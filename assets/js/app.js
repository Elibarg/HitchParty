// HP-FRONT-001 | Configuracao compartilhada do frontend. Todas as telas devem
// usar APP_CONFIG/apiFetch para falar com a API e enviar JWT de forma uniforme.
const APP_CONFIG = {

    // Responsabilidade: concentrar configuracoes compartilhadas entre telas.
    // API_URL aponta para o backend Node; pode ser sobrescrita por:
    // window.HITCHPARTY_API_URL ou localStorage.hitchparty_api_url.
    API_URL: resolveApiUrl(),

    TOKEN_KEY: "hitchparty_token",

    USER_KEY: "hitchparty_user"

};

function resolveApiUrl() {
    const configuredUrl =
        window.HITCHPARTY_API_URL
        || localStorage.getItem("hitchparty_api_url");

    if (configuredUrl) {
        return configuredUrl.replace(/\/$/, "");
    }

    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        return `${window.location.protocol}//${window.location.hostname}:8080/api`;
    }

    return "http://localhost:8080/api";
}

function getToken() {

    // Le o JWT salvo apos o login. Saida: string do token ou null.
    return localStorage.getItem(
        APP_CONFIG.TOKEN_KEY
    );

}

function saveToken(token) {

    // Persiste o JWT para que outras paginas possam validar autenticacao.
    localStorage.setItem(
        APP_CONFIG.TOKEN_KEY,
        token
    );

}

function removeToken() {

    // Remove apenas o token; dados do usuario sao removidos no fluxo de logout.
    localStorage.removeItem(
        APP_CONFIG.TOKEN_KEY
    );

}

function isAuthenticated() {

    // Entrada: nenhuma. Saida booleana usada por paginas protegidas.
    return !!getToken();

}

function normalizeUser(rawUser = {}) {
    // Aceita respostas antigas e novas, mas padroniza o front em camelCase.
    return {
        ...rawUser,
        fullName:
            rawUser.fullName
            || rawUser.full_name
            || rawUser.name
            || rawUser.nome
            || "",
        phone:
            rawUser.phone
            || rawUser.telefone
            || "",
        photoUrl:
            rawUser.photoUrl
            || rawUser.photo_url
            || ""
    };
}

function saveUser(user) {
    localStorage.setItem(
        APP_CONFIG.USER_KEY,
        JSON.stringify(normalizeUser(user))
    );
}

function getStoredUser() {
    try {
        return normalizeUser(
            JSON.parse(
                localStorage.getItem(APP_CONFIG.USER_KEY) || "{}"
            )
        );
    } catch (error) {
        return {};
    }
}

function getFirstName(user = getStoredUser()) {
    const displayName =
        user.fullName
        || user.email
        || "Usuário";

    return displayName.trim().split(" ")[0] || "Usuário";
}

async function apiFetch(path, options = {}) {
    // HP-AUTH-009 | Ponto unico de fetch autenticado. Se existir token salvo,
    // adiciona Authorization: Bearer <JWT> antes de chamar o backend.
    const headers = {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {})
    };

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        return await fetch(`${APP_CONFIG.API_URL}${path}`, {
            ...options,
            headers
        });
    } catch (error) {
        throw new Error(
            `Nao foi possivel conectar a API em ${APP_CONFIG.API_URL}. ` +
            "Verifique se o backend esta rodando e se o teste foi aberto pelo mesmo host."
        );
    }
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = "dashboard.html";
}


function bindLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (!logoutButton) return;

    // Fluxo de logout: cancela o clique padrao, limpa sessao local e envia o
    // usuario de volta para a tela de login.
    logoutButton.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            removeToken();

            localStorage.removeItem(
                APP_CONFIG.USER_KEY
            );

            window.location.href =
                "login.html";
        }
    );
}

document.addEventListener("DOMContentLoaded", initializeGlobalNotifications);

async function initializeGlobalNotifications() {
    // Busca notificacoes ao abrir paginas protegidas do app.
    if (!isAuthenticated()) return;

    // A dashboard possui lista propria de avisos e popup com recarregamento
    // completo dos seus dados; nas demais paginas usamos apenas o alerta global.
    if (document.getElementById("notificationsList")) return;

    try {
        const response = await apiFetch("/notifications");

        if (!response.ok) return;

        const data = await response.json();
        const notification = (data?.data?.notifications || []).find(item =>
            item.type === "ride_updated"
            && item.actionRequired
            && item.status !== "resolved"
        );

        if (notification) {
            showGlobalRideChangePopup(notification);
        }
    } catch (error) {
        console.error("Erro ao carregar notificacoes:", error);
    }
}

function showGlobalRideChangePopup(notification) {
    if (!window.bootstrap) return;

    let modalElement = document.getElementById("globalNotificationModal");

    if (!modalElement) {
        modalElement = document.createElement("div");
        modalElement.id = "globalNotificationModal";
        modalElement.className = "modal fade";
        modalElement.tabIndex = -1;
        modalElement.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-message"></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-danger" id="globalRejectRideChange">Rejeitar alteracao</button>
                        <button type="button" class="btn btn-success" id="globalAcceptRideChange">Aceitar alteracao</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalElement);
    }

    modalElement.querySelector(".modal-title").textContent = notification.title;
    modalElement.querySelector(".modal-message").textContent = notification.message;
    modalElement.querySelector("#globalAcceptRideChange").onclick =
        () => respondGlobalRideChange(notification, "accept");
    modalElement.querySelector("#globalRejectRideChange").onclick =
        () => respondGlobalRideChange(notification, "reject");

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

async function respondGlobalRideChange(notification, action) {
    const endpoint = action === "accept"
        ? `/rides/${notification.rideId}/confirm-change`
        : `/rides/${notification.rideId}/reject-change`;

    const response = await apiFetch(endpoint, { method: "POST" });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Erro ao responder alteracao.");
        return;
    }

    const modalElement = document.getElementById("globalNotificationModal");
    if (modalElement) {
        bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    }

    window.location.reload();
}
