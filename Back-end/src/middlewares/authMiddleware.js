const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado no ambiente.');
}

// HP-SEC-001 | Valida JWT e injeta req.user. Services e repositories usam
// esse id confiavel em vez de aceitar driver_id/user_id enviado pelo frontend.
function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization || '';
    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
        return res.status(401).json({
            success: false,
            message: 'Token de autenticação não informado.'
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        req.user = {
            id: payload.id,
            email: payload.email
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado.'
        });
    }
}

module.exports = authMiddleware;
