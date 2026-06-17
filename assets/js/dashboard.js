document.addEventListener("DOMContentLoaded", initializeDashboard);

async function initializeDashboard() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
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
    const userNameElement = document.getElementById("userName");

    let userName = "Usuário";

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

function loadDashboardData() {
    /*
        BACKEND FUTURO

        const response = await fetch(`${APP_CONFIG.API_URL}/dashboard`, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const data = await response.json();
        renderDashboard(data);
    */

    const mockData = {
        stats: {
            ridesCount: 0,
            vehiclesCount: 0,
            messagesCount: 0,
            ratingValue: 0.0
        },
        upcomingRides: [
            {
                route: "Rua 9 de Março → Rua Mário Lobo",
                date: "07:10",
                seat: "2 vagas",
                price: "R$ 12,00"
            },
            {
                route: "Rua João Colin → Rua São Paulo",
                date: "12:20",
                seat: "1 vaga",
                price: "R$ 28,00"
            },
            {
                route: "Rua Albano Schmidt → Rua Coelho Neto",
                date: "18:30",
                seat: "3 vagas",
                price: "R$ 8,00"
            }
        ],
        recentActivity: [
            {
                title: "Você recebeu uma nova solicitação",
                meta: "há 12 min"
            },
            {
                title: "Sua carona foi confirmada",
                meta: "há 1 hora"
            },
            {
                title: "Novo veículo adicionado",
                meta: "ontem"
            }
        ]
    };

    renderStats(mockData.stats);
    renderUpcomingRides(mockData.upcomingRides);
    renderRecentActivity(mockData.recentActivity);
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