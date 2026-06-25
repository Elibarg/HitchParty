// Configuracoes locais: preferencias visuais salvas no navegador.

document.addEventListener("DOMContentLoaded", initializeSettings);

const SETTINGS_STORAGE_KEY = "hitchparty_settings";

const DEFAULT_SETTINGS = {
    newRequests: true,
    rideApproval: true,
    rideCancellation: true,
    chatNotifications: false,
    tripReminders: true,
    showRating: true,
    sharePhone: true,
    publicPhoto: true,
    language: "pt-BR"
};

async function initializeSettings() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    loadSettings();
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
    document.getElementById("saveSettingsBtn")?.addEventListener("click", saveSettings);
    document.getElementById("logoutAllBtn")?.addEventListener("click", logoutAllSessions);
    document.getElementById("deleteAccountBtn")?.addEventListener("click", confirmDeleteAccount);
}

function loadSettings() {
    const settings = getStoredSettings();

    Object.entries(settings).forEach(([key, value]) => {
        const field = document.getElementById(key);
        if (!field) return;

        if (field.type === "checkbox") {
            field.checked = Boolean(value);
        } else {
            field.value = value;
        }
    });
}

function getStoredSettings() {
    try {
        return {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}")
        };
    } catch (error) {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings() {
    const settings = {
        newRequests: document.getElementById("newRequests").checked,
        rideApproval: document.getElementById("rideApproval").checked,
        rideCancellation: document.getElementById("rideCancellation").checked,
        chatNotifications: document.getElementById("chatNotifications").checked,
        tripReminders: document.getElementById("tripReminders").checked,
        showRating: document.getElementById("showRating").checked,
        sharePhone: document.getElementById("sharePhone").checked,
        publicPhoto: document.getElementById("publicPhoto").checked,
        language: document.getElementById("language").value
    };

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    showToast("Configurações salvas com sucesso.", "success");
}

function logoutAllSessions() {
    showToast(
        "Encerrar todas as sessões ainda não possui endpoint real.",
        "warning"
    );
}

function confirmDeleteAccount() {
    const confirmed = confirm("Tem certeza que deseja excluir sua conta?");
    if (!confirmed) return;

    showToast(
        "Excluir conta ainda não possui endpoint real.",
        "warning"
    );
}

function showToast(message, variant = "success") {
    const toastElement = document.getElementById("feedbackToast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toastElement || !toastMessage) return;

    toastMessage.textContent = message;
    toastElement.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning", "text-bg-info");
    toastElement.classList.add(`text-bg-${variant}`);

    bootstrap.Toast
        .getOrCreateInstance(toastElement, { delay: 3000 })
        .show();
}
