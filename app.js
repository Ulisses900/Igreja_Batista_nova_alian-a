// ==========================================================
// IMPORTAR FIREBASE.JS
// ==========================================================

async function subscribeWithFirebase() {
  try {
    const { requestNotificationPermission } = await import('/firebase.js');

    console.log('Pedindo token FCM...');
    const token = await requestNotificationPermission();

    if (!token) {
      alert("❌ Não foi possível obter o token FCM.");
      return;
    }

    localStorage.setItem("fcmToken", token);

    alert("🎉 Inscrição realizada com sucesso!");
  } catch (err) {
    console.error("Erro ao inscrever:", err);
    alert("Erro: " + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById("subscribe");
  if (btn) {
    btn.addEventListener("click", subscribeWithFirebase);
  }
});
