const userService = require('../services/userService');

async function getCurrentUser(req, res) {
    try {
        const user = await userService.getCurrentUser(req.user.id);

        return res.status(200).json({
            user
        });
    } catch (error) {
        return res.status(404).json({
            error: error.message
        });
    }
}

async function updateCurrentUser(req, res) {
    try {
        const user = await userService.updateCurrentUser(
            req.user.id,
            req.body
        );

        return res.status(200).json({
            message: 'Perfil atualizado com sucesso.',
            user
        });
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
}

module.exports = {
    getCurrentUser,
    updateCurrentUser
};
