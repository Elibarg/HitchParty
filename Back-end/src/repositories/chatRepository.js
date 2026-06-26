const pool = require('../config/database');

// HP-CHAT-003 | Repository do chat: persiste e recupera ride_messages.
// A permissao de acesso e validada no service antes da consulta.
function mapMessageFromDb(message) {
    if (!message) return null;

    return {
        id: message.id,
        rideId: message.ride_id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        senderName: message.sender_name,
        message: message.message,
        createdAt: message.created_at,
        readAt: message.read_at
    };
}

async function listarPorCarona(rideId, userId, isDriver) {
    const parametros = isDriver
        ? [rideId]
        : [rideId, userId, userId];

    const filtro = isDriver
        ? 'rm.ride_id = ?'
        : `
            rm.ride_id = ?
            AND (
                rm.sender_id = ?
                OR rm.receiver_id = ?
                OR rm.receiver_id IS NULL
            )
        `;

    const [messages] = await pool.query(
        `
        SELECT
            rm.*,
            sender.full_name AS sender_name
        FROM ride_messages rm
        INNER JOIN users sender
            ON sender.id = rm.sender_id
        WHERE ${filtro}
        ORDER BY rm.created_at ASC, rm.id ASC
        `,
        parametros
    );

    return messages.map(mapMessageFromDb);
}

async function criarMensagem({ rideId, senderId, receiverId, message }) {
    const [resultado] = await pool.query(
        `
        INSERT INTO ride_messages
        (
            ride_id,
            sender_id,
            receiver_id,
            message
        )
        VALUES (?, ?, ?, ?)
        `,
        [rideId, senderId, receiverId || null, message]
    );

    return buscarPorId(resultado.insertId);
}

async function buscarPorId(id) {
    const [messages] = await pool.query(
        `
        SELECT
            rm.*,
            sender.full_name AS sender_name
        FROM ride_messages rm
        INNER JOIN users sender
            ON sender.id = rm.sender_id
        WHERE rm.id = ?
        `,
        [id]
    );

    return mapMessageFromDb(messages[0]);
}

module.exports = {
    listarPorCarona,
    criarMensagem
};
