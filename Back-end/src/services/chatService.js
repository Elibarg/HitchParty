const chatRepository = require('../repositories/chatRepository');
const participantRepository = require('../repositories/rideParticipantRepository');

// HP-CHAT-002 | Service do chat. Antes de listar/enviar mensagem, confirma se
// o usuario e motorista da carona ou passageiro com solicitacao aceita.
function validarMensagem(message) {
    const text = String(message || '').trim();

    if (!text) {
        throw new Error('Mensagem não pode ser vazia.');
    }

    if (text.length > 1000) {
        throw new Error('Mensagem deve ter no máximo 1000 caracteres.');
    }

    return text;
}

async function obterContextoAutorizado(rideId, userId) {
    const context = await participantRepository.buscarContextoParticipante(
        rideId,
        userId
    );

    if (!context) {
        throw new Error('Você não tem permissão para acessar este chat.');
    }

    if (!context.isDriver && !context.hasAcceptedRequest) {
        throw new Error('Chat disponível apenas para caronas aceitas.');
    }

    if (context.isDriver) {
        const passengers = await participantRepository.listarPassageirosAceitos(rideId);

        if (!passengers.length) {
            throw new Error('Chat disponível apenas quando há solicitação aceita.');
        }

        return {
            ...context,
            passengers
        };
    }

    return context;
}

async function listarMensagens(rideId, userId) {
    const context = await obterContextoAutorizado(rideId, userId);
    const messages = await chatRepository.listarPorCarona(
        rideId,
        userId,
        context.isDriver
    );

    return {
        currentUserId: userId,
        context,
        messages
    };
}

async function enviarMensagem(rideId, userId, rawMessage) {
    const context = await obterContextoAutorizado(rideId, userId);
    const message = validarMensagem(rawMessage);

    const receiverId = context.isDriver
        ? context.passengers?.[0]?.requesterId || null
        : context.driverId;

    return chatRepository.criarMensagem({
        rideId,
        senderId: userId,
        receiverId,
        message
    });
}

module.exports = {
    listarMensagens,
    enviarMensagem
};
