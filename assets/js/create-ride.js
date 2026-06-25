document.addEventListener("DOMContentLoaded", initializeCreateRide);

// HP-FRONT-005 | Criacao/edicao de carona. A tela coleta dados do formulario e
// coordenadas do Google Maps, mas o backend decide motorista e regras de vagas.

let editingRideId = null;
let currentRide = null;

async function initializeCreateRide() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    await loadVehicles();

    editingRideId = new URLSearchParams(window.location.search).get("id");

    if (editingRideId) {
        const canEdit = await loadRideForEditing(editingRideId);

        if (!canEdit) return;
    }

    bindForm();
}

async function loadComponents() {
    try {
        const [headerResponse, navbarResponse] = await Promise.all([
            fetch("../components/header.html"),
            fetch("../components/navbar.html")
        ]);

        document.getElementById("header-slot").innerHTML = await headerResponse.text();
        document.getElementById("navbar-slot").innerHTML = await navbarResponse.text();
    } catch (error) {
        console.error(error);
    }
}

async function loadVehicles() {
    const response = await apiFetch("/vehicles");

    if (!response.ok) {
        showToast("Erro ao carregar veiculos.");
        return;
    }

    const data = await response.json();
    const vehicles = data?.data?.vehicles || [];
    const select = document.getElementById("vehicle");

    select.innerHTML = '<option value="">Selecione um veiculo</option>';

    if (!vehicles.length) {
        document.getElementById("createRideForm").style.display = "none";
        Swal.fire({
            icon: "warning",
            title: "Nenhum veiculo cadastrado",
            html: "Para criar ou editar uma carona e necessario possuir <b>pelo menos um veiculo cadastrado.</b>",
            showCancelButton: true,
            confirmButtonText: "Cadastrar veiculo",
            cancelButtonText: "Voltar",
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(result => {
            window.location.href = result.isConfirmed ? "vehicles.html" : "dashboard.html";
        });
        return;
    }

    vehicles.forEach(vehicle => {
        const option = document.createElement("option");
        option.value = vehicle.id;
        option.textContent = `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`;
        select.appendChild(option);
    });
}

async function loadRideForEditing(rideId) {
    try {
        const response = await apiFetch(`/rides/${rideId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Erro ao carregar carona.");
        }

        const data = await response.json();
        currentRide = data?.data?.ride;

        if (!currentRide) return false;

        if (currentRide.role !== "driver") {
            showToast("Apenas o motorista dono da carona pode editar esta carona.");
            setTimeout(() => {
                window.location.href = `ride-detail.html?id=${encodeURIComponent(rideId)}`;
            }, 1500);
            return false;
        }

        document.title = "Editar Carona | HitchParty";
        document.getElementById("pageTitle").textContent = "Editar Carona";
        document.getElementById("pageSubtitle").textContent = "Atualize os dados da viagem.";
        document.getElementById("publishRideLabel").textContent = "Salvar Alteracoes";

        document.getElementById("origin").value = currentRide.origin || "";
        document.getElementById("destination").value = currentRide.destination || "";
        document.getElementById("vehicle").value = currentRide.vehicleId || "";
        document.getElementById("availableSeats").value =
            currentRide.totalSeats || currentRide.availableSeats || "";
        document.getElementById("price").value = currentRide.suggestedPrice || "";
        document.getElementById("notes").value = currentRide.description || "";

        const date = currentRide.departureTime
            ? new Date(currentRide.departureTime)
            : null;

        if (date && !Number.isNaN(date.getTime())) {
            document.getElementById("rideDate").value = date.toISOString().slice(0, 10);
            document.getElementById("rideTime").value = date.toTimeString().slice(0, 5);
        }

        return true;
    } catch (error) {
        console.error(error);
        showToast(error.message || "Erro ao carregar carona.");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
        return false;
    }
}

function bindForm() {
    document
        .getElementById("createRideForm")
        .addEventListener("submit", handleCreateRide);
}

async function handleCreateRide(event) {
    // Coleta dados do formulario para criar ou editar corrida.
    event.preventDefault();

    const button = document.getElementById("publishRideBtn");
    button.disabled = true;

    try {
        const rideData = {
            origin: document.getElementById("origin").value,
            destination: document.getElementById("destination").value,
            date: document.getElementById("rideDate").value,
            time: document.getElementById("rideTime").value,
            vehicleId: document.getElementById("vehicle").value,
            seats: document.getElementById("availableSeats").value,
            price: document.getElementById("price").value,
            notes: document.getElementById("notes").value
        };

        const response = await apiFetch(
            editingRideId ? `/rides/${editingRideId}` : "/rides",
            {
                method: editingRideId ? "PUT" : "POST",
                body: JSON.stringify({
                    ...rideData,
                    originLat: window.hitchpartyRoute?.originLat || currentRide?.originLat || null,
                    originLng: window.hitchpartyRoute?.originLng || currentRide?.originLng || null,
                    destinationLat:
                        window.hitchpartyRoute?.destinationLat
                        || currentRide?.destinationLat
                        || null,
                    destinationLng:
                        window.hitchpartyRoute?.destinationLng
                        || currentRide?.destinationLng
                        || null
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Erro ao salvar carona.");
        }

        document.getElementById("publishRideLabel").textContent =
            editingRideId ? "Alteracoes Salvas" : "Carona Publicada";
        button.classList.add("is-success");

        showToast(editingRideId ? "Carona atualizada com sucesso." : "Carona publicada com sucesso.");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Erro ao salvar carona.");
        button.disabled = false;
    }
}

function showToast(message) {
    document.getElementById("toastMessage").textContent = message;

    const toast = bootstrap.Toast.getOrCreateInstance(
        document.getElementById("feedbackToast")
    );
    toast.show();
}

window.initMap = function() {
    // HP-MAPS-003 | Inicializa mapa e autocomplete de origem/destino da corrida.
    // Preservar este callback: ele e chamado diretamente pelo script do Google.
    const inputOrigem = document.getElementById("origin");
    const inputDestino = document.getElementById("destination");

    window.hitchpartyRoute = window.hitchpartyRoute || {
        originLat: null,
        originLng: null,
        destinationLat: null,
        destinationLng: null
    };

    if (!inputOrigem || !inputDestino) return;

    const autoOrigem = new google.maps.places.Autocomplete(inputOrigem);
    const autoDestino = new google.maps.places.Autocomplete(inputDestino);
    const divMapa = document.getElementById("meu-mapa");

    if (!divMapa) return;

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

        if (!lugarOrigem?.geometry || !lugarDestino?.geometry) return;

        window.hitchpartyRoute = {
            originLat: lugarOrigem.geometry.location.lat(),
            originLng: lugarOrigem.geometry.location.lng(),
            destinationLat: lugarDestino.geometry.location.lat(),
            destinationLng: lugarDestino.geometry.location.lng()
        };

        directionsService.route(
            {
                origin: lugarOrigem.geometry.location,
                destination: lugarDestino.geometry.location,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (resultado, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(resultado);
                    document.getElementById("mapa-section")?.classList.remove("d-none");
                } else {
                    console.error("Erro ao tracar a rota do motorista:", status);
                }
            }
        );
    }

    autoOrigem.addListener("place_changed", calcularRota);
    autoDestino.addListener("place_changed", calcularRota);
};
