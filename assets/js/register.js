// Cadastro: valida formulario inicial e cria usuario no backend.

document.addEventListener("DOMContentLoaded", initializeRegister);

// HP-FRONT-003 | Cadastro: valida formulario no navegador e envia dados para
// authController -> authService -> usuarioRepository -> users.
function initializeRegister() {
    // Inicializa validacoes e envio do cadastro para a API.
    setupPasswordToggles();
    setupRegisterForm();
}

function setupPasswordToggles() {
    const togglePassword = document.getElementById("togglePassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    // Alterna a visualizacao dos campos de senha sem modificar os valores.
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
    // Monta payload minimo para criar usuario no backend.
    event.preventDefault();

    const form = event.target;

    // Entrada enviada ao backend em camelCase, seguindo o contrato do
    // authController/authService.
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const termsAccepted = document.getElementById("terms").checked;

    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    // Limpa validacoes customizadas antes de recalcular as regras do formulario.
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

    // Payload da API: somente os campos necessarios para criar usuario.
    const payload = {
        fullName,
        email,
        phone,
        password
    };

    try {
        // Chamada para API: cria a conta no backend Node.
        const response = await apiFetch("/auth/register", {
            method: "POST",
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
        // Tratamento de erro: exibe a mensagem devolvida pela API ou gerada
        // pelas validacoes locais.
        alert(error.message);
    }
}
