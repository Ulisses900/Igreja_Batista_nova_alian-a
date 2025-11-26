// ==========================================================
// REGISTRAR SERVICE WORKER
// ==========================================================

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker registrado com sucesso:', registration);
      console.log('📁 Escopo do Service Worker:', registration.scope);
      return registration;
    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
      
      // Tentativa alternativa com caminho explícito
      try {
        console.log('🔄 Tentando registro alternativo...');
        const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
        console.log('✅ Service Worker registrado (caminho alternativo):', registration);
        return registration;
      } catch (error2) {
        console.error('❌ Erro no registro alternativo:', error2);
        return null;
      }
    }
  } else {
    console.log('❌ Service Worker não suportado neste navegador');
    return null;
  }
}

// ==========================================================
// VERIFICAR SE JÁ TEM PERMISSÃO
// ==========================================================

function checkExistingPermission() {
  if (!('Notification' in window)) {
    console.log('❌ Notificações não suportadas');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    console.log('✅ Permissão de notificação já concedida');
    return true;
  } else if (Notification.permission === 'denied') {
    console.log('❌ Permissão de notificação negada pelo usuário');
    return false;
  }
  
  return null; // Permissão ainda não solicitada
}

// ==========================================================
// FUNÇÃO PRINCIPAL DE INSCRIÇÃO
// ==========================================================

async function subscribeWithFirebase() {
  console.log('🎯 Iniciando processo de inscrição...');
  
  // Verificar se já tem permissão
  const hasPermission = checkExistingPermission();
  if (hasPermission === false) {
    alert("❌ As notificações estão bloqueadas. Por favor, permita notificações nas configurações do seu navegador.");
    return;
  }

  try {
    // Registrar Service Worker primeiro
    console.log('🔧 Registrando Service Worker...');
    const swRegistration = await registerServiceWorker();
    
    if (!swRegistration) {
      alert("❌ Não foi possível registrar o Service Worker. Verifique se o site está em HTTPS.");
      return;
    }

    console.log('📦 Importando módulo Firebase...');
    
    // Importar módulo Firebase
    let requestNotificationPermission;
    try {
      const firebaseModule = await import('./firebase.js');
      requestNotificationPermission = firebaseModule.requestNotificationPermission;
    } catch (importError) {
      console.error('❌ Erro ao importar Firebase:', importError);
      // Tentativa alternativa
      const firebaseModule = await import('/firebase.js');
      requestNotificationPermission = firebaseModule.requestNotificationPermission;
    }

    if (!requestNotificationPermission) {
      alert("❌ Módulo Firebase não carregado corretamente.");
      return;
    }

    console.log('🔑 Solicitando token FCM...');
    const token = await requestNotificationPermission(swRegistration);

    if (!token) {
      alert("❌ Não foi possível obter o token FCM. A permissão pode ter sido negada.");
      return;
    }

    // Salvar token no localStorage
    localStorage.setItem("fcmToken", token);
    localStorage.setItem("fcmTokenTimestamp", new Date().toISOString());
    
    console.log("💾 Token salvo no localStorage:", token);

    // Opcional: Enviar token para seu backend
    await sendTokenToBackend(token);

    alert("🎉 Inscrição realizada com sucesso! Você receberá notificações da IBNA.");
    
    // Atualizar UI se necessário
    updateUIAfterSubscription();
    
  } catch (err) {
    console.error("💥 Erro durante a inscrição:", err);
    
    let errorMessage = "Erro durante a inscrição: ";
    
    if (err.message.includes('failed-service-worker-registration')) {
      errorMessage += "Service Worker não registrado. Verifique se o site está em HTTPS.";
    } else if (err.message.includes('permission-blocked')) {
      errorMessage += "Permissão bloqueada. Libere as notificações nas configurações do navegador.";
    } else if (err.message.includes('token-subscription-failed')) {
      errorMessage += "Falha na assinatura. Tente novamente.";
    } else {
      errorMessage += err.message;
    }
    
    alert(errorMessage);
  }
}

// ==========================================================
// ATUALIZAR UI APÓS INSCRIÇÃO
// ==========================================================

function updateUIAfterSubscription() {
  const btn = document.getElementById("subscribe");
  if (btn) {
    btn.textContent = "✅ Inscrito";
    btn.disabled = true;
    btn.style.backgroundColor = "#28a745";
  }
  
  // Mostrar token resumido (opcional)
  const token = localStorage.getItem("fcmToken");
  if (token) {
    const shortToken = token.substring(0, 20) + '...';
    console.log('🔐 Token (resumido):', shortToken);
  }
}

// ==========================================================
// VERIFICAR INSCRIÇÃO EXISTENTE AO CARREGAR
// ==========================================================

function checkExistingSubscription() {
  const savedToken = localStorage.getItem("fcmToken");
  const savedTimestamp = localStorage.getItem("fcmTokenTimestamp");
  
  if (savedToken && savedTimestamp) {
    console.log('📋 Inscrição existente encontrada');
    console.log('🕒 Data da inscrição:', new Date(savedTimestamp).toLocaleString());
    
    // Atualizar UI se já estiver inscrito
    updateUIAfterSubscription();
    return true;
  }
  
  return false;
}

// ==========================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Aplicação IBNA carregada');
  
  // Verificar se já está inscrito
  checkExistingSubscription();
  
  // Configurar botão de inscrição
  const btn = document.getElementById("subscribe");
  if (btn) {
    btn.addEventListener("click", subscribeWithFirebase);
    console.log('🎯 Botão de inscrição configurado');
  } else {
    console.log('⚠️ Botão de inscrição não encontrado');
  }
  
  // Registrar Service Worker automaticamente
  registerServiceWorker().then(registration => {
    if (registration) {
      console.log('🔧 Service Worker pronto para uso');
    }
  });
  
  // Verificar suporte a notificações
  if (!('Notification' in window)) {
    console.log('❌ Este navegador não suporta notificações');
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Notificações não suportadas";
    }
  }
});

// ==========================================================
// FUNÇÕES ÚTEIS PARA DEBUG
// ==========================================================

// Expor funções globalmente para debug (remover em produção)
window.ibnaDebug = {
  getToken: () => localStorage.getItem("fcmToken"),
  clearSubscription: () => {
    localStorage.removeItem("fcmToken");
    localStorage.removeItem("fcmTokenTimestamp");
    location.reload();
  },
  checkSW: () => navigator.serviceWorker?.ready,
  testNotification: () => {
    if (Notification.permission === 'granted') {
      new Notification('IBNA - Teste', {
        body: 'Esta é uma notificação de teste!',
        icon: '/icon.png'
      });
    }
  }
};

console.log('🔧 Debug functions available: window.ibnaDebug');