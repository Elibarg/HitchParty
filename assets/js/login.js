document.addEventListener(
    "DOMContentLoaded",
    initializeLogin
);

function initializeLogin() {

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
    event.preventDefault();

    const form = event.target;

    // Se o formulário não for válido (ex: e-mail fora do formato), para aqui
    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    try {
        // CÓDIGO REAL: O front-end envia o pedido para a porta 8080 do Back-end
        const response = await fetch(`${APP_CONFIG.API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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

        console.log('Resposta do login:', data);
        // Salva o token real no navegador e entra no Dashboard
        saveToken(data.token);

        // salva os dados do usuário
        localStorage.setItem(
            APP_CONFIG.USER_KEY,
            JSON.stringify(data.user)
        );

        console.log("Opção Lembrar-me:", rememberMe);

        window.location.href = "dashboard.html";




    } catch (error) {
        console.error("Erro no login:", error);
        // Trava na tela e exibe o alerta de senha errada
        alert(error.message);
    }
}