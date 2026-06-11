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