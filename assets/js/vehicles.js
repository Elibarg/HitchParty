// HP-VEH-003 | Tela de veiculos: lista, cria, edita, remove e envia imagem.
// O backend usa JWT para vincular cada veiculo ao usuario logado.

document.addEventListener("DOMContentLoaded", initializeVehicles);

let vehicles = [];
let selectedVehicleImageFile = null;
let shouldRemoveVehicleImage = false;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp"
];

async function initializeVehicles() {
    // Pagina protegida: sem JWT local, volta para login antes de consultar API.
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    await loadVehicles();
    bindEvents();
    renderVehicles();
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

async function loadVehicles() {
    try {
        // Chamada autenticada: apiFetch inclui Authorization: Bearer <JWT>.
        const response = await apiFetch("/vehicles");

        if (!response.ok) {
            throw new Error("Erro ao carregar veículos.");
        }

        const data = await response.json();
        vehicles = data?.data?.vehicles || [];
    } catch (error) {
        console.error(error);
        vehicles = [];
        showToast(error.message || "Erro ao carregar veículos.", "danger");
    }
}

function bindEvents() {
    const saveButton = document.getElementById("saveVehicleBtn");
    const imageInput = document.getElementById("vehicleImage");
    const modal = document.getElementById("vehicleModal");
    const removeImageButton = document.getElementById("removeVehicleImageBtn");

    saveButton?.addEventListener("click", saveVehicle);
    imageInput?.addEventListener("change", handleImageSelection);
    modal?.addEventListener("hidden.bs.modal", resetVehicleForm);
    removeImageButton?.addEventListener("click", removeVehicleImage);

    bindFieldRestrictions();
    initializeImageDropArea();
}

function bindFieldRestrictions() {
    bindLettersOnly("brand");
    bindLettersOnly("model");
    bindLettersOnly("color");
    bindPlateField();
    bindYearField();
}

function bindLettersOnly(id) {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", () => {
        input.value = input.value.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
    });
}

function bindPlateField() {
    const input = document.getElementById("plate");
    if (!input) return;

    input.addEventListener("input", () => {
        input.value = input.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 7);
    });
}

function bindYearField() {
    const input = document.getElementById("year");
    if (!input) return;

    input.addEventListener("input", () => {
        input.value = input.value
            .replace(/\D/g, "")
            .slice(0, 4);
    });
}

function handleImageSelection(event) {
    const file = event.target.files[0];

    if (!file || !validateImage(file)) {
        event.target.value = "";
        return;
    }

    readImage(file);
}

function validateImage(file) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        showToast("Formato inválido. Utilize PNG, JPG ou WEBP.", "danger");
        return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
        showToast("A imagem deve possuir no máximo 5 MB.", "danger");
        return false;
    }

    return true;
}

function readImage(file) {
    const reader = new FileReader();

    reader.onload = function(event) {
        selectedVehicleImageFile = file;
        shouldRemoveVehicleImage = false;
        updateImagePreview(event.target.result);
    };

    reader.onerror = function() {
        showToast("Erro ao carregar imagem.", "danger");
    };

    reader.readAsDataURL(file);
}

function updateImagePreview(image) {
    const preview = document.getElementById("vehiclePreview");
    if (preview) {
        preview.src = resolveVehicleImageUrl(image) || "../assets/img/car-placeholder.png";
    }
}

function removeVehicleImage() {
    selectedVehicleImageFile = null;
    shouldRemoveVehicleImage = true;

    const input = document.getElementById("vehicleImage");
    if (input) {
        input.value = "";
    }

    updateImagePreview(null);
    showToast("Imagem removida.", "warning");
}

function initializeImageDropArea() {
    const wrapper = document.getElementById("vehicleImagePreviewWrapper");
    if (!wrapper) return;

    wrapper.addEventListener("dragover", event => {
        event.preventDefault();
        wrapper.classList.add("dragging");
    });

    wrapper.addEventListener("dragleave", () => {
        wrapper.classList.remove("dragging");
    });

    wrapper.addEventListener("drop", event => {
        event.preventDefault();
        wrapper.classList.remove("dragging");

        const file = event.dataTransfer.files[0];
        if (!file || !validateImage(file)) return;

        readImage(file);
    });
}

