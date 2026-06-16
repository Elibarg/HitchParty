const APP_CONFIG = {

    API_URL: "http://localhost:8080/api",

    TOKEN_KEY: "hitchparty_token",

    USER_KEY: "hitchparty_user"

};

function getToken() {

    return localStorage.getItem(
        APP_CONFIG.TOKEN_KEY
    );

}

function saveToken(token) {

    localStorage.setItem(
        APP_CONFIG.TOKEN_KEY,
        token
    );

}

function removeToken() {

    localStorage.removeItem(
        APP_CONFIG.TOKEN_KEY
    );

}

function isAuthenticated() {

    return !!getToken();

}
<<<<<<< HEAD


function bindLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (!logoutButton) return;

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

=======
function bindLogout() {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", (event) => {
        event.preventDefault();

        removeToken();
        localStorage.removeItem(APP_CONFIG.USER_KEY);

        window.location.href = "login.html";
    });
>>>>>>> 81b28584d430c66066f7e1d4a1cc007b9e66b9c1
}