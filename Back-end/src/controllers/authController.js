const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado no ambiente.');
}

// HP-AUTH-002 | Controller de autenticacao: recebe HTTP, delega regras ao
// authService e devolve JSON consistente para cadastro e login.
async function registrar(req, res) {
    try {
        const {
            fullName,
            email,
            phone,
            password
        } = req.body;

        const resultado = await authService.registrarUsuario(
            fullName,
            email,
            phone,
            password
        );

        return res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso.',
            data: {
                userId: resultado.insertId
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function entrar(req, res) {
    try {
        const {
            email,
            password
        } = req.body;

        const usuario = await authService.loginUsuario(email, password);
        const user = authService.removerDadosSensiveis(usuario);

        // HP-AUTH-003 | Gera JWT com payload minimo. Nunca colocamos senha,
        // telefone ou dados sensiveis no token.
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            JWT_SECRET,
            {
                expiresIn: '24h'
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Login realizado com sucesso.',
            data: {
                user,
                token
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
    registrar,
    entrar
};
