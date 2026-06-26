// Dashboard: carrega perfil, proximas caronas e atividades recentes do usuario logado.

document.addEventListener("DOMContentLoaded", initializeDashboard);

async function initializeDashboard() {
    // Dashboard usa dados privados, entao exige token salvo pelo login.
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    await loadDashboardData();
}

async function loadComponents() {
    try {
        const headerSlot = document.getElementById("header-slot");
        const navbarSlot = document.getElementById("navbar-slot");

        const [headerResponse, navbarResponse] = await Promise.all([
            fetch("../components/header.html"),
            fetch("../components/navbar.html")
        ]);

        if (headerResponse.ok) {
            headerSlot.innerHTML = await headerResponse.text();
        }

        if (navbarResponse.ok) {
            navbarSlot.innerHTML = await navbarResponse.text();
        }
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
    }
}

function loadUserInfo(user = getStoredUser()) {
    const userNameElement =
        document.getElementById("fullName")
        || document.getElementById("name");

    if (!userNameElement) return;

    userNameElement.textContent = getFirstName(user);
}

async function loadDashboardData() {
    try {
        // Carrega dados em paralelo para reduzir espera na primeira tela apos login.
        const [profileResponse, ridesResponse, notificationsResponse] =
            await Promise.all([
                apiFetch("/profile"),
                apiFetch("/rides/upcoming"),
                apiFetch("/notifications")
            ]);

        if (
            !profileResponse.ok
            || !ridesResponse.ok
            || !notificationsResponse.ok
        ) {
            throw new Error("Erro ao carregar dashboard.");
        }

        const [profileData, ridesData, notificationsData] =
            await Promise.all([
                profileResponse.json(),
                ridesResponse.json(),
                notificationsResponse.json()
            ]);

        const user = normalizeUser(profileData?.data?.user || {});
        const rides = ridesData?.data?.rides || [];
        const notifications = notificationsData?.data?.notifications || [];

        saveUser(user);
        loadUserInfo(user);
        renderStats({
            ridesCount: user.ridesCount || 0,
            vehiclesCount: user.vehiclesCount || 0,
            messagesCount: user.messagesCount || 0,
            ratingValue: user.ratingAverage || 0
        });
        renderNotifications(notifications);
        showPendingNotificationPopup(notifications);
        renderUpcomingRides(rides);
        renderRecentActivity([]);
    } catch (error) {
        console.error(error);
        loadUserInfo();
        renderStats({
            ridesCount: 0,
            vehiclesCount: 0,
            messagesCount: 0,
            ratingValue: 0
        });
        renderNotifications([]);
        renderUpcomingRides([]);
        renderRecentActivity([]);
    }
}

function renderNotifications(notifications) {
    // Exibe notificacoes persistentes na tela Inicio.
    const list = document.getElementById("notificationsList");
    list.textContent = "";

    const visibleNotifications = notifications.filter(
        notification => notification.status !== "resolved"
    );

    if (!visibleNotifications.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "notifications-empty";
        emptyState.textContent = "Nenhum aviso pendente.";
        list.appendChild(emptyState);
        return;
    }

    visibleNotifications.forEach(notification => {
        const card = document.createElement("article");
        card.className = "notification-card";

        const title = document.createElement("h3");
        title.textContent = notification.title || "Aviso";

        const message = document.createElement("p");
        message.textContent = notification.message || "";

        const actions = document.createElement("div");
        actions.className = "notification-actions";

        if (notification.type === "ride_updated" && notification.actionRequired) {
            const acceptButton = document.createElement("button");
            acceptButton.className = "btn btn-success btn-sm";
            acceptButton.textContent = "Aceitar alteração";
            acceptButton.addEventListener("click", () => respondRideChange(notification, "accept"));

            const rejectButton = document.createElement("button");
            rejectButton.className = "btn btn-outline-danger btn-sm";
            rejectButton.textContent = "Rejeitar alteração";
            rejectButton.addEventListener("click", () => respondRideChange(notification, "reject"));

            actions.append(acceptButton, rejectButton);
        } else if (notification.status === "unread") {
            const readButton = document.createElement("button");
            readButton.className = "btn btn-outline-primary btn-sm";
            readButton.textContent = "Marcar como lida";
            readButton.addEventListener("click", () => markNotificationRead(notification.id));
            actions.appendChild(readButton);
        }

        card.append(title, message, actions);
        list.appendChild(card);
    });
}

function showPendingNotificationPopup(notifications) {
    // Mostra popup para notificacao acionavel de alteracao.
    const notification = notifications.find(item =>
        item.type === "ride_updated"
        && item.actionRequired
        && item.status !== "resolved"
    );

    if (!notification || !window.bootstrap) return;

    let modalElement = document.getElementById("notificationModal");

    if (!modalElement) {
        modalElement = document.createElement("div");
        modalElement.id = "notificationModal";
        modalElement.className = "modal fade";
        modalElement.tabIndex = -1;
        modalElement.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-message"></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-danger" id="modalRejectRideChange">Rejeitar alteração</button>
                        <button type="button" class="btn btn-success" id="modalAcceptRideChange">Aceitar alteração</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalElement);
    }

    modalElement.querySelector(".modal-title").textContent = notification.title;
    modalElement.querySelector(".modal-message").textContent = notification.message;
    modalElement.querySelector("#modalAcceptRideChange").onclick =
        () => respondRideChange(notification, "accept");
    modalElement.querySelector("#modalRejectRideChange").onclick =
        () => respondRideChange(notification, "reject");

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

async function respondRideChange(notification, action) {
    const endpoint = action === "accept"
        ? `/rides/${notification.rideId}/confirm-change`
        : `/rides/${notification.rideId}/reject-change`;

    try {
        const response = await apiFetch(endpoint, { method: "POST" });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Erro ao responder alteração.");
        }

        const modalElement = document.getElementById("notificationModal");
        if (modalElement) {
            bootstrap.Modal.getOrCreateInstance(modalElement).hide();
        }

        await loadDashboardData();
    } catch (error) {
        console.error(error);
        alert(error.message || "Erro ao responder alteração.");
    }
}

async function markNotificationRead(notificationId) {
    await apiFetch(`/notifications/${notificationId}/read`, {
        method: "PATCH"
    });
    await loadDashboardData();
}

function renderStats(stats) {
    document.getElementById("ridesCount").textContent = stats.ridesCount;
    document.getElementById("vehiclesCount").textContent = stats.vehiclesCount;
    document.getElementById("messagesCount").textContent = stats.messagesCount;
    document.getElementById("ratingValue").textContent = Number(stats.ratingValue || 0).toFixed(1);
}

function renderUpcomingRides(rides) {
    const list = document.getElementById("upcomingRidesList");
    list.textContent = "";

    if (!rides.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "rides-empty";
        emptyState.textContent = "Você ainda não tem caronas agendadas.";
        list.appendChild(emptyState);
        return;
    }

    rides.forEach(ride => {
        const card = document.createElement("article");
        card.className = "ride-card";

        const top = document.createElement("div");
        top.className = "ride-top";

        const textGroup = document.createElement("div");

        const route = document.createElement("p");
        route.className = "ride-route";
        route.textContent = ride.route || montarRota(ride);

        const date = document.createElement("p");
        date.className = "ride-meta";
        date.textContent = [ride.date, ride.time].filter(Boolean).join(" às ");

        const badge = document.createElement("span");
        badge.className = "ride-badge";
        badge.textContent = ride.passengerStatus === "PENDING_CHANGE_CONFIRMATION"
            ? "confirmação pendente"
            : formatarVagas(ride.availableSeats ?? ride.seats);

        const bottom = document.createElement("div");
        bottom.className = "ride-bottom";

        const price = document.createElement("span");
        price.className = "ride-price";
        price.textContent = ride.price || formatarMoeda(ride.suggestedPrice);

        const detailsLink = document.createElement("a");
        detailsLink.href = `ride-detail.html?id=${encodeURIComponent(ride.id)}`;
        detailsLink.className = "ride-link";
        detailsLink.textContent = "Ver detalhes";

        const chatLink = document.createElement("a");
        chatLink.href = `chat.html?id=${encodeURIComponent(ride.id)}`;
        chatLink.className = "ride-link";
        chatLink.textContent = "Chat";

        const qrLink = document.createElement("a");
        qrLink.href = `trip-qr.html?id=${encodeURIComponent(ride.id)}`;
        qrLink.className = "ride-link";
        qrLink.textContent = "QR";

        textGroup.append(route, date);
        top.append(textGroup, badge);
        bottom.append(price, detailsLink, chatLink, qrLink);
        card.append(top, bottom);
        list.appendChild(card);
    });
}

function renderRecentActivity(items) {
    const list = document.getElementById("recentActivityList");
    list.textContent = "";

    if (!items.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "activity-empty";
        emptyState.textContent = "Nenhuma atividade recente.";
        list.appendChild(emptyState);
        return;
    }

    items.forEach(item => {
        const card = document.createElement("article");
        card.className = "activity-card";

        const title = document.createElement("h3");
        title.className = "activity-title";
        title.textContent = item.title || item.message || "Atividade";

        const meta = document.createElement("p");
        meta.className = "activity-meta";
        meta.textContent = item.meta || formatarDataRelativa(item.createdAt);

        card.append(title, meta);
        list.appendChild(card);
    });
}

function montarRota(ride) {
    const origin = ride.origin || "Origem não informada";
    const destination = ride.destination || "Destino não informado";

    return `${origin} → ${destination}`;
}

function formatarVagas(seats) {
    const total = Number(seats || 0);

    return `${total} ${total === 1 ? "vaga" : "vagas"}`;
}

function formatarMoeda(value) {
    const numberValue = Number(value || 0);

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(numberValue);
}

function formatarDataRelativa(value) {
    if (!value) return "";

    return new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}
