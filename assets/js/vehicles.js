/* ============================================================
   HitchParty
   vehicles.js

   Parte 1
   Configuração
   Inicialização
   Componentes
   Eventos
============================================================ */

/* ============================================================
   CONFIGURAÇÕES
============================================================ */

const VEHICLES_STORAGE_KEY = "hitchparty_vehicles";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp"
];

/* ============================================================
   VARIÁVEIS GLOBAIS
============================================================ */

let vehicles = [];

let selectedVehicleImage = null;

/*
selectedVehicleImage

MVP

Base64

Backend

https://api.hitchparty.com/uploads/abc123.webp
*/

/* ============================================================
   INICIALIZAÇÃO
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeVehicles
);

async function initializeVehicles() {

    if (!isAuthenticated()) {

        window.location.href = "login.html";

        return;
    }

    await loadComponents();

    loadVehicles();

    bindEvents();

    renderVehicles();

}

/* ============================================================
   COMPONENTES
============================================================ */

async function loadComponents() {

    try {

        const [
            headerResponse,
            navbarResponse
        ] = await Promise.all([

            fetch("../components/header.html"),

            fetch("../components/navbar.html")

        ]);

        if (headerResponse.ok) {

            document
                .getElementById("header-slot")
                .innerHTML =
                await headerResponse.text();

        }

        if (navbarResponse.ok) {

            document
                .getElementById("navbar-slot")
                .innerHTML =
                await navbarResponse.text();

        }

    }

    catch (error) {

        console.error(
            "Erro ao carregar componentes:",
            error
        );

    }

}

/* ============================================================
   EVENTOS
============================================================ */

function bindEvents() {

    const saveButton =
        document.getElementById(
            "saveVehicleBtn"
        );

    const imageInput =
        document.getElementById(
            "vehicleImage"
        );

    const modal =
        document.getElementById(
            "vehicleModal"
        );

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveVehicle
        );

    }

    if (imageInput) {

        imageInput.addEventListener(
            "change",
            handleImageSelection
        );

    }

    if (modal) {

        modal.addEventListener(
            "hidden.bs.modal",
            resetVehicleForm
        );

    }
    const removeImageButton =
    document.getElementById(
        "removeVehicleImageBtn"
        );

        if (removeImageButton) {

        removeImageButton.addEventListener(
            "click",
            removeVehicleImage
        );

}
    bindFieldRestrictions();

}

/* ============================================================
   RESTRIÇÕES DOS CAMPOS
============================================================ */

function bindFieldRestrictions() {

    bindLettersOnly("brand");

    bindLettersOnly("model");

    bindLettersOnly("color");

    bindPlateField();

    bindYearField();

}

function bindLettersOnly(id) {

    const input =
        document.getElementById(id);

    if (!input) return;

    input.addEventListener(
        "input",
        () => {

            input.value =
                input.value.replace(
                    /[^A-Za-zÀ-ÿ\s]/g,
                    ""
                );

        }
    );

}

function bindPlateField() {

    const input =
        document.getElementById(
            "plate"
        );

    if (!input) return;

    input.addEventListener(
        "input",
        () => {

            input.value =
                input.value
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9]/g,
                        ""
                    )
                    .slice(0, 7);

        }
    );

}

function bindYearField() {

    const input =
        document.getElementById(
            "year"
        );

    if (!input) return;

    input.addEventListener(
        "input",
        () => {

            input.value =
                input.value
                    .replace(/\D/g, "")
                    .slice(0, 4);

        }
    );

}

/* ============================================================
   CARREGAMENTO
============================================================ */

function loadVehicles() {

    vehicles =
        JSON.parse(
            localStorage.getItem(
                VEHICLES_STORAGE_KEY
            )
        ) || [];

}

/* ============================================================
   PREPARAÇÃO PARA O BACKEND

   Atualmente:
       LocalStorage

   Futuramente:

   GET    /api/vehicles

   POST   /api/vehicles

   PUT    /api/vehicles/{id}

   DELETE /api/vehicles/{id}

   Upload:

   POST /api/upload

============================================================ */

/* ============================================================
   PARTE 2

   UPLOAD DA IMAGEM
============================================================ */

/* ============================================================
   SELEÇÃO DA IMAGEM
============================================================ */

function handleImageSelection(event) {

    const file =
        event.target.files[0];

    if (!file) {

        return;

    }

    if (!validateImage(file)) {

        event.target.value = "";

        return;

    }

    readImage(file);

}

/* ============================================================
   VALIDAÇÃO
============================================================ */

function validateImage(file) {

    if (
        !ACCEPTED_IMAGE_TYPES.includes(
            file.type
        )
    ) {

        showToast(
            "Formato inválido. Utilize PNG, JPG ou WEBP.",
            "danger"
        );

        return false;

    }

    if (
        file.size >
        MAX_IMAGE_SIZE
    ) {

        showToast(
            "A imagem deve possuir no máximo 5 MB.",
            "danger"
        );

        return false;

    }

    return true;

}

/* ============================================================
   LEITURA DA IMAGEM
============================================================ */

function readImage(file) {

    const reader =
        new FileReader();

    reader.onload = function(event) {

        selectedVehicleImage =
            event.target.result;

        updateImagePreview(
            selectedVehicleImage
        );

    };

    reader.onerror = function() {

        showToast(
            "Erro ao carregar imagem.",
            "danger"
        );

    };

    reader.readAsDataURL(file);

}

/* ============================================================
   PREVIEW
============================================================ */

function updateImagePreview(image) {

    const preview =
        document.getElementById(
            "vehiclePreview"
        );

    if (!preview) {

        return;

    }

    preview.src = image;

}

/* ============================================================
   REMOVER IMAGEM
============================================================ */

function removeVehicleImage() {

    selectedVehicleImage = null;

    const preview =
        document.getElementById(
            "vehiclePreview"
        );

    const input =
        document.getElementById(
            "vehicleImage"
        );

    if (preview) {

        preview.src =
            "../assets/img/car-placeholder.png";

    }

    if (input) {

        input.value = "";

    }

    showToast(
        "Imagem removida.",
        "warning"
    );

}

/* ============================================================
   DRAG AND DROP
============================================================ */

initializeImageDropArea();

function initializeImageDropArea() {

    const wrapper =
        document.getElementById(
            "vehicleImagePreviewWrapper"
        );

    if (!wrapper) {

        return;

    }

    wrapper.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            wrapper.classList.add(
                "dragging"
            );

        }
    );

    wrapper.addEventListener(
        "dragleave",
        () => {

            wrapper.classList.remove(
                "dragging"
            );

        }
    );

    wrapper.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            wrapper.classList.remove(
                "dragging"
            );

            const file =
                event.dataTransfer.files[0];

            if (!file) {

                return;

            }

            if (!validateImage(file)) {

                return;

            }

            readImage(file);

        }
    );

}

/* ============================================================
   UTILIDADES
============================================================ */

function hasVehicleImage() {

    return (
        selectedVehicleImage !== null
        &&
        selectedVehicleImage !== ""
    );

}

function getVehicleImage() {

    return hasVehicleImage()

        ? selectedVehicleImage

        : "../assets/img/car-placeholder.png";

}

/* ============================================================
   PREPARAÇÃO PARA BACKEND

   Hoje

   selectedVehicleImage

   Base64

   Futuro

   https://cdn.hitchparty.com/uploads/abc123.webp

============================================================ */

/* ============================================================
   PARTE 3

   CRUD DOS VEÍCULOS
============================================================ */

/* ============================================================
   SALVAR
============================================================ */

function saveVehicle() {

    const form =
        document.getElementById(
            "vehicleForm"
        );

    if (!validateVehicleForm()) {

        form.classList.add(
            "was-validated"
        );

        return;
    }

    const id =
        document.getElementById(
            "vehicleId"
        ).value;

    const vehicle = {

        id:
            id
            ? Number(id)
            : Date.now(),

        brand:
            document
                .getElementById("brand")
                .value
                .trim(),

        model:
            document
                .getElementById("model")
                .value
                .trim(),

        year:
            Number(
                document
                    .getElementById("year")
                    .value
            ),

        color:
            document
                .getElementById("color")
                .value
                .trim(),

        plate:
            document
                .getElementById("plate")
                .value
                .toUpperCase(),

        seats:
            Number(
                document
                    .getElementById("seats")
                    .value
            ),

        image:
            selectedVehicleImage,

        primary:
            false

    };

    if (id) {

        updateVehicle(vehicle);

    }
    else {

        createVehicle(vehicle);

    }

}

/* ============================================================
   CRIAR
============================================================ */

function createVehicle(vehicle) {

    if (vehicles.length === 0) {

        vehicle.primary = true;

    }

    vehicles.push(vehicle);

    persistVehicles();

    renderVehicles();

    closeVehicleModal();

    showToast(
        "Veículo cadastrado."
    );

}

/* ============================================================
   EDITAR
============================================================ */

function updateVehicle(vehicle) {

    const index =
        vehicles.findIndex(

            item =>
                item.id === vehicle.id

        );

    if (index === -1) {

        return;

    }

    vehicle.primary =
        vehicles[index].primary;

    if (!vehicle.image) {

        vehicle.image =
            vehicles[index].image;

    }

    vehicles[index] =
        vehicle;

    persistVehicles();

    renderVehicles();

    closeVehicleModal();

    showToast(
        "Veículo atualizado."
    );

}

/* ============================================================
   EDITAR FORMULÁRIO
============================================================ */

function editVehicle(id) {

    const vehicle =
        vehicles.find(

            item =>
                item.id === id

        );

    if (!vehicle) {

        return;

    }

    document
        .getElementById("vehicleId")
        .value =
        vehicle.id;

    document
        .getElementById("brand")
        .value =
        vehicle.brand;

    document
        .getElementById("model")
        .value =
        vehicle.model;

    document
        .getElementById("year")
        .value =
        vehicle.year;

    document
        .getElementById("color")
        .value =
        vehicle.color;

    document
        .getElementById("plate")
        .value =
        vehicle.plate;

    document
        .getElementById("seats")
        .value =
        vehicle.seats;

    selectedVehicleImage =
        vehicle.image || null;

    updateImagePreview(
        getVehicleImage()
    );

    new bootstrap.Modal(

        document.getElementById(
            "vehicleModal"
        )

    ).show();

}

/* ============================================================
   EXCLUIR
============================================================ */

function deleteVehicle(id) {

    const confirmed =
        confirm(
            "Deseja remover este veículo?"
        );

    if (!confirmed) {

        return;

    }

    const removedVehicle =
        vehicles.find(

            vehicle =>
                vehicle.id === id

        );

    vehicles =
        vehicles.filter(

            vehicle =>
                vehicle.id !== id

        );

    if (

        removedVehicle?.primary
        &&
        vehicles.length > 0

    ) {

        vehicles[0].primary = true;

    }

    persistVehicles();

    renderVehicles();

    showToast(
        "Veículo removido."
    );

}

/* ============================================================
   PRINCIPAL
============================================================ */

function setPrimaryVehicle(id) {

    vehicles.forEach(

        vehicle => {

            vehicle.primary =
                vehicle.id === id;

        }

    );

    persistVehicles();

    renderVehicles();

    showToast(
        "Veículo principal atualizado."
    );

}

/* ============================================================
   FECHAR MODAL
============================================================ */

function closeVehicleModal() {

    const modal =
        bootstrap.Modal.getInstance(

            document.getElementById(
                "vehicleModal"
            )

        );

    modal?.hide();

}

/* ============================================================
   RESET
============================================================ */

function resetVehicleForm() {

    document
        .getElementById(
            "vehicleForm"
        )
        .reset();

    document
        .getElementById(
            "vehicleId"
        )
        .value = "";

    document
        .getElementById(
            "vehicleForm"
        )
        .classList.remove(
            "was-validated"
        );

    selectedVehicleImage =
        null;

    updateImagePreview(

        "../assets/img/car-placeholder.png"

    );

}

/* ============================================================
   LOCAL STORAGE
============================================================ */

function persistVehicles() {

    localStorage.setItem(

        VEHICLES_STORAGE_KEY,

        JSON.stringify(
            vehicles
        )

    );

    /*
    =========================================

    BACKEND FUTURO

    GET

    /api/vehicles

    POST

    /api/vehicles

    PUT

    /api/vehicles/{id}

    DELETE

    /api/vehicles/{id}

    =========================================
    */

}

/* ============================================================
   PARTE 4

   RENDERIZAÇÃO
============================================================ */

/* ============================================================
   RENDERIZAÇÃO PRINCIPAL
============================================================ */

function renderVehicles() {

    const container =
        document.getElementById(
            "vehiclesList"
        );

    if (!container) {

        return;

    }

    if (vehicles.length === 0) {

        container.innerHTML =
            createEmptyState();

        return;

    }

    container.innerHTML =
        vehicles
            .map(createVehicleCard)
            .join("");

}

/* ============================================================
   CARD
============================================================ */

function createVehicleCard(vehicle) {

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

                        <p>

                            ${escapeHtml(vehicle.plate)}

                        </p>

                    </div>

                    ${vehicle.primary
                        ? `
                        <span
                            class="vehicle-badge">

                            Principal

                        </span>
                        `
                        : ""
                    }

                </div>

                <div class="vehicle-details">

                    <span class="vehicle-detail">

                        ${vehicle.year}

                    </span>

                    <span class="vehicle-detail">

                        ${escapeHtml(vehicle.color)}

                    </span>

                    <span class="vehicle-detail">

                        ${vehicle.seats}
                        lugares

                    </span>

                </div>

                <div class="vehicle-actions">

                    ${vehicle.primary
                        ? ""
                        : `
                        <button
                            class="btn btn-outline-success"
                            onclick="setPrimaryVehicle(${vehicle.id})">

                            Principal

                        </button>
                        `
                    }

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

/* ============================================================
   FOTO
============================================================ */

function createVehicleImage(vehicle) {

    if (

        vehicle.image &&
        vehicle.image !== ""

    ) {

        return `

            <img

                src="${vehicle.image}"

                class="vehicle-image"

                alt="${escapeHtml(vehicle.brand)}">

        `;

    }

    return `

        <div
            class="vehicle-placeholder">

            🚗

        </div>

    `;

}

/* ============================================================
   EMPTY STATE
============================================================ */

function createEmptyState() {

    return `

        <div
            class="empty-state">

            <h3>

                Nenhum veículo cadastrado

            </h3>

            <p>

                Clique no botão

                <strong>

                    + Adicionar Veículo

                </strong>

                para começar.

            </p>

        </div>

    `;

}

/* ============================================================
   HELPERS HTML
============================================================ */

function escapeHtml(text) {

    if (

        text === null ||
        text === undefined

    ) {

        return "";

    }

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}

/* ============================================================
   PARTE 5

   VALIDAÇÕES
   HELPERS
   TOAST
============================================================ */

/* ============================================================
   VALIDAÇÃO DO FORMULÁRIO
============================================================ */

function validateVehicleForm() {

    const brand =
        document
            .getElementById("brand")
            .value
            .trim();

    const model =
        document
            .getElementById("model")
            .value
            .trim();

    const year =
        Number(
            document
                .getElementById("year")
                .value
        );

    const color =
        document
            .getElementById("color")
            .value
            .trim();

    const plate =
        document
            .getElementById("plate")
            .value
            .trim()
            .toUpperCase();

    const seats =
        Number(
            document
                .getElementById("seats")
                .value
        );

    const editingId =
        Number(
            document
                .getElementById("vehicleId")
                .value
        );

    if (!brand) {

        showToast(
            "Informe a marca.",
            "warning"
        );

        return false;

    }

    if (!model) {

        showToast(
            "Informe o modelo.",
            "warning"
        );

        return false;

    }

    if (!color) {

        showToast(
            "Informe a cor.",
            "warning"
        );

        return false;

    }

    if (!isValidYear(year)) {

        showToast(
            "Ano inválido.",
            "warning"
        );

        return false;

    }

    if (!isValidSeats(seats)) {

        showToast(
            "Quantidade de assentos inválida.",
            "warning"
        );

        return false;

    }

    if (!isValidPlate(plate)) {

        showToast(
            "Placa inválida.",
            "warning"
        );

        return false;

    }

    if (isDuplicatedPlate(
        plate,
        editingId
    )) {

        showToast(
            "Já existe um veículo com essa placa.",
            "danger"
        );

        return false;

    }

    return true;

}

/* ============================================================
   PLACA
============================================================ */

function isValidPlate(plate) {

    const mercosul =
        /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

    const antiga =
        /^[A-Z]{3}[0-9]{4}$/;

    return (

        mercosul.test(plate)
        ||

        antiga.test(plate)

    );

}

function isDuplicatedPlate(
    plate,
    editingId = 0
) {

    return vehicles.some(

        vehicle =>

            vehicle.plate === plate

            &&

            vehicle.id !== editingId

    );

}

/* ============================================================
   ANO
============================================================ */

function isValidYear(year) {

    const currentYear =
        new Date().getFullYear();

    return (

        year >= 1980

        &&

        year <= currentYear + 1

    );

}

/* ============================================================
   ASSENTOS
============================================================ */

function isValidSeats(seats) {

    return (

        Number.isInteger(seats)

        &&

        seats >= 1

        &&

        seats <= 8

    );

}

/* ============================================================
   TOAST
============================================================ */

function showToast(
    message,
    variant = "success"
) {

    const toast =
        document.getElementById(
            "feedbackToast"
        );

    if (!toast) {

        alert(message);

        return;

    }

    const body =
        document.getElementById(
            "toastMessage"
        );

    body.textContent =
        message;

    toast.className =
        "toast border-0";

    toast.classList.add(
        `text-bg-${variant}`
    );

    bootstrap.Toast
        .getOrCreateInstance(
            toast,
            {
                delay: 3000
            }
        )
        .show();

}

/* ============================================================
   HELPERS
============================================================ */

function generateVehicleId() {

    return Date.now();

}

function getVehicleById(id) {

    return vehicles.find(

        vehicle =>

            vehicle.id === id

    );

}

function sortVehicles() {

    vehicles.sort(

        (a, b) => {

            if (
                a.primary &&
                !b.primary
            ) {

                return -1;

            }

            if (
                !a.primary &&
                b.primary
            ) {

                return 1;

            }

            return a.brand.localeCompare(
                b.brand
            );

        }

    );

}

function resetStorage() {

    localStorage.removeItem(
        VEHICLES_STORAGE_KEY
    );

    vehicles = [];

    renderVehicles();

}

/* ============================================================
   BACKEND FUTURO

   GET
   /api/vehicles

   GET
   /api/vehicles/{id}

   POST
   /api/vehicles

   PUT
   /api/vehicles/{id}

   DELETE
   /api/vehicles/{id}

   POST
   /api/upload

============================================================ */

/* ============================================================
   PARTE 6

   FINALIZAÇÃO
   ESTATÍSTICAS
   BACKEND
============================================================ */

/* ============================================================
   ESTATÍSTICAS
============================================================ */

function getVehicleStatistics() {

    return {

        total:
            vehicles.length,

        primary:

            vehicles.find(
                vehicle => vehicle.primary
            ) || null,

        availableSeats:

            vehicles.reduce(

                (total, vehicle) =>

                    total + vehicle.seats,

                0

            )

    };

}

/* ============================================================
   BUSCA
============================================================ */

function searchVehicles(term = "") {

    term =
        term
            .trim()
            .toLowerCase();

    return vehicles.filter(vehicle =>

        vehicle.brand
            .toLowerCase()
            .includes(term)

        ||

        vehicle.model
            .toLowerCase()
            .includes(term)

        ||

        vehicle.plate
            .toLowerCase()
            .includes(term)

        ||

        vehicle.color
            .toLowerCase()
            .includes(term)

    );

}

/* ============================================================
   FILTROS
============================================================ */

function getPrimaryVehicle() {

    return vehicles.find(

        vehicle => vehicle.primary

    );

}

function getVehicleByPlate(plate) {

    return vehicles.find(

        vehicle =>

            vehicle.plate ===

            plate.toUpperCase()

    );

}

/* ============================================================
   EXPORTAÇÃO

   (Útil futuramente para backup)
============================================================ */

function exportVehicles() {

    return JSON.stringify(

        vehicles,

        null,

        2

    );

}

/* ============================================================
   IMPORTAÇÃO

   (Backup)
============================================================ */

function importVehicles(json) {

    try {

        const imported =
            JSON.parse(json);

        if (

            !Array.isArray(imported)

        ) {

            throw new Error();

        }

        vehicles =
            imported;

        persistVehicles();

        renderVehicles();

        showToast(

            "Backup importado."

        );

    }

    catch {

        showToast(

            "Arquivo inválido.",

            "danger"

        );

    }

}

/* ============================================================
   DEBUG

   Apenas desenvolvimento
============================================================ */

function printVehicles() {

    console.table(

        vehicles

    );

}

/* ============================================================
   BACKEND

   Quando existir backend,
   praticamente SOMENTE estas funções
   precisarão ser alteradas.

============================================================ */

/*

========================

GET

/api/vehicles

========================

Resposta

[
    {

        id:1,

        brand:"Honda",

        model:"Civic",

        year:2022,

        color:"Preto",

        plate:"ABC1D23",

        seats:5,

        image:

"https://cdn.hitchparty.com/uploads/abc123.webp",

        primary:true

    }

]

========================

POST

/api/vehicles

multipart/form-data

Campos

brand

model

year

color

plate

seats

image

========================

PUT

/api/vehicles/{id}

========================

DELETE

/api/vehicles/{id}

========================

*/

/* ============================================================
   ROADMAP

   Próximas melhorias

   ✓ Compressão automática
   ✓ Múltiplas imagens
   ✓ Marca do veículo
   ✓ Modelo por marca
   ✓ Cor via Color Picker
   ✓ Renavam
   ✓ Documento
   ✓ Seguro
   ✓ Licenciamento
   ✓ Foto da CNH
   ✓ Foto CRLV
============================================================ */

/* ============================================================
   FIM
============================================================ */

console.log(

    "%cHitchParty Vehicles",

    "color:#2563eb;font-size:18px;font-weight:bold"

);

console.log(

    "vehicles.js carregado com sucesso."

);