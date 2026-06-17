const pool = require('../config/database');

async function findById(id) {
    const [rows] = await pool.query(
        'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
        [id]
    );

    return rows[0];
}

async function findByEmail(email) {
    const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
        [email]
    );

    return rows[0];
}

async function create({ fullName, email, phone, passwordHash }) {
    const [result] = await pool.query(
        `
        INSERT INTO users
            (full_name, email, phone, password_hash)
        VALUES
            (?, ?, ?, ?)
        `,
        [fullName, email, phone || null, passwordHash]
    );

    return findById(result.insertId);
}

async function updateById(id, { fullName, email, phone, passwordHash }) {
    const fields = [
        'full_name = ?',
        'email = ?',
        'phone = ?'
    ];

    const values = [
        fullName,
        email,
        phone || null
    ];

    if (passwordHash) {
        fields.push('password_hash = ?');
        values.push(passwordHash);
    }

    values.push(id);

    await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
    );

    return findById(id);
}

async function getSummaryById(id) {
    const [rows] = await pool.query(
        `
        SELECT
            u.*,
            COUNT(DISTINCT r.id) AS rides_count,
            COUNT(DISTINCT v.id) AS vehicles_count
        FROM users u
        LEFT JOIN rides r
            ON r.driver_id = u.id
            AND r.status <> 'CANCELED'
        LEFT JOIN vehicles v
            ON v.user_id = u.id
            AND v.is_active = TRUE
        WHERE u.id = ?
            AND u.is_active = TRUE
        GROUP BY u.id
        `,
        [id]
    );

    return rows[0];
}

async function updateLastLogin(id) {
    await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [id]
    );
}

module.exports = {
    findById,
    findByEmail,
    create,
    updateById,
    getSummaryById,
    updateLastLogin
};
