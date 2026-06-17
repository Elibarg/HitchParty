const pool = require('../config/database');

async function listScheduled(filters = {}) {
    const params = [];
    const where = ["r.status = 'SCHEDULED'"];

    if (filters.origin) {
        where.push('r.origin LIKE ?');
        params.push(`%${filters.origin}%`);
    }

    if (filters.destination) {
        where.push('r.destination LIKE ?');
        params.push(`%${filters.destination}%`);
    }

    if (filters.date) {
        where.push('DATE(r.departure_time) = ?');
        params.push(filters.date);
    }

    const [rows] = await pool.query(
        `
        SELECT
            r.*,
            u.full_name AS driver_name,
            u.rating_average AS driver_rating,
            v.brand AS vehicle_brand,
            v.model AS vehicle_model,
            v.color AS vehicle_color,
            v.license_plate AS vehicle_license_plate
        FROM rides r
        INNER JOIN users u ON u.id = r.driver_id
        INNER JOIN vehicles v ON v.id = r.vehicle_id
        WHERE ${where.join(' AND ')}
        ORDER BY r.departure_time ASC
        `,
        params
    );

    return rows;
}

async function listUpcomingByUserId(userId) {
    const [rows] = await pool.query(
        `
        SELECT *
        FROM rides
        WHERE driver_id = ?
            AND status = 'SCHEDULED'
            AND departure_time >= NOW()
        ORDER BY departure_time ASC
        LIMIT 5
        `,
        [userId]
    );

    return rows;
}

async function create(userId, ride) {
    const [result] = await pool.query(
        `
        INSERT INTO rides
            (
                driver_id,
                vehicle_id,
                origin,
                destination,
                departure_time,
                total_seats,
                available_seats,
                suggested_price,
                description
            )
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            userId,
            ride.vehicleId,
            ride.origin,
            ride.destination,
            ride.departureTime,
            ride.totalSeats,
            ride.totalSeats,
            ride.suggestedPrice || null,
            ride.description || null
        ]
    );

    return result.insertId;
}

module.exports = {
    listScheduled,
    listUpcomingByUserId,
    create
};
