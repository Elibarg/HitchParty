document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);

async function initializeSettings() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();

    loadSettings();

    bindEvents();
}

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

        document.getElementById(
            "header-slot"
        ).innerHTML =
            await headerResponse.text();

        document.getElementById(
            "navbar-slot"
        ).innerHTML =
            await navbarResponse.text();

    }
    catch(error) {

        console.error(error);

    }

}

function loadSettings() {

    const settings =
        JSON.parse(
            localStorage.getItem(
                "hitchparty_settings"
            )
        ) || {

            emailNotifications: true,
            pushNotifications: true,
            showPhone: true,
            theme: "light",
            language: "pt-BR"
        };

    document.getElementById(
        "emailNotifications"
    ).checked =
        settings.emailNotifications;

    document.getElementById(
        "pushNotifications"
    ).checked =
        settings.pushNotifications;

    document.getElementById(
        "showPhone"
    ).checked =
        settings.showPhone;

    document.getElementById(
        "theme"
    ).value =
        settings.theme;

    document.getElementById(
        "language"
    ).value =
        settings.language;
}

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
            "deleteAccountBtn"
        )
        .addEventListener(
            "click",
            openDeleteModal
        );

    document
        .getElementById(
            "confirmDeleteBtn"
        )
        .addEventListener(
            "click",
            deleteAccount
        );

    document
        .getElementById(
            "logoutAllBtn"
        )
        .addEventListener(
            "click",
            logoutAllSessions
        );
}

function saveSettings() {

    const settings = {

        emailNotifications:
            document.getElementById(
                "emailNotifications"
            ).checked,

        pushNotifications:
            document.getElementById(
                "pushNotifications"
            ).checked,

        showPhone:
            document.getElementById(
                "showPhone"
            ).checked,

        theme:
            document.getElementById(
                "theme"
            ).value,

        language:
            document.getElementById(
                "language"
            ).value
    };

    localStorage.setItem(
        "hitchparty_settings",
        JSON.stringify(settings)
    );

    showToast(
        "Configurações salvas com sucesso."
    );
}

function logoutAllSessions() {

    /*
    BACKEND FUTURO

    POST /api/auth/logout-all

    */

    showToast(
        "Todas as sessões foram encerradas."
    );
}

function openDeleteModal() {

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "deleteAccountModal"
            )
        );

    modal.show();
}

function deleteAccount() {

    /*
    BACKEND FUTURO

    DELETE /api/users/me

    */

    localStorage.clear();

    window.location.href =
        "login.html";
}

function showToast(message) {

    document.getElementById(
        "toastMessage"
    ).textContent = message;

    const toast =
        bootstrap.Toast.getOrCreateInstance(
            document.getElementById(
                "feedbackToast"
            )
        );

    toast.show();
}