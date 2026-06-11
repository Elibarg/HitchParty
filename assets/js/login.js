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

    const form =
        event.target;

    if (!form.checkValidity()) {

        form.classList.add(
            "was-validated"
        );

        return;

    }

    const email =
        document.getElementById(
            "email"
        ).value;

    const password =
        document.getElementById(
            "password"
        ).value;

    const rememberMe =
        document.getElementById(
            "rememberMe"
        ).checked;

    try {

        /*
        BACKEND FUTURO

        const response =
            await fetch(
                `${APP_CONFIG.API_URL}/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

        if (!response.ok) {
            throw new Error(
                "Credenciais inválidas"
            );
        }

        const data =
            await response.json();

        saveToken(data.token);

        */

        console.log({
            email,
            password,
            rememberMe
        });

        saveToken(
            "jwt-token-exemplo"
        );

        window.location.href =
            "dashboard.html";

    }
    catch(error) {

        console.error(error);

        alert(
            "Erro ao realizar login."
        );

    }

}