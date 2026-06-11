document.addEventListener(
    "DOMContentLoaded",
    initializeSearch
);

async function initializeSearch() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;

    }

    await loadComponents();

    setupSearchForm();

    loadMockRides();

}

async function loadComponents() {

    const header =
        await fetch(
            "../components/header.html"
        );

    document
        .getElementById("header-slot")
        .innerHTML =
        await header.text();

    const navbar =
        await fetch(
            "../components/navbar.html"
        );

    document
        .getElementById("navbar-slot")
        .innerHTML =
        await navbar.text();

}

function setupSearchForm() {

    document
        .getElementById("searchForm")
        .addEventListener(
            "submit",
            handleSearch
        );

}

async function handleSearch(event) {

    event.preventDefault();

    /*
    BACKEND FUTURO

    GET

    /api/rides/search

    */

    loadMockRides();

}

function loadMockRides() {

    const rides = [

        {
            id: 1,
            driver: "Carlos Silva",
            route:
                "Joinville → Blumenau",
            date:
                "20/06/2026 - 07:10",
            seats: 2,
            price: "R$ 25,00"
        },

        {
            id: 2,
            driver: "Ana Souza",
            route:
                "Joinville → Curitiba",
            date:
                "21/06/2026 - 08:00",
            seats: 3,
            price: "R$ 40,00"
        }

    ];

    renderRides(rides);

}

function renderRides(rides) {

    const container =
        document.getElementById(
            "ridesList"
        );

    container.innerHTML =
        rides.map(ride => `

        <article class="ride-card">

            <div class="ride-header">

                <div>

                    <div class="driver-name">
                        ${ride.driver}
                    </div>

                    <div class="route">
                        ${ride.route}
                    </div>

                </div>

                <div class="seats">
                    ${ride.seats} vagas
                </div>

            </div>

            <p>
                ${ride.date}
            </p>

            <div class="ride-info">

                <div class="price">
                    ${ride.price}
                </div>

                <a
                    href="ride-detail.html?id=${ride.id}"
                    class="btn btn-primary btn-sm">

                    Ver detalhes

                </a>

            </div>

        </article>

    `).join("");

}