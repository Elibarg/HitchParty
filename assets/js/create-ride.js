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

/* ==========================================================
   CARREGA OS VEÍCULOS DO USUÁRIO
   ----------------------------------------------------------
   Busca os veículos cadastrados no localStorage.
   Caso nenhum veículo seja encontrado, bloqueia a criação
   de novas corridas e direciona o usuário para cadastrar
   um veículo.
   ========================================================== */

function loadVehicles() {

    const vehicles =
        JSON.parse(
            localStorage.getItem("hitchparty_vehicles")
        ) || [];

    const select =
        document.getElementById("vehicle");

    // Remove opções antigas (mantendo apenas a primeira)
    select.innerHTML = `
        <option value="">
            Selecione um veículo
        </option>
    `;

    /* ==========================================================
       VERIFICA SE O USUÁRIO POSSUI VEÍCULOS CADASTRADOS
       ========================================================== */

    if (vehicles.length === 0) {

        document.getElementById(
            "createRideForm"
        ).style.display = "none";

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

                window.location.href =
                    "vehicles.html";

            } else {

                history.back();

            }

        });

        return;
    }

    /* ==========================================================
       PREENCHE O SELECT COM OS VEÍCULOS CADASTRADOS
       ========================================================== */

    vehicles.forEach(vehicle => {

        select.innerHTML += `
            <option value="${vehicle.id}">
                ${vehicle.brand} ${vehicle.model} (${vehicle.plate})
            </option>
        `;

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