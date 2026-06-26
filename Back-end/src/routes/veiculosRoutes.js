const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { handleVehicleImageUpload } = require('../middlewares/uploadMiddleware');
const veiculosController = require('../controllers/veiculosController');

const routes = express.Router();

// Todas as rotas de veiculos exigem JWT. Criacao/edicao passam antes pelo
// middleware de upload para aceitar imagem opcional do veiculo.
routes.post('/', authMiddleware, handleVehicleImageUpload, veiculosController.criarVeiculo);
routes.get('/', authMiddleware, veiculosController.listarVeiculos);
routes.put('/:vehicleId', authMiddleware, handleVehicleImageUpload, veiculosController.atualizarVeiculo);
routes.delete('/:vehicleId', authMiddleware, veiculosController.removerVeiculo);

module.exports = routes;
