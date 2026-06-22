document.addEventListener(
    "DOMContentLoaded",
    initializeCreateRide
);

async function initializeCreateRide() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    bindLogout();
    loadVehicles();
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
    }
    catch (error) {
        console.error(error);
    }
}

/* ==========================================================
   CARREGA OS VEÍCULOS DO USUÁRIO
   ========================================================== */
function loadVehicles() {
    const vehicles = JSON.parse(localStorage.getItem("hitchparty_vehicles")) || [];
    const select = document.getElementById("vehicle");

    select.innerHTML = `
        <option value="">
            Selecione um veículo
        </option>
    `;

    if (vehicles.length === 0) {
        document.getElementById("createRideForm").style.display = "none";

        Swal.fire({
            icon: "warning",
            title: "Nenhum veículo cadastrado",
            html: `
                Para criar uma carona é necessário possuir
                <b>pelo menos um veículo cadastrado.</b>
                <br><br>
                Cadastre um veículo para continuar.
            `,
            showCancelButton: true,
            confirmButtonText: "Cadastrar veículo",
            cancelButtonText: "Voltar",
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "vehicles.html";
            } else {
                history.back();
            }
        });

        return;
    }

    vehicles.forEach(vehicle => {
        select.innerHTML += `
            <option value="${vehicle.id}">
                ${vehicle.brand} ${vehicle.model} (${vehicle.plate})
            </option>
        `;
    });
}

function bindForm() {
    document.getElementById("createRideForm").addEventListener("submit", handleCreateRide);
}

async function handleCreateRide(event) {
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

        console.log("Nova carona:", rideData);

        await new Promise(resolve => setTimeout(resolve, 1000));

        button.textContent = "✓ Carona Publicada";
        button.classList.add("is-success");

        showToast("Carona publicada com sucesso.");
    }
    catch (error) {
        console.error(error);
        showToast("Erro ao criar carona.");
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

/* =====================================================================
   NOVA PARTE: INTEGRAÇÃO COM O GOOGLE MAPS NA CRIAÇÃO DE VAGAS
   ===================================================================== */

window.initMap = function() {
    // 1. Vincula as caixas de texto existentes no seu formulário
    const inputOrigem = document.getElementById("origin");
    const inputDestino = document.getElementById("destination");

    if (!inputOrigem || !inputDestino) return;

    // 2. Ativa as sugestões automáticas do Google nos inputs
    const autoOrigem = new google.maps.places.Autocomplete(inputOrigem);
    const autoDestino = new google.maps.places.Autocomplete(inputDestino);

    const divMapa = document.getElementById("meu-mapa");
    
    if (divMapa) {
        // 3. Inicializa o mapa centralizado na região padrão
        const mapa = new google.maps.Map(divMapa, {
            zoom: 13,
            center: { lat: -26.3044, lng: -48.8456 }, 
            disableDefaultUI: true,
            zoomControl: true
        });

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({ map: mapa });

        // 4. Calcula e desenha o trajeto na tela
        function calcularRota() {
            const lugarOrigem = autoOrigem.getPlace();
            const lugarDestino = autoDestino.getPlace();

            // Só executa o cálculo se ambos os locais foram selecionados no autocompletar
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
                    
                    // Exibe o contêiner do mapa na tela removendo a classe invisível do Bootstrap
                    const mapaSection = document.getElementById("mapa-section");
                    if (mapaSection) {
                        mapaSection.classList.remove("d-none");
                    }
                } else {
                    console.error("Erro ao traçar a rota do motorista:", status);
                }
            });
        }

        // Fica monitorando as caixas; quando o endereço muda, recalcula a rota
        autoOrigem.addListener("place_changed", calcularRota);
        autoDestino.addListener("place_changed", calcularRota);
    }
};