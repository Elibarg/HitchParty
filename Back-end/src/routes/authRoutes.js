// Importamos o Express para nos ajudar a criar o mapa de URLs (endereços).
const express = require('express');
const rotas = express.Router();

// Importamos as funções que acabámos de criar no ficheiro do controlador.
const authController = require('../controllers/authController');

// Rota de Registo
// Quando o front-end pedir a morada "/register" usando o método POST, o servidor vai executar a função "registrar".
// (Usamos POST porque ele esconde os dados de forma segura, ao contrário do GET, que mostra tudo na barra de endereços do browser).
rotas.post('/register', authController.registrar);

// Rota de Login
// Quando o front-end pedir a morada "/login" usando o método POST, executamos a função "entrar".
rotas.post('/login', authController.entrar);

// Exportamos este "mapa" para o podermos ligar ao ficheiro principal (index.js).
module.exports = rotas;