document.addEventListener("DOMContentLoaded", initializeVehicles);

const VEHICLES_STORAGE_KEY = "hitchparty_vehicles";

let vehicles = [];

async function initializeVehicles() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    loadVehicles();
    bindLogout();
    bindEvents();
    bindLogout();
    bindFieldRestrictions();
}

async function loadComponents() {
    try {
        const [headerResponse, navbarResponse] = await Promise.all([
            fetch("../components/header.html"),
            fetch("../components/navbar.html")
        ]);

        if (headerResponse.ok) {
            document.getElementById("header-slot").innerHTML = await headerResponse.text();
        }

        if (navbarResponse.ok) {
            document.getElementById("navbar-slot").innerHTML = await navbarResponse.text();
        }
    } catch (error) {
        console.error("Erro ao carregar componentes:", error);
    }
}

function bindEvents() {
    document.getElementById("saveVehicleBtn").addEventListener("click", saveVehicle);

    const vehicleModal = document.getElementById("vehicleModal");
    vehicleModal.addEventListener("hidden.bs.modal", resetForm);
}

function bindFieldRestrictions() {
    const brandInput = document.getElementById("brand");
    const modelInput = document.getElementById("model");
    const colorInput = document.getElementById("color");
    const plateInput = document.getElementById("plate");
    const yearInput = document.getElementById("year");

    if (brandInput) {
        brandInput.addEventListener("input", () => {
            brandInput.value = cleanLettersOnly(brandInput.value, true);
        });
    }

    if (modelInput) {
        modelInput.addEventListener("input", () => {
            modelInput.value = cleanLettersOnly(modelInput.value, true);
        });
    }

    if (colorInput) {
        colorInput.addEventListener("input", () => {
            colorInput.value = cleanLettersOnly(colorInput.value, true);
        });
    }

    if (plateInput) {
        plateInput.addEventListener("input", () => {
            plateInput.value = cleanPlate(plateInput.value);
        });
    }

    if (yearInput) {
        yearInput.addEventListener("input", () => {
            yearInput.value = cleanNumbersOnly(yearInput.value).slice(0, 4);
        });
    }
}

function loadVehicles() {
    vehicles = JSON.parse(localStorage.getItem(VEHICLES_STORAGE_KEY)) || [];
    renderVehicles();
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

function renderVehicles() {
    const container = document.getElementById("vehiclesList");

    if (!vehicles.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Nenhum veículo cadastrado</h3>
                <p>Clique em "Adicionar Veículo" para começar.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = vehicles.map(vehicle => createVehicleCard(vehicle)).join("");
}

function createVehicleCard(vehicle) {
    return `
        <article class="vehicle-card">

            <div class="vehicle-header">

                <div class="vehicle-info">

                    <h3>${escapeHtml(`${vehicle.brand} ${vehicle.model}`)}</h3>

                    <p>${escapeHtml(vehicle.plate)}</p>

                </div>

                ${vehicle.primary
            ? `<span class="vehicle-badge">Principal</span>`
            : ""
        }

            </div>

            <div class="vehicle-details">

                <span class="vehicle-detail">${vehicle.year}</span>

                <span class="vehicle-detail">${escapeHtml(vehicle.color)}</span>

                <span class="vehicle-detail">${vehicle.seats || 5} lugares</span>

            </div>

            <div class="vehicle-actions">

                ${!vehicle.primary
            ? `<button class="btn btn-outline-success" onclick="setPrimaryVehicle(${vehicle.id})">Principal</button>`
            : ""
        }

                <button class="btn btn-outline-primary" onclick="editVehicle(${vehicle.id})">Editar</button>

                <button class="btn btn-outline-danger" onclick="deleteVehicle(${vehicle.id})">Excluir</button>

            </div>

        </article>
    `;
}

function saveVehicle() {
    const form = document.getElementById("vehicleForm");
    const vehicleId = document.getElementById("vehicleId").value;

    const brand = cleanLettersOnly(document.getElementById("brand").value, true).trim();
    const model = cleanLettersOnly(document.getElementById("model").value, true).trim();
    const year = Number(document.getElementById("year").value);
    const color = cleanLettersOnly(document.getElementById("color").value, true).trim();
    const plate = cleanPlate(document.getElementById("plate").value).trim().toUpperCase();
    const seats = Number(document.getElementById("seats").value);

    form.classList.remove("was-validated");

    if (!brand || !model || !color || !plate || !year || !seats) {
        form.classList.add("was-validated");
        showToast("Preencha os campos obrigatórios.", "warning");
        return;
    }

    if (!isValidYear(year)) {
        showToast("Informe um ano válido.", "warning");
        return;
    }

    if (!isValidPlate(plate)) {
        showToast("Informe uma placa válida com 7 caracteres.", "warning");
        return;
    }

    if (brand.length < 2 || model.length < 1 || color.length < 3) {
        showToast("Verifique marca, modelo e cor.", "warning");
        return;
    }

    const vehicle = {
        id: vehicleId ? Number(vehicleId) : Date.now(),
        brand,
        model,
        year,
        color,
        plate,
        seats: clampSeats(seats),
        primary: false
    };

    if (vehicleId) {
        const index = vehicles.findIndex(v => v.id === Number(vehicleId));
        if (index === -1) return;

        vehicle.primary = vehicles[index].primary;
        vehicles[index] = vehicle;
        showToast("Veículo atualizado.", "success");
    } else {
        if (vehicles.length === 0) {
            vehicle.primary = true;
        }

        vehicles.push(vehicle);
        showToast("Veículo cadastrado.", "success");
    }

    persistVehicles();
    renderVehicles();
    bootstrap.Modal.getInstance(document.getElementById("vehicleModal"))?.hide();
}

function editVehicle(id) {
    const vehicle = vehicles.find(v => v.id === id);

    if (!vehicle) return;

    document.getElementById("vehicleId").value = vehicle.id;
    document.getElementById("brand").value = vehicle.brand;
    document.getElementById("model").value = vehicle.model;
    document.getElementById("year").value = vehicle.year;
    document.getElementById("color").value = vehicle.color;
    document.getElementById("plate").value = vehicle.plate;
    document.getElementById("seats").value = vehicle.seats || 5;

    new bootstrap.Modal(document.getElementById("vehicleModal")).show();
}

function deleteVehicle(id) {
    const confirmed = confirm("Deseja excluir este veículo?");
    if (!confirmed) return;

    const deletedVehicle = vehicles.find(vehicle => vehicle.id === id);

    vehicles = vehicles.filter(vehicle => vehicle.id !== id);

    if (deletedVehicle?.primary && vehicles.length > 0) {
        vehicles[0].primary = true;
    }

    persistVehicles();
    renderVehicles();
    showToast("Veículo removido.", "success");
}

function setPrimaryVehicle(id) {
    vehicles.forEach(vehicle => {
        vehicle.primary = vehicle.id === id;
    });

    persistVehicles();
    renderVehicles();
    showToast("Veículo principal atualizado.", "success");
}

function persistVehicles() {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));

    /*
    BACKEND FUTURO

    GET    /api/vehicles
    POST   /api/vehicles
    PUT    /api/vehicles/{id}
    DELETE /api/vehicles/{id}

    */
}

function resetForm() {
    const form = document.getElementById("vehicleForm");
    form.reset();
    form.classList.remove("was-validated");

    document.getElementById("vehicleId").value = "";
    document.getElementById("seats").value = 5;
}

function cleanNumbersOnly(value) {
    return value.replace(/\D/g, "");
}

function cleanLettersOnly(value, allowSpaces = true) {
    const regex = allowSpaces ? /[^a-zA-ZÀ-ÿ\s]/g : /[^a-zA-ZÀ-ÿ]/g;
    return value.replace(regex, "");
}

function cleanPlate(value) {
    return value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 7);
}

function isValidYear(year) {
    const currentYear = new Date().getFullYear();
    return year >= 1980 && year <= currentYear + 1;
}

function isValidPlate(plate) {
    return /^[A-Z0-9]{7}$/.test(plate);
}

function clampSeats(seats) {
    if (Number.isNaN(seats)) return 5;
    return Math.min(Math.max(seats, 1), 8);
}

function showToast(message, variant = "success") {
    const toastElement = document.getElementById("feedbackToast");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;

    toastElement.classList.remove(
        "text-bg-success",
        "text-bg-danger",
        "text-bg-warning",
        "text-bg-info"
    );

    toastElement.classList.add(`text-bg-${variant}`);

    bootstrap.Toast.getOrCreateInstance(toastElement, {
        delay: 3000
    }).show();
}

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}