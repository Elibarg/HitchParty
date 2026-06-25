const notificationRepository = require('../repositories/notificationRepository');

async function listarPorUsuario(userId) {
    return notificationRepository.listarPorUsuario(userId);
}

async function marcarComoLida(notificationId, userId) {
    const notification =
        await notificationRepository.marcarComoLida(notificationId, userId);

    if (!notification || Number(notification.userId) !== Number(userId)) {
        throw new Error('Notificacao nao encontrada.');
    }

    return notification;
}

module.exports = {
    listarPorUsuario,
    marcarComoLida
};
