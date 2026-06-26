const authService = require('../services/authService');

// HP-USER-001 | Controller de perfil: usa o id vindo do JWT e delega ao service.
// Assim o frontend nunca escolhe qual usuario sera lido ou atualizado.
async function obterPerfil(req, res) {
    try {
        const user = await authService.buscarPerfil(req.user.id);

        return res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

async function atualizarPerfil(req, res) {
    try {
        const user = await authService.atualizarPerfil(req.user.id, req.body);

        return res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    obterPerfil,
    atualizarPerfil
};