async function saveVehicle() {
    const form = document.getElementById("vehicleForm");

    if (!validateVehicleForm()) {
        form.classList.add("was-validated");
        return;
    }

    const id = document.getElementById("vehicleId").value;
    const vehicle = getVehicleFormData();

    try {
        // Envia FormData para permitir cadastro/edicao com imagem opcional.
        const response = await apiFetch(id ? `/vehicles/${id}` : "/vehicles", {
            method: id ? "PUT" : "POST",
            body: vehicle
        });

        const responseData = await parseJsonResponse(response);

        if (!response.ok) {
            throw new Error(responseData.message || "Erro ao salvar veículo.");
        }

        await loadVehicles();
        renderVehicles();
        closeVehicleModal();
        showToast(id ? "Veículo atualizado." : "Veículo cadastrado.");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Erro ao salvar veículo. Verifique o servidor.", "danger");
    }
}

async function parseJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        throw new Error("Erro ao salvar veículo. Verifique o servidor.");
    }

    return response.json();
}

function getVehiclePayload() {
    return {
        brand: document.getElementById("brand").value.trim(),
        model: document.getElementById("model").value.trim(),
        year: Number(document.getElementById("year").value),
        color: document.getElementById("color").value.trim(),
        licensePlate: document.getElementById("plate").value.trim().toUpperCase(),
        seats: Number(document.getElementById("seats").value)
    };
}

function getVehicleFormData() {
    const payload = getVehiclePayload();
    const formData = new FormData();

    // FormData preserva texto e arquivo no mesmo request multipart.
    Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
    });

    if (selectedVehicleImageFile) {
        formData.append("image", selectedVehicleImageFile);
    }

    formData.append("removeImage", shouldRemoveVehicleImage ? "true" : "false");

    return formData;
}

function editVehicle(id) {
    const vehicle = vehicles.find(item => Number(item.id) === Number(id));
    if (!vehicle) return;

    document.getElementById("vehicleId").value = vehicle.id;
    document.getElementById("brand").value = vehicle.brand || "";
    document.getElementById("model").value = vehicle.model || "";
    document.getElementById("year").value = vehicle.year || "";
    document.getElementById("color").value = vehicle.color || "";
    document.getElementById("plate").value = vehicle.plate || vehicle.licensePlate || "";
    document.getElementById("seats").value = vehicle.seats || "";

    selectedVehicleImageFile = null;
    shouldRemoveVehicleImage = false;
    updateImagePreview(vehicle.imageUrl || vehicle.image || null);

    new bootstrap.Modal(document.getElementById("vehicleModal")).show();
}

async function deleteVehicle(id) {
    const confirmed = confirm("Deseja remover este veículo?");
    if (!confirmed) return;

    try {
        const response = await apiFetch(`/vehicles/${id}`, {
            method: "DELETE"
        });

        const responseData = await parseDeleteResponse(response);

        if (!response.ok) {
            throw new Error(responseData.message || "Erro ao remover veículo.");
        }

        await loadVehicles();
        renderVehicles();
        showToast("Veículo removido.");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Erro ao remover veículo.", "danger");
    }
}

async function parseDeleteResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        throw new Error("Erro ao remover veículo. Verifique o servidor.");
    }

    return response.json();
}

function closeVehicleModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById("vehicleModal"));
    modal?.hide();
}

function resetVehicleForm() {
    document.getElementById("vehicleForm").reset();
    document.getElementById("vehicleId").value = "";
    document.getElementById("vehicleForm").classList.remove("was-validated");
    selectedVehicleImageFile = null;
    shouldRemoveVehicleImage = false;
    updateImagePreview(null);
}

function renderVehicles() {
    const container = document.getElementById("vehiclesList");
    if (!container) return;

    if (!vehicles.length) {
        container.innerHTML = createEmptyState();
        return;
    }

    container.innerHTML = vehicles.map(createVehicleCard).join("");
}

function createVehicleCard(vehicle) {
    const plate = vehicle.plate || vehicle.licensePlate || "";

    return `
        <article class="vehicle-card">
            ${createVehicleImage(vehicle)}
            <div class="vehicle-content">
                <div class="vehicle-header">
                    <div class="vehicle-info">
                        <h3>
                            ${escapeHtml(vehicle.brand)}
                            ${escapeHtml(vehicle.model)}
                        </h3>
                        <p>${escapeHtml(plate)}</p>
                    </div>
                </div>
                <div class="vehicle-details">
                    <span class="vehicle-detail">${escapeHtml(vehicle.year)}</span>
                    <span class="vehicle-detail">${escapeHtml(vehicle.color)}</span>
                    <span class="vehicle-detail">${escapeHtml(formatSeats(vehicle.seats))}</span>
                </div>
                <div class="vehicle-actions">
                    <button
                        class="btn btn-outline-primary"
                        onclick="editVehicle(${vehicle.id})">
                        Editar
                    </button>
                    <button
                        class="btn btn-outline-danger"
                        onclick="deleteVehicle(${vehicle.id})">
                        Excluir
                    </button>
                </div>
            </div>
        </article>
    `;
}

function createVehicleImage(vehicle) {
    const imageUrl = vehicle.imageUrl || vehicle.image;

    if (imageUrl) {
        return `
            <img
                src="${escapeHtml(resolveVehicleImageUrl(imageUrl))}"
                class="vehicle-image"
                alt="${escapeHtml(vehicle.brand)}">
        `;
    }

    return `
        <div class="vehicle-placeholder">
            CAR
        </div>
    `;
}

function resolveVehicleImageUrl(imageUrl) {
    if (!imageUrl) return "";

    // URLs vindas do upload sao relativas ao backend, nao ao arquivo HTML.
    if (/^(https?:|data:)/.test(imageUrl)) {
        return imageUrl;
    }

    const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    const apiRoot = APP_CONFIG.API_URL.replace(/\/api$/, "");

    return `${apiRoot}${normalizedPath}`;
}

function createEmptyState() {
    return `
        <div class="empty-state">
            <h3>Nenhum veículo cadastrado</h3>
            <p>Cadastre um veículo para criar caronas.</p>
        </div>
    `;
}

function validateVehicleForm() {
    const vehicle = getVehiclePayload();
    const editingId = Number(document.getElementById("vehicleId").value);

    if (!vehicle.brand) {
        showToast("Informe a marca.", "warning");
        return false;
    }

    if (!vehicle.model) {
        showToast("Informe o modelo.", "warning");
        return false;
    }

    if (!vehicle.color) {
        showToast("Informe a cor.", "warning");
        return false;
    }

    if (!isValidYear(vehicle.year)) {
        showToast("Ano inválido.", "warning");
        return false;
    }

    if (!isValidSeats(vehicle.seats)) {
        showToast("Quantidade de assentos inválida.", "warning");
        return false;
    }

    if (!isValidPlate(vehicle.licensePlate)) {
        showToast("Placa inválida.", "warning");
        return false;
    }

    if (isDuplicatedPlate(vehicle.licensePlate, editingId)) {
        showToast("Já existe um veículo com essa placa.", "danger");
        return false;
    }

    return true;
}

function isValidPlate(plate) {
    const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    const antiga = /^[A-Z]{3}[0-9]{4}$/;

    return mercosul.test(plate) || antiga.test(plate);
}

function isDuplicatedPlate(plate, editingId = 0) {
    return vehicles.some(vehicle =>
        (vehicle.plate || vehicle.licensePlate) === plate
        && Number(vehicle.id) !== Number(editingId)
    );
}

function isValidYear(year) {
    const currentYear = new Date().getFullYear();
    return year >= 1980 && year <= currentYear + 1;
}

function isValidSeats(seats) {
    return Number.isInteger(seats) && seats >= 1 && seats <= 8;
}

function formatSeats(seats) {
    const total = Number(seats);

    if (!Number.isInteger(total) || total < 1) {
        return "Assentos não informados";
    }

    return `${total} ${total === 1 ? "lugar" : "lugares"}`;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return "";

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showToast(message, variant = "success") {
    const toast = document.getElementById("feedbackToast");
    const body = document.getElementById("toastMessage");

    if (!toast || !body) {
        alert(message);
        return;
    }

    body.textContent = message;
    toast.className = "toast border-0";
    toast.classList.add(`text-bg-${variant}`);

    bootstrap.Toast
        .getOrCreateInstance(toast, { delay: 3000 })
        .show();
}
