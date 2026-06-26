// Validacao de viagem: tela reservada para fluxo futuro de confirmacao.

document.addEventListener("DOMContentLoaded", initializeValidation);

async function initializeValidation() {
    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    await loadComponents();
    showEmptyState();
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

function showEmptyState() {
    const details = document.querySelector(".trip-details");
    const success = document.querySelector(".validation-success");
    const status = document.querySelector(".validation-status");

    if (success) {
        success.querySelector("h1").textContent = "Nenhuma validação encontrada";
        success.querySelector("p").textContent = "A validação de QR ainda não possui dados reais cadastrados.";
    }

    if (details) {
        details.innerHTML = `
            <div class="alert alert-warning text-center">
                Nenhuma validação encontrada.
            </div>
        `;
    }

    if (status) {
        status.innerHTML = `
            Status:
            <strong>Não validado</strong>
        `;
    }
}
