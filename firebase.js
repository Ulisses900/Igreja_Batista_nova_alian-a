// firebase-messaging.js ou no seu firebase config
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Sua configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAK3QItAHsUAwHBI0eI7LUDnnD3X25Zz6A",
  authDomain: "ibna-b5f3d.firebaseapp.com",
  projectId: "ibna-b5f3d",
  storageBucket: "ibna-b5f3d.firebasestorage.app",
  messagingSenderId: "238089075652",
  appId: "1:238089075652:web:3b0c4d38937f62c01cc291",
  measurementId: "G-MN2WRJC6X1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

// Função para solicitar permissão e obter token
async function requestNotificationPermission() {
  try {
    console.log('Solicitando permissão para notificações...');
    
    // Solicitar permissão
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permissão concedida. Obtendo token FCM...');
      
      // Obter token FCM
      const token = await getToken(messaging, {
        vapidKey: 'BPln7ph5L0061tGzpskhYNK1jX6h6j8GXIhO1Jlxq2DncedsEn6vhNB4q-pDdKBg7CEgjXiqmd21kJkuC_u9hz8'
      });
      
      if (token) {
        console.log('Token FCM:', token);
        
        // Enviar token para seu Google Apps Script
        await sendTokenToServer(token);
        
        return token;
      } else {
        console.log('Não foi possível obter o token FCM');
        return null;
      }
    } else {
      console.log('Permissão para notificações negada');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter token FCM:', error);
    return null;
  }
}

// Função para enviar token para o servidor
async function sendTokenToServer(token) {
  try {
    const BROWSER_ID = 'ibna-' + Date.now();
    
    const response = await fetch('https://script.google.com/macros/s/AKfycbw93LOXmAc7YsQZT0NBV6o6y4_uq7JqMq1mdxZjFEy5o37VNVCEICHzvZc_21efZao/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        browserId: BROWSER_ID,
        fcmToken: token,
        type: 'fcm'
      })
    });
    
    console.log('Token enviado para o servidor');
    return true;
  } catch (error) {
    console.error('Erro ao enviar token:', error);
    return false;
  }
}

// Escutar mensagens enquanto o app está em primeiro plano
onMessage(messaging, (payload) => {
  console.log('Mensagem recebida em primeiro plano:', payload);
  
  // Mostrar notificação customizada
  showCustomNotification(payload);
});

// Função para mostrar notificação customizada
function showCustomNotification(payload) {
  const { title, body, icon, image } = payload.notification;
  
  // Você pode customizar como a notificação aparece no seu site
  if ('Notification' in window && Notification.permission === 'granted') {
    const options = {
      body: body,
      icon: icon || '/icon-192x192.png',
      image: image,
      badge: '/badge-72x72.png',
      tag: 'ibna-notification'
    };
    
    const notification = new Notification(title, options);
    
    notification.onclick = function() {
      window.focus();
      notification.close();
    };
  }
}

// Exportar funções
export { messaging, requestNotificationPermission, getToken };
