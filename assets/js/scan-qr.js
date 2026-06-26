// Leitura de QR: tela reservada para validacao futura do embarque.

// HP-QR-003 | Leitura de QR: tela reservada para validacao futura do embarque.
// Hoje nao existe endpoint real de leitura, apenas aviso controlado ao usuario.
document.addEventListener("DOMContentLoaded", initializeScanner);

async function initializeScanner() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindEvents();
}

async function loadComponents() {
    try {
        const [headerResponse, navbarResponse] = await Promise.all([
            fetch("../components/header.html"),
            fetch("../components/navbar.html")
        ]);

        if (headerResponse.ok) {
            document.getElementById("header-slot").innerHTML = await headerResponse.text();
        }

        if (navbarResponse.ok) {
            document.getElementById("navbar-slot").innerHTML = await navbarResponse.text();
        }
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
    }
}

function bindEvents() {
    const scanButton = document.getElementById("scanQrBtn");

    if (!scanButton) return;

    scanButton.addEventListener("click", () => {
        showToast("Validação de QR ainda não possui endpoint real.", "warning");
    });
}

function showToast(message, variant = "success") {
    const toastElement = document.getElementById("feedbackToast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toastElement || !toastMessage) return;

    toastMessage.textContent = message;
    toastElement.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning", "text-bg-info");
    toastElement.classList.add(`text-bg-${variant}`);

    bootstrap.Toast
        .getOrCreateInstance(toastElement, { delay: 2500 })
        .show();
}
