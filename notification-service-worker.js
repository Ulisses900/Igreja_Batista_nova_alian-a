self.addEventListener("push", async (event) => {
    // Tenta analisar o payload (carga útil) da notificação
    let data = {};
    try {
        data = await event.data.json();
    } catch (e) {
        console.error("Erro ao analisar dados da notificação push:", e);
        data = { title: "Nova Notificação", body: "Você tem uma nova mensagem." };
    }

    const title = data.title || "Nova Notificação";
    const body = data.body || "Você tem uma nova mensagem.";
    const icon = data.icon || 'https://umpordez.com/assets/images/logo.png'; // Use um ícone padrão se não for fornecido

    // Exibe a notificação ao usuário
    self.registration.showNotification(
        title,
        { body, icon: icon }
    );
});

// Opcional, mas recomendado: Lidar com o clique na notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Se houver um URL (link) nos dados, abre a janela
    // event.waitUntil(clients.openWindow('URL_PARA_ABRIR_AO_CLICAR'));
});
