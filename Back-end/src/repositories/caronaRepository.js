const pool = require('../config/database');

// HP-RIDE-015 | Repository de caronas: todo SQL de rides/ride_stops fica aqui.
// Services chamam funcoes de dominio e nao montam query diretamente.
function mapCaronaFromDb(carona) {
    if (!carona) return null;

    return {
        id: carona.id,
        driverId: carona.driver_id,
        vehicleId: carona.vehicle_id,
        driverFullName: carona.driver_full_name,
        driverRating: Number(carona.driver_rating || 0),
        vehicleName: [carona.brand, carona.model].filter(Boolean).join(' '),
        vehiclePlate: carona.license_plate,
        origin: carona.origin,
        destination: carona.destination,
        originLat: carona.origin_lat,
        originLng: carona.origin_lng,
        destinationLat: carona.destination_lat,
        destinationLng: carona.destination_lng,
        distanceKm: carona.distance_km,
        estimatedDurationMinutes: carona.estimated_duration_minutes,
        departureTime: carona.departure_time,
        totalSeats: carona.total_seats,
        availableSeats: carona.available_seats,
        suggestedPrice: carona.suggested_price,
        description: carona.description,
        status: carona.status,
        role: carona.user_role,
        passengerStatus: carona.passenger_status,
        createdAt: carona.created_at
    };

}

async function criarCarona(carona) {
    const [resultado] = await pool.query(
        `
        INSERT INTO rides
        (
            driver_id,
            vehicle_id,
            origin,
            destination,
            origin_lat,
            origin_lng,
            destination_lat,
            destination_lng,
            departure_time,
            total_seats,
            available_seats,
            suggested_price,
            description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            carona.driverId,
            carona.vehicleId,
            carona.origin,
            carona.destination,
            carona.originLat,
            carona.originLng,
            carona.destinationLat,
            carona.destinationLng,
            carona.departureTime,
            carona.totalSeats,
            carona.totalSeats,
            carona.suggestedPrice,
            carona.description
        ]
    );

    return buscarPorId(resultado.insertId);
}

async function listarTodas(filtros = {}) {

    const condicoes = [];
    const parametros = [];

    // Filtros opcionais usam parametros para nao interpolar texto digitado
    // pelo usuario diretamente no SQL.
    condicoes.push("r.status = 'SCHEDULED'");
    condicoes.push('r.available_seats > 0');

    if (filtros.origin && !filtros.originLat) {
        condicoes.push('r.origin LIKE ?');
        parametros.push(`%${filtros.origin}%`);
    }

    if (filtros.destination && !filtros.destinationLat) {
        condicoes.push('r.destination LIKE ?');
        parametros.push(`%${filtros.destination}%`);
    }

    const where =
        condicoes.length
            ? `WHERE ${condicoes.join(' AND ')}`
            : '';

    const [caronas] =
        await pool.query(
            `
            SELECT
                r.*,
                u.full_name AS driver_full_name,
                u.rating_average AS driver_rating,
                v.brand,
                v.model,
                v.license_plate
            FROM rides r
            LEFT JOIN users u
                ON u.id = r.driver_id
            LEFT JOIN vehicles v
                ON v.id = r.vehicle_id
            ${where}
            ORDER BY r.departure_time ASC
            `,
            parametros
        );

    // Saida: lista normalizada para o service formatar para o frontend.
    return caronas.map(mapCaronaFromDb);
}

async function listarProximasPorUsuario(userId) {
    const [caronas] = await pool.query(
        `
        SELECT DISTINCT
            r.*,
            CASE
                WHEN r.driver_id = ? THEN 'driver'
                ELSE 'passenger'
            END AS user_role,
            u.full_name AS driver_full_name,
            u.rating_average AS driver_rating,
            v.brand,
            v.model,
            v.license_plate,
            rr.status AS passenger_status
        FROM rides r
        LEFT JOIN ride_requests rr
            ON rr.ride_id = r.id
            AND rr.requester_id = ?
            AND UPPER(rr.status) IN (
                'ACCEPTED',
                'CHANGE_ACCEPTED',
                'PENDING_CHANGE_CONFIRMATION'
            )
        LEFT JOIN users u
            ON u.id = r.driver_id
        LEFT JOIN vehicles v
            ON v.id = r.vehicle_id
        WHERE UPPER(r.status) IN ('SCHEDULED', 'PENDING_PASSENGER_CONFIRMATION')
            AND r.departure_time >= NOW()
            AND (
                r.driver_id = ?
                OR rr.id IS NOT NULL
            )
        ORDER BY r.departure_time ASC
        LIMIT 5
        `,
        [userId, userId, userId]
    );

    return caronas.map(mapCaronaFromDb);
}

async function listarHistoricoPorUsuario(userId) {
    const [caronas] = await pool.query(
        `
        SELECT DISTINCT
            r.*,
            u.full_name AS driver_full_name,
            u.rating_average AS driver_rating,
            v.brand,
            v.model,
            v.license_plate
        FROM rides r
        LEFT JOIN ride_requests rr
            ON rr.ride_id = r.id
            AND rr.requester_id = ?
            AND UPPER(rr.status) IN (
                'ACCEPTED',
                'CHANGE_ACCEPTED',
                'PENDING_CHANGE_CONFIRMATION'
            )
        LEFT JOIN users u
            ON u.id = r.driver_id
        LEFT JOIN vehicles v
            ON v.id = r.vehicle_id
        WHERE UPPER(r.status) IN ('FINISHED', 'CANCELED')
            AND (
                r.driver_id = ?
                OR rr.id IS NOT NULL
            )
        ORDER BY r.departure_time DESC
        `,
        [userId, userId]
    );

    return caronas.map(mapCaronaFromDb);
}

async function contarPorMotorista(driverId) {
    const [resultado] = await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM rides
        WHERE driver_id = ?
        `,
        [driverId]
    );

    return Number(resultado[0]?.total || 0);
}

async function buscarPorId(id) {
    const [caronas] = await pool.query(
        `
        SELECT
            r.*,
            u.full_name AS driver_full_name,
            u.rating_average AS driver_rating,
            v.brand,
            v.model,
            v.license_plate
        FROM rides r
        LEFT JOIN users u
            ON u.id = r.driver_id
        LEFT JOIN vehicles v
            ON v.id = r.vehicle_id
        WHERE r.id = ?
        `,
        [id]
    );

    return mapCaronaFromDb(caronas[0]);
}

async function listarParadas(rideId, connection = pool) {
    const [stops] = await connection.query(
        `
        SELECT *
        FROM ride_stops
        WHERE ride_id = ?
        ORDER BY stop_order ASC
        `,
        [rideId]
    );

    return stops.map(stop => ({
        id: stop.id,
        rideId: stop.ride_id,
        rideRequestId: stop.ride_request_id,
        passengerId: stop.passenger_id,
        stopType: stop.stop_type,
        stopOrder: stop.stop_order,
        address: stop.address,
        latitude: stop.latitude,
        longitude: stop.longitude,
        estimatedStopMinutes: stop.estimated_stop_minutes
    }));
}

async function atualizarCarona(rideId, dados, connection = pool) {
    await connection.query(
        `
        UPDATE rides
        SET vehicle_id = ?,
            origin = ?,
            destination = ?,
            origin_lat = ?,
            origin_lng = ?,
            destination_lat = ?,
            destination_lng = ?,
            departure_time = ?,
            total_seats = ?,
            available_seats = ?,
            suggested_price = ?,
            description = ?,
            status = ?
        WHERE id = ?
        `,
        [
            dados.vehicleId,
            dados.origin,
            dados.destination,
            dados.originLat,
            dados.originLng,
            dados.destinationLat,
            dados.destinationLng,
            dados.departureTime,
            dados.totalSeats,
            dados.availableSeats,
            dados.suggestedPrice,
            dados.description,
            dados.status,
            rideId
        ]
    );
}

async function substituirParadas(rideId, stops = [], connection = pool) {
    // Regrava paradas em ordem para manter stop_order consistente.
    await connection.query(
        'DELETE FROM ride_stops WHERE ride_id = ?',
        [rideId]
    );

    for (const [index, stop] of stops.entries()) {
        if (!stop.address) continue;

        await connection.query(
            `
            INSERT INTO ride_stops
            (
                ride_id,
                ride_request_id,
                passenger_id,
                stop_type,
                stop_order,
                address,
                latitude,
                longitude,
                estimated_stop_minutes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                rideId,
                stop.rideRequestId || stop.ride_request_id || null,
                stop.passengerId || stop.passenger_id || null,
                stop.stopType || stop.stop_type || 'pickup',
                Number(stop.stopOrder || stop.stop_order || index + 1),
                stop.address,
                stop.latitude ?? stop.lat,
                stop.longitude ?? stop.lng,
                Number(stop.estimatedStopMinutes || stop.estimated_stop_minutes || 3)
            ]
        );
    }
}

async function atualizarStatus(rideId, status, connection = pool) {
    await connection.query(
        'UPDATE rides SET status = ? WHERE id = ?',
        [status, rideId]
    );
}

async function contarPassageirosConfirmados(rideId, connection = pool) {
    const [resultado] = await connection.query(
        `
        SELECT COUNT(*) AS total
        FROM ride_requests
        WHERE ride_id = ?
            AND status IN ('ACCEPTED', 'CHANGE_ACCEPTED')
        `,
        [rideId]
    );

    return Number(resultado[0]?.total || 0);
}

async function marcarAceitosAguardandoConfirmacao(rideId, connection = pool) {
    // Move passageiros confirmados para aguardando nova decisao.
    await connection.query(
        `
        UPDATE ride_requests
        SET status = 'PENDING_CHANGE_CONFIRMATION',
            confirmation_required_at = NOW(),
            confirmed_change_at = NULL,
            rejected_change_at = NULL
        WHERE ride_id = ?
            AND status IN ('ACCEPTED', 'CHANGE_ACCEPTED')
        `,
        [rideId]
    );
}

async function aceitarAlteracao(rideId, passengerId, connection = pool) {
    await connection.query(
        `
        UPDATE ride_requests
        SET status = 'CHANGE_ACCEPTED',
            confirmed_change_at = NOW()
        WHERE ride_id = ?
            AND requester_id = ?
            AND status = 'PENDING_CHANGE_CONFIRMATION'
        `,
        [rideId, passengerId]
    );
}

async function rejeitarAlteracao(rideId, passengerId, connection = pool) {
    await connection.query(
        `
        UPDATE ride_requests
        SET status = 'CHANGE_REJECTED',
            rejected_change_at = NOW()
        WHERE ride_id = ?
            AND requester_id = ?
            AND status = 'PENDING_CHANGE_CONFIRMATION'
        `,
        [rideId, passengerId]
    );
}

async function atualizarVagas(rideId, availableSeats, connection = pool) {
    await connection.query(
        'UPDATE rides SET available_seats = ? WHERE id = ?',
        [availableSeats, rideId]
    );
}

module.exports = {
    criarCarona,
    listarTodas,
    listarProximasPorUsuario,
    listarHistoricoPorUsuario,
    contarPorMotorista,
    buscarPorId,
    listarParadas,
    atualizarCarona,
    substituirParadas,
    atualizarStatus,
    contarPassageirosConfirmados,
    marcarAceitosAguardandoConfirmacao,
    aceitarAlteracao,
    rejeitarAlteracao,
    atualizarVagas
};
