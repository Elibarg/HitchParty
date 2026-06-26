document.addEventListener(
    "DOMContentLoaded",
    initializeLogin
);

// HP-FRONT-002 | Login: envia credenciais para a API, recebe JWT e salva apenas
// token + dados nao sensiveis para as telas protegidas.
function initializeLogin() {
    // Controla login, credenciais e sessao local segura.

    setupPasswordToggle();

    setupLoginForm();

}

function setupPasswordToggle() {

    const toggleButton =
        document.getElementById(
            "togglePassword"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    // Alterna apenas a visualizacao da senha, sem alterar o valor digitado.
    toggleButton.addEventListener(
        "click",
        () => {

            passwordInput.type =
                passwordInput.type === "password"
                    ? "text"
                    : "password";

        }
    );

}

function setupLoginForm() {

    const form =
        document.getElementById(
            "loginForm"
        );

    form.addEventListener(
        "submit",
        handleLogin
    );

}

async function handleLogin(event) {
    // Envia credenciais para a API e processa JWT recebido.
    event.preventDefault();

    const form = event.target;

    // Se o formulário não for válido (ex: e-mail fora do formato), para aqui
    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    // Entrada da API: e-mail e senha informados no formulario.
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        // Chamada para API: envia credenciais para o backend autenticar.
        const response = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        });

        // Se o back-end responder com erro (ex: status 401 - senha incorreta)
        if (!response.ok) {
            const errorData = await response.json();
            // Lança o erro usando a mensagem enviada pelo back-end
            throw new Error(errorData.message || "Credenciais inválidas");
        }

        // Se a senha estiver correta, recebe os dados
        const data = await response.json();

        const loginData = data.data || {};
        const user = loginData.user;
        const token = loginData.token;

        if (!user || !token) {
            throw new Error("Resposta de login inválida.");
        }

        // Salva o token real no navegador e entra no Dashboard
        // HP-AUTH-010 | Salva JWT para apiFetch autorizar paginas protegidas.
        saveToken(token);

        // salva os dados do usuário
        // Dados nao sensiveis do usuario ficam no localStorage para exibicao
        // em dashboard/perfil sem nova chamada imediata para a API.
        // Guarda apenas dados nao sensiveis para exibicao imediata.
        saveUser(user);

        window.location.href = "dashboard.html";




    } catch (error) {
        console.error("Erro no login:", error);
        // Tratamento de erro: mantem o usuario na tela e mostra a mensagem da
        // API ou a validacao feita acima.
        // Trava na tela e exibe o alerta de senha errada
        alert(error.message);
    }
}
