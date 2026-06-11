document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);

async function initializeApp() {

    try {

        await simulateStartup();

        if (isAuthenticated()) {

            window.location.href =
                "pages/dashboard.html";

        } else {

            window.location.href =
                "pages/login.html";

        }

    } catch (error) {

        console.error(
            "Erro ao iniciar aplicação:",
            error
        );

        window.location.href =
            "pages/login.html";

    }

}

async function simulateStartup() {

    return new Promise(resolve => {

        setTimeout(() => {

            resolve();

        }, 2000);

    });

}