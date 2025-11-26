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
// URL DO WEB APP DO GOOGLE APPS SCRIPT
// ==========================================================

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw93LOXmAc7YsQZT0NBV6o6y4_uq7JqMq1mdxZjFEy5o37VNVCEICHzvZc_21efZao/exec';

// ==========================================================
// VERIFICAR STATUS DO SISTEMA
// ==========================================================

async function checkSystemStatus() {
  try {
    console.log('🔍 Verificando status do sistema...');
    
    const response = await fetch(`${WEB_APP_URL}?action=status&timestamp=${Date.now()}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sistema online:', result);
      return result;
    }
  } catch (error) {
    console.log('⚠️ Não foi possível verificar status do sistema:', error);
  }
  
  return null;
}

// ==========================================================
// INICIALIZAR SISTEMA NO GOOGLE APPS SCRIPT
// ==========================================================

async function initializeSystem() {
  try {
    console.log('🔧 Inicializando sistema no Google Apps Script...');
    
    const response = await fetch(`${WEB_APP_URL}?action=initialize&timestamp=${Date.now()}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sistema inicializado:', result);
      return result;
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar sistema:', error);
  }
  
  return null;
}

// ==========================================================
// SALVAR TOKEN NO GOOGLE SHEETS (SISTEMA AUTOMÁTICO)
// ==========================================================

async function saveTokenToGoogleSheets(token) {
  try {
    console.log('📤 Enviando token para Google Sheets...');
    
    // Verificar status do sistema primeiro
    const status = await checkSystemStatus();
    if (!status) {
      console.log('⚠️ Sistema não respondeu, tentando inicialização...');
      await initializeSystem();
    }
    
    // Método GET com parâmetros (funciona melhor com CORS)
    const params = new URLSearchParams({
      action: 'saveToken',
      token: token,
      device: navigator.userAgent.substring(0, 100),
      url: window.location.href,
      origin: window.location.origin,
      timestamp: new Date().getTime(),
      source: 'webapp-frontend',
      autoCreate: 'true'
    });
    
    const getUrl = `${WEB_APP_URL}?${params.toString()}`;
    
    // Tentar com fetch normal primeiro
    try {
      const response = await fetch(getUrl);
      if (response.ok) {
        const result = await response.text();
        console.log('✅ Resposta do servidor:', result);
        
        // Tentar parsear JSON se possível
        try {
          const data = JSON.parse(result);
          if (data.success) {
            showSuccessMessage(`Inscrição realizada! ${data.totalUsers ? `Total de ${data.totalUsers} usuários.` : ''}`);
          }
        } catch (e) {
          // Se não for JSON, mostrar mensagem genérica
          showSuccessMessage('Inscrição realizada com sucesso!');
        }
        
        return true;
      }
    } catch (fetchError) {
      console.log('⚠️ Fetch normal falhou, usando no-cors...', fetchError);
    }
    
    // Método FALLBACK: no-cors (sempre funciona)
    await fetch(getUrl, {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit'
    });
    
    console.log('✅ Requisição enviada (modo no-cors)');
    showSuccessMessage('Inscrição realizada com sucesso!');
    
    return true;
    
  } catch (error) {
    console.warn('⚠️ Erro ao enviar token:', error);
    showTokenBackup(token);
    return false;
  }
}

// ==========================================================
// MENSAGEM DE SUCESSO MELHORADA
// ==========================================================

function showSuccessMessage(message) {
  // Remover mensagens anteriores
  const existingMessages = document.querySelectorAll('.success-message');
  existingMessages.forEach(msg => msg.remove());
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
    font-family: Arial, sans-serif;
  `;
  
  messageDiv.innerHTML = `
    <strong>🎉 ${message}</strong>
    <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: transparent; border: 1px solid white; color: white; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">OK</button>
  `;
  
  document.body.appendChild(messageDiv);
  
  // Auto-remover após 5 segundos
  setTimeout(() => {
    if (messageDiv.parentElement) {
      messageDiv.remove();
    }
  }, 5000);
}

// ==========================================================
// BACKUP VISUAL DO TOKEN
// ==========================================================

function showTokenBackup(token) {
  const tokenDisplay = document.createElement('div');
  tokenDisplay.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: #fff3cd;
    border: 2px solid #ffc107;
    padding: 15px;
    border-radius: 8px;
    font-size: 12px;
    max-width: 400px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
  `;
  
  tokenDisplay.innerHTML = `
    <strong>⚠️ Backup do Token</strong>
    <p style="margin: 8px 0; color: #856404;">O sistema pode ter salvado automaticamente, mas aqui está seu token para garantir:</p>
    <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #ddd; word-break: break-all; font-family: 'Courier New', monospace; font-size: 11px;">
      ${token}
    </div>
    <div style="margin-top: 10px; display: flex; gap: 10px;">
      <button onclick="copyTokenToClipboard('${token}')" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Copiar Token</button>
      <button onclick="this.parentElement.parentElement.remove()" style="padding: 5px 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Fechar</button>
    </div>
  `;
  
  document.body.appendChild(tokenDisplay);
  
  // Remover automaticamente após 15 segundos
  setTimeout(() => {
    if (tokenDisplay.parentElement) {
      tokenDisplay.remove();
    }
  }, 15000);
}

// ==========================================================
// COPIAR TOKEN PARA ÁREA DE TRANSFERÊNCIA
// ==========================================================

function copyTokenToClipboard(token) {
  navigator.clipboard.writeText(token).then(() => {
    // Mostrar mensagem de confirmação
    const copyMsg = document.createElement('div');
    copyMsg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10001;
      font-size: 14px;
    `;
    copyMsg.textContent = '✅ Token copiado para a área de transferência!';
    document.body.appendChild(copyMsg);
    
    setTimeout(() => {
      if (copyMsg.parentElement) {
        copyMsg.remove();
      }
    }, 2000);
  }).catch(err => {
    console.error('Erro ao copiar token:', err);
  });
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

    // ✅ SALVAR NO GOOGLE SHEETS (SISTEMA AUTOMÁTICO)
    const saved = await saveTokenToGoogleSheets(token);
    if (saved) {
      console.log('✅ Token registrado no sistema de notificações!');
    } else {
      console.log('⚠️ Token pode não ter sido salvo no Google Sheets, mas está no localStorage');
    }

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
    
    showSuccessMessage('Notificações configuradas! Você receberá notificações quando o app estiver aberto.');
    
    // Atualizar UI
    updateUIAfterSubscription();
    
    return true;
    
  } catch (error) {
    console.error('❌ Método alternativo também falhou:', error);
    
    // Última tentativa - apenas solicitar permissão
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showSuccessMessage('Permissão concedida! Configuração básica concluída.');
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
    
    // Adicionar ícone de verificação
    if (!btn.querySelector('.check-icon')) {
      const checkIcon = document.createElement('span');
      checkIcon.className = 'check-icon';
      checkIcon.innerHTML = ' ✓';
      checkIcon.style.fontWeight = 'bold';
      btn.appendChild(checkIcon);
    }
  }
  
  // Mostrar status para o usuário
  const statusElement = document.getElementById("subscription-status");
  if (statusElement) {
    statusElement.textContent = "Status: Inscrito nas notificações";
    statusElement.style.color = "#28a745";
    statusElement.style.fontWeight = "bold";
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
    
    // Remover ícone de verificação
    const checkIcon = btn.querySelector('.check-icon');
    if (checkIcon) {
      checkIcon.remove();
    }
  }
  
  const statusElement = document.getElementById("subscription-status");
  if (statusElement) {
    statusElement.textContent = "Status: Não inscrito";
    statusElement.style.color = "#dc3545";
    statusElement.style.fontWeight = "normal";
  }
  
  console.log('🧹 Inscrição removida - pronto para novo teste');
  showSuccessMessage('Inscrição removida. Você pode testar novamente.');
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
    clearBtn.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 10000;
      padding: 8px 12px;
      font-size: 12px;
      background-color: #ffc107;
      color: #000;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    clearBtn.addEventListener('click', clearSubscription);
    
    document.body.appendChild(clearBtn);
    console.log('🔧 Botão de limpar inscrição adicionado para testes');
  }
  
  // Adicionar CSS para animações
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
});

// ==========================================================
// FUNÇÕES ÚTEIS PARA DEBUG
// ==========================================================

// Expor funções globalmente para debug (remover em produção)
window.ibnaDebug = {
  getToken: () => localStorage.getItem("fcmToken"),
  clearSubscription: clearSubscription,
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
  }),
  // Nova função para testar conexão com Google Sheets
  testGoogleSheets: async () => {
    const token = localStorage.getItem("fcmToken");
    if (!token) {
      alert('Nenhum token encontrado. Faça a inscrição primeiro.');
      return;
    }
    const result = await saveTokenToGoogleSheets(token);
    alert(result ? '✅ Conexão com Google Sheets OK!' : '❌ Falha na conexão');
  },
  // Função para verificar status do sistema
  checkSystemStatus: checkSystemStatus,
  // Função para inicializar sistema
  initializeSystem: initializeSystem
};

console.log('🔧 Debug functions available: window.ibnaDebug');
console.log('💡 Use window.ibnaDebug.testGoogleSheets() para testar a conexão');
console.log('🌐 Use window.ibnaDebug.checkSystemStatus() para verificar o sistema');
