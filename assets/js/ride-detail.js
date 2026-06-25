// Detalhe da carona: mostra rota, dados da viagem e permite solicitar vaga.

// HP-FRONT-007 | Detalhe da carona: mostra rota, motorista, passageiros
// confirmados e permite solicitar vaga com embarque/desembarque.
let passengerPickup = null;
let passengerDropoff = null;
let currentRideRequest = null;

document.addEventListener("DOMContentLoaded", initializeRideDetail);

async function initializeRideDetail() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    bindActionButtons();
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
    const cancelRideBtn = document.getElementById("cancelRideBtn");

    if (requestSeatBtn) {
        requestSeatBtn.addEventListener("click", handleRequestSeat);
    }

    if (cancelRideBtn) {
        cancelRideBtn.addEventListener("click", handleCancelRide);
    }
}

async function loadRideDetails() {
    const rideId = new URLSearchParams(window.location.search).get("id");

    if (!rideId) {
        showToast("Carona não informada.", "warning");
        return;
    }

    try {
        const response = await apiFetch(`/rides/${rideId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao carregar carona.");
        }

        const data = await response.json();
        const ride = data?.data?.ride;

        renderRide(ride);
        await loadConfirmedPassengers(ride.id);

        if (window.desenharRotaDoBanco) {
            window.desenharRotaDoBanco(ride.origin, ride.destination, ride.stops || []);
        }

        if (ride.role !== "driver") {
            await loadMyRideRequest(ride.id);
        }
    } catch (error) {
        console.error(error);
        showToast(error.message, "danger");
    }

}

async function loadConfirmedPassengers(rideId) {
    const list = document.getElementById("confirmedPassengersList");

    if (!list) return;

    try {
        const response = await apiFetch(`/rides/${rideId}/passengers`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Erro ao carregar passageiros confirmados.");
        }

        const passengers = data?.data?.passengers || data?.passengers || [];
        renderConfirmedPassengers(passengers);
    } catch (error) {
        console.error(error);
        list.textContent = "Não foi possível carregar os passageiros confirmados.";
    }
}

function renderConfirmedPassengers(passengers = []) {
    const list = document.getElementById("confirmedPassengersList");

    if (!list) return;

    list.innerHTML = "";

    if (!passengers.length) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "confirmed-passengers-empty";
        emptyMessage.textContent = "Ainda não há passageiros confirmados nesta carona.";
        list.appendChild(emptyMessage);
        return;
    }

    passengers.forEach(passenger => {
        list.appendChild(createConfirmedPassengerCard(passenger));
    });
}

function createConfirmedPassengerCard(passenger) {
    const card = document.createElement("article");
    card.className = "confirmed-passenger-card";

    const avatar = document.createElement("div");
    avatar.className = "confirmed-passenger-avatar";

    if (passenger.photoUrl) {
        const image = document.createElement("img");
        image.src = passenger.photoUrl;
        image.alt = "";
        image.className = "confirmed-passenger-photo";
        avatar.appendChild(image);
    } else {
        avatar.textContent = getInitials(passenger.fullName || "Passageiro");
    }

    const info = document.createElement("div");
    info.className = "confirmed-passenger-info";

    const name = document.createElement("strong");
    name.textContent = passenger.fullName || "Passageiro";

    const rating = document.createElement("span");
    rating.textContent = `Avaliação: ${Number(passenger.ratingAverage || 0).toFixed(1)} • ${Number(passenger.completedRides || 0)} viagens`;

    info.append(name, rating);

    if (passenger.pickupReference) {
        const reference = document.createElement("small");
        reference.textContent = `Referência de embarque: ${passenger.pickupReference}`;
        info.appendChild(reference);
    }

    card.append(avatar, info);

    return card;
}

function getInitials(name) {
    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

async function loadMyRideRequest(rideId) {
    // HP-REQ-006 | Reabre solicitacao existente. Se o passageiro ja pediu vaga,
    // a tela repovoa embarque, desembarque e referencias informativas.
    try {
        const response = await apiFetch(`/rides/${rideId}/my-request`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Erro ao carregar sua solicitação.");
        }

        currentRideRequest = data?.data?.request || null;

        if (currentRideRequest) {
            renderExistingRequest(currentRideRequest);
        }
    } catch (error) {
        console.error(error);
        showToast(error.message || "Erro ao carregar sua solicitação.", "danger");
    }
}

function renderExistingRequest(request) {
    const pickupInput = document.getElementById("pickupAddress");
    const dropoffInput = document.getElementById("dropoffAddress");
    const pickupReferenceInput = document.getElementById("pickupReference");
    const dropoffReferenceInput = document.getElementById("dropoffReference");
    const statusBox = document.getElementById("requestStatusBox");
    const requestSeatBtn = document.getElementById("requestSeatBtn");

    pickupInput.value = request.pickupAddress || "";
    dropoffInput.value = request.dropoffAddress || "";
    pickupReferenceInput.value = request.pickupReference || "";
    dropoffReferenceInput.value = request.dropoffReference || "";

    passengerPickup = request.pickupLatitude && request.pickupLongitude
        ? {
            address: request.pickupAddress,
            latitude: Number(request.pickupLatitude),
            longitude: Number(request.pickupLongitude)
        }
        : null;
    passengerDropoff = request.dropoffLatitude && request.dropoffLongitude
        ? {
            address: request.dropoffAddress,
            latitude: Number(request.dropoffLatitude),
            longitude: Number(request.dropoffLongitude)
        }
        : null;

    const statusLabel = getRequestStatusLabel(request.status);

    if (statusBox) {
        statusBox.classList.remove("d-none");
        statusBox.textContent = `Você já solicitou vaga nesta carona. Status: ${statusLabel}.`;
    }

    if (requestSeatBtn) {
        requestSeatBtn.disabled = true;
        requestSeatBtn.textContent = getRequestButtonLabel(request.status);
        requestSeatBtn.classList.toggle("is-success", ["aceita", "confirmada", "aprovada"].includes(normalizeRequestStatus(request.status)));
    }

    updatePassengerRouteInfo();
}

function normalizeRequestStatus(status) {
    const statusMap = {
        PENDING: "pendente",
        ACCEPTED: "aceita",
        REJECTED: "recusada",
        CANCELED: "cancelada",
        pending: "pendente",
        accepted: "aceita",
        rejected: "recusada",
        pendente: "pendente",
        aceita: "aceita",
        rejeitada: "recusada",
        recusada: "recusada"
    };

    return statusMap[status] || String(status || "pendente").toLowerCase();
}

function getRequestStatusLabel(status) {
    switch (normalizeRequestStatus(status)) {
        case "aceita":
        case "confirmada":
        case "aprovada":
            return "Aceita";
        case "recusada":
        case "rejeitada":
            return "Recusada";
        default:
            return "Pendente";
    }
}

function getRequestButtonLabel(status) {
    switch (normalizeRequestStatus(status)) {
        case "aceita":
        case "confirmada":
        case "aprovada":
            return "Solicitação aceita";
        case "recusada":
        case "rejeitada":
            return "Solicitação recusada";
        default:
            return "Solicitação enviada";
    }
}

function renderRide(ride) {
    window.currentRide = ride;

    document.getElementById("driverName").textContent = ride.driverName;
    document.getElementById("driverRating").textContent = `Avaliação: ${Number(ride.rating).toFixed(1)} • ${ride.trips} viagens`;

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

    const openQrBtn = document.getElementById("openQrBtn");
    if (openQrBtn) {
        openQrBtn.href = `trip-qr.html?id=${ride.id}`;
    }

    renderRideActions(ride);
}

function renderRideActions(ride) {
    const isDriver = ride.role === "driver";
    const editRideBtn = document.getElementById("editRideBtn");
    const cancelRideBtn = document.getElementById("cancelRideBtn");
    const requestSeatBtn = document.getElementById("requestSeatBtn");
    const openChatBtn = document.getElementById("openChatBtn");
    const openQrBtn = document.getElementById("openQrBtn");
    const scanQrBtn = document.getElementById("scanQrBtn");

    if (isDriver) {
        editRideBtn.href = `create-ride.html?id=${encodeURIComponent(ride.id)}`;
        editRideBtn.classList.remove("d-none");
        cancelRideBtn.classList.remove("d-none");
        requestSeatBtn.classList.add("d-none");
        openChatBtn?.classList.add("d-none");
        openQrBtn?.classList.add("d-none");
        document.getElementById("passengerRouteCard")?.classList.add("d-none");
        return;
    }

    editRideBtn.removeAttribute("href");
    editRideBtn.classList.add("d-none");
    cancelRideBtn.classList.add("d-none");
    openQrBtn?.classList.add("d-none");
    scanQrBtn?.classList.add("d-none");
    document.getElementById("passengerRouteCard")?.classList.remove("d-none");
    requestSeatBtn.classList.remove("d-none");

    if (ride.status === "cancelada") {
        requestSeatBtn.disabled = true;
        requestSeatBtn.textContent = "Carona cancelada";
    }
}

async function handleRequestSeat() {
    const button = document.getElementById("requestSeatBtn");

    if (!button || button.disabled) return;
    if (currentRideRequest) {
        showToast("Você já solicitou vaga nesta carona.", "warning");
        return;
    }

    button.classList.add("is-loading");
    button.disabled = true;

    try {
        const rideId = new URLSearchParams(window.location.search).get("id");

        const response = await apiFetch(`/rides/${rideId}/requests`, {
            method: "POST",
            body: JSON.stringify(buildPassengerRequestPayload())
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Erro ao solicitar vaga");
        }

        currentRideRequest = data?.data?.request || null;

        if (currentRideRequest) {
            renderExistingRequest(currentRideRequest);
        } else {
            button.textContent = "Solicitação enviada";
            button.disabled = true;
        }

        button.classList.remove("is-loading");

        showToast("Solicitação enviada. O motorista analisará o desvio estimado antes de aceitar.", "success");
    } catch (error) {
        console.error(error);
        button.disabled = false;
        button.classList.remove("is-loading");
        showToast(error.message || "Erro ao solicitar vaga.", "danger");
    }
}

function buildPassengerRequestPayload() {
    // HP-REQ-007 | Payload da solicitacao. Referencias sao texto livre; apenas
    // embarque/desembarque do Google Maps entram na validacao de coordenadas.
    if (!passengerPickup || !passengerDropoff) {
        throw new Error("Selecione embarque e desembarque pelo Google Maps.");
    }

    return {
        pickupAddress: passengerPickup.address,
        pickupLatitude: passengerPickup.latitude,
        pickupLongitude: passengerPickup.longitude,
        pickupReference: document.getElementById("pickupReference")?.value.trim() || "",
        dropoffAddress: passengerDropoff.address,
        dropoffLatitude: passengerDropoff.latitude,
        dropoffLongitude: passengerDropoff.longitude,
        dropoffReference: document.getElementById("dropoffReference")?.value.trim() || "",
        notes: ""
    };
}

async function handleCancelRide() {
    const ride = window.currentRide;

    if (!ride) return;

    const confirmed = window.confirm("Cancelar esta carona? Os passageiros vinculados serão notificados.");

    if (!confirmed) return;

    try {
        const response = await apiFetch(`/rides/${ride.id}/cancel`, {
            method: "PATCH"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Erro ao cancelar carona.");
        }

        showToast("Carona cancelada com sucesso.", "success");
        await loadRideDetails();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Erro ao cancelar carona.", "danger");
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
    // HP-MAPS-005 | Mapa do detalhe. Desenha rota salva e paradas aprovadas sem
    // alterar dados; edicoes e solicitacoes continuam passando pelo backend.
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
        const directionsRenderer = new google.maps.DirectionsRenderer({
            map: mapa,
            suppressMarkers: false
        });
        const stopMarkers = [];
        setupPassengerRouteAutocomplete();

        // Deixamos essa função global para você conseguir chamá-la quando a API do Node devolver os dados
        window.desenharRotaDoBanco = function(enderecoOrigem, enderecoDestino, stops = []) {
            
            // Preenche os textos no HTML para o usuário ler
            document.getElementById("origemTexto").innerText = enderecoOrigem;
            document.getElementById("destinoTexto").innerText = enderecoDestino;

            stopMarkers.forEach(marker => marker.setMap(null));
            stopMarkers.length = 0;

            const validStops = stops.filter(stop =>
                stop.latitude !== null
                && stop.latitude !== undefined
                && stop.longitude !== null
                && stop.longitude !== undefined
            );

            validStops.forEach((stop, index) => {
                stopMarkers.push(new google.maps.Marker({
                    position: {
                        lat: Number(stop.latitude),
                        lng: Number(stop.longitude)
                    },
                    map: mapa,
                    label: String(index + 1),
                    title: `Parada ${index + 1}`
                }));
            });

            const pedidoDeRota = {
                origin: enderecoOrigem,
                destination: enderecoDestino,
                waypoints: validStops.map(stop => ({
                    location: {
                        lat: Number(stop.latitude),
                        lng: Number(stop.longitude)
                    },
                    stopover: true
                })),
                optimizeWaypoints: false,
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

function setupPassengerRouteAutocomplete() {
    const pickupInput = document.getElementById("pickupAddress");
    const dropoffInput = document.getElementById("dropoffAddress");

    if (!pickupInput || !dropoffInput || !google.maps.places) return;

    const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput);
    const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput);

    pickupAutocomplete.addListener("place_changed", () => {
        passengerPickup = placeToPassengerPoint(
            pickupAutocomplete.getPlace(),
            pickupInput.value
        );
        updatePassengerRouteInfo();
    });

    dropoffAutocomplete.addListener("place_changed", () => {
        passengerDropoff = placeToPassengerPoint(
            dropoffAutocomplete.getPlace(),
            dropoffInput.value
        );
        updatePassengerRouteInfo();
    });

    pickupInput.addEventListener("input", () => {
        passengerPickup = null;
        updatePassengerRouteInfo();
    });

    dropoffInput.addEventListener("input", () => {
        passengerDropoff = null;
        updatePassengerRouteInfo();
    });
}

function placeToPassengerPoint(place, fallbackAddress) {
    if (!place?.geometry?.location) return null;

    return {
        address: place.formatted_address || place.name || fallbackAddress,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
    };
}

function updatePassengerRouteInfo() {
    const info = document.getElementById("passengerRouteInfo");
    if (!info) return;

    info.textContent = passengerPickup && passengerDropoff
        ? "Pontos selecionados. O backend validará o limite de 5 minutos antes de enviar ao motorista."
        : "Selecione embarque e desembarque pelo autocomplete do Google Maps. O motorista não é obrigado a aceitar.";
}
