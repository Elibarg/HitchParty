document.addEventListener(
    "DOMContentLoaded",
    initializeHistory
);

const HISTORY_STORAGE_KEY =
    "hitchparty_history";

let trips = [];

async function initializeHistory() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();

    loadHistory();

    bindEvents();

    renderHistory();
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

    document
        .querySelectorAll(
            ".history-tab"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    switchTab(
                        button.dataset.tab
                    )
            );

        });

}

/* =========================
   DADOS
========================= */

function loadHistory() {

    trips =
        JSON.parse(
            localStorage.getItem(
                HISTORY_STORAGE_KEY
            )
        ) || getMockHistory();

}

function getMockHistory() {

    return [

        {
            id: 1,

            status:
                "completed",

            role:
                "Passageiro",

            user:
                "Carlos Silva",

            origin:
                "Joinville",

            destination:
                "Blumenau",

            date:
                "12/06/2025",

            rating:
                5
        },

        {
            id: 2,

            status:
                "completed",

            role:
                "Motorista",

            user:
                "Maria Oliveira",

            origin:
                "Joinville",

            destination:
                "Curitiba",

            date:
                "08/06/2025",

            rating:
                4
        },

        {
            id: 3,

            status:
                "cancelled",

            role:
                "Passageiro",

            user:
                "Pedro Santos",

            origin:
                "Joinville",

            destination:
                "Florianópolis",

            date:
                "03/06/2025",

            rating:
                0
        }

    ];

}

/* =========================
   ABAS
========================= */

function switchTab(tab) {

    document
        .querySelectorAll(
            ".history-tab"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });

    document
        .querySelector(
            `[data-tab="${tab}"]`
        )
        .classList.add(
            "active"
        );

    document
        .getElementById(
            "completedTrips"
        )
        .classList.add(
            "d-none"
        );

    document
        .getElementById(
            "cancelledTrips"
        )
        .classList.add(
            "d-none"
        );

    if (tab === "completed") {

        document
            .getElementById(
                "completedTrips"
            )
            .classList.remove(
                "d-none"
            );

    }
    else {

        document
            .getElementById(
                "cancelledTrips"
            )
            .classList.remove(
                "d-none"
            );

    }

}

/* =========================
   RENDERIZAÇÃO
========================= */

function renderHistory() {

    renderCompletedTrips();

    renderCancelledTrips();

}

function renderCompletedTrips() {

    const container =
        document.getElementById(
            "completedTrips"
        );

    const completed =
        trips.filter(
            trip =>
                trip.status ===
                "completed"
        );

    if (!completed.length) {

        container.innerHTML =
            getEmptyState(
                "Nenhuma viagem concluída"
            );

        return;
    }

    container.innerHTML =
        completed
            .map(
                createTripCard
            )
            .join("");

}

function renderCancelledTrips() {

    const container =
        document.getElementById(
            "cancelledTrips"
        );

    const cancelled =
        trips.filter(
            trip =>
                trip.status ===
                "cancelled"
        );

    if (!cancelled.length) {

        container.innerHTML =
            getEmptyState(
                "Nenhuma viagem cancelada"
            );

        return;
    }

    container.innerHTML =
        cancelled
            .map(
                createTripCard
            )
            .join("");

}

function createTripCard(trip) {

    return `

        <article class="history-card">

            <div class="history-header">

                <div class="history-user">

                    <h3>
                        ${trip.user}
                    </h3>

                    <p>
                        ${trip.role}
                    </p>

                </div>

                <span
                    class="
                    trip-status
                    ${
                        trip.status ===
                        "completed"
                        ?
                        "status-completed"
                        :
                        "status-cancelled"
                    }">

                    ${
                        trip.status ===
                        "completed"
                        ?
                        "Concluída"
                        :
                        "Cancelada"
                    }

                </span>

            </div>

            <div class="trip-route">

                <div class="route-origin">

                    ${trip.origin}

                </div>

                <div class="route-arrow">

                    ↓

                </div>

                <div class="route-destination">

                    ${trip.destination}

                </div>

            </div>

            <div class="trip-info">

                <span class="trip-badge">

                    ${trip.date}

                </span>

                <span class="trip-badge">

                    ${trip.role}

                </span>

            </div>

            ${
                trip.status ===
                "completed"
                ?
                `
                <div class="trip-rating">

                    ${generateStars(
                        trip.rating
                    )}

                    <span>
                        (${trip.rating}.0)
                    </span>

                </div>
                `
                :
                ""
            }

            <div class="trip-actions">

                <button
                    class="btn btn-primary"
                    onclick="viewTrip(${trip.id})">

                    Detalhes

                </button>

                ${
                    trip.status ===
                    "completed"
                    ?
                    `
                    <button
                        class="btn btn-outline-warning"
                        onclick="rateTrip(${trip.id})">

                        Avaliar

                    </button>

                    <button
                        class="btn btn-outline-success"
                        onclick="viewQr(${trip.id})">

                        QR

                    </button>
                    `
                    :
                    ""
                }

            </div>

        </article>

    `;

}

/* =========================
   AÇÕES
========================= */

function viewTrip(id) {

    window.location.href =
        "ride-detail.html";

}

function viewQr(id) {

    window.location.href =
        "trip-qr.html";

}

function rateTrip(id) {

    showToast(
        "Tela de avaliação será aberta."
    );

    /*
    MVP

    Futuramente:
    review.html

    ou modal bootstrap
    */

}

/* =========================
   HELPERS
========================= */

function generateStars(rating) {

    let stars = "";

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        stars +=
            i <= rating
            ? "⭐"
            : "☆";

    }

    return stars;

}

function getEmptyState(message) {

    return `

        <div class="empty-state">

            <h3>

                ${message}

            </h3>

            <p>

                Nenhum registro encontrado.

            </p>

        </div>

    `;

}

/* =========================
   STORAGE
========================= */

function persistHistory() {

    localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(
            trips
        )
    );

    /*
    BACKEND FUTURO

    GET /api/history

    GET /api/history/completed

    GET /api/history/cancelled

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