// HP-USER-002 | Tela de perfil: carrega dados pelo JWT, renderiza informacoes
// do usuario logado e envia atualizacoes para /api/profile.

document.addEventListener("DOMContentLoaded", initializeProfile);

let currentProfile = null;

async function initializeProfile() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    await loadProfileData();
    bindProfileForm();
    bindLogout();
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

async function loadProfileData() {
    try {
        // apiFetch envia o JWT; o backend usa req.user.id para buscar o perfil.
        const response = await apiFetch("/profile");

        if (!response.ok) {
            throw new Error("Erro ao carregar perfil.");
        }

        const data = await response.json();
        const updatedUser = normalizeUser(data?.data?.user || data?.user || {});
        currentProfile = {
            ...(currentProfile || {}),
            ...updatedUser
        };
        saveUser(currentProfile);
        renderProfile(currentProfile);
        fillEditForm(currentProfile);
    } catch (error) {
        console.error(error);
        currentProfile = null;
        renderProfile(null);
        showToast(error.message || "Erro ao carregar perfil.", "danger");
    }
}

function renderProfile(profile) {
    const safeProfile = profile || {};
    const fullName = safeProfile.fullName || "Não informado";
    const email = safeProfile.email || "Não informado";
    const phone = safeProfile.phone || "Não informado";

    document.getElementById("profileName").textContent = fullName;
    document.getElementById("profileEmail").textContent = email;
    document.getElementById("profilePhone").textContent = phone;

    document.getElementById("infoName").textContent = fullName;
    document.getElementById("infoEmail").textContent = email;
    document.getElementById("infoPhone").textContent = phone;

    document.getElementById("profileRidesCount").textContent = safeProfile.ridesCount || 0;
    document.getElementById("profileVehiclesCount").textContent = safeProfile.vehiclesCount || 0;
    document.getElementById("profileMessagesCount").textContent = safeProfile.messagesCount || 0;
    document.getElementById("profileRatingValue").textContent =
        Number(safeProfile.ratingAverage || safeProfile.ratingValue || 0).toFixed(1);

    const avatar = document.getElementById("profileAvatar");
    if (avatar) {
        avatar.textContent = safeProfile.fullName
            ? getInitials(safeProfile.fullName)
            : "--";
    }
}

function fillEditForm(profile) {
    const safeProfile = profile || {};

    document.getElementById("editName").value = safeProfile.fullName || "";
    document.getElementById("editEmail").value = safeProfile.email || "";
    document.getElementById("editPhone").value = safeProfile.phone || "";
    document.getElementById("editPassword").value = "";
}

function bindProfileForm() {
    const saveButton = document.getElementById("saveProfileBtn");

    if (saveButton) {
        saveButton.addEventListener("click", handleSaveProfile);
    }
}

async function handleSaveProfile() {
    const form = document.getElementById("editProfileForm");
    const nameInput = document.getElementById("editName");
    const emailInput = document.getElementById("editEmail");
    const phoneInput = document.getElementById("editPhone");
    const passwordInput = document.getElementById("editPassword");

    const fullName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;

    if (!fullName || !email || !phone) {
        form.classList.add("was-validated");
        showToast("Preencha os campos obrigatórios.", "warning");
        return;
    }

    if (!validateEmail(email)) {
        form.classList.add("was-validated");
        showToast("Informe um e-mail válido.", "warning");
        return;
    }

    const payload = {
        fullName,
        email,
        phone
    };

    // Senha so e enviada quando o usuario preenche o campo no modal.
    if (password.trim()) {
        payload.password = password.trim();
    }

    try {
        const response = await apiFetch("/profile", {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao atualizar perfil.");
        }

        const data = await response.json();
        currentProfile = normalizeUser(data?.data?.user || data?.user || {});

        saveUser(currentProfile);
        renderProfile(currentProfile);

        const modalElement = document.getElementById("editProfileModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();

        showToast("Perfil atualizado com sucesso.", "success");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Erro ao atualizar perfil.", "danger");
    }
}

function getInitials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(message, variant = "success") {
    const toastElement = document.getElementById("feedbackToast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toastElement || !toastMessage) return;

    toastMessage.textContent = message;

    toastElement.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning", "text-bg-info");
    toastElement.classList.add(`text-bg-${variant}`);

    bootstrap.Toast
        .getOrCreateInstance(toastElement, { delay: 3000 })
        .show();
}
