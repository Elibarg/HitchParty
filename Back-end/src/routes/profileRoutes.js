const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const profileController = require('../controllers/profileController');

const routes = express.Router();

// Perfil e protegido por JWT porque usa req.user.id para ler/atualizar apenas
// os dados do usuario logado.
routes.get('/', authMiddleware, profileController.obterPerfil);
routes.put('/', authMiddleware, profileController.atualizarPerfil);

module.exports = routes;
