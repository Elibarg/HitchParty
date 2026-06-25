const chatService = require('../services/chatService');

// Controller do chat real. A autorizacao de participante fica no service; aqui
// apenas lemos rideId/JWT e devolvemos mensagens ou erro HTTP.
async function listarMensagens(req, res) {
    try {
        const data = await chatService.listarMensagens(
            req.params.rideId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }
}

async function enviarMensagem(req, res) {
    try {
        const message = await chatService.enviarMensagem(
            req.params.rideId,
            req.user.id,
            req.body.message
        );

        return res.status(201).json({
            success: true,
            message: 'Mensagem enviada com sucesso.',
            data: { message }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    listarMensagens,
    enviarMensagem
};
