/**
 * ============================================================================
 * ROTAS DE CARONAS
 * ============================================================================
 * Mapeamento das URLs (endereços) relacionadas às viagens.
 */

const express = require('express');
const rotas = express.Router();

// Importação do controlador que contém a inteligência das caronas
const caronasController = require('../controllers/caronasController');

/*
 * ROTA: Listar todas as caronas
 * MÉTODO: GET (Utilizado para buscar/ler informações, não para criar)
 * ENDPOINT ACESSADO: /api/rides/search
 * * Quando o Front-end fizer um GET para "/search", o Express direcionará 
 * o pedido automaticamente para a função "buscarCaronas" no controlador.
 */

console.log('Controller:', caronasController);
console.log('Função:', caronasController.buscarCaronas);

rotas.get('/search', caronasController.buscarCaronas);
rotas.post('/', caronasController.criarCarona);
// Exporta este grupo de rotas para ser ligado no ficheiro principal (index.js)
module.exports = rotas;