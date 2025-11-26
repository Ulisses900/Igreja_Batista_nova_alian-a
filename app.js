// ==========================================================
// CONFIGURAÇÕES E IMPORTAÇÕES
// ==========================================================

const APPS_SCRIPT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw93LOXmAc7YsQZT0NBV6o6y4_uq7JqMq1mdxZjFEy5o37VNVCEICHzvZc_21efZao/exec';
const BROWSER_ID = 'ibna-' + Date.now();

// ==========================================================
// FUNÇÃO PRINCIPAL DE INSCRIÇÃO COM FIREBASE
// ==========================================================

async function subscribeWithFirebase() {
  try {
    console.log('Iniciando inscrição com Firebase...');
    
    // Importar funções do Firebase (ajuste o caminho conforme sua estrutura)
    const { requestNotificationPermission } = await import('./firebase.js');
    
    // Solicitar permissão e obter token
    const token = await requestNotificationPermission();
    
    if (token) {
      alert('🎉 Inscrito com sucesso! Você receberá notificações da IBNA.');
      
      // Salvar no localStorage para referência futura
      localStorage.setItem('fcmToken', token);
      localStorage.setItem('browserId', BROWSER_ID);
      
      console.log('Inscrição concluída - Token:', token);
    } else {
      alert('❌ Não foi possível completar a inscrição. Por favor, permita as notificações.');
    }
    
  } catch (error) {
    console.error('Erro na inscrição Firebase:', error);
    alert('❌ Erro ao tentar se inscrever: ' + error.message);
  }
}

// ==========================================================
// VERIFICAR INSCRIÇÃO EXISTENTE
// ==========================================================

function checkExistingSubscription() {
  const token = localStorage.getItem('fcmToken');
  const browserId = localStorage.getItem('browserId');
  
  if (token && browserId) {
    console.log('Inscrição existente encontrada:', { browserId, token: token.substring(0, 20) + '...' });
    
    // Mostrar status para o usuário
    const statusElement = document.getElementById('subscriptionStatus');
    if (statusElement) {
      statusElement.innerHTML = '✅ Você está inscrito para receber notificações';
      statusElement.style.color = 'green';
    }
    
    return true;
  }
  
  return false;
}

// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('IBNA - Sistema de Notificações inicializando...');
  
  // Verificar se já está inscrito
  checkExistingSubscription();
  
  // Configurar botão de inscrição
  const subscribeButton = document.getElementById('subscribe');
  if (subscribeButton) {
    subscribeButton.addEventListener('click', subscribeWithFirebase);
    subscribeButton.innerHTML = '🔔 Receber Notificações';
  }
  
  // Botão para testar notificação local (apenas desenvolvimento)
  const testButton = document.getElementById('testNotification');
  if (testButton) {
    testButton.addEventListener('click', testLocalNotification);
    testButton.style.display = 'block';
  }
});

// ==========================================================
// FUNÇÃO DE TESTE LOCAL (APENAS DESENVOLVIMENTO)
// ==========================================================

function testLocalNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('🔔 IBNA - Teste', {
      body: 'Esta é uma notificação de teste do sistema!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test'
    });
    
    notification.onclick = function() {
      window.focus();
      notification.close();
    };
    
    alert('Notificação de teste enviada!');
  } else {
    alert('Primeiro você precisa permitir notificações.');
  }
}
