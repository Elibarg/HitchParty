const pool = require('../config/database');

// HP-PASS-001 | Repository de participantes: identifica motorista e passageiros
// aceitos para liberar chat, QR e lista de passageiros confirmados.

function isAcceptedStatus(status) {
    return ['ACCEPTED', 'CHANGE_ACCEPTED']
        .includes(String(status || '').toUpperCase());
}

function mapParticipantContext(row, userId) {
    if (!row) return null;

    const isDriver = Number(row.driver_id) === Number(userId);

    return {
        rideId: row.ride_id,
        driverId: row.driver_id,
        driverName: row.driver_name,
        requesterId: row.requester_id,
        requesterName: row.requester_name,
        origin: row.origin,
        destination: row.destination,
        departureTime: row.departure_time,
        status: row.ride_status,
        requestStatus: row.request_status,
        role: isDriver ? 'driver' : 'passenger',
        isDriver,
        hasAcceptedRequest: Boolean(row.requester_id) && isAcceptedStatus(row.request_status)
    };
}

async function buscarContextoParticipante(rideId, userId) {
    const [rows] = await pool.query(
        `
        SELECT
            r.id AS ride_id,
            r.driver_id,
            r.origin,
            r.destination,
            r.departure_time,
            r.status AS ride_status,
            driver.full_name AS driver_name,
            rr.requester_id,
            rr.status AS request_status,
            requester.full_name AS requester_name
        FROM rides r
        INNER JOIN users driver
            ON driver.id = r.driver_id
        LEFT JOIN ride_requests rr
            ON rr.ride_id = r.id
            AND UPPER(rr.status) IN ('ACCEPTED', 'CHANGE_ACCEPTED')
            AND (
                r.driver_id = ?
                OR rr.requester_id = ?
            )
        LEFT JOIN users requester
            ON requester.id = rr.requester_id
        WHERE r.id = ?
            AND (
                r.driver_id = ?
                OR rr.requester_id = ?
            )
        ORDER BY rr.created_at ASC
        LIMIT 1
        `,
        [userId, userId, rideId, userId, userId]
    );

    return mapParticipantContext(rows[0], userId);
}

async function listarPassageirosAceitos(rideId) {
    const [rows] = await pool.query(
        `
        SELECT
            rr.requester_id,
            requester.full_name AS requester_name
        FROM ride_requests rr
        INNER JOIN users requester
            ON requester.id = rr.requester_id
        WHERE rr.ride_id = ?
            AND UPPER(rr.status) IN ('ACCEPTED', 'CHANGE_ACCEPTED')
        ORDER BY rr.created_at ASC
        `,
        [rideId]
    );

    return rows.map(row => ({
        requesterId: row.requester_id,
        requesterName: row.requester_name
    }));
}

module.exports = {
    buscarContextoParticipante,
    listarPassageirosAceitos
};
