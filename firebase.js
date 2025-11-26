// ==========================================================
// IMPORTS DO FIREBASE VIA CDN
// ==========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { 
  getMessaging, 
  getToken, 
  onMessage,
  isSupported 
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js";

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

// ==========================================================
// VERIFICAR SUPORTE DO NAVEGADOR
// ==========================================================

export async function initializeMessaging() {
  try {
    const supported = await isSupported();
    if (!supported) {
      throw new Error('Navegador não suporta Firebase Messaging');
    }
    
    const messaging = getMessaging(app);
    console.log('✅ Firebase Messaging inicializado');
    return messaging;
  } catch (error) {
    console.error('❌ Erro ao inicializar messaging:', error);
    throw error;
  }
}

// ==========================================================
// PEDIR PERMISSÃO E PEGAR TOKEN (CORRIGIDA)
// ==========================================================

export async function requestNotificationPermission(swRegistration) {
  console.log("📣 Iniciando solicitação de permissão...");

  try {
    // Verificar se já tem permissão
    if (Notification.permission === 'granted') {
      console.log("✅ Permissão já concedida anteriormente");
    } else {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("❌ Permissão negada pelo usuário.");
        return null;
      }
      console.log("✔ Permissão concedida!");
    }

    console.log("🔑 Gerando token FCM...");

    // Inicializar messaging
    const messaging = await initializeMessaging();
    
    // Obter token com configuração robusta
    const token = await getToken(messaging, {
      vapidKey: "BPln7ph5L0061tGzpskhYNK1jX6h6j8GXIhO1Jlxq2DncedsEn6vhNB4q-pDdKBg7CEgjXiqmd21kJkuC_u9hz8",
      serviceWorkerRegistration: swRegistration
    });

    if (!token) {
      throw new Error('Token vazio recebido');
    }

    console.log("🎉 Token FCM gerado com sucesso");
    return token;

  } catch (error) {
    console.error("❌ Erro crítico ao obter token:", error);
    
    // Diagnóstico detalhado do erro
    if (error.code === 'messaging/failed-service-worker-registration') {
      console.error('Service Worker não registrado ou inválido');
    } else if (error.code === 'messaging/permission-blocked') {
      console.error('Permissão permanentemente bloqueada');
    } else if (error.code === 'messaging/invalid-sw-registration') {
      console.error('Registro de Service Worker inválido');
    } else if (error.name === 'AbortError') {
      console.error('Push service error - Problema no serviço de push do navegador');
      console.log('💡 Possíveis causas:');
      console.log('   - Bloqueador de anúncios ativo');
      console.log('   - VPN ou proxy bloqueando push');
      console.log('   - Navegador em modo privado');
      console.log('   - Problema temporário do serviço');
    }
    
    throw error;
  }
}

// ==========================================================
// RECEBE NOTIFICAÇÕES EM PRIMEIRO PLANO
// ==========================================================

export async function setupForegroundMessages() {
  try {
    const messaging = await initializeMessaging();
    
    onMessage(messaging, (payload) => {
      console.log("🔔 Notificação recebida em primeiro plano:", payload);
      
      // Exibir notificação mesmo em primeiro plano
      if (payload.notification && Notification.permission === 'granted') {
        const { title, body, icon } = payload.notification;
        new Notification(title, { 
          body, 
          icon: icon || '/icon.png',
          badge: '/badge.png'
        });
      }
    });
    
    console.log('✅ Listener de primeiro plano configurado');
  } catch (error) {
    console.warn('⚠️ Não foi possível configurar listener de primeiro plano:', error);
  }
}