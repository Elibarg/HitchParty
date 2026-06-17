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

        /* ==========================================================
        NOTIFICAÇÃO DE SUCESSO DO CADASTRO
        ----------------------------------------------------------
        Esta notificação é exibida somente quando a API confirma
        que o usuário foi cadastrado com sucesso.

        Após 3 segundos, o usuário é redirecionado automaticamente
        para a tela de login.
        ========================================================== */
         Swal.fire({
             icon: "success",
             title: "Cadastro realizado!",
             html: `
                    <b>Bem-vindo ao HitchParty!</b><br><br>
                    Sua conta foi criada com sucesso.<br>
                    Você será redirecionado para a tela de login.
                `,
             timer: 2500,
             timerProgressBar: true,
             showConfirmButton: false,
             allowOutsideClick: false,
             allowEscapeKey: false
            });

        // Aguarda o tempo da notificação antes de redirecionar
         setTimeout(() => {
            window.location.href = "login.html";
        }, 2500);


    } catch (error) {
        console.error("Erro na requisição:", error);
        alert(error.message);
    }
}