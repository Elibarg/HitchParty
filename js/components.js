async function loadComponent(id, file) {
    const container = document.getElementById(id);
    if (!container) return;

    try {
        const response = await fetch(file, { cache: "no-store" });

        if (!response.ok) {
            console.warn(`Componente não encontrado: ${file}`);
            return;
        }

        const html = await response.text();
        container.innerHTML = html;
    } catch (error) {
        console.error(`Erro ao carregar ${file}:`, error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header", "components/header.html");
    loadComponent("navbar", "components/navbar.html");
});