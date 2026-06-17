document.addEventListener("DOMContentLoaded", initializeProfile);

let currentProfile = {
    fullName: "Usuário",
    email: "email@exemplo.com",
    phone: "(00) 00000-0000",
    ridesCount: 0,
    vehiclesCount: 0,
    messagesCount: 0,
    ratingValue: 0.0
};

async function initializeProfile() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    loadProfileData();
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

function loadProfileData() {
    try {
        const storedUser = localStorage.getItem(APP_CONFIG.USER_KEY);

        if (storedUser) {
            const user = JSON.parse(storedUser);

            currentProfile = {
                ...currentProfile,
                name: user?.name || user?.fullName || currentProfile.name,
                email: user?.email || currentProfile.email,
                phone: user?.phone || currentProfile.phone,
                ridesCount: user?.ridesCount ?? currentProfile.ridesCount,
                vehiclesCount: user?.vehiclesCount ?? currentProfile.vehiclesCount,
                messagesCount: user?.messagesCount ?? currentProfile.messagesCount,
                ratingValue: user?.ratingValue ?? currentProfile.ratingValue
            };
        }
    } catch (error) {
        console.warn("Erro ao ler perfil do localStorage:", error);
    }

    renderProfile(currentProfile);
    fillEditForm(currentProfile);
}

function renderProfile(profile) {
    document.getElementById("profileName").textContent = profile.name;
    document.getElementById("profileEmail").textContent = profile.email;
    document.getElementById("profilePhone").textContent = profile.phone;

    document.getElementById("infoName").textContent = profile.name;
    document.getElementById("infoEmail").textContent = profile.email;
    document.getElementById("infoPhone").textContent = profile.phone;

    document.getElementById("profileRidesCount").textContent = profile.ridesCount;
    document.getElementById("profileVehiclesCount").textContent = profile.vehiclesCount;
    document.getElementById("profileMessagesCount").textContent = profile.messagesCount;
    document.getElementById("profileRatingValue").textContent = Number(profile.ratingValue).toFixed(1);

    const avatar = document.getElementById("profileAvatar");
    if (avatar && profile.name) {
        const initials = profile.name
            .split(" ")
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();

        avatar.textContent = initials;
    }
}

function fillEditForm(profile) {
    document.getElementById("editName").value = profile.name;
    document.getElementById("editEmail").value = profile.email;
    document.getElementById("editPhone").value = profile.phone;
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

    if (password.trim()) {
        payload.password = password.trim();
    }

    try {
        /*
        BACKEND FUTURO

        const response = await fetch(`${APP_CONFIG.API_URL}/users/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Erro ao atualizar perfil");
        }

        const updatedUser = await response.json();
        localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(updatedUser));
        currentProfile = { ...currentProfile, ...updatedUser };
        */

        currentProfile = {
            ...currentProfile,
            fullName,
            email,
            phone
        };

        localStorage.setItem(
            APP_CONFIG.USER_KEY,
            JSON.stringify({
                ...JSON.parse(localStorage.getItem(APP_CONFIG.USER_KEY) || "{}"),
                fullName,
                email,
                phone
            })
        );

        renderProfile(currentProfile);

        const modalElement = document.getElementById("editProfileModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }

        showToast("Perfil atualizado com sucesso.", "success");
    } catch (error) {
        console.error(error);
        showToast("Erro ao atualizar perfil.", "danger");
    }
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

    const toast = bootstrap.Toast.getOrCreateInstance(toastElement, {
        delay: 3000
    });

    toast.show();
}