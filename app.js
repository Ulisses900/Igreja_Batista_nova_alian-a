// ==========================================================
// IMPORTS DO FIREBASE VIA CDN (ESSENCIAL PARA NETLIFY)
// ==========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js";

// ==========================================================
// CONFIG FIREBASE
// ==========================================================

const firebaseConfig = {
  apiKey: "AIzaSyAK3QItAHsUAwHBI0eI7LUDnnD3X25Zz6A",
  authDomain: "ibna-b5f3d.firebaseapp.com",
  projectId: "ibna-b5f3d",
  storageBucket: "ibna-b5f3d.firebasestorage.app",
  messagingSenderId: "238089075652",
  appId: "1:238089075652:web:3b0c4d38937f62c01cc291",
  measurementId: "G-MN2WRJC6X1"
};

// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ==========================================================
// PERMISSÃO E TOKEN FCM
// ==========================================================

export async function requestNotificationPermission() {
  console.log("Solicitando permissão para notificações...");

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    console.warn("Permissão negada pelo usuário.");
    return null;
  }

  console.log("Permissão concedida. Obtendo token FCM...");

  const token = await getToken(messaging, {
    vapidKey: "BPln7ph5L0061tGzpskhYNK1jX6h6j8GXIhO1Jlxq2DncedsEn6vhNB4q-pDdKBg7CEgjXiqmd21kJkuC_u9hz8"
  });

  console.log("Token FCM:", token);

  await sendTokenToServer(token);

  return token;
}

// ==========================================================
// ENVIAR TOKEN PARA SEU GOOGLE APP SCRIPT
// ==========================================================

async function sendTokenToServer(token) {
  try {
    const BROWSER_ID = "ibna-" + Date.now();

    await fetch("https://script.google.com/macros/s/AKfycbw93LOXmAc7YsQZT0NBV6o6y4_uq7JqMq1mdxZjFEy5o37VNVCEICHzvZc_21efZao/exec", {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        browserId: BROWSER_ID,
        fcmToken: token,
        type: "fcm"
      })
    });

    console.log("Token enviado ao servidor");

  } catch (err) {
    console.error("Erro ao enviar token ao servidor:", err);
  }
}

// ==========================================================
// RECEBER NOTIFICAÇÕES EM PRIMEIRO PLANO
// ==========================================================

onMessage(messaging, (payload) => {
  console.log("Mensagem recebida:", payload);

  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon
  });
});
