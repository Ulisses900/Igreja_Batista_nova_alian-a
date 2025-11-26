// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Inicializa Firebase dentro do SW
firebase.initializeApp({
  apiKey: "AIzaSyAK3QItAHsUAwHBI0eI7LUDnnD3X25Zz6A",
  authDomain: "ibna-b5f3d.firebaseapp.com",
  projectId: "ibna-b5f3d",
  messagingSenderId: "238089075652",
  appId: "1:238089075652:web:3b0c4d38937f62c01cc291",
});

// Init messaging
const messaging = firebase.messaging();

// Mensagem em background
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Mensagem background recebida:", payload);

  const title = payload.notification.title;
  const options = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    data: payload.data
  };

  self.registration.showNotification(title, options);
});

// Clique da notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("https://igrejabatistanovaalianca.netlify.app")
  );
});
