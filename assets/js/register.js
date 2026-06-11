document.addEventListener("DOMContentLoaded", initializeRegister);

function initializeRegister() {
    setupPasswordToggles();
    setupRegisterForm();
}

function setupPasswordToggles() {
    const togglePassword = document.getElementById("togglePassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    togglePassword.addEventListener("click", () => {
        passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    });

    toggleConfirmPassword.addEventListener("click", () => {
        confirmPasswordInput.type = confirmPasswordInput.type === "password" ? "text" : "password";
    });
}

function setupRegisterForm() {
    const form = document.getElementById("registerForm");
    form.addEventListener("submit", handleRegister);
}

async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const termsAccepted = document.getElementById("terms").checked;

    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    passwordInput.setCustomValidity("");
    confirmPasswordInput.setCustomValidity("");

    if (password.length < 6) {
        passwordInput.setCustomValidity("A senha deve ter pelo menos 6 caracteres.");
    }

    if (password !== confirmPassword) {
        confirmPasswordInput.setCustomValidity("As senhas não coincidem.");
    }

    if (!termsAccepted) {
        form.classList.add("was-validated");
        return;
    }

    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const payload = {
        name,
        email,
        phone,
        password
    };

    try {
        /*
        BACKEND FUTURO

        const response = await fetch(`${APP_CONFIG.API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao criar conta");
        }

        const data = await response.json();

        // se o backend devolver token:
        // saveToken(data.token);
        // window.location.href = "dashboard.html";
        */

        console.log("Cadastro enviado:", payload);

        alert("Conta criada com sucesso.");

        window.location.href = "login.html";
    } catch (error) {
        console.error(error);
        alert("Erro ao criar conta.");
    }
}