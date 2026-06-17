document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);

const SETTINGS_STORAGE_KEY =
    "hitchparty_settings";

async function initializeSettings() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();
    bindLogout();
    loadSettings();

    bindEvents();
}

/* =========================
   COMPONENTES
========================= */

async function loadComponents() {

    try {

        const [
            headerResponse,
            navbarResponse
        ] = await Promise.all([

            fetch(
                "../components/header.html"
            ),

            fetch(
                "../components/navbar.html"
            )

        ]);

        if (headerResponse.ok) {

            document.getElementById(
                "header-slot"
            ).innerHTML =
                await headerResponse.text();

        }

        if (navbarResponse.ok) {

            document.getElementById(
                "navbar-slot"
            ).innerHTML =
                await navbarResponse.text();

        }

    }
    catch (error) {

        console.error(
            "Erro ao carregar componentes:",
            error
        );

    }

}

/* =========================
   EVENTOS
========================= */

function bindEvents() {

    document
        .getElementById(
            "saveSettingsBtn"
        )
        .addEventListener(
            "click",
            saveSettings
        );

    document
        .getElementById(
            "logoutAllBtn"
        )
        .addEventListener(
            "click",
            logoutAllSessions
        );

    document
        .getElementById(
            "deleteAccountBtn"
        )
        .addEventListener(
            "click",
            confirmDeleteAccount
        );
}

/* =========================
   CARREGAR CONFIGURAÇÕES
========================= */

function loadSettings() {

    const settings =
        JSON.parse(
            localStorage.getItem(
                SETTINGS_STORAGE_KEY
            )
        ) || getDefaultSettings();

    document.getElementById(
        "newRequests"
    ).checked =
        settings.newRequests;

    document.getElementById(
        "rideApproval"
    ).checked =
        settings.rideApproval;

    document.getElementById(
        "rideCancellation"
    ).checked =
        settings.rideCancellation;

    document.getElementById(
        "chatNotifications"
    ).checked =
        settings.chatNotifications;

    document.getElementById(
        "tripReminders"
    ).checked =
        settings.tripReminders;

    document.getElementById(
        "showRating"
    ).checked =
        settings.showRating;

    document.getElementById(
        "sharePhone"
    ).checked =
        settings.sharePhone;

    document.getElementById(
        "publicPhoto"
    ).checked =
        settings.publicPhoto;

    document.getElementById(
        "language"
    ).value =
        settings.language;
}

/* =========================
   SALVAR CONFIGURAÇÕES
========================= */

function saveSettings() {

    const settings = {

        newRequests:
            document.getElementById(
                "newRequests"
            ).checked,

        rideApproval:
            document.getElementById(
                "rideApproval"
            ).checked,

        rideCancellation:
            document.getElementById(
                "rideCancellation"
            ).checked,

        chatNotifications:
            document.getElementById(
                "chatNotifications"
            ).checked,

        tripReminders:
            document.getElementById(
                "tripReminders"
            ).checked,

        showRating:
            document.getElementById(
                "showRating"
            ).checked,

        sharePhone:
            document.getElementById(
                "sharePhone"
            ).checked,

        publicPhoto:
            document.getElementById(
                "publicPhoto"
            ).checked,

        language:
            document.getElementById(
                "language"
            ).value
    };

    localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(
            settings
        )
    );

    /*
    BACKEND FUTURO

    PUT /api/settings

    body:
    {
        newRequests,
        rideApproval,
        rideCancellation,
        chatNotifications,
        tripReminders,
        showRating,
        sharePhone,
        publicPhoto,
        language
    }

    */

    showToast(
        "Configurações salvas com sucesso.",
        "success"
    );
}

/* =========================
   CONFIGURAÇÕES PADRÃO
========================= */

function getDefaultSettings() {

    return {

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
}

/* =========================
   ENCERRAR SESSÕES
========================= */

async function logoutAllSessions() {

    try {

        /*
        BACKEND FUTURO

        POST /api/auth/logout-all

        */

        await fakeDelay();

        showToast(
            "Todas as sessões foram encerradas.",
            "success"
        );

    }
    catch (error) {

        console.error(error);

        showToast(
            "Erro ao encerrar sessões.",
            "danger"
        );

    }

}

/* =========================
   EXCLUIR CONTA
========================= */

function confirmDeleteAccount() {

    const confirmed =
        confirm(
            "Tem certeza que deseja excluir sua conta?"
        );

    if (!confirmed) {

        return;
    }

    deleteAccount();
}

async function deleteAccount() {

    try {

        /*
        BACKEND FUTURO

        DELETE /api/users/me

        */

        await fakeDelay();

        localStorage.clear();

        showToast(
            "Conta removida.",
            "success"
        );

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 1500);

    }
    catch (error) {

        console.error(error);

        showToast(
            "Erro ao excluir conta.",
            "danger"
        );

    }

}

/* =========================
   TOAST
========================= */

function showToast(
    message,
    variant = "success"
) {

    const toastElement =
        document.getElementById(
            "feedbackToast"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );

    toastMessage.textContent =
        message;

    toastElement.classList.remove(
        "text-bg-success",
        "text-bg-danger",
        "text-bg-warning",
        "text-bg-info"
    );

    toastElement.classList.add(
        `text-bg-${variant}`
    );

    const toast =
        bootstrap.Toast
            .getOrCreateInstance(
                toastElement,
                {
                    delay: 3000
                }
            );

    toast.show();
}

/* =========================
   UTILITÁRIOS
========================= */

function fakeDelay() {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                600
            )
    );

}