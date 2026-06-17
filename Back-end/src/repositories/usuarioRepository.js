const pool = require('../config/database');

async function buscarPorEmail(email) {

    const [usuarios] =
        await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

    return usuarios[0];
}

async function criarUsuario(
    fullName,
    email,
    phone,
    password
) {

    const [resultado] =
        await pool.query(
            `
            INSERT INTO users
            (
                full_name,
                email,
                phone,
                password_hash
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                fullName,
                email,
                phone,
                password
            ]
        );

    return resultado;
}

module.exports = {
    buscarPorEmail, criarUsuario
};

