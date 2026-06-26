// Tela de solicitacoes: separa pedidos recebidos/enviados e executa aceitar/rejeitar.

// HP-REQ-005 | Tela de solicitacoes: separa pedidos recebidos/enviados e
// executa aceite/recusa pelo motorista usando endpoints protegidos por JWT.
document.addEventListener("DOMContentLoaded", initializeRequests);

let requests = [];

async function initializeRequests() {
    // Tela protegida: as solicitacoes pertencem ao usuario identificado pelo JWT.
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    bindEvents();
    await loadRequests();
    renderRequests();
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
    document
        .querySelectorAll(".tab-button")
        .forEach(button => {
            button.addEventListener("click", () => switchTab(button.dataset.tab));
        });
}

async function loadRequests() {
    try {
        // Retorna pedidos recebidos como motorista e enviados como passageiro.
        const response = await apiFetch("/ride-requests");

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Erro ao carregar solicitações.");
        }

        const data = await response.json();
        requests = data?.data?.requests || [];
    } catch (error) {
        console.error(error);
        requests = [];
        showToast(error.message, "danger");
    }
}

function switchTab(tab) {
    document
        .querySelectorAll(".tab-button")
        .forEach(button => button.classList.remove("active"));

    document
        .querySelector(`[data-tab="${tab}"]`)
        .classList.add("active");

    document.getElementById("receivedRequests").classList.add("d-none");
    document.getElementById("sentRequests").classList.add("d-none");

    if (tab === "received") {
        document.getElementById("receivedRequests").classList.remove("d-none");
    } else {
        document.getElementById("sentRequests").classList.remove("d-none");
    }
}

function renderRequests() {
    renderReceivedRequests();
    renderSentRequests();
}

function renderReceivedRequests() {
    const container = document.getElementById("receivedRequests");
    const received = requests.filter(request => request.type === "received");

    if (!received.length) {
        container.innerHTML = getEmptyState("Nenhuma solicitação recebida");
        return;
    }

    container.innerHTML = received.map(createReceivedCard).join("");
}

function renderSentRequests() {
    const container = document.getElementById("sentRequests");
    const sent = requests.filter(request => request.type === "sent");

    if (!sent.length) {
        container.innerHTML = getEmptyState("Nenhuma solicitação enviada");
        return;
    }

    container.innerHTML = sent.map(createSentCard).join("");
}

function createReceivedCard(request) {
    const phone = request.passengerPhone
        ? `<p>${escapeHtml(request.passengerPhone)}</p>`
        : "<p>Passageiro</p>";

    return `
        <article class="request-card">
            <div class="request-header">
                <div class="request-user">
                    <h3>${escapeHtml(request.passenger || "Passageiro")}</h3>
                    ${phone}
                </div>
                <span class="request-status ${getStatusClass(request.status)}">
                    ${getStatusLabel(request.status)}
                </span>
            </div>

            <div class="request-route">
                <div class="route-origin">${escapeHtml(request.origin)}</div>
                <div class="route-arrow">↓</div>
                <div class="route-destination">${escapeHtml(request.destination)}</div>
            </div>

            ${createPassengerPickupMeta(request)}
            ${createRideMeta(request)}
            ${createReceivedActions(request)}
        </article>
    `;
}

function createSentCard(request) {
    return `
        <article class="request-card">
            <div class="request-header">
                <div class="request-user">
                    <h3>${escapeHtml(request.driver || "Motorista")}</h3>
                    <p>Motorista</p>
                </div>
                <span class="request-status ${getStatusClass(request.status)}">
                    ${getStatusLabel(request.status)}
                </span>
            </div>

            <div class="request-route">
                <div class="route-origin">${escapeHtml(request.origin)}</div>
                <div class="route-arrow">↓</div>
                <div class="route-destination">${escapeHtml(request.destination)}</div>
            </div>

            ${createPassengerPickupMeta(request)}
            ${createRideMeta(request)}

            <div class="request-actions">
                <button class="btn btn-primary" onclick="openRideDetail(${request.rideId})">
                    Ver Detalhes
                </button>
                ${createAcceptedLinks(request)}
            </div>
        </article>
    `;
}

function createRideMeta(request) {
    const dateTime = [request.date, request.time].filter(Boolean).join(" às ");
    const price = formatCurrency(request.valorSugerido ?? request.suggestedPrice);
    const seats = request.vagasDisponiveis ?? request.availableSeats ?? "Não informado";

    return `
        <div class="request-date">
            ${escapeHtml(dateTime || "Data não informada")}
        </div>
        <div class="request-date">
            Valor: ${escapeHtml(price)} • Vagas: ${escapeHtml(seats)}
        </div>
    `;
}

function createPassengerPickupMeta(request) {
    if (!request.pickupAddress && !request.dropoffAddress) {
        return "";
    }

    const pickupReference = request.pickupReference
        ? `<div class="request-date">Referência do embarque: ${escapeHtml(request.pickupReference)}</div>`
        : "";
    const dropoffReference = request.dropoffReference
        ? `<div class="request-date">Referência do desembarque: ${escapeHtml(request.dropoffReference)}</div>`
        : "";

    return `
        <div class="request-date">
            Embarque: ${escapeHtml(request.pickupAddress || "Nao informado")}
        </div>
        ${pickupReference}
        <div class="request-date">
            Desembarque: ${escapeHtml(request.dropoffAddress || "Nao informado")}
        </div>
        ${dropoffReference}
        <div class="request-date">
            Desvio: ${escapeHtml(formatMinutes(request.estimatedExtraRouteMinutes))}
            • Parada: ${escapeHtml(formatMinutes(request.estimatedBoardingMinutes))}
        </div>
        <div class="request-date">
            Parada estimada: ${escapeHtml(formatMinutes(request.estimatedBoardingMinutes))} no embarque e ${escapeHtml(formatMinutes(request.estimatedBoardingMinutes))} no desembarque.
        </div>
        <div class="request-date">
            O motorista pode aceitar ou recusar esta proposta. A rota oficial so muda apos aprovacao.
        </div>
    `;
}

function createReceivedActions(request) {
    if (normalizeStatus(request.status) !== "pendente") {
        return `
            <div class="request-actions">
                ${createAcceptedLinks(request)}
            </div>
        `;
    }

    return `
        <div class="request-actions">
            <button class="btn btn-success" onclick="approveRequest(${request.id})">
                Aceitar
            </button>
            <button class="btn btn-danger" onclick="rejectRequest(${request.id})">
                Rejeitar
            </button>
        </div>
    `;
}

function createAcceptedLinks(request) {
    if (!isAccepted(request.status) || !request.rideId) {
        return "";
    }

    return `
        <button class="btn btn-outline-primary" onclick="openChat(${request.rideId})">
            Abrir Chat
        </button>
        <button class="btn btn-outline-success" onclick="openQr(${request.rideId})">
            Mostrar QR
        </button>
    `;
}

async function approveRequest(id) {
    await updateRequestStatus(id, "accept", "Solicitação aceita com sucesso.");
}

async function rejectRequest(id) {
    await updateRequestStatus(id, "reject", "Solicitação rejeitada.");
}

async function updateRequestStatus(id, action, successMessage) {
    try {
        // PATCH chama /accept ou /reject; o backend confere se o usuario e o
        // motorista da carona antes de alterar o status.
        const response = await apiFetch(`/ride-requests/${id}/${action}`, {
            method: "PATCH"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Erro ao atualizar solicitação.");
        }

        const data = await response.json().catch(() => ({}));
        const updatedRequest = data?.data?.request;

        if (updatedRequest) {
            requests = requests.map(request =>
                request.id === updatedRequest.id
                    ? updatedRequest
                    : request
            );
        }

        await loadRequests();
        renderRequests();
        showToast(data.message || successMessage);
    } catch (error) {
        console.error(error);
        showToast(error.message, "danger");
    }
}

function openRideDetail(rideId) {
    window.location.href = rideId
        ? `ride-detail.html?id=${encodeURIComponent(rideId)}`
        : "ride-detail.html";
}

function openChat(rideId) {
    window.location.href = `chat.html?id=${encodeURIComponent(rideId)}`;
}

function openQr(rideId) {
    window.location.href = `trip-qr.html?id=${encodeURIComponent(rideId)}`;
}

function getStatusLabel(status) {
    switch (normalizeStatus(status)) {
        case "aceita":
        case "confirmada":
        case "aprovada":
        case "alteracao_aceita":
            return "Aceita";
        case "aguardando_alteracao":
            return "Aguardando passageiro";
        case "alteracao_recusada":
            return "Recusou alteracao";
        case "rejeitada":
            return "Rejeitada";
        case "cancelada":
            return "Cancelada";
        default:
            return "Pendente";
    }
}

function getStatusClass(status) {
    switch (normalizeStatus(status)) {
        case "aceita":
        case "confirmada":
        case "aprovada":
        case "alteracao_aceita":
            return "status-approved";
        case "aguardando_alteracao":
            return "status-pending";
        case "rejeitada":
        case "alteracao_recusada":
        case "cancelada":
            return "status-rejected";
        default:
            return "status-pending";
    }
}

function normalizeStatus(status) {
    const statusMap = {
        PENDING: "pendente",
        ACCEPTED: "aceita",
        PENDING_CHANGE_CONFIRMATION: "aguardando_alteracao",
        CHANGE_ACCEPTED: "alteracao_aceita",
        CHANGE_REJECTED: "alteracao_recusada",
        REJECTED: "rejeitada",
        CANCELED: "cancelada",
        pending: "pendente",
        accepted: "aceita",
        rejected: "rejeitada",
        canceled: "cancelada",
        approved: "aceita"
    };

    return statusMap[status] || String(status || "pendente").toLowerCase();
}

function isAccepted(status) {
    return ["aceita", "confirmada", "aprovada", "alteracao_aceita"].includes(normalizeStatus(status));
}

function getEmptyState(message) {
    return `
        <div class="empty-state">
            <h3>${escapeHtml(message)}</h3>
            <p>Nenhum registro encontrado.</p>
        </div>
    `;
}

function formatCurrency(value) {
    if (value === null || value === undefined || value === "") {
        return "Não informado";
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
        return String(value);
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(numberValue);
}

function formatMinutes(value) {
    return `${Number(value || 0).toFixed(1)} min`;
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(message, variant = "success") {
    const toastElement = document.getElementById("feedbackToast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toastElement || !toastMessage) return;

    toastMessage.textContent = message;

    toastElement.classList.remove(
        "text-bg-success",
        "text-bg-danger",
        "text-bg-warning",
        "text-bg-info"
    );

    toastElement.classList.add(`text-bg-${variant}`);

    bootstrap.Toast
        .getOrCreateInstance(toastElement, { delay: 3000 })
        .show();
}
