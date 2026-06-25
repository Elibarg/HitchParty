// Pagina inicial: redireciona conforme estado de autenticacao local.

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
    try {
        window.location.href = isAuthenticated()
            ? "pages/dashboard.html"
            : "pages/login.html";
    } catch (error) {
        console.error("Erro ao iniciar aplicação:", error);
        window.location.href = "pages/login.html";
    }
}
