const veiculoService = require('../services/veiculoService');

// HP-VEH-001 | Controller de veiculos: traduz HTTP/multipart para o service e
// devolve JSON padronizado para a tela de garagem.
async function criarVeiculo(req, res) {
    try {
        const vehicle = await veiculoService.criarVeiculo(
            req.user.id,
            montarPayloadVeiculo(req)
        );

        return res.status(201).json({
            success: true,
            data: { vehicle }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function listarVeiculos(req, res) {
    try {
        const vehicles = await veiculoService.listarVeiculos(req.user.id);

        return res.status(200).json({
            success: true,
            data: { vehicles }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar veículos.'
        });
    }
}

async function atualizarVeiculo(req, res) {
    try {
        const vehicle = await veiculoService.atualizarVeiculo(
            req.user.id,
            req.params.vehicleId,
            montarPayloadVeiculo(req)
        );

        return res.status(200).json({
            success: true,
            data: { vehicle }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function removerVeiculo(req, res) {
    try {
        await veiculoService.removerVeiculo(req.user.id, req.params.vehicleId);

        return res.status(200).json({
            success: true,
            message: 'Veículo removido com sucesso.'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

function montarPayloadVeiculo(req) {
    // Upload opcional: quando multer recebe arquivo, gravamos a URL relativa que
    // o frontend resolve contra o host do backend.
    return {
        ...req.body,
        imageUrl: req.file ? `/uploads/vehicles/${req.file.filename}` : req.body.imageUrl,
        removeImage: req.body.removeImage === 'true' || req.body.removeImage === true
    };
}

module.exports = {
    criarVeiculo,
    listarVeiculos,
    atualizarVeiculo,
    removerVeiculo
};
