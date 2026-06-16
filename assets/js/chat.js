document.addEventListener("DOMContentLoaded", initializeChat);

let chatMessages = [];
let currentRide = null;
let currentUserName = "Você";

async function initializeChat() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    loadCurrentUser();
    bindLogout();
    loadConversation();
    bindChatForm();
    setupAutoResize();
}

async function loadComponents() {
    try {
        const [headerResponse, navbarResponse] = await Promise.all([
            fetch("../components/header.html"),
            fetch("../components/navbar.html")
        ]);

        if (headerResponse.ok) {
            document.getElementById("header-slot").innerHTML = await headerResponse.text();
        } else {
            console.warn("Não foi possível carregar header.html");
        }

        if (navbarResponse.ok) {
            document.getElementById("navbar-slot").innerHTML = await navbarResponse.text();
        } else {
            console.warn("Não foi possível carregar navbar.html");
        }
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
    }
}

function loadCurrentUser() {
    try {
        const storedUser = localStorage.getItem(APP_CONFIG.USER_KEY);
        if (storedUser) {
            const user = JSON.parse(storedUser);
            currentUserName = user?.name || user?.fullName || "Você";
        }
    } catch (error) {
        console.warn("Não foi possível ler o usuário do storage:", error);
    }
}
function bindLogout() {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", (event) => {
        event.preventDefault();
        removeToken();
        localStorage.removeItem(APP_CONFIG.USER_KEY);
        window.location.href = "login.html";
    });
}

function loadConversation() {
    const rideId = new URLSearchParams(window.location.search).get("id");

    renderRideHeader(currentRide.ride);
    chatMessages = currentRide.messages;
    renderMessages();
}


function renderRideHeader(ride) {
    document.getElementById("chatDriverName").textContent = ride.driverName;
    document.getElementById("chatRideRoute").textContent = `${ride.origin} → ${ride.destination}`;
    document.getElementById("chatRideDate").textContent = ride.date;
    document.getElementById("chatRideTime").textContent = ride.time;
    document.getElementById("chatRideSeats").textContent = `${ride.seats} vagas`;

    const avatar = document.getElementById("chatDriverAvatar");
    if (avatar && ride.driverName) {
        const initials = ride.driverName
            .split(" ")
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();

        avatar.textContent = initials;
    }
}

function renderMessages() {
    const container = document.getElementById("messagesList");

    container.innerHTML = chatMessages.map(message => {
        const rowClass = message.sender === "me" ? "sent" : "received";
        const senderLabel = message.sender === "me" ? currentUserName : currentRide.ride.driverName;

        return `
            <div class="message-row ${rowClass}">
                <div class="message-bubble">
                    <div>${escapeHtml(message.text)}</div>
                    <span class="message-meta">${senderLabel} • ${message.time}</span>
                </div>
            </div>
        `;
    }).join("");

    scrollToBottom();
}

function bindChatForm() {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendChatBtn");

    if (!form || !input || !sendButton) return;

    const updateButtonState = () => {
        sendButton.disabled = !input.value.trim();
    };

    input.addEventListener("input", () => {
        updateButtonState();
        autoResizeTextarea(input);
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!sendButton.disabled) {
                form.requestSubmit();
            }
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await handleSendMessage();
    });

    updateButtonState();
}

function setupAutoResize() {
    const input = document.getElementById("chatInput");
    if (!input) return;
    autoResizeTextarea(input);
}

function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
}

async function handleSendMessage() {
    const input = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendChatBtn");
    const message = input.value.trim();

    if (!message) return;

    try {
        /*
        BACKEND FUTURO

        const rideId = new URLSearchParams(window.location.search).get("id");

        const response = await fetch(`${APP_CONFIG.API_URL}/chats/${rideId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                message
            })
        });

        if (!response.ok) {
            throw new Error("Erro ao enviar mensagem");
        }
        */

        sendButton.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 450));

        chatMessages.push({
            sender: "me",
            text: message,
            time: getCurrentTime()
        });

        input.value = "";
        autoResizeTextarea(input);
        renderMessages();

        sendButton.disabled = true;
    } catch (error) {
        console.error(error);
        alert("Erro ao enviar mensagem.");
        sendButton.disabled = false;
    }
}

function scrollToBottom() {
    window.requestAnimationFrame(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
        });
    });
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}