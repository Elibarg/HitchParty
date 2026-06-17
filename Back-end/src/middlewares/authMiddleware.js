const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hitchparty_secret';

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({
            error: 'Token não informado.'
        });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        return next();
    } catch (error) {
        return res.status(401).json({
            error: 'Token inválido.'
        });
    }
}

module.exports = {
    authenticate,
    JWT_SECRET
};
