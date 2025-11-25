// ==========================================================
// 1. CONFIGURAÇÕES CRÍTICAS (ATUALIZADAS)
// ==========================================================
// Sua CHAVE PÚBLICA VAPID.
const VAPID_PUBLIC_KEY = 'BPln7ph5L0061tGzpskhYNK1jX6h6j8GXIhO1Jlxq2DncedsEn6vhNB4q-pDdKBg7CEgjXiqmd21kJkuC_u9hz8';

// URL do seu Google Apps Script (Web App) - ENDPOINT DE INSCRIÇÃO
const APPS_SCRIPT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw93LOXmAc7YsQZT0NBV6o6y4_uq7JqMq1mdxZjFEy5o37VNVCEICHzvZc_21efZao/exec';

// ID único para identificar o navegador na Planilha (para este exemplo)
const BROWSER_ID = Date.now().toString(); 

let notificationServiceWorker;

// ==========================================================
// 2. REGISTRO DO SERVICE WORKER
// ==========================================================

function registerNotificationServiceWorker () {
    return new Promise((resolve, reject) => {
        if (!('serviceWorker' in navigator)) {
            return resolve();
        }

        return window.navigator.serviceWorker.register(
            `/notification-service-worker.js`,
            { scope: "./" }
        ).then((registration) => {
            const sw = registration.installing ||
                registration.waiting ||
                registration.active;

            if (registration.active) {
                notificationServiceWorker = registration;
                resolve();
                return;
            }

            sw.addEventListener('statechange', (ev) => {
                if (ev.target.state === 'activated') {
                    notificationServiceWorker = registration;
                    resolve();
                }
            });
        }).catch(reject);
    });
}

// ==========================================================
// 3. REGISTRO DA PUSH NOTIFICATION
// ==========================================================

async function registerPushManager() {
    await registerNotificationServiceWorker();

    if (!notificationServiceWorker) {
        alert('Desculpe, não foi possível registrar o Service Worker.');
        return;
    }

    try {
        const result = await window.Notification.requestPermission();

        if (result !== 'granted') {
            alert(`Permissão negada: ${result}`);
            return;
        }

        // 1. Gera a subscrição push usando a Chave Pública VAPID
        const subscription = await notificationServiceWorker
            .pushManager
            .subscribe({
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                userVisibleOnly: true
            });

        // 2. Envia a subscrição para o Apps Script - CÓDIGO CORRIGIDO
        const response = await fetch(APPS_SCRIPT_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors', // ← ADICIONE ESTA LINHA
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                browserId: BROWSER_ID,
                pushSubscription: subscription
            })
        });

        // Com 'no-cors' não podemos ver a resposta, mas a requisição é enviada
        console.log('Inscrição enviada para o servidor');
        alert('Inscrição realizada com sucesso! Você receberá notificações recorrentes.');

    } catch (ex) {
        console.error('Erro detalhado:', ex);
        alert(`Erro ao tentar se inscrever: ${ex.message}`);
    }
}

// ==========================================================
// FUNÇÃO AUXILIAR ESSENCIAL (ADICIONE ESTA FUNÇÃO)
// ==========================================================

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// ==========================================================
// 4. INICIALIZAÇÃO E EVENTOS
// ==========================================================

// Se houver um elemento para mostrar o ID do navegador
const browserIdElement = document.querySelector('#browserId');
if (browserIdElement) {
    browserIdElement.innerHTML = BROWSER_ID;
}

registerNotificationServiceWorker().catch(console.error);

// Configura o botão de subscrição
document.querySelector('#subscribe').addEventListener('click', () => {
    registerPushManager();
});

// A lógica de teste local (#notifyAll) foi removida, 
// pois o envio será feito exclusivamente pelo Apps Script.
