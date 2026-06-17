const pool = require('../config/database');

async function listByUserId(userId) {
    const [rows] = await pool.query(
        `
        SELECT *
        FROM vehicles
        WHERE user_id = ?
            AND is_active = TRUE
        ORDER BY created_at ASC, id ASC
        `,
        [userId]
    );

    return rows;
}

async function findByIdForUser(id, userId) {
    const [rows] = await pool.query(
        `
        SELECT *
        FROM vehicles
        WHERE id = ?
            AND user_id = ?
            AND is_active = TRUE
        `,
        [id, userId]
    );

    return rows[0];
}

async function create(userId, vehicle) {
    const [result] = await pool.query(
        `
        INSERT INTO vehicles
            (user_id, brand, model, license_plate, color, year)
        VALUES
            (?, ?, ?, ?, ?, ?)
        `,
        [
            userId,
            vehicle.brand,
            vehicle.model,
            vehicle.licensePlate,
            vehicle.color || null,
            vehicle.year || null
        ]
    );

    return findByIdForUser(result.insertId, userId);
}

async function updateByIdForUser(id, userId, vehicle) {
    await pool.query(
        `
        UPDATE vehicles
        SET brand = ?,
            model = ?,
            license_plate = ?,
            color = ?,
            year = ?
        WHERE id = ?
            AND user_id = ?
            AND is_active = TRUE
        `,
        [
            vehicle.brand,
            vehicle.model,
            vehicle.licensePlate,
            vehicle.color || null,
            vehicle.year || null,
            id,
            userId
        ]
    );

    return findByIdForUser(id, userId);
}

async function deleteByIdForUser(id, userId) {
    const [result] = await pool.query(
        `
        UPDATE vehicles
        SET is_active = FALSE
        WHERE id = ?
            AND user_id = ?
            AND is_active = TRUE
        `,
        [id, userId]
    );

    return result.affectedRows > 0;
}

module.exports = {
    listByUserId,
    findByIdForUser,
    create,
    updateByIdForUser,
    deleteByIdForUser
};
