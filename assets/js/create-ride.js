document.addEventListener(
    "DOMContentLoaded",
    initializeCreateRide
);

async function initializeCreateRide() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();
    bindLogout();
    loadVehicles();
    bindLogout();
    bindForm();
}

async function loadComponents() {

    try {

        const [
            headerResponse,
            navbarResponse
        ] = await Promise.all([

            fetch(
                "../components/header.html"
            ),

            fetch(
                "../components/navbar.html"
            )

        ]);

        document.getElementById(
            "header-slot"
        ).innerHTML =
            await headerResponse.text();

        document.getElementById(
            "navbar-slot"
        ).innerHTML =
            await navbarResponse.text();

    }
    catch (error) {

        console.error(error);

    }

}

function loadVehicles() {

    const select =
        document.getElementById(
            "vehicle"
        );

    vehicles.forEach(vehicle => {

        select.innerHTML += `
            <option
                value="${vehicle.id}">
                ${vehicle.name}
            </option>
        `;

    });

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
function bindForm() {

    document
        .getElementById(
            "createRideForm"
        )
        .addEventListener(
            "submit",
            handleCreateRide
        );

}

async function handleCreateRide(event) {

    event.preventDefault();

    const button =
        document.getElementById(
            "publishRideBtn"
        );

    button.disabled = true;

    try {

        const rideData = {

            origin:
                document.getElementById(
                    "origin"
                ).value,

            destination:
                document.getElementById(
                    "destination"
                ).value,

            date:
                document.getElementById(
                    "rideDate"
                ).value,

            time:
                document.getElementById(
                    "rideTime"
                ).value,

            vehicleId:
                document.getElementById(
                    "vehicle"
                ).value,

            seats:
                document.getElementById(
                    "availableSeats"
                ).value,

            price:
                document.getElementById(
                    "price"
                ).value,

            notes:
                document.getElementById(
                    "notes"
                ).value

        };

        console.log(
            "Nova carona:",
            rideData
        );

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    1000
                )
        );

        button.textContent =
            "✓ Carona Publicada";

        button.classList.add(
            "is-success"
        );

        showToast(
            "Carona publicada com sucesso."
        );

    }
    catch (error) {

        console.error(error);

        showToast(
            "Erro ao criar carona."
        );

        button.disabled = false;

    }

}

function showToast(message) {

    document.getElementById(
        "toastMessage"
    ).textContent = message;

    const toast =
        bootstrap.Toast.getOrCreateInstance(
            document.getElementById(
                "feedbackToast"
            )
        );

    toast.show();

}