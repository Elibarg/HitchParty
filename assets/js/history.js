// Historico: lista caronas encerradas/canceladas relacionadas ao usuario.

document.addEventListener("DOMContentLoaded", initializeHistory);

let trips = [];

async function initializeHistory() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindEvents();
    await loadHistory();
    renderHistory();
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
        .querySelectorAll(".history-tab")
        .forEach(button => {
            button.addEventListener("click", () => switchTab(button.dataset.tab));
        });
}

async function loadHistory() {
    try {
        const response = await apiFetch("/rides/history");

        if (!response.ok) {
            throw new Error("Erro ao carregar histórico.");
        }

        const data = await response.json();
        trips = data?.data?.rides || [];
    } catch (error) {
        console.error(error);
        trips = [];
        showToast(error.message || "Erro ao carregar histórico.", "danger");
    }
}

function switchTab(tab) {
    document
        .querySelectorAll(".history-tab")
        .forEach(button => button.classList.remove("active"));

    document
        .querySelector(`[data-tab="${tab}"]`)
        .classList.add("active");

    document.getElementById("completedTrips").classList.add("d-none");
    document.getElementById("cancelledTrips").classList.add("d-none");

    if (tab === "completed") {
        document.getElementById("completedTrips").classList.remove("d-none");
    } else {
        document.getElementById("cancelledTrips").classList.remove("d-none");
    }
}

function renderHistory() {
    renderCompletedTrips();
    renderCancelledTrips();
}

function renderCompletedTrips() {
    const container = document.getElementById("completedTrips");
    const completed = trips.filter(trip => trip.status === "FINISHED");

    if (!completed.length) {
        container.innerHTML = getEmptyState("Nenhuma viagem concluída");
        return;
    }

    container.innerHTML = completed.map(createTripCard).join("");
}

function renderCancelledTrips() {
    const container = document.getElementById("cancelledTrips");
    const cancelled = trips.filter(trip => trip.status === "CANCELED");

    if (!cancelled.length) {
        container.innerHTML = getEmptyState("Nenhuma viagem cancelada");
        return;
    }

    container.innerHTML = cancelled.map(createTripCard).join("");
}

function createTripCard(trip) {
    const isCompleted = trip.status === "FINISHED";

    return `
        <article class="history-card">
            <div class="history-header">
                <div class="history-user">
                    <h3>${escapeHtml(trip.driverName || trip.driver || "Motorista não informado")}</h3>
                    <p>${escapeHtml(trip.vehicle || "")}</p>
                </div>
                <span class="trip-status ${isCompleted ? "status-completed" : "status-cancelled"}">
                    ${isCompleted ? "Concluída" : "Cancelada"}
                </span>
            </div>
            <div class="trip-route">
                <div class="route-origin">${escapeHtml(trip.origin)}</div>
                <div class="route-arrow">↓</div>
                <div class="route-destination">${escapeHtml(trip.destination)}</div>
            </div>
            <div class="trip-info">
                <span class="trip-badge">${escapeHtml(trip.date || "Data não informada")}</span>
                <span class="trip-badge">${escapeHtml(trip.time || "Horário não informado")}</span>
            </div>
            <div class="trip-actions">
                <button
                    class="btn btn-primary"
                    onclick="viewTrip(${trip.id})">
                    Detalhes
                </button>
            </div>
        </article>
    `;
}

function viewTrip(id) {
    window.location.href = `ride-detail.html?id=${encodeURIComponent(id)}`;
}

function getEmptyState(message) {
    return `
        <div class="empty-state">
            <h3>${escapeHtml(message)}</h3>
            <p>Nenhum registro encontrado.</p>
        </div>
    `;
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
    toastElement.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning", "text-bg-info");
    toastElement.classList.add(`text-bg-${variant}`);

    bootstrap.Toast
        .getOrCreateInstance(toastElement, { delay: 3000 })
        .show();
}
