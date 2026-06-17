const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: '24h'
        }
    );
}

async function register(req, res) {
    try {
        const user = await authService.registerUser(req.body);
        const token = createToken(user);

        return res.status(201).json({
            message: 'Usuário criado com sucesso.',
            user,
            token
        });
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
}

async function login(req, res) {
    try {
        const user = await authService.loginUser(req.body);
        const token = createToken(user);

        return res.status(200).json({
            message: 'Login realizado com sucesso.',
            user,
            token
        });
    } catch (error) {
        return res.status(401).json({
            error: error.message
        });
    }
}

module.exports = {
    register,
    login
};
