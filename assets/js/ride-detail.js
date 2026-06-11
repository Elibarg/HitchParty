document.addEventListener(
    "DOMContentLoaded",
    initializeRideDetail
);

async function initializeRideDetail() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }

    await loadComponents();

    loadRideDetails();
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

function loadRideDetails() {

    /*
    BACKEND FUTURO

    const id =
        new URLSearchParams(
            window.location.search
        ).get("id");

    GET /api/rides/{id}

    */

    const ride = {

        id: 1,

        driverName:
            "Carlos Silva",

        rating:
            4.9,

        trips:
            84,

        origin:
            "Joinville",

        destination:
            "Blumenau",

        date:
            "20/06/2026",

        time:
            "07:10",

        vehicle:
            "Honda Civic",

        seats:
            2,

        price:
            "R$ 25,00",

        notes:
            "Bagagem pequena permitida."
    };

    renderRide(ride);
}

function renderRide(ride) {

    document.getElementById(
        "driverName"
    ).textContent =
        ride.driverName;

    document.getElementById(
        "driverRating"
    ).textContent =
        `⭐ ${ride.rating} • ${ride.trips} viagens`;

    document.querySelector(
        ".route-point.start"
    ).textContent =
        ride.origin;

    document.querySelector(
        ".route-point.end"
    ).textContent =
        ride.destination;

    document.getElementById(
        "rideDate"
    ).textContent =
        ride.date;

    document.getElementById(
        "rideTime"
    ).textContent =
        ride.time;

    document.getElementById(
        "vehicle"
    ).textContent =
        ride.vehicle;

    document.getElementById(
        "availableSeats"
    ).textContent =
        ride.seats;

    document.getElementById(
        "price"
    ).textContent =
        ride.price;

    document.getElementById(
        "rideNotes"
    ).textContent =
        ride.notes;
}