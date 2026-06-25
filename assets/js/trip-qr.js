// QR da viagem: consulta o payload da carona aceita e renderiza o codigo visual.

// HP-QR-002 | QR da viagem: consulta payload derivado de carona aceita e
// renderiza o codigo visual no navegador.
document.addEventListener("DOMContentLoaded", initializeTripQr);

async function initializeTripQr() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindEvents();
    await loadTripData();
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
    const shareButton = document.getElementById("shareQrBtn");
    shareButton?.addEventListener("click", shareQr);
}

async function loadTripData() {
    const rideId = new URLSearchParams(window.location.search).get("id");

    if (!rideId) {
        showEmptyState();
        return;
    }

    try {
        const response = await apiFetch(`/rides/${rideId}/qr`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Erro ao carregar QR.");
        }

        const qr = data?.data;

        if (!qr) {
            showEmptyState();
            return;
        }

        fillTripData(qr);
    } catch (error) {
        console.error(error);
        showEmptyState(error.message);
    }
}

function fillTripData(qr) {
    document.getElementById("qrOrigin").textContent = qr.origin || "Origem não informada";
    document.getElementById("qrDestination").textContent = qr.destination || "Destino não informado";
    document.getElementById("tripCode").textContent = qr.qrPayload;
    document.getElementById("qrDriverName").textContent = qr.driverName || "Motorista não informado";
    document.getElementById("qrPassengerName").textContent = qr.requesterName || "Passageiro não informado";
    document.getElementById("qrRideDate").textContent = qr.date || "Data não informada";
    document.getElementById("qrRideTime").textContent = qr.time || "Horário não informado";

    renderQrCode(qr.qrPayload);
}

function renderQrCode(payload) {
    const container = document.getElementById("qrImage");
    container.textContent = "";

    if (window.QRCode) {
        new QRCode(container, {
            text: payload,
            width: 250,
            height: 250,
            correctLevel: QRCode.CorrectLevel.M
        });
        return;
    }

    const image = document.createElement("img");
    image.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;
    image.alt = "QR Code da viagem";
    container.appendChild(image);
}

function showEmptyState(message = "Selecione uma carona aceita para gerar o QR.") {
    const card = document.querySelector(".trip-card");
    if (!card) return;

    card.innerHTML = `
        <div class="empty-state">
            <h3>Nenhum QR disponível.</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

async function shareQr() {
    const shareData = {
        title: "HitchParty",
        text: "QR Code da viagem",
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showToast("QR compartilhado com sucesso.");
            return;
        }

        await navigator.clipboard.writeText(shareData.url);
        showToast("Link copiado para a área de transferência.");
    } catch (error) {
        console.error(error);
        showToast("Não foi possível compartilhar.", "danger");
    }
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

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
