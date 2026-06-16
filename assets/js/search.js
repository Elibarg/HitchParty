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
    bindLogout();
    setupSearchForm();

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

/*
 * FRONT-END: PÁGINA DE BUSCA (search.js)
 * Lógica do lado do cliente para interagir com o Back-end e desenhar as viagens.
 * FUNÇÃO: Lidar com o botão de busca
 * Desencadeada quando o utilizador preenche o formulário e clica em "Buscar".
 */
async function handleSearch(event) {
    event.preventDefault();

    // 1. Pegamos o que o utilizador digitou nos campos de texto
    const origem = document.getElementById("origin").value;
    const destino = document.getElementById("destination").value;

    try {
        // 2. Preparamos o endereço base da nossa API
        let urlBusca = `${APP_CONFIG.API_URL}/rides/search`;

        // 3. Adicionamos os filtros na URL se o utilizador tiver digitado alguma coisa
        // Exemplo: se digitou Joinville, a URL vira ".../search?origin=Joinville"
        const parametros = new URLSearchParams();
        if (origem) parametros.append("origin", origem);
        if (destino) parametros.append("destination", destino);

        // Se houver parâmetros, colamos eles no final da URL com um "?"
        if (parametros.toString()) {
            urlBusca += `?${parametros.toString()}`;
        }

        console.log("A pedir caronas na URL:", urlBusca); // Só para você ver no console!

        // 4. Fazemos o pedido com a URL filtrada
        const response = await fetch(urlBusca);

        if (!response.ok) throw new Error("Erro ao buscar as caronas.");

        const rides = await response.json();
        renderRides(rides);

    } catch (error) {
        console.error("[Front-end] Erro na busca de caronas:", error);
        alert(error.message);
    }
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