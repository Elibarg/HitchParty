document.addEventListener(
    "DOMContentLoaded",
    initializeTripQr
);

async function initializeTripQr() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();

    bindEvents();

    loadTripData();
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

    const shareButton =
        document.getElementById(
            "shareQrBtn"
        );

    if (shareButton) {

        shareButton.addEventListener(
            "click",
            shareQr
        );

    }

}

/* =========================
   DADOS DA VIAGEM
========================= */

function loadTripData() {

    /*
    MVP

    Dados simulados

    Futuro:
    GET /api/trips/{id}
    */

    const trip = {

        code:
            "HP-TRIP-2025-001",

        driver:
            "Carlos Silva",

        origin:
            "Joinville",

        destination:
            "Blumenau",

        date:
            "12/06/2025",

        time:
            "18:30",

        status:
            "Pronto para embarque"
    };

    console.log(
        "Viagem carregada:",
        trip
    );

}

/* =========================
   COMPARTILHAR QR
========================= */

async function shareQr() {

    const shareData = {

        title:
            "HitchParty",

        text:
            "Meu QR Code da viagem",

        url:
            window.location.href
    };

    try {

        if (
            navigator.share
        ) {

            await navigator.share(
                shareData
            );

            showToast(
                "QR compartilhado com sucesso."
            );

        }
        else {

            await navigator.clipboard.writeText(
                shareData.url
            );

            showToast(
                "Link copiado para a área de transferência."
            );

        }

    }
    catch(error) {

        console.error(
            error
        );

        showToast(
            "Não foi possível compartilhar.",
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

    bootstrap.Toast
        .getOrCreateInstance(
            toastElement,
            {
                delay: 3000
            }
        )
        .show();

}