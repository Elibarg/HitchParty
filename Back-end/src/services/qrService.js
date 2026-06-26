const participantRepository = require('../repositories/rideParticipantRepository');

// HP-QR-001 | QR visual. O payload e derivado do banco (ride + solicitacao
// aceita), por isso nao existe tabela propria de QR no schema atual.
function formatarData(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Data não informada';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function formatarHorario(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Horário não informado';

    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

async function gerarQr(rideId, userId) {
    const context = await participantRepository.buscarContextoParticipante(
        rideId,
        userId
    );

    if (!context || !context.hasAcceptedRequest) {
        throw new Error('Selecione uma carona aceita para gerar o QR.');
    }

    const qrPayload = [
        'HITCHPARTY',
        `rideId=${context.rideId}`,
        `driverId=${context.driverId}`,
        `requesterId=${context.requesterId}`,
        'status=accepted'
    ].join('|');

    return {
        qrPayload,
        rideId: context.rideId,
        status: 'disponivel',
        role: context.role,
        origin: context.origin,
        destination: context.destination,
        date: formatarData(context.departureTime),
        time: formatarHorario(context.departureTime),
        driverId: context.driverId,
        driverName: context.driverName,
        requesterId: context.requesterId,
        requesterName: context.requesterName
    };
}

module.exports = {
    gerarQr
};
