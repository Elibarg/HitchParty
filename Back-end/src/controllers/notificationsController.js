const notificationService = require('../services/notificationService');

async function listar(req, res) {
    try {
        const notifications =
            await notificationService.listarPorUsuario(req.user.id);

        return res.status(200).json({
            success: true,
            data: { notifications }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar notificacoes.'
        });
    }
}

async function marcarComoLida(req, res) {
    try {
        const notification =
            await notificationService.marcarComoLida(
                req.params.notificationId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    listar,
    marcarComoLida
};
