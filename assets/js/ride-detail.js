document.addEventListener("DOMContentLoaded", initializeRideDetail);

async function initializeRideDetail() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    bindActionButtons();
    bindLogout();
    await loadRideDetails();
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

function bindActionButtons() {
    const requestSeatBtn = document.getElementById("requestSeatBtn");

    if (requestSeatBtn) {
        requestSeatBtn.addEventListener("click", handleRequestSeat);
    }
}

async function loadRideDetails() {
    const rideId = new URLSearchParams(window.location.search).get("id");

}

function renderRide(ride) {
    document.getElementById("driverName").textContent = ride.driverName;
    document.getElementById("driverRating").textContent = `⭐ ${Number(ride.rating).toFixed(1)} • ${ride.trips} viagens`;

    document.querySelector(".route-point.start").textContent = ride.origin;
    document.querySelector(".route-point.end").textContent = ride.destination;

    document.getElementById("rideDate").textContent = ride.date;
    document.getElementById("rideTime").textContent = ride.time;
    document.getElementById("vehicle").textContent = ride.vehicle;
    document.getElementById("availableSeats").textContent = ride.seats;
    document.getElementById("price").textContent = ride.price;
    document.getElementById("rideNotes").textContent = ride.notes;

    const avatar = document.querySelector(".driver-avatar");
    if (avatar && ride.driverName) {
        const initials = ride.driverName
            .split(" ")
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();

        avatar.textContent = initials;
    }

    const openChatBtn = document.getElementById("openChatBtn");
    if (openChatBtn) {
        openChatBtn.href = `chat.html?id=${ride.id}`;
    }
}

async function handleRequestSeat() {
    const button = document.getElementById("requestSeatBtn");

    if (!button || button.disabled) return;

    button.classList.add("is-loading");
    button.disabled = true;

    try {
        /*
        BACKEND FUTURO

        const rideId = new URLSearchParams(window.location.search).get("id");

        const response = await fetch(`${APP_CONFIG.API_URL}/rides/${rideId}/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error("Erro ao solicitar vaga");
        }
        */

        await new Promise(resolve => setTimeout(resolve, 1000));

        button.textContent = "✓ Solicitação Enviada";
        button.classList.remove("btn-primary", "is-loading");
        button.classList.add("is-success");

        showToast("Solicitação enviada com sucesso.", "success");
    } catch (error) {
        console.error(error);
        button.disabled = false;
        button.classList.remove("is-loading");
        showToast("Erro ao solicitar vaga.", "danger");
    }
}

function showToast(message, variant = "success") {
    const toastElement = document.getElementById("feedbackToast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toastElement || !toastMessage) return;

    toastMessage.textContent = message;

    toastElement.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning", "text-bg-info");
    toastElement.classList.add(`text-bg-${variant}`);

    const toast = bootstrap.Toast.getOrCreateInstance(toastElement, {
        delay: 3000
    });

    toast.show();
}

// =====================================================================
// MAPA DA TELA DE DETALHES (Apenas Visualização)
// =====================================================================

window.initDetalheMapa = function() {
    const divMapa = document.getElementById("meu-mapa");
    
    if (divMapa) {
        // Inicia o mapa limpo, sem os controles feios
        const mapa = new google.maps.Map(divMapa, {
            zoom: 13,
            center: { lat: -26.3044, lng: -48.8456 }, 
            disableDefaultUI: true,
            zoomControl: true
        });

        // Prepara os serviços para desenhar a linha azul
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({ map: mapa });

        // Deixamos essa função global para você conseguir chamá-la quando a API do Node devolver os dados
        window.desenharRotaDoBanco = function(enderecoOrigem, enderecoDestino) {
            
            // Preenche os textos no HTML para o usuário ler
            document.getElementById("origemTexto").innerText = enderecoOrigem;
            document.getElementById("destinoTexto").innerText = enderecoDestino;

            const pedidoDeRota = {
                origin: enderecoOrigem,
                destination: enderecoDestino,
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(pedidoDeRota, (resultado, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(resultado);
                } else {
                    console.error("Não foi possível traçar a rota da viagem salva:", status);
                }
            });
        };
    }
};
// Teste forçado: desenha a rota 1 segundo após a página carregar
setTimeout(() => window.desenharRotaDoBanco("UniSenai Joinville", "Shopping Mueller Joinville"), 1000);