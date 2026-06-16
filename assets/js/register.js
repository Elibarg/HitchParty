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

    const fullName = document.getElementById("fullName").value.trim();
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
        fullName,
        email,
        phone,
        password
    };

    try {
        // CÓDIGO REAL DA API
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

        // O alerta verdadeiro que só aparece se a API responder com sucesso
        alert("Conta criada com sucesso no Banco de Dados!");

        window.location.href = "login.html";

    } catch (error) {
        console.error("Erro na requisição:", error);
        alert(error.message);
    }
}