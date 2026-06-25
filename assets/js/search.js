document.addEventListener("DOMContentLoaded", initializeSearch);

let searchRoute = {
    originAddress: "",
    originLat: null,
    originLng: null,
    destinationAddress: "",
    destinationLat: null,
    destinationLng: null
};

// HP-FRONT-006 | Busca de caronas: monta filtros de texto/coordenadas e exibe
// somente resultados reais retornados por /api/rides/search.

async function initializeSearch() {
    // Pagina protegida: exige JWT salvo no login antes de permitir a busca.
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    setupSearchForm();
}

async function loadComponents() {
    // Componentes compartilhados sao carregados via fetch e injetados na tela.
    const header = await fetch("../components/header.html");
    document.getElementById("header-slot").innerHTML = await header.text();

    const navbar = await fetch("../components/navbar.html");
    document.getElementById("navbar-slot").innerHTML = await navbar.text();
}

function setupSearchForm() {
    document.getElementById("searchForm").addEventListener("submit", handleSearch);
}

/*
 * FRONT-END: PAGINA DE BUSCA (search.js)
 * Logica do lado do cliente para interagir com o backend e desenhar as viagens.
 * FUNCAO: Lidar com o botao de busca.
 */
async function handleSearch(event) {
    event.preventDefault();

    // 1. Pegamos o que o utilizador digitou nos campos de texto
    const origem = document.getElementById("origin").value.trim();
    const destino = document.getElementById("destination").value.trim();

    try {
        validateSelectedPlaces(origem, destino);

        // 3. Adicionamos os filtros na URL se o utilizador tiver digitado alguma coisa
        // Entrada do formulario vira query string: origin/destination.
        const parametros = new URLSearchParams();
        if (origem) parametros.append("origin", searchRoute.originAddress);
        if (destino) parametros.append("destination", searchRoute.destinationAddress);
        if (searchRoute.originLat !== null) parametros.append("originLat", searchRoute.originLat);
        if (searchRoute.originLng !== null) parametros.append("originLng", searchRoute.originLng);
        if (searchRoute.destinationLat !== null) parametros.append("destinationLat", searchRoute.destinationLat);
        if (searchRoute.destinationLng !== null) parametros.append("destinationLng", searchRoute.destinationLng);

        const queryString = parametros.toString();
        const response = await apiFetch(`/rides/search${queryString ? `?${queryString}` : ""}`);

        if (!response.ok) throw new Error("Erro ao buscar as caronas.");

        const data = await response.json();
        // Saida aceita lista direta ou envelope data.rides, mantendo compatibilidade.
        const rides = Array.isArray(data)
            ? data
            : data?.data?.rides || [];

        renderRides(rides);

    } catch (error) {
        console.error("[Front-end] Erro na busca de caronas:", error);
        // Tratamento de erro: mantem usuario na tela e mostra a falha da busca.
        alert(error.message);
    }
}

function validateSelectedPlaces(origem, destino) {
    const originWasSelected =
        !origem
        || (
            origem === searchRoute.originAddress
            && searchRoute.originLat !== null
            && searchRoute.originLng !== null
        );
    const destinationWasSelected =
        !destino
        || (
            destino === searchRoute.destinationAddress
            && searchRoute.destinationLat !== null
            && searchRoute.destinationLng !== null
        );

    if (!originWasSelected) {
        throw new Error("Selecione uma origem nas sugestões do Google Maps.");
    }

    if (!destinationWasSelected) {
        throw new Error("Selecione um destino nas sugestões do Google Maps.");
    }
}

function renderRides(rides) {
    // Saida visual: transforma cada carona recebida em um card HTML.
    const container = document.getElementById("ridesList");

    if (!rides.length) {
        container.innerHTML = `<div class="rides-empty">Nenhuma carona encontrada.</div>`;
        return;
    }

    container.innerHTML = rides.map(ride => `
        <article class="ride-card">
            <div class="ride-header">
                <div>
                    <div class="driver-name">Motorista: ${escapeHtml(ride.driver || "não informado")}</div>
                    <div class="route">${escapeHtml(ride.route || montarRota(ride))}</div>
                </div>
                <div class="seats">${escapeHtml(formatarVagas(ride.seats))}</div>
            </div>
            <p>Data: ${escapeHtml(ride.date || "Data não informada")}</p>
            <p>Horário: ${escapeHtml(ride.time || "Horário não informado")}</p>
            ${ride.compatibility ? `<p>Desvio estimado: ${escapeHtml(formatarMinutos(ride.compatibility.estimatedExtraRouteMinutes))}</p>` : ""}
            <div class="ride-info">
                <div class="price">${escapeHtml(ride.price || "R$ 0,00")}</div>
                <a href="ride-detail.html?id=${encodeURIComponent(ride.id)}" class="btn btn-primary btn-sm">
                    Ver detalhes
                </a>
            </div>
        </article>
    `).join("");
}

function montarRota(ride) {
    const origem = ride.origin || ride.origem || "Origem não informada";
    const destino = ride.destination || ride.destino || "Destino não informado";

    return `${origem} -> ${destino}`;
}

function formatarVagas(seats) {
    const total = Number(seats || 0);

    return `${total} ${total === 1 ? "vaga" : "vagas"}`;
}

function formatarMinutos(value) {
    return `${Number(value || 0).toFixed(1)} min`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =====================================================================
// INTEGRACAO COM O GOOGLE MAPS E AUTOCOMPLETAR
// =====================================================================

window.initMap = function() {
    // HP-MAPS-004 | Integra Google Maps/Places aos inputs sem alterar o
    // formulario original. O backend recebe coordenadas para estimar desvio.
    // 1. Pega as suas caixas de texto originais
    const inputOrigem = document.getElementById("origin");
    const inputDestino = document.getElementById("destination");

    if (!inputOrigem || !inputDestino || !window.google?.maps?.places) return;

    // 2. Transforma elas em buscas inteligentes do Google
    const autoOrigem = new google.maps.places.Autocomplete(inputOrigem, {
        fields: ["formatted_address", "geometry", "name"]
    });
    const autoDestino = new google.maps.places.Autocomplete(inputDestino, {
        fields: ["formatted_address", "geometry", "name"]
    });

    // 3. Tenta encontrar a div do mapa na tela
    const divMapa = document.getElementById("meu-mapa");
    
    // Se a pagina atual tiver a div do mapa, ele desenha o mapa e traca a rota.
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

            // So traca a rota se os dois locais forem validados pelo Google.
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
                    
                    // Revela o mapa se a rota for tracada pelo autocompletar.
                    const mapaSection = document.getElementById("mapa-section");
                    if (mapaSection) mapaSection.classList.remove("d-none");
                    
                } else {
                    console.error("Erro ao traçar rota:", status);
                }
            });
        }

        // Recalcula a rota quando o usuario escolhe locais no autocomplete.
        autoOrigem.addListener("place_changed", () => {
            updateSelectedPlace("origin", autoOrigem.getPlace(), inputOrigem);
            calcularRota();
        });
        autoDestino.addListener("place_changed", () => {
            updateSelectedPlace("destination", autoDestino.getPlace(), inputDestino);
            calcularRota();
        });

        inputOrigem.addEventListener("input", () => {
            resetSelectedPlace("origin");
        });
        inputDestino.addEventListener("input", () => {
            resetSelectedPlace("destination");
        });
    }
};

function updateSelectedPlace(type, place, input) {
    if (!place?.geometry?.location) {
        resetSelectedPlace(type);
        return;
    }

    const address = getPlaceAddress(place);
    input.value = address;

    if (type === "origin") {
        searchRoute.originAddress = address;
        searchRoute.originLat = place.geometry.location.lat();
        searchRoute.originLng = place.geometry.location.lng();
        return;
    }

    searchRoute.destinationAddress = address;
    searchRoute.destinationLat = place.geometry.location.lat();
    searchRoute.destinationLng = place.geometry.location.lng();
}

function resetSelectedPlace(type) {
    if (type === "origin") {
        searchRoute.originAddress = "";
        searchRoute.originLat = null;
        searchRoute.originLng = null;
        return;
    }

    searchRoute.destinationAddress = "";
    searchRoute.destinationLat = null;
    searchRoute.destinationLng = null;
}

function getPlaceAddress(place) {
    return place.formatted_address || place.name || "";
}
