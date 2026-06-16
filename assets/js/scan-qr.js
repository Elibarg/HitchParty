document.addEventListener(
    "DOMContentLoaded",
    initializeScanner
);

async function initializeScanner() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();

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
    catch(error) {

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

    const simulateButton =
        document.getElementById(
            "simulateScanBtn"
        );

    if (!simulateButton) {

        return;
    }

    simulateButton.addEventListener(
        "click",
        simulateScan
    );

}

/* =========================
   SIMULAÇÃO QR
========================= */

function simulateScan() {

    const button =
        document.getElementById(
            "simulateScanBtn"
        );

    button.disabled = true;

    button.innerHTML = `
        <span
            class="spinner-border spinner-border-sm me-2">
        </span>
        Lendo QR...
    `;

    showToast(
        "QR identificado."
    );

    setTimeout(() => {

        saveValidation();

        window.location.href =
            "trip-validation.html";

    }, 1800);

}

/* =========================
   VALIDAÇÃO
========================= */

function saveValidation() {

    const validation = {

        tripCode:
            "HP-TRIP-2025-001",

        passenger:
            "Gabriel Alves",

        driver:
            "Carlos Silva",

        route:
            "Joinville → Blumenau",

        timestamp:
            new Date()
                .toISOString(),

        status:
            "validated"
    };

    localStorage.setItem(
        "hitchparty_trip_validation",
        JSON.stringify(
            validation
        )
    );

    /*
    BACKEND FUTURO

    POST /api/trips/validate

    body:

    {
        tripCode:
        "HP-TRIP-2025-001"
    }

    */

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

    if (!toastElement) {

        return;
    }

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

    bootstrap.Toast
        .getOrCreateInstance(
            toastElement,
            {
                delay: 2500
            }
        )
        .show();

}