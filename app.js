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
// DIAGNÓSTICO DE PROBLEMAS
// ==========================================================

async function diagnosePushIssues() {
  console.log('🔍 Executando diagnóstico...');
  
  const issues = [];
  
  // Verificar HTTPS
  if (location.protocol !== 'https:') {
    issues.push('❌ Site não está em HTTPS (obrigatório para notificações)');
  } else {
    console.log('✅ Site está em HTTPS');
  }
  
  // Verificar Service Worker
  if (!navigator.serviceWorker) {
    issues.push('❌ Service Worker não suportado');
  } else {
    console.log('✅ Service Worker suportado');
  }
  
  // Verificar notificações
  if (!('Notification' in window)) {
    issues.push('❌ Notificações não suportadas');
  } else {
    console.log('✅ Notificações suportadas');
  }
  
  // Verificar push manager
  if (!navigator.serviceWorker) {
    issues.push('❌ Service Worker não suportado');
  } else {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker pronto');
      
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log('⚠️ Já existe uma inscrição push ativa');
        issues.push('⚠️ Já existe uma inscrição push ativa - pode conflitar');
      } else {
        console.log('✅ Nenhuma inscrição push ativa encontrada');
      }
    } catch (error) {
      issues.push(`❌ Erro ao verificar inscrição: ${error.message}`);
    }
  }
  
  // Verificar modo privado
  if (navigator.userAgent.includes('Firefox') && 'MozAppearance' in document.documentElement.style) {
    issues.push('⚠️ Possível modo privado (Firefox)');
  }
  
  // Verificar se é Safari (tem limitações)
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    issues.push('⚠️ Safari detectado - pode ter limitações com notificações');
  }
  
  if (issues.length === 0) {
    console.log('✅ Diagnóstico: Nenhum problema crítico detectado');
    return true;
  } else {
    console.log('❌ Problemas detectados:', issues);
    return false;
  }
}

// ==========================================================
// FUNÇÃO PRINCIPAL DE INSCRIÇÃO
// ==========================================================

async function subscribeWithFirebase() {
  console.log('🎯 Iniciando processo de inscrição...');
  
  // Executar diagnóstico primeiro
  const diagnosisOk = await diagnosePushIssues();
  if (!diagnosisOk) {
    console.warn('⚠️ Problemas detectados no diagnóstico, mas continuando...');
  }
  
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
    let requestNotificationPermission, setupForegroundMessages;
    try {
      const firebaseModule = await import('./firebase.js');
      requestNotificationPermission = firebaseModule.requestNotificationPermission;
      setupForegroundMessages = firebaseModule.setupForegroundMessages;
    } catch (importError) {
      console.error('❌ Erro ao importar Firebase:', importError);
      // Tentativa alternativa
      const firebaseModule = await import('/firebase.js');
      requestNotificationPermission = firebaseModule.requestNotificationPermission;
      setupForegroundMessages = firebaseModule.setupForegroundMessages;
    }

    if (!requestNotificationPermission) {
      alert("❌ Módulo Firebase não carregado corretamente.");
      return;
    }

    // Configurar mensagens em primeiro plano
    if (setupForegroundMessages) {
      await setupForegroundMessages();
      console.log('✅ Listener de primeiro plano configurado');
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
    
    if (err.name === 'AbortError' || err.message.includes('push service error') || err.message.includes('Registration failed')) {
      errorMessage = "❌ Problema no serviço de notificações do navegador. \n\n";
      errorMessage += "Soluções possíveis:\n";
      errorMessage += "• 📵 Desative bloqueadores de anúncios para este site\n";
      errorMessage += "• 🔒 Verifique se não está em modo de navegação privada\n";
      errorMessage += "• 🌐 Tente em outro navegador (Chrome recomendado)\n";
      errorMessage += "• 📶 Verifique sua conexão com a internet\n";
      errorMessage += "• 🔄 Recarregue a página e tente novamente";
      
      // Oferecer alternativa
      if (confirm(errorMessage + "\n\nDeseja tentar o método alternativo?")) {
        await alternativeSubscription();
      }
    } else if (err.message.includes('failed-service-worker-registration')) {
      errorMessage += "Service Worker não registrado. Verifique se o site está em HTTPS.";
    } else if (err.message.includes('permission-blocked')) {
      errorMessage += "Permissão bloqueada. Libere as notificações nas configurações do navegador.";
    } else {
      errorMessage += err.message;
    }
    
    alert(errorMessage);
  }
}

// ==========================================================
// FUNÇÃO ALTERNATIVA PARA CASOS PROBLEMÁTICOS
// ==========================================================

async function alternativeSubscription() {
  console.log('🔄 Tentando método alternativo de inscrição...');
  
  try {
    // Tentar sem Service Worker primeiro (apenas notificações em primeiro plano)
    const { setupForegroundMessages } = await import('./firebase.js');
    
    if (setupForegroundMessages) {
      await setupForegroundMessages();
    }
    
    // Forçar nova solicitação de permissão
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão negada no método alternativo');
    }
    
    console.log('✅ Notificações em primeiro plano configuradas');
    
    // Marcar como fallback
    localStorage.setItem('fcmFallback', 'true');
    localStorage.setItem('fcmTokenTimestamp', new Date().toISOString());
    
    alert('✅ Notificações configuradas! Você receberá notificações quando o app estiver aberto.\n\n⚠️ Nota: Para notificações em segundo plano, tente em outro navegador ou desative bloqueadores.');
    
    // Atualizar UI
    updateUIAfterSubscription();
    
    return true;
    
  } catch (error) {
    console.error('❌ Método alternativo também falhou:', error);
    
    // Última tentativa - apenas solicitar permissão
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('✅ Permissão concedida! Configuração básica concluída.');
        return true;
      }
    } catch (finalError) {
      console.error('❌ Falha total:', finalError);
    }
    
    throw error;
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
    btn.style.cursor = "default";
  }
  
  // Mostrar status para o usuário
  const statusElement = document.getElementById("subscription-status");
  if (statusElement) {
    statusElement.textContent = "Status: Inscrito nas notificações";
    statusElement.style.color = "#28a745";
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
  const fallbackMode = localStorage.getItem("fcmFallback");
  
  if (savedToken && savedTimestamp) {
    console.log('📋 Inscrição existente encontrada');
    console.log('🕒 Data da inscrição:', new Date(savedTimestamp).toLocaleString());
    
    if (fallbackMode) {
      console.log('ℹ️ Modo fallback ativo (apenas primeiro plano)');
    }
    
    // Atualizar UI se já estiver inscrito
    updateUIAfterSubscription();
    return true;
  }
  
  return false;
}

// ==========================================================
// LIMPAR INSCRIÇÃO (PARA TESTES)
// ==========================================================

function clearSubscription() {
  localStorage.removeItem("fcmToken");
  localStorage.removeItem("fcmTokenTimestamp");
  localStorage.removeItem("fcmFallback");
  
  const btn = document.getElementById("subscribe");
  if (btn) {
    btn.textContent = "Receber Notificações Diárias";
    btn.disabled = false;
    btn.style.backgroundColor = "";
    btn.style.cursor = "pointer";
  }
  
  const statusElement = document.getElementById("subscription-status");
  if (statusElement) {
    statusElement.textContent = "Status: Não inscrito";
    statusElement.style.color = "#dc3545";
  }
  
  console.log('🧹 Inscrição removida - pronto para novo teste');
  alert('Inscrição removida. Você pode testar novamente.');
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
    
    // Adicionar tooltip para melhor UX
    btn.title = "Clique para receber notificações diárias da IBNA";
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
      btn.title = "Seu navegador não suporta notificações";
    }
  }
  
  // Adicionar botão de limpar para testes (apenas em desenvolvimento)
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('netlify')) {
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🧹 Limpar Inscrição (Teste)';
    clearBtn.style.position = 'fixed';
    clearBtn.style.bottom = '10px';
    clearBtn.style.right = '10px';
    clearBtn.style.zIndex = '10000';
    clearBtn.style.padding = '5px 10px';
    clearBtn.style.fontSize = '12px';
    clearBtn.style.backgroundColor = '#ffc107';
    clearBtn.style.color = '#000';
    clearBtn.style.border = 'none';
    clearBtn.style.borderRadius = '4px';
    clearBtn.style.cursor = 'pointer';
    clearBtn.addEventListener('click', clearSubscription);
    
    document.body.appendChild(clearBtn);
    console.log('🔧 Botão de limpar inscrição adicionado para testes');
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
    localStorage.removeItem("fcmFallback");
    location.reload();
  },
  checkSW: () => navigator.serviceWorker?.ready,
  testNotification: () => {
    if (Notification.permission === 'granted') {
      new Notification('IBNA - Teste', {
        body: 'Esta é uma notificação de teste!',
        icon: '/icon.png',
        badge: '/badge.png'
      });
    } else {
      alert('Permissão de notificação não concedida');
    }
  },
  diagnose: diagnosePushIssues,
  forceSubscribe: subscribeWithFirebase,
  getStatus: () => ({
    permission: Notification.permission,
    hasToken: !!localStorage.getItem("fcmToken"),
    fallback: localStorage.getItem("fcmFallback") === 'true',
    timestamp: localStorage.getItem("fcmTokenTimestamp")
  })
};

console.log('🔧 Debug functions available: window.ibnaDebug');
console.log('💡 Use window.ibnaDebug.diagnose() para verificar problemas');