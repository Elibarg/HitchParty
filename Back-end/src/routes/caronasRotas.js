const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const caronasController = require('../controllers/caronasController');
const chatController = require('../controllers/chatController');
const qrController = require('../controllers/qrController');

const routes = express.Router();

// HP-RIDE-004 | Rotas de carona. Busca publica lista viagens disponiveis;
// criacao, detalhes, solicitacoes, chat e QR exigem JWT por dependerem do usuario.
routes.get('/', caronasController.buscarCaronas);
routes.get('/search', caronasController.buscarCaronas);
routes.get('/upcoming', authMiddleware, caronasController.listarProximas);
routes.get('/history', authMiddleware, caronasController.listarHistorico);
routes.get('/:rideId/messages', authMiddleware, chatController.listarMensagens);
routes.post('/:rideId/messages', authMiddleware, chatController.enviarMensagem);
routes.get('/:rideId/qr', authMiddleware, qrController.buscarQr);
routes.get('/:rideId/my-request', authMiddleware, caronasController.buscarMinhaSolicitacao);
routes.get('/:rideId/passengers', authMiddleware, caronasController.listarPassageirosConfirmados);
routes.get('/:rideId', authMiddleware, caronasController.buscarCaronaPorId);
routes.post('/', authMiddleware, caronasController.criarCarona);
routes.put('/:rideId', authMiddleware, caronasController.editarCarona);
routes.patch('/:rideId/cancel', authMiddleware, caronasController.cancelarCarona);
routes.post('/:rideId/confirm-change', authMiddleware, caronasController.confirmarAlteracao);
routes.post('/:rideId/reject-change', authMiddleware, caronasController.rejeitarAlteracao);
routes.post('/:rideId/requests', authMiddleware, caronasController.solicitarCarona);
routes.get('/:rideId/requests', authMiddleware, caronasController.listarSolicitacoesDaCarona);

module.exports = routes;
