document.addEventListener(
    "DOMContentLoaded",
    initializeValidation
);

const VALIDATION_STORAGE_KEY =
    "hitchparty_trip_validation";

async function initializeValidation() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();

    loadValidationData();
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
   DADOS DA VALIDAÇÃO
========================= */

function loadValidationData() {

    const validation =
        JSON.parse(
            localStorage.getItem(
                VALIDATION_STORAGE_KEY
            )
        );

    if (!validation) {

        showEmptyState();

        return;
    }

    fillValidationData(
        validation
    );
}

function fillValidationData(
    validation
) {

    const tripCode =
        document.getElementById(
            "tripCode"
        );

    const passengerName =
        document.getElementById(
            "passengerName"
        );

    const driverName =
        document.getElementById(
            "driverName"
        );

    const tripRoute =
        document.getElementById(
            "tripRoute"
        );

    const validationTime =
        document.getElementById(
            "validationTime"
        );

    if (tripCode) {

        tripCode.textContent =
            validation.tripCode;
    }

    if (passengerName) {

        passengerName.textContent =
            validation.passenger;
    }

    if (driverName) {

        driverName.textContent =
            validation.driver;
    }

    if (tripRoute) {

        tripRoute.textContent =
            validation.route;
    }

    if (validationTime) {

        validationTime.textContent =
            formatDateTime(
                validation.timestamp
            );
    }

}

/* =========================
   SEM DADOS
========================= */

function showEmptyState() {

    const details =
        document.querySelector(
            ".trip-details"
        );

    if (!details) {

        return;
    }

    details.innerHTML = `

        <div
            class="alert alert-warning text-center">

            Nenhuma validação encontrada.

        </div>

    `;

}

/* =========================
   FORMATAÇÃO
========================= */

function formatDateTime(
    dateString
) {

    if (!dateString) {

        return "--";
    }

    const date =
        new Date(
            dateString
        );

    return date.toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}

/* =========================
   BACKEND FUTURO
========================= */

/*

GET /api/trips/validation/{id}

Resposta:

{
    "tripCode":
        "HP-TRIP-2025-001",

    "passenger":
        "Gabriel Alves",

    "driver":
        "Carlos Silva",

    "route":
        "Joinville → Blumenau",

    "timestamp":
        "2025-06-12T18:30:00",

    "status":
        "validated"
}

*/