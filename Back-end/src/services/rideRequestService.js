const caronaRepository = require('../repositories/caronaRepository');
const rideRequestRepository = require('../repositories/rideRequestRepository');
const notificationRepository = require('../repositories/notificationRepository');
const routeCompatibilityService = require('./routeCompatibilityService');

// HP-REQ-001 | Service de solicitacoes. Controla o fluxo passageiro ->
// motorista: criar pedido, recuperar pedido existente, aceitar e recusar.

function mapStatus(status) {
    const normalizedStatus = String(status || '').toUpperCase();
    const statusMap = {
        PENDING: 'pendente',
        ACCEPTED: 'aceita',
        PENDING_CHANGE_CONFIRMATION: 'aguardando_alteracao',
        CHANGE_ACCEPTED: 'alteracao_aceita',
        CHANGE_REJECTED: 'alteracao_recusada',
        REJECTED: 'rejeitada',
        CANCELED: 'cancelada'
    };

    return statusMap[normalizedStatus] || 'pendente';
}

function formatarData(dataHoraSaida) {
    const data = new Date(dataHoraSaida);

    if (Number.isNaN(data.getTime())) return 'Data nao informada';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(data);
}

function formatarHorario(dataHoraSaida) {
    const data = new Date(dataHoraSaida);

    if (Number.isNaN(data.getTime())) return 'Horario nao informado';

    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(data);
}

function mapParaFrontend(request, type) {
    return {
        id: request.id,
        rideId: request.rideId,
        requesterId: request.requesterId,
        driverId: request.driverId,
        type,
        passenger: request.requesterName,
        passengerPhone: request.requesterPhone,
        driver: request.driverName,
        origin: request.origin,
        destination: request.destination,
        date: formatarData(request.departureTime),
        time: formatarHorario(request.departureTime),
        suggestedPrice: request.suggestedPrice,
        availableSeats: request.availableSeats,
        valorSugerido: request.valorSugerido ?? request.suggestedPrice,
        vagasDisponiveis: request.vagasDisponiveis ?? request.availableSeats,
        status: mapStatus(request.status),
        notes: request.notes,
        pickupAddress: request.pickupAddress,
        pickupReference: request.pickupReference,
        pickupLatitude: request.pickupLatitude,
        pickupLongitude: request.pickupLongitude,
        dropoffAddress: request.dropoffAddress,
        dropoffReference: request.dropoffReference,
        dropoffLatitude: request.dropoffLatitude,
        dropoffLongitude: request.dropoffLongitude,
        estimatedExtraRouteMinutes: request.estimatedExtraRouteMinutes,
        estimatedBoardingMinutes: request.estimatedBoardingMinutes,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
    };
}

function validarRotaPassageiro(dados) {
    if (
        !dados.pickupAddress
        || dados.pickupLatitude === undefined
        || dados.pickupLongitude === undefined
        || !dados.dropoffAddress
        || dados.dropoffLatitude === undefined
        || dados.dropoffLongitude === undefined
    ) {
        throw new Error('Informe embarque e desembarque usando o Google Maps.');
    }
}

function temCoordenada(valor) {
    return valor !== null
        && valor !== undefined
        && valor !== ''
        && !Number.isNaN(Number(valor));
}

function validarCoordenadasParaDesvio(ride, dados) {
    const campos = [
        ride.originLat,
        ride.originLng,
        ride.destinationLat,
        ride.destinationLng,
        dados.pickupLatitude,
        dados.pickupLongitude,
        dados.dropoffLatitude,
        dados.dropoffLongitude
    ];

    if (!campos.every(temCoordenada)) {
        throw new Error('Selecione embarque e desembarque pelo Google Maps para calcular o limite de desvio.');
    }
}

async function solicitarCarona(rideId, requesterId, dados = {}) {
    // HP-REQ-002 | Cria solicitacao com embarque/desembarque desejados.
    const ride = await caronaRepository.buscarPorId(rideId);

    if (!ride) {
        throw new Error('Carona nao encontrada.');
    }

    if (Number(ride.driverId) === Number(requesterId)) {
        throw new Error('Motorista nao pode solicitar a propria carona.');
    }

    if (ride.availableSeats <= 0) {
        throw new Error('Nao ha vagas disponiveis.');
    }

    const solicitacaoExistente =
        await rideRequestRepository.buscarPorCaronaEUsuario(
            rideId,
            requesterId
        );

    if (solicitacaoExistente) {
        throw new Error('Você já possui uma solicitação para esta carona.');
    }

    validarRotaPassageiro(dados);
    validarCoordenadasParaDesvio(ride, dados);

    const compatibility = routeCompatibilityService.calculateCompatibility(
        ride,
        {
            pickupLatitude: dados.pickupLatitude,
            pickupLongitude: dados.pickupLongitude,
            dropoffLatitude: dados.dropoffLatitude,
            dropoffLongitude: dados.dropoffLongitude
        }
    );

    if (!compatibility.compatible) {
        throw new Error('O embarque/desembarque aumenta a rota em mais de 5 minutos.');
    }

    const request = await rideRequestRepository.criarSolicitacao({
        rideId,
        requesterId,
        driverId: ride.driverId,
        notes: dados.notes,
        pickupAddress: dados.pickupAddress,
        pickupReference: dados.pickupReference,
        pickupLatitude: dados.pickupLatitude,
        pickupLongitude: dados.pickupLongitude,
        dropoffAddress: dados.dropoffAddress,
        dropoffReference: dados.dropoffReference,
        dropoffLatitude: dados.dropoffLatitude,
        dropoffLongitude: dados.dropoffLongitude,
        estimatedExtraRouteMinutes: compatibility.estimatedExtraRouteMinutes,
        estimatedBoardingMinutes: compatibility.estimatedBoardingMinutes
    });

    await notificationRepository.criar({
        userId: ride.driverId,
        rideId,
        type: 'ride_request_created',
        title: 'Nova solicitacao de carona',
        message: 'Um passageiro solicitou entrada na sua corrida com pontos de embarque e desembarque.',
        actionRequired: false
    });

    return mapParaFrontend(request, 'sent');
}

async function buscarMinhaSolicitacao(rideId, requesterId) {
    const request = await rideRequestRepository.buscarPorCaronaEUsuario(
        rideId,
        requesterId
    );

    return request ? mapParaFrontend(request, 'sent') : null;
}

async function listarPassageirosConfirmados(rideId) {
    const ride = await caronaRepository.buscarPorId(rideId);

    if (!ride) {
        throw new Error('Carona não encontrada.');
    }

    return rideRequestRepository.listarPassageirosConfirmadosPorCarona(rideId);
}

async function listarPorCarona(rideId, driverId) {
    const ride = await caronaRepository.buscarPorId(rideId);

    if (!ride || Number(ride.driverId) !== Number(driverId)) {
        throw new Error('Voce nao tem permissao para ver estas solicitacoes.');
    }

    const requests = await rideRequestRepository.listarPorCarona(rideId);

    return requests.map(request => mapParaFrontend(request, 'received'));
}

async function listarMinhasSolicitacoes(userId) {
    const [received, sent] = await Promise.all([
        rideRequestRepository.listarRecebidasPorMotorista(userId),
        rideRequestRepository.listarEnviadasPorSolicitante(userId)
    ]);

    return [
        ...received.map(request => mapParaFrontend(request, 'received')),
        ...sent.map(request => mapParaFrontend(request, 'sent'))
    ];
}

async function aceitarRequest(requestId, driverId) {
    // HP-REQ-003 | Motorista aceita passageiro, reduz vaga e gera paradas.
    const request = await rideRequestRepository.buscarPorId(requestId);

    if (!request || Number(request.driverId) !== Number(driverId)) {
        throw new Error('Voce nao tem permissao para aceitar esta solicitacao.');
    }

    if (request.status !== 'PENDING') {
        throw new Error('Solicitacao ja foi processada.');
    }

    if (request.availableSeats <= 0) {
        throw new Error('Nao ha vagas disponiveis.');
    }

    const updatedRequest = await rideRequestRepository.aceitarSolicitacao(
        requestId,
        driverId
    );

    await notificationRepository.criar({
        userId: updatedRequest.requesterId,
        rideId: updatedRequest.rideId,
        type: 'ride_request_accepted',
        title: 'Solicitacao aceita',
        message: 'O motorista aceitou sua solicitacao de carona.',
        actionRequired: false
    });

    return mapParaFrontend(updatedRequest, 'received');
}

async function rejeitarRequest(requestId, driverId) {
    const request = await rideRequestRepository.buscarPorId(requestId);

    if (!request || Number(request.driverId) !== Number(driverId)) {
        throw new Error('Voce nao tem permissao para recusar esta solicitacao.');
    }

    if (request.status !== 'PENDING') {
        throw new Error('Solicitacao ja foi processada.');
    }

    const updatedRequest = await rideRequestRepository.atualizarStatus(
        requestId,
        'REJECTED'
    );

    await notificationRepository.criar({
        userId: updatedRequest.requesterId,
        rideId: updatedRequest.rideId,
        type: 'ride_request_rejected',
        title: 'Solicitacao recusada',
        message: 'O motorista recusou sua solicitacao de carona.',
        actionRequired: false
    });

    return mapParaFrontend(updatedRequest, 'received');
}

module.exports = {
    solicitarCarona,
    buscarMinhaSolicitacao,
    listarPassageirosConfirmados,
    listarPorCarona,
    listarMinhasSolicitacoes,
    aceitarRequest,
    rejeitarRequest
};
