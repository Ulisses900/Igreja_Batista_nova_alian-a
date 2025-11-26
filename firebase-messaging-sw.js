// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAK3QItAHsUAwHBI0eI7LUDnnD3X25Zz6A",
  authDomain: "ibna-b5f3d.firebaseapp.com",
  projectId: "ibna-b5f3d",
  storageBucket: "ibna-b5f3d.firebasestorage.app",
  messagingSenderId: "238089075652",
  appId: "1:238089075652:web:3b0c4d38937f62c01cc291",
  measurementId: "G-MN2WRJC6X1"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Configuração de notificação em background
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Notificação em background recebida:', payload);

  const notificationTitle = payload.notification?.title || 'Nova Mensagem';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova notificação',
    icon: payload.notification?.icon || '/icon.png',
    badge: '/badge.png',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada', event.notification.tag);
  event.notification.close();

  const urlToOpen = 'https://igrejabatistanovaalianca.netlify.app';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Verifica se já existe uma janela/tab aberta
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não existir, abre nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});