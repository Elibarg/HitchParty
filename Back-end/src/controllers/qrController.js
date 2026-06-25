const qrService = require('../services/qrService');

// QR fica isolado para versao futura. Hoje o endpoint monta um payload simples
// com base em carona aceita, sem gravar tabela propria no banco.
async function buscarQr(req, res) {
    try {
        const qr = await qrService.gerarQr(req.params.rideId, req.user.id);

        return res.status(200).json({
            success: true,
            data: qr
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    buscarQr
};
