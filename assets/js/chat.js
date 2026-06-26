// Tela de chat: carrega conversa autorizada, envia mensagens e atualiza o historico.

// HP-CHAT-004 | Tela de chat: carrega conversa autorizada, envia mensagens e
// atualiza historico real vindo de ride_messages.
document.addEventListener("DOMContentLoaded", initializeChat);

let currentRide = null;
let currentUserId = null;

async function initializeChat() {
    // O chat depende de usuario autenticado e de uma carona aceita.
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    bindChatForm();
    setupAutoResize();
    await loadConversation();
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

async function loadConversation() {
    // O ID da carona vem da URL: chat.html?id=<rideId>.
    const rideId = new URLSearchParams(window.location.search).get("id");

    if (!rideId) {
        renderEmptyRide();
        renderMessages([]);
        showComposerError("Selecione uma carona aceita para abrir o chat.");
        return;
    }

    try {
        const response = await apiFetch(`/rides/${rideId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Erro ao carregar carona.");
        }

        currentRide = data?.data?.ride || null;

        if (!currentRide) {
            throw new Error("Carona não encontrada.");
        }

        renderRideHeader(currentRide);
        await loadMessages(rideId);
    } catch (error) {
        console.error(error);
        renderEmptyRide();
        renderMessages([]);
        showComposerError(error.message || "Chat indisponível.");
    }
}

async function loadMessages(rideId) {
    // Chamada autenticada: backend valida se o usuario e motorista ou passageiro
    // aceito antes de devolver o historico.
    const response = await apiFetch(`/rides/${rideId}/messages`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Erro ao carregar mensagens.");
    }

    currentUserId = data?.data?.currentUserId;
    renderMessages(data?.data?.messages || []);
}

function renderRideHeader(ride) {
    document.getElementById("chatDriverName").textContent = ride.driverName || ride.driver || "Motorista";
    document.getElementById("chatRideRoute").textContent = ride.route || `${ride.origin} -> ${ride.destination}`;
    document.getElementById("chatRideDate").textContent = ride.date || "--/--/----";
    document.getElementById("chatRideTime").textContent = ride.time || "--:--";
    document.getElementById("chatRideSeats").textContent = formatarVagas(ride.availableSeats ?? ride.seats);

    const avatar = document.getElementById("chatDriverAvatar");
    if (avatar) {
        avatar.textContent = ride.driverName ? getInitials(ride.driverName) : "HP";
    }
}

function renderEmptyRide() {
    document.getElementById("chatDriverName").textContent = "Carona não informada";
    document.getElementById("chatRideRoute").textContent = "Nenhuma carona selecionada";
    document.getElementById("chatRideDate").textContent = "--/--/----";
    document.getElementById("chatRideTime").textContent = "--:--";
    document.getElementById("chatRideSeats").textContent = "0 vagas";
}

function renderMessages(messages) {
    const container = document.getElementById("messagesList");

    if (!messages.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Nenhuma mensagem ainda.</h3>
                <p>Envie a primeira mensagem.</p>
            </div>
        `;
        return;
    }

    container.textContent = "";

    messages.forEach(message => {
        const row = document.createElement("div");
        const isSent = Number(message.senderId) === Number(currentUserId);

        row.className = `message-row ${isSent ? "sent" : "received"}`;

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        const text = document.createElement("div");
        text.textContent = message.message;

        const meta = document.createElement("span");
        meta.className = "message-meta";
        meta.textContent = [
            isSent ? "Você" : message.senderName,
            formatMessageDate(message.createdAt)
        ].filter(Boolean).join(" • ");

        bubble.append(text, meta);
        row.appendChild(bubble);
        container.appendChild(row);
    });

    container.scrollTop = container.scrollHeight;
}

function bindChatForm() {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendChatBtn");

    if (!form || !input || !sendButton) return;

    input.addEventListener("input", () => {
        sendButton.disabled = !input.value.trim();
        autoResizeTextarea(input);
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        await sendMessage();
    });
}

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendChatBtn");
    const rideId = new URLSearchParams(window.location.search).get("id");
    const message = input?.value.trim();

    if (!rideId || !message) return;

    try {
        sendButton.disabled = true;

        // Envia apenas o texto; sender/receiver sao resolvidos pelo backend.
        const response = await apiFetch(`/rides/${rideId}/messages`, {
            method: "POST",
            body: JSON.stringify({ message })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Erro ao enviar mensagem.");
        }

        input.value = "";
        autoResizeTextarea(input);
        await loadMessages(rideId);
    } catch (error) {
        console.error(error);
        showComposerError(error.message || "Erro ao enviar mensagem.");
    } finally {
        sendButton.disabled = !input?.value.trim();
    }
}

function setupAutoResize() {
    const input = document.getElementById("chatInput");
    if (input) {
        autoResizeTextarea(input);
    }
}

function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
}

function showComposerError(message) {
    const container = document.getElementById("messagesList");

    container.innerHTML = `
        <div class="empty-state">
            <h3>Chat indisponível.</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function formatarVagas(seats) {
    const total = Number(seats || 0);

    return `${total} ${total === 1 ? "vaga" : "vagas"}`;
}

function getInitials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

function formatMessageDate(value) {
    if (!value) return "";

    return new Date(value).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
