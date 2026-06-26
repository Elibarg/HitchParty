const express = require('express');
const authController = require('../controllers/authController');

const rotas = express.Router();

// Rotas publicas de autenticacao. Cadastro cria o usuario; login devolve o
// usuario sem password_hash e o token JWT usado pelas telas protegidas.
rotas.post('/register', authController.registrar);
rotas.post('/login', authController.entrar);

module.exports = rotas;
