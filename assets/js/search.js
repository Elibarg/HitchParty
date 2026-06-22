document.addEventListener("DOMContentLoaded", initializeSearch);

async function initializeSearch() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    setupSearchForm();
}

async function loadComponents() {
    const header = await fetch("../components/header.html");
    document.getElementById("header-slot").innerHTML = await header.text();

    const navbar = await fetch("../components/navbar.html");
    document.getElementById("navbar-slot").innerHTML = await navbar.text();
}

function setupSearchForm() {
    document.getElementById("searchForm").addEventListener("submit", handleSearch);
}

/*
 * FRONT-END: PÁGINA DE BUSCA (search.js)
 * Lógica do lado do cliente para interagir com o Back-end e desenhar as viagens.
 * FUNÇÃO: Lidar com o botão de busca
 */
async function handleSearch(event) {
    event.preventDefault();

    // 🌟 NOVIDADE: Revela o mapa ao clicar em "Buscar"
    const mapaSection = document.getElementById("mapa-section");
    if (mapaSection) mapaSection.classList.remove("d-none");

    // 1. Pegamos o que o utilizador digitou nos campos de texto
    const origem = document.getElementById("origin").value;
    const destino = document.getElementById("destination").value;

    try {
        // 2. Preparamos o endereço base da nossa API
        let urlBusca = `${APP_CONFIG.API_URL}/rides/search`;

        // 3. Adicionamos os filtros na URL se o utilizador tiver digitado alguma coisa
        const parametros = new URLSearchParams();
        if (origem) parametros.append("origin", origem);
        if (destino) parametros.append("destination", destino);

        // Se houver parâmetros, colamos eles no final da URL com um "?"
        if (parametros.toString()) {
            urlBusca += `?${parametros.toString()}`;
        }

        console.log("A pedir caronas na URL:", urlBusca); 

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
    const container = document.getElementById("ridesList");

    container.innerHTML = rides.map(ride => `
        <article class="ride-card">
            <div class="ride-header">
                <div>
                    <div class="driver-name">${ride.driver}</div>
                    <div class="route">${ride.route}</div>
                </div>
                <div class="seats">${ride.seats} vagas</div>
            </div>
            <p>${ride.date}</p>
            <div class="ride-info">
                <div class="price">${ride.price}</div>
                <a href="ride-detail.html?id=${ride.id}" class="btn btn-primary btn-sm">
                    Ver detalhes
                </a>
            </div>
        </article>
    `).join("");
}

// =====================================================================
// NOVA PARTE: INTEGRAÇÃO COM O GOOGLE MAPS E AUTOCOMPLETAR
// =====================================================================

window.initMap = function() {
    // 1. Pega as suas caixas de texto originais
    const inputOrigem = document.getElementById("origin");
    const inputDestino = document.getElementById("destination");

    // 2. Transforma elas em buscas inteligentes do Google
    const autoOrigem = new google.maps.places.Autocomplete(inputOrigem);
    const autoDestino = new google.maps.places.Autocomplete(inputDestino);

    // 3. Tenta encontrar a div do mapa na tela
    const divMapa = document.getElementById("meu-mapa");
    
    // Se a página atual tiver a div do mapa, ele desenha o mapa e traça a rota
    if (divMapa) {
        const mapa = new google.maps.Map(divMapa, {
            zoom: 13,
            center: { lat: -26.3044, lng: -48.8456 }, 
            disableDefaultUI: true,
            zoomControl: true
        });

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({ map: mapa });

        function calcularRota() {
            const lugarOrigem = autoOrigem.getPlace();
            const lugarDestino = autoDestino.getPlace();

            // Só traça a rota se os dois locais forem validados pelo Google
            if (!lugarOrigem || !lugarOrigem.geometry || !lugarDestino || !lugarDestino.geometry) {
                return;
            }

            const pedidoDeRota = {
                origin: lugarOrigem.geometry.location,
                destination: lugarDestino.geometry.location,
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(pedidoDeRota, (resultado, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(resultado);
                    
                    // 🌟 NOVIDADE: Revela o mapa se a rota for traçada pelo autocompletar do Google
                    const mapaSection = document.getElementById("mapa-section");
                    if (mapaSection) mapaSection.classList.remove("d-none");
                    
                } else {
                    console.error("Erro ao traçar rota:", status);
                }
            });
        }

        // Fica observando: se o usuário escolher um local na lista, recalcula a rota
        autoOrigem.addListener("place_changed", calcularRota);
        autoDestino.addListener("place_changed", calcularRota);
    }
};