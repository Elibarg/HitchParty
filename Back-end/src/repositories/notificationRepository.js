const pool = require('../config/database');

function mapNotificationFromDb(notification) {
    if (!notification) return null;

    return {
        id: notification.id,
        userId: notification.user_id,
        rideId: notification.ride_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        status: notification.status,
        actionRequired: Boolean(notification.action_required),
        createdAt: notification.created_at,
        readAt: notification.read_at
    };
}

async function criar(notification, connection = pool) {
    // Persiste notificacao interna para o usuario destinatario.
    const [resultado] = await connection.query(
        `
        INSERT INTO notifications
        (
            user_id,
            ride_id,
            type,
            title,
            message,
            action_required
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            notification.userId,
            notification.rideId || null,
            notification.type,
            notification.title,
            notification.message,
            Boolean(notification.actionRequired)
        ]
    );

    return {
        id: resultado.insertId,
        ...notification,
        status: 'unread',
        readAt: null
    };
}

async function listarPorUsuario(userId) {
    const [notifications] = await pool.query(
        `
        SELECT *
        FROM notifications
        WHERE user_id = ?
            AND status <> 'resolved'
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [userId]
    );

    return notifications.map(mapNotificationFromDb);
}

async function buscarPorId(id) {
    const [notifications] = await pool.query(
        'SELECT * FROM notifications WHERE id = ?',
        [id]
    );

    return mapNotificationFromDb(notifications[0]);
}

async function marcarComoLida(id, userId) {
    await pool.query(
        `
        UPDATE notifications
        SET status = 'read',
            read_at = COALESCE(read_at, NOW())
        WHERE id = ?
            AND user_id = ?
            AND status = 'unread'
        `,
        [id, userId]
    );

    return buscarPorId(id);
}

async function resolverPorUsuarioRideTipo(userId, rideId, type, connection = pool) {
    // Resolve notificacao acionavel depois de aceitar/rejeitar alteracao.
    await connection.query(
        `
        UPDATE notifications
        SET status = 'resolved',
            read_at = COALESCE(read_at, NOW())
        WHERE user_id = ?
            AND ride_id = ?
            AND type = ?
            AND status <> 'resolved'
        `,
        [userId, rideId, type]
    );
}

module.exports = {
    criar,
    listarPorUsuario,
    buscarPorId,
    marcarComoLida,
    resolverPorUsuarioRideTipo
};
