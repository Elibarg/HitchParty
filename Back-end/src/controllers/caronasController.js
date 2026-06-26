const caronaService = require('../services/caronaService');
const rideRequestService = require('../services/rideRequestService');

// HP-BACK-005 | Controller de caronas: traduz params/query/body HTTP para
// services. Ele nao decide regra de negocio; apenas padroniza status e JSON.

async function buscarCaronas(req, res) {
    try {
        const rides = await caronaService.buscarCaronas({
            origin: req.query.origin,
            destination: req.query.destination,
            originLat: req.query.originLat,
            originLng: req.query.originLng,
            destinationLat: req.query.destinationLat,
            destinationLng: req.query.destinationLng
        });

        return res.status(200).json({
            success: true,
            data: { rides }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar caronas.'
        });
    }
}

async function buscarCaronaPorId(req, res) {
    try {
        const ride = await caronaService.buscarPorId(
            req.params.rideId,
            req.user?.id
        );

        return res.status(200).json({
            success: true,
            data: { ride }
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

async function listarProximas(req, res) {
    try {
        const rides = await caronaService.listarProximasPorUsuario(req.user.id);

        return res.status(200).json({
            success: true,
            data: { rides }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar próximas caronas.'
        });
    }
}

async function listarHistorico(req, res) {
    try {
        const rides = await caronaService.listarHistoricoPorUsuario(req.user.id);

        return res.status(200).json({
            success: true,
            data: { rides }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar histórico de caronas.'
        });
    }
}

async function listarPassageirosConfirmados(req, res) {
    try {
        const passengers = await rideRequestService.listarPassageirosConfirmados(
            req.params.rideId
        );

        return res.status(200).json({
            success: true,
            data: { passengers },
            passengers
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

async function criarCarona(req, res) {
    try {
        // HP-AUTH-008 | O motorista vem do JWT; o front nao controla driver_id.
        const ride = await caronaService.criarCarona(req.user.id, req.body);

        return res.status(201).json({
            success: true,
            message: 'Carona criada com sucesso.',
            data: { ride }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function editarCarona(req, res) {
    try {
        const ride = await caronaService.editarCarona(
            req.params.rideId,
            req.user.id,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: 'Carona atualizada com sucesso.',
            data: { ride }
        });
    } catch (error) {
        const statusCode = /permissao/i.test(error.message) ? 403 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
}

async function cancelarCarona(req, res) {
    try {
        const ride = await caronaService.cancelarCarona(
            req.params.rideId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: 'Carona cancelada com sucesso.',
            data: { ride }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function confirmarAlteracao(req, res) {
    try {
        const ride = await caronaService.aceitarAlteracao(
            req.params.rideId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: 'Alteracao aceita. Voce continua na carona.',
            data: { ride }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function rejeitarAlteracao(req, res) {
    try {
        const ride = await caronaService.rejeitarAlteracao(
            req.params.rideId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: 'Alteracao recusada. Voce saiu da carona.',
            data: { ride }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function solicitarCarona(req, res) {
    try {
        const request = await rideRequestService.solicitarCarona(
            req.params.rideId,
            req.user.id,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: 'Solicitação enviada com sucesso.',
            data: { request }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function buscarMinhaSolicitacao(req, res) {
    try {
        const request = await rideRequestService.buscarMinhaSolicitacao(
            req.params.rideId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: { request }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function listarSolicitacoesDaCarona(req, res) {
    try {
        const requests = await rideRequestService.listarPorCarona(
            req.params.rideId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: { requests }
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    buscarCaronas,
    listarProximas,
    listarHistorico,
    buscarCaronaPorId,
    listarPassageirosConfirmados,
    criarCarona,
    editarCarona,
    cancelarCarona,
    confirmarAlteracao,
    rejeitarAlteracao,
    solicitarCarona,
    buscarMinhaSolicitacao,
    listarSolicitacoesDaCarona
};
