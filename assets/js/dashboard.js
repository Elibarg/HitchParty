document.addEventListener("DOMContentLoaded", initializeDashboard);

async function initializeDashboard() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    loadUserInfo();
    bindLogout();
    loadDashboardData();
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

function loadUserInfo() {
    const userNameElement = document.getElementById("fullName");


    try {
        const storedUser = localStorage.getItem(APP_CONFIG.USER_KEY);

        if (storedUser) {
            const user = JSON.parse(storedUser);
            userName = user?.name || user?.fullName || "Usuário";
        }
    } catch (error) {
        console.warn("Usuário inválido no storage:", error);
    }

    userNameElement.textContent = userName;
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

function loadDashboardData() {

}

function renderStats(stats) {
    document.getElementById("ridesCount").textContent = stats.ridesCount;
    document.getElementById("vehiclesCount").textContent = stats.vehiclesCount;
    document.getElementById("messagesCount").textContent = stats.messagesCount;
    document.getElementById("ratingValue").textContent = stats.ratingValue.toFixed(1);
}

function renderUpcomingRides(rides) {
    const list = document.getElementById("upcomingRidesList");

    if (!rides.length) {
        list.innerHTML = `<div class="rides-empty">Você ainda não tem caronas agendadas.</div>`;
        return;
    }

    list.innerHTML = rides.map(ride => `
        <article class="ride-card">
            <div class="ride-top">
                <div>
                    <p class="ride-route">${ride.route}</p>
                    <p class="ride-meta">${ride.date}</p>
                </div>
                <span class="ride-badge">${ride.seat}</span>
            </div>

            <div class="ride-bottom">
                <span class="ride-price">${ride.price}</span>
                <a href="ride-detail.html" class="ride-link">Ver detalhes</a>
            </div>
        </article>
    `).join("");
}

function renderRecentActivity(items) {
    const list = document.getElementById("recentActivityList");

    if (!items.length) {
        list.innerHTML = `<div class="activity-empty">Nenhuma atividade recente.</div>`;
        return;
    }

    list.innerHTML = items.map(item => `
        <article class="activity-card">
            <h3 class="activity-title">${item.title}</h3>
            <p class="activity-meta">${item.meta}</p>
        </article>
    `).join("");
}