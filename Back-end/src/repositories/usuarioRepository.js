const pool = require('../config/database');

// Isola SQL de users e mapeia snake_case do banco para camelCase.
function mapUsuarioFromDb(usuario) {

    if (!usuario) return null;

    // Mapeamento snake_case -> camelCase usado pelo restante do Node.js.
    return {
        id: usuario.id,
        fullName: usuario.full_name,
        email: usuario.email,
        phone: usuario.phone,
        passwordHash: usuario.password_hash,
        photoUrl: usuario.photo_url,
        ratingAverage: Number(usuario.rating_average || 0),
        createdAt: usuario.created_at,
        updatedAt: usuario.updated_at
    };

}

async function buscarPorEmail(email) {

    // Entrada: e-mail recebido do service. Saida: usuario unico ou null, ja
    // convertido para camelCase.
    const [usuarios] =
        await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

    return mapUsuarioFromDb(
        usuarios[0]
    );
}

async function buscarPorId(id) {

    // Busca sempre no banco real para evitar perfil baseado em storage antigo.
    const [usuarios] =
        await pool.query(
            'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
            [id]
        );

    return mapUsuarioFromDb(
        usuarios[0]
    );
}

async function criarUsuario(
    fullName,
    email,
    phone,
    password
) {

    // Entrada em camelCase; INSERT grava nas colunas snake_case da tabela.
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

async function atualizarUsuario(id, dados) {

    const campos = [];
    const valores = [];

    if (dados.fullName !== undefined) {
        campos.push('full_name = ?');
        valores.push(dados.fullName);
    }

    if (dados.email !== undefined) {
        campos.push('email = ?');
        valores.push(dados.email);
    }

    if (dados.phone !== undefined) {
        campos.push('phone = ?');
        valores.push(dados.phone);
    }

    if (dados.password !== undefined) {
        campos.push('password_hash = ?');
        valores.push(dados.password);
    }

    if (!campos.length) {
        return buscarPorId(id);
    }

    valores.push(id);

    await pool.query(
        `UPDATE users SET ${campos.join(', ')} WHERE id = ?`,
        valores
    );

    return buscarPorId(id);
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    criarUsuario,
    atualizarUsuario
};
