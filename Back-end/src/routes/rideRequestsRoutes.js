const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const rideRequestsController = require('../controllers/rideRequestsController');

const routes = express.Router();

// Centraliza a visao "minhas solicitacoes" e as acoes do motorista para
// aceitar/rejeitar pedidos recebidos.
routes.get('/', authMiddleware, rideRequestsController.listarMinhasSolicitacoes);
routes.patch('/:requestId/accept', authMiddleware, rideRequestsController.aceitar);
routes.patch('/:requestId/reject', authMiddleware, rideRequestsController.rejeitar);

module.exports = routes;
