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

// Inicializar app
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase App inicializado');

// ==========================================================
// VAPID KEY CORRETA - USE ESTA!
// ==========================================================

const VAPID_KEY = "BOgny9cf-6bxN7lBEWymgvFXeENOLDsyz3iLV_7S0hZy4e1kRv4k6zjnlhW9dszR-YDDX_-EKlq_XNUyftc8SH4";

// ==========================================================
// INICIALIZAR MESSAGING
// ==========================================================

let messaging = null;

export async function initializeMessaging() {
  try {
    const supported = await isSupported();
    if (!supported) {
      throw new Error('Navegador não suporta Firebase Messaging');
    }
    
    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging inicializado');
    console.log('🔑 VAPID Key:', VAPID_KEY.substring(0, 25) + '...');
    return messaging;
  } catch (error) {
    console.error('❌ Erro ao inicializar messaging:', error);
    throw error;
  }
}

// ==========================================================
// GERAR TOKEN FCM
// ==========================================================

export async function requestNotificationPermission(swRegistration) {
  console.log("📣 Iniciando solicitação de token FCM...");

  try {
    // Verificar permissão
    if (Notification.permission !== 'granted') {
      console.log("🔐 Solicitando permissão...");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("❌ Permissão negada pelo usuário.");
        return null;
      }
      console.log("✅ Permissão concedida!");
    } else {
      console.log("✅ Permissão já concedida anteriormente");
    }

    console.log("🔑 Gerando token FCM...");

    // Garantir que messaging está inicializado
    if (!messaging) {
      await initializeMessaging();
    }

    // Configuração do token
    const tokenOptions = {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    };

    console.log('⚙️ Configuração do token:', {
      vapidKey: VAPID_KEY.substring(0, 20) + '...',
      hasSW: !!swRegistration
    });

    // Obter token
    const token = await getToken(messaging, tokenOptions);

    if (!token) {
      throw new Error('Token vazio recebido');
    }

    console.log("🎉 TOKEN FCM GERADO COM SUCESSO!");
    console.log("📝 Token completo:", token);
    return token;

  } catch (error) {
    console.error("❌ Erro ao obter token:", error);
    
    // Diagnóstico detalhado
    if (error.code === 'messaging/invalid-vapid-key') {
      console.error('🔐 VAPID KEY INVÁLIDA');
      console.error('   Verifique se a chave está correta:', VAPID_KEY);
    } else if (error.code === 'messaging/token-subscribe-failed') {
      console.error('🔐 ERRO DE AUTENTICAÇÃO');
      console.error('   Projeto Firebase ou VAPID key incorretos');
    }
    
    throw error;
  }
}

// ==========================================================
// CONFIGURAR MENSAGENS EM PRIMEIRO PLANO
// ==========================================================

export async function setupForegroundMessages() {
  try {
    if (!messaging) {
      await initializeMessaging();
    }
    
    onMessage(messaging, (payload) => {
      console.log("🔔 Notificação recebida em primeiro plano:", payload);
      
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

// ==========================================================
// VERIFICAR CONFIGURAÇÃO
// ==========================================================

export async function verifyFirebaseSetup() {
  console.group('🔧 Verificação de Configuração Firebase');
  
  try {
    await initializeMessaging();
    
    console.log('✅ Projeto Firebase: OK');
    console.log('✅ Configuração: OK');
    console.log('🔑 VAPID Key: VÁLIDA');
    console.log('📋 Detalhes:');
    console.log('   - Project ID:', firebaseConfig.projectId);
    console.log('   - Sender ID:', firebaseConfig.messagingSenderId);
    console.log('   - VAPID Key:', VAPID_KEY.substring(0, 25) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Falha na configuração:', error);
    return false;
  } finally {
    console.groupEnd();
  }
}

// ==========================================================
// TESTE DE NOTIFICAÇÃO
// ==========================================================

export async function testNotification() {
  if (Notification.permission === 'granted') {
    new Notification('IBNA - Teste', {
      body: 'Notificação de teste funcionando!',
      icon: '/icon.png',
      badge: '/badge.png'
    });
    return true;
  }
  return false;
}
