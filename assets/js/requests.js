document.addEventListener(
    "DOMContentLoaded",
    initializeRequests
);

const REQUESTS_STORAGE_KEY =
    "hitchparty_requests";

let requests = [];

async function initializeRequests() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();
    bindLogout();
    loadRequests();
    bindLogout();
    bindEvents();

    renderRequests();
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
        .querySelectorAll(
            ".tab-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => switchTab(
                    button.dataset.tab
                )
            );

        });

}


/* =========================
   DADOS
========================= */

function loadRequests() {

    requests =
        JSON.parse(
            localStorage.getItem(
                REQUESTS_STORAGE_KEY
            )
        ) || getMockRequests();

}


function getMockRequests() {

    return [

        {
            id: 1,

            type: "received",

            passenger:
                "Gabriel",

            origin:
                "Rua Guanabara",

            destination:
                "Rua Aracaju",

            date:
                "18:30",

            status:
                "pending"
        },

        {
            id: 2,

            type: "received",

            passenger:
                "Maria",

            origin:
                "Rua Farroupilha",

            destination:
                "Rua Papanduva",

            date:
                "07:00",

            status:
                "pending"
        },

        {
            id: 3,

            type: "sent",

            driver:
                "Carlos",

            origin:
                "Rua Iguaçu",

            destination:
                "Rua Marcílio Dias",

            date:
                "08:00",

            status:
                "approved"
        },

        {
            id: 4,

            type: "sent",

            driver:
                "Pedro",

            origin:
                "Rua Dona Francisca",

            destination:
                "Rua 15 de Novembro",

            date:
                "14:00",

            status:
                "pending"
        }

    ];

}

function switchTab(tab) {

    document
        .querySelectorAll(
            ".tab-button"
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
            "receivedRequests"
        )
        .classList.add(
            "d-none"
        );

    document
        .getElementById(
            "sentRequests"
        )
        .classList.add(
            "d-none"
        );

    if (tab === "received") {

        document
            .getElementById(
                "receivedRequests"
            )
            .classList.remove(
                "d-none"
            );

    }
    else {

        document
            .getElementById(
                "sentRequests"
            )
            .classList.remove(
                "d-none"
            );

    }

}

/* =========================
   RENDERIZAÇÃO
========================= */

function renderRequests() {

    renderReceivedRequests();

    renderSentRequests();

}

function renderReceivedRequests() {

    const container =
        document.getElementById(
            "receivedRequests"
        );

    const received =
        requests.filter(
            request =>
                request.type ===
                "received"
        );

    if (!received.length) {

        container.innerHTML =
            getEmptyState(
                "Nenhuma solicitação recebida"
            );

        return;
    }

    container.innerHTML =
        received
            .map(
                createReceivedCard
            )
            .join("");

}

function renderSentRequests() {

    const container =
        document.getElementById(
            "sentRequests"
        );

    const sent =
        requests.filter(
            request =>
                request.type ===
                "sent"
        );

    if (!sent.length) {

        container.innerHTML =
            getEmptyState(
                "Nenhuma solicitação enviada"
            );

        return;
    }

    container.innerHTML =
        sent
            .map(
                createSentCard
            )
            .join("");

}

/* =========================
   CARDS
========================= */

function createReceivedCard(request) {

    return `

        <article class="request-card">

            <div class="request-header">

                <div class="request-user">

                    <h3>
                        ${request.passenger}
                    </h3>

                    <p>
                        Passageiro
                    </p>

                </div>

                <span class="
                    request-status
                    ${getStatusClass(
        request.status
    )}
                ">

                    ${getStatusLabel(
        request.status
    )}

                </span>

            </div>

            <div class="request-route">

                <div class="route-origin">
                    ${request.origin}
                </div>

                <div class="route-arrow">
                    ↓
                </div>

                <div class="route-destination">
                    ${request.destination}
                </div>

            </div>

            <div class="request-date">

                ${request.date}

            </div>

            <div class="request-actions">

                <button
                    class="btn btn-success"
                    onclick="approveRequest(${request.id})">

                    Aceitar

                </button>

                <button
                    class="btn btn-danger"
                    onclick="rejectRequest(${request.id})">

                    Recusar

                </button>

                <button
                    class="btn btn-outline-primary"
                    onclick="openChat()">

                    Chat

                </button>

            </div>

        </article>

    `;

}

function createSentCard(request) {

    return `

        <article class="request-card">

            <div class="request-header">

                <div class="request-user">

                    <h3>
                        ${request.driver}
                    </h3>

                    <p>
                        Motorista
                    </p>

                </div>

                <span class="
                    request-status
                    ${getStatusClass(
        request.status
    )}
                ">

                    ${getStatusLabel(
        request.status
    )}

                </span>

            </div>

            <div class="request-route">

                <div class="route-origin">
                    ${request.origin}
                </div>

                <div class="route-arrow">
                    ↓
                </div>

                <div class="route-destination">
                    ${request.destination}
                </div>

            </div>

            <div class="request-date">

                ${request.date}

            </div>

            <div class="request-actions">

                <button
                    class="btn btn-primary"
                    onclick="openRideDetail()">

                    Ver Detalhes

                </button>

            </div>

        </article>

    `;

}

/* =========================
   AÇÕES
========================= */

function approveRequest(id) {

    updateRequestStatus(
        id,
        "approved"
    );

    showToast(
        "Solicitação aprovada."
    );

}

function rejectRequest(id) {

    updateRequestStatus(
        id,
        "rejected"
    );

    showToast(
        "Solicitação recusada."
    );

}

function updateRequestStatus(
    id,
    status
) {

    const request =
        requests.find(
            request =>
                request.id === id
        );

    if (!request) {

        return;
    }

    request.status =
        status;

    persistRequests();

    renderRequests();

}

function openChat() {

    window.location.href =
        "chat.html";

}

function openRideDetail() {

    window.location.href =
        "ride-detail.html";

}

/* =========================
   HELPERS
========================= */

function getStatusLabel(
    status
) {

    switch (status) {

        case "approved":
            return "Aprovada";

        case "rejected":
            return "Recusada";

        default:
            return "Pendente";

    }

}

function getStatusClass(
    status
) {

    switch (status) {

        case "approved":
            return "status-approved";

        case "rejected":
            return "status-rejected";

        default:
            return "status-pending";

    }

}

function getEmptyState(
    message
) {

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

function persistRequests() {

    localStorage.setItem(
        REQUESTS_STORAGE_KEY,
        JSON.stringify(
            requests
        )
    );

    /*
    BACKEND FUTURO

    GET /api/requests

    POST /api/requests

    PATCH /api/requests/{id}

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