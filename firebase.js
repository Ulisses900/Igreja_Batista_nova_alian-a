// ==========================================================
// IMPORTS DO FIREBASE VIA CDN
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

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ==========================================================
// PEDIR PERMISSÃO E PEGAR TOKEN (ATUALIZADA)
// ==========================================================

export async function requestNotificationPermission(swRegistration) {
  console.log("📣 Iniciando solicitação de permissão...");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("❌ Permissão negada.");
    return null;
  }

  console.log("✔ Permissão concedida! Gerando token...");

  try {
    const token = await getToken(messaging, {
      vapidKey: "BPln7ph5L0061tGzpskhYNK1jX6h6j8GXIhO1Jlxq2DncedsEn6vhNB4q-pDdKBg7CEgjXiqmd21kJkuC_u9hz8",
      serviceWorkerRegistration: swRegistration
    });

    console.log("🎉 Token FCM:", token);
    return token;

  } catch (error) {
    console.error("❌ Erro ao obter token:", error);
    
    // Verificação de erros comuns
    if (error.code === 'messaging/failed-service-worker-registration') {
      console.error('Service Worker não registrado corretamente');
    } else if (error.code === 'messaging/permission-blocked') {
      console.error('Permissão de notificação bloqueada');
    }
    
    throw error;
  }
}

// ==========================================================
// RECEBE NOTIFICAÇÕES EM PRIMEIRO PLANO
// ==========================================================

onMessage(messaging, (payload) => {
  console.log("🔔 Notificação recebida em primeiro plano:", payload);
  
  // Exibir notificação mesmo em primeiro plano
  if (payload.notification) {
    const { title, body, icon } = payload.notification;
    new Notification(title, { body, icon });
  }
});