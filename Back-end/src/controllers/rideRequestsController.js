const rideRequestService = require('../services/rideRequestService');

async function listarMinhasSolicitacoes(req, res) {
    try {
        const requests = await rideRequestService.listarMinhasSolicitacoes(req.user.id);

        return res.status(200).json({
            success: true,
            data: { requests }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar solicitações.'
        });
    }
}

async function aceitar(req, res) {
    try {
        const request = await rideRequestService.aceitarRequest(
            req.params.requestId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: 'Solicitação aceita com sucesso.',
            data: {
                requestId: request.id,
                status: request.status,
                request
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function rejeitar(req, res) {
    try {
        const request = await rideRequestService.rejeitarRequest(
            req.params.requestId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: 'Solicitação rejeitada.',
            data: {
                requestId: request.id,
                status: request.status,
                request
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    listarMinhasSolicitacoes,
    aceitar,
    rejeitar
};
