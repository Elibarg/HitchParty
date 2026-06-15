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
function bindActionButtons() {
    const requestSeatBtn = document.getElementById("requestSeatBtn");

    if (requestSeatBtn) {
        requestSeatBtn.addEventListener("click", handleRequestSeat);
    }
}

async function loadRideDetails() {
    const rideId = new URLSearchParams(window.location.search).get("id");

    try {
        /*
        BACKEND FUTURO

        const response = await fetch(`${APP_CONFIG.API_URL}/rides/${rideId}`, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar detalhes da carona");
        }

        const ride = await response.json();
        renderRide(ride);
        return;
        */

        const ride = getMockRide(rideId);
        renderRide(ride);
    } catch (error) {
        console.error(error);
        showToast("Erro ao carregar os detalhes da carona.", "danger");
    }
}

function getMockRide(rideId) {
    const rides = {
        "1": {
            id: 1,
            driverName: "Carlos Silva",
            rating: 4.9,
            trips: 84,
            origin: "Joinville",
            destination: "Blumenau",
            date: "20/06/2026",
            time: "07:10",
            vehicle: "Honda Civic",
            seats: 2,
            price: "R$ 25,00",
            notes: "Bagagem pequena permitida."
        },
        "2": {
            id: 2,
            driverName: "Ana Souza",
            rating: 4.8,
            trips: 61,
            origin: "Joinville",
            destination: "Curitiba",
            date: "21/06/2026",
            time: "08:00",
            vehicle: "Toyota Corolla",
            seats: 3,
            price: "R$ 40,00",
            notes: "Não é permitido fumar."
        }
    };

    return rides[rideId] || {
        id: rideId || 0,
        driverName: "Motorista",
        rating: 0.0,
        trips: 0,
        origin: "Origem",
        destination: "Destino",
        date: "--/--/----",
        time: "--:--",
        vehicle: "Veículo não informado",
        seats: 0,
        price: "R$ 0,00",
        notes: "Nenhuma observação cadastrada."
    };
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