const pool = require('../config/database');

// HP-REQ-004 | Repository de solicitacoes: concentra SQL de ride_requests.
// O banco usa snake_case e o frontend recebe camelCase.
function mapRequestFromDb(request) {
    if (!request) return null;

    return {
        id: request.id,
        rideId: request.ride_id,
        requesterId: request.requester_id,
        requesterName: request.requester_name,
        requesterPhone: request.requester_phone,
        driverId: request.driver_id,
        driverName: request.driver_name,
        origin: request.origin,
        destination: request.destination,
        departureTime: request.departure_time,
        suggestedPrice: request.suggested_price ?? request.valor_sugerido,
        valorSugerido: request.valor_sugerido ?? request.suggested_price,
        availableSeats: request.available_seats ?? request.vagas_disponiveis,
        vagasDisponiveis: request.vagas_disponiveis ?? request.available_seats,
        status: request.status,
        notes: request.notes,
        pickupStopId: request.pickup_stop_id,
        pickupAddress: request.pickup_address,
        pickupReference: request.pickup_reference,
        pickupLatitude: request.pickup_latitude,
        pickupLongitude: request.pickup_longitude,
        dropoffStopId: request.dropoff_stop_id,
        dropoffAddress: request.dropoff_address,
        dropoffReference: request.dropoff_reference,
        dropoffLatitude: request.dropoff_latitude,
        dropoffLongitude: request.dropoff_longitude,
        estimatedExtraRouteMinutes: request.estimated_extra_route_minutes,
        estimatedBoardingMinutes: request.estimated_boarding_minutes,
        createdAt: request.created_at,
        updatedAt: request.updated_at
    };
}

function mapConfirmedPassengerFromDb(passenger) {
    if (!passenger) return null;

    return {
        id: passenger.id,
        fullName: passenger.full_name,
        photoUrl: passenger.photo_url || null,
        ratingAverage: Number(passenger.rating_average || 0),
        completedRides: Number(passenger.completed_rides || 0),
        pickupReference: passenger.pickup_reference || null
    };
}

function selectSolicitacaoBase() {
    return `
        SELECT
            rr.*,
            r.origin,
            r.destination,
            r.departure_time,
            r.suggested_price,
            r.available_seats,
            r.suggested_price AS valor_sugerido,
            r.available_seats AS vagas_disponiveis,
            requester.full_name AS requester_name,
            requester.phone AS requester_phone,
            driver.full_name AS driver_name
        FROM ride_requests rr
        INNER JOIN rides r
            ON r.id = rr.ride_id
        INNER JOIN users requester
            ON requester.id = rr.requester_id
        INNER JOIN users driver
            ON driver.id = rr.driver_id
    `;
}

async function listarPassageirosConfirmadosPorCarona(rideId) {
    const [passengers] = await pool.query(
        `
        SELECT
            requester.id,
            requester.full_name,
            requester.photo_url,
            requester.rating_average,
            rr.pickup_reference,
            (
                SELECT COUNT(*)
                FROM ride_requests rr_done
                WHERE rr_done.requester_id = requester.id
                    AND UPPER(rr_done.status) IN (
                        'ACCEPTED',
                        'CHANGE_ACCEPTED'
                    )
            ) AS completed_rides
        FROM ride_requests rr
        INNER JOIN users requester
            ON requester.id = rr.requester_id
        WHERE rr.ride_id = ?
            AND UPPER(rr.status) IN (
                'ACCEPTED',
                'CHANGE_ACCEPTED'
            )
        ORDER BY rr.accepted_at ASC, rr.created_at ASC
        `,
        [rideId]
    );

    return passengers.map(mapConfirmedPassengerFromDb);
}

async function criarSolicitacao({
    rideId,
    requesterId,
    driverId,
    notes,
    pickupAddress,
    pickupReference,
    pickupLatitude,
    pickupLongitude,
    dropoffAddress,
    dropoffReference,
    dropoffLatitude,
    dropoffLongitude,
    estimatedExtraRouteMinutes,
    estimatedBoardingMinutes
}) {
    const [resultado] = await pool.query(
        `
        INSERT INTO ride_requests
        (
            ride_id,
            requester_id,
            driver_id,
            status,
            notes,
            pickup_address,
            pickup_reference,
            pickup_latitude,
            pickup_longitude,
            dropoff_address,
            dropoff_reference,
            dropoff_latitude,
            dropoff_longitude,
            estimated_extra_route_minutes,
            estimated_boarding_minutes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            rideId,
            requesterId,
            driverId,
            'PENDING',
            notes || null,
            pickupAddress,
            pickupReference || null,
            pickupLatitude,
            pickupLongitude,
            dropoffAddress,
            dropoffReference || null,
            dropoffLatitude,
            dropoffLongitude,
            estimatedExtraRouteMinutes,
            estimatedBoardingMinutes || 3
        ]
    );

    return buscarPorId(resultado.insertId);
}

async function buscarPorId(id) {
    const [requests] = await pool.query(
        `
        ${selectSolicitacaoBase()}
        WHERE rr.id = ?
        `,
        [id]
    );

    return mapRequestFromDb(requests[0]);
}

async function buscarPorCaronaEUsuario(rideId, requesterId) {
    const [requests] = await pool.query(
        `
        ${selectSolicitacaoBase()}
        WHERE rr.ride_id = ?
            AND rr.requester_id = ?
        ORDER BY rr.created_at DESC
        LIMIT 1
        `,
        [rideId, requesterId]
    );

    return mapRequestFromDb(requests[0]);
}

async function listarPorCarona(rideId) {
    const [requests] = await pool.query(
        `
        ${selectSolicitacaoBase()}
        WHERE rr.ride_id = ?
        ORDER BY rr.created_at DESC
        `,
        [rideId]
    );

    return requests.map(mapRequestFromDb);
}

async function listarRecebidasPorMotorista(driverId) {
    const [requests] = await pool.query(
        `
        ${selectSolicitacaoBase()}
        WHERE rr.driver_id = ?
        ORDER BY rr.created_at DESC
        `,
        [driverId]
    );

    return requests.map(mapRequestFromDb);
}

async function listarEnviadasPorSolicitante(requesterId) {
    const [requests] = await pool.query(
        `
        ${selectSolicitacaoBase()}
        WHERE rr.requester_id = ?
        ORDER BY rr.created_at DESC
        `,
        [requesterId]
    );

    return requests.map(mapRequestFromDb);
}

async function atualizarStatus(requestId, status) {
    await pool.query(
        'UPDATE ride_requests SET status = ? WHERE id = ?',
        [status, requestId]
    );

    return buscarPorId(requestId);
}

async function aceitarSolicitacao(requestId, driverId) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.query(
            `
            SELECT rr.*, r.available_seats
            FROM ride_requests rr
            INNER JOIN rides r
                ON r.id = rr.ride_id
            WHERE rr.id = ?
                AND rr.driver_id = ?
            FOR UPDATE
            `,
            [requestId, driverId]
        );

        const request = requests[0];

        if (!request) {
            throw new Error('Você não tem permissão para aceitar esta solicitação.');
        }

        if (request.status !== 'PENDING') {
            throw new Error('Solicitação já foi processada.');
        }

        if (request.available_seats <= 0) {
            throw new Error('Não há vagas disponíveis.');
        }

        await connection.query(
            'UPDATE ride_requests SET status = ?, accepted_at = NOW() WHERE id = ?',
            ['ACCEPTED', requestId]
        );

        const [[orderResult]] = await connection.query(
            `
            SELECT COALESCE(MAX(stop_order), 0) AS max_order
            FROM ride_stops
            WHERE ride_id = ?
            `,
            [request.ride_id]
        );

        const nextOrder = Number(orderResult.max_order || 0) + 1;

        const [pickupResult] = await connection.query(
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
            VALUES (?, ?, ?, 'pickup', ?, ?, ?, ?, ?)
            `,
            [
                request.ride_id,
                request.id,
                request.requester_id,
                nextOrder,
                request.pickup_address,
                request.pickup_latitude,
                request.pickup_longitude,
                request.estimated_boarding_minutes || 3
            ]
        );

        const [dropoffResult] = await connection.query(
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
            VALUES (?, ?, ?, 'dropoff', ?, ?, ?, ?, ?)
            `,
            [
                request.ride_id,
                request.id,
                request.requester_id,
                nextOrder + 1,
                request.dropoff_address,
                request.dropoff_latitude,
                request.dropoff_longitude,
                request.estimated_boarding_minutes || 3
            ]
        );

        await connection.query(
            `
            UPDATE ride_requests
            SET pickup_stop_id = ?,
                dropoff_stop_id = ?
            WHERE id = ?
            `,
            [pickupResult.insertId, dropoffResult.insertId, requestId]
        );

        await connection.query(
            'UPDATE rides SET available_seats = available_seats - 1 WHERE id = ?',
            [request.ride_id]
        );

        await connection.commit();

        return buscarPorId(requestId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function listarAceitasPorCarona(rideId, connection = pool) {
    const [requests] = await connection.query(
        `
        ${selectSolicitacaoBase()}
        WHERE rr.ride_id = ?
            AND rr.status IN ('ACCEPTED', 'CHANGE_ACCEPTED')
        ORDER BY rr.created_at ASC
        `,
        [rideId]
    );

    return requests.map(mapRequestFromDb);
}

async function listarAguardandoConfirmacaoPorCarona(rideId, connection = pool) {
    const [requests] = await connection.query(
        `
        ${selectSolicitacaoBase()}
        WHERE rr.ride_id = ?
            AND rr.status = 'PENDING_CHANGE_CONFIRMATION'
        ORDER BY rr.created_at ASC
        `,
        [rideId]
    );

    return requests.map(mapRequestFromDb);
}

async function buscarConfirmacaoPendente(rideId, requesterId, connection = pool) {
    const [requests] = await connection.query(
        `
        ${selectSolicitacaoBase()}
        WHERE rr.ride_id = ?
            AND rr.requester_id = ?
            AND rr.status = 'PENDING_CHANGE_CONFIRMATION'
        LIMIT 1
        `,
        [rideId, requesterId]
    );

    return mapRequestFromDb(requests[0]);
}

module.exports = {
    criarSolicitacao,
    buscarPorId,
    buscarPorCaronaEUsuario,
    listarPorCarona,
    listarRecebidasPorMotorista,
    listarEnviadasPorSolicitante,
    listarPassageirosConfirmadosPorCarona,
    atualizarStatus,
    aceitarSolicitacao,
    listarAceitasPorCarona,
    listarAguardandoConfirmacaoPorCarona,
    buscarConfirmacaoPendente
};
