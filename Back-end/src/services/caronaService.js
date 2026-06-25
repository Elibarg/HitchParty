const caronaRepository = require('../repositories/caronaRepository');
const rideRequestRepository = require('../repositories/rideRequestRepository');
const notificationRepository = require('../repositories/notificationRepository');
const routeCompatibilityService = require('./routeCompatibilityService');
const pool = require('../config/database');

// HP-RIDE-005 | Service de caronas. Aqui ficam regras que envolvem motorista,
// vagas, edicao, cancelamento, paradas aprovadas e notificacoes.

function criarData(dataHoraSaida) {
    if (!dataHoraSaida) return null;

    const data = new Date(dataHoraSaida);

    return Number.isNaN(data.getTime()) ? null : data;
}

function formatarData(dataHoraSaida) {
    const data = criarData(dataHoraSaida);

    if (!data) return 'Data nao informada';

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(data);
}

function formatarHorario(dataHoraSaida) {
    const data = criarData(dataHoraSaida);

    if (!data) return 'Horario nao informado';

    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(data);
}

function formatarPreco(valorSugerido) {
    const valor = Number(valorSugerido || 0);

    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function mapStatusCarona(status) {
    const statusMap = {
        SCHEDULED: 'agendada',
        PENDING_PASSENGER_CONFIRMATION: 'aguardando_confirmacao_passageiros',
        IN_PROGRESS: 'em_andamento',
        FINISHED: 'finalizada',
        CANCELED: 'cancelada'
    };

    return statusMap[String(status || '').toUpperCase()] || status;
}

function mapCaronaParaResposta(carona) {
    const origin = carona.origin || 'Origem nao informada';
    const destination = carona.destination || 'Destino nao informado';

    return {
        id: carona.id,
        driver: carona.driverFullName || 'Motorista nao informado',
        driverName: carona.driverFullName || 'Motorista nao informado',
        rating: carona.driverRating || 0,
        trips: 0,
        origin,
        destination,
        route: `${origin} -> ${destination}`,
        departureTime: carona.departureTime,
        dataHoraSaida: carona.departureTime,
        date: formatarData(carona.departureTime),
        time: formatarHorario(carona.departureTime),
        seats: carona.availableSeats || 0,
        price: formatarPreco(carona.suggestedPrice),
        notes: carona.description || 'Nenhuma observacao cadastrada.',
        description: carona.description || '',
        driverId: carona.driverId,
        vehicleId: carona.vehicleId,
        vehicle: carona.vehicleName || carona.vehiclePlate || 'Veiculo nao informado',
        availableSeats: carona.availableSeats,
        vagasDisponiveis: carona.availableSeats,
        totalSeats: carona.totalSeats,
        suggestedPrice: carona.suggestedPrice,
        valorSugerido: carona.suggestedPrice,
        originLat: carona.originLat,
        originLng: carona.originLng,
        destinationLat: carona.destinationLat,
        destinationLng: carona.destinationLng,
        status: mapStatusCarona(carona.status),
        role: carona.role || 'driver',
        passengerStatus: carona.passengerStatus || null,
        stops: carona.stops || []
    };
}

function montarDataHora(date, time) {
    if (date && time) return `${date} ${time}:00`;
    if (time) return `${new Date().toISOString().slice(0, 10)} ${time}:00`;
    return null;
}

function normalizarParadas(stops = []) {
    if (!Array.isArray(stops)) return [];

    return stops
        .map((stop, index) => ({
            stopOrder: Number(stop.stopOrder || stop.stop_order || index + 1),
            address: String(stop.address || '').trim(),
            latitude: stop.latitude ?? stop.lat ?? null,
            longitude: stop.longitude ?? stop.lng ?? null,
            passengerId: stop.passengerId || stop.passenger_id || null,
            estimatedStopMinutes: Number(
                stop.estimatedStopMinutes
                || stop.estimated_stop_minutes
                || 3
            ),
            estimatedExtraRouteMinutes:
                stop.estimatedExtraRouteMinutes
                ?? stop.estimated_extra_route_minutes
                ?? null
        }))
        .filter(stop => stop.address || stop.latitude || stop.longitude);
}

function montarDadosCarona(dados, caronaAtual = {}) {
    const departureTime =
        dados.departureTime
        || dados.dataHoraSaida
        || montarDataHora(dados.date, dados.time)
        || caronaAtual.departureTime;

    const totalSeats = Number(
        dados.totalSeats
        || dados.seats
        || dados.vagasTotal
        || caronaAtual.totalSeats
    );

    return {
        vehicleId: Number(dados.vehicleId || caronaAtual.vehicleId),
        origin: dados.origin ?? caronaAtual.origin,
        destination: dados.destination ?? caronaAtual.destination,
        originLat: dados.originLat ?? caronaAtual.originLat ?? null,
        originLng: dados.originLng ?? caronaAtual.originLng ?? null,
        destinationLat: dados.destinationLat ?? caronaAtual.destinationLat ?? null,
        destinationLng: dados.destinationLng ?? caronaAtual.destinationLng ?? null,
        departureTime,
        totalSeats,
        suggestedPrice: Number(
            dados.suggestedPrice
            || dados.price
            || caronaAtual.suggestedPrice
            || 0
        ),
        description: dados.description ?? dados.notes ?? caronaAtual.description ?? null,
        stops: normalizarParadas(dados.stops || dados.paradas || [])
    };
}

function paradasMudaram(anteriores = [], proximas = []) {
    const normalizar = stops => stops.map(stop => ({
        order: Number(stop.stopOrder),
        address: stop.address,
        latitude: stop.latitude === null || stop.latitude === undefined
            ? null
            : Number(stop.latitude),
        longitude: stop.longitude === null || stop.longitude === undefined
            ? null
            : Number(stop.longitude),
        passengerId: stop.passengerId || null
    }));

    return JSON.stringify(normalizar(anteriores)) !== JSON.stringify(normalizar(proximas));
}

function alteracaoRelevante(caronaAtual, dadosAtualizados, paradasAtuais) {
    return [
        caronaAtual.origin !== dadosAtualizados.origin,
        caronaAtual.destination !== dadosAtualizados.destination,
        String(caronaAtual.departureTime) !== String(dadosAtualizados.departureTime),
        Number(caronaAtual.suggestedPrice) !== Number(dadosAtualizados.suggestedPrice),
        paradasMudaram(paradasAtuais, dadosAtualizados.stops)
    ].some(Boolean);
}

function validarDadosCarona(dados) {
    if (!dados.origin || !dados.destination) {
        throw new Error('Origem e destino sao obrigatorios.');
    }

    if (!dados.vehicleId) {
        throw new Error('Veiculo nao informado.');
    }

    if (!dados.departureTime) {
        throw new Error('Data e horario de saida sao obrigatorios.');
    }

    if (!Number.isInteger(dados.totalSeats) || dados.totalSeats < 1 || dados.totalSeats > 8) {
        throw new Error('Quantidade de vagas invalida.');
    }

    const totalExtraRouteMinutes = dados.stops.reduce(
        (total, stop) => total + Number(stop.estimatedExtraRouteMinutes || 0),
        0
    );

    if (totalExtraRouteMinutes > 5) {
        throw new Error('As paradas aumentam a rota em mais de 5 minutos.');
    }

    for (const stop of dados.stops) {
        if (
            !stop.address
            || stop.latitude === null
            || stop.latitude === undefined
            || stop.longitude === null
            || stop.longitude === undefined
        ) {
            throw new Error('Cada parada deve ser selecionada pelo Google Maps.');
        }

        if (Number(stop.estimatedStopMinutes) > 3) {
            throw new Error('O tempo maximo de parada e de 3 minutos.');
        }
    }
}

async function criarCarona(userId, dados) {
    // HP-RIDE-006 | Cria corrida vinculada ao motorista autenticado pelo JWT.
    const dadosCarona = montarDadosCarona(dados);
    validarDadosCarona(dadosCarona);

    const carona = await caronaRepository.criarCarona({
        driverId: userId,
        ...dadosCarona
    });

    return buscarPorId(carona.id);
}

async function buscarCaronas(filtros = {}) {
    const caronas = await caronaRepository.listarTodas(filtros);

    return caronas
        .map(carona => {
            const compatibility = routeCompatibilityService.calculateCompatibility(
                carona,
                {
                    originLat: filtros.originLat,
                    originLng: filtros.originLng,
                    destinationLat: filtros.destinationLat,
                    destinationLng: filtros.destinationLng
                }
            );

            return {
                ...mapCaronaParaResposta(carona),
                compatibility
            };
        })
        .filter(ride => ride.compatibility.compatible);
}

async function listarProximasPorUsuario(userId) {
    const caronas = await caronaRepository.listarProximasPorUsuario(userId);

    return caronas.map(mapCaronaParaResposta);
}

async function listarHistoricoPorUsuario(userId) {
    const caronas = await caronaRepository.listarHistoricoPorUsuario(userId);

    return caronas.map(mapCaronaParaResposta);
}

async function buscarPorId(id, userId = null) {
    const carona = await caronaRepository.buscarPorId(id);

    if (!carona) {
        throw new Error('Carona nao encontrada.');
    }

    carona.stops = await caronaRepository.listarParadas(id);

    const ride = mapCaronaParaResposta(carona);

    if (userId) {
        ride.role = Number(ride.driverId) === Number(userId)
            ? 'driver'
            : 'passenger';
    }

    return ride;
}

async function editarCarona(rideId, driverId, dados) {
    // Edita corrida apenas quando o usuario e motorista dono.
    const caronaAtual = await caronaRepository.buscarPorId(rideId);

    if (!caronaAtual || Number(caronaAtual.driverId) !== Number(driverId)) {
        throw new Error('Voce nao tem permissao para editar esta carona.');
    }

    if (['CANCELED', 'FINISHED'].includes(String(caronaAtual.status).toUpperCase())) {
        throw new Error('Esta carona nao pode ser editada.');
    }

    const dadosAtualizados = montarDadosCarona(dados, caronaAtual);
    dadosAtualizados.stops = [];
    validarDadosCarona(dadosAtualizados);

    const passageirosAceitos =
        await rideRequestRepository.listarAceitasPorCarona(rideId);
    const passageirosAguardando =
        await rideRequestRepository.listarAguardandoConfirmacaoPorCarona(rideId);
    const passageirosVinculados = [
        ...passageirosAceitos,
        ...passageirosAguardando
    ];

    if (dadosAtualizados.totalSeats < passageirosVinculados.length) {
        throw new Error('As vagas nao podem ficar abaixo dos passageiros aceitos.');
    }

    const requerConfirmacao =
        passageirosVinculados.length > 0
        && alteracaoRelevante(caronaAtual, dadosAtualizados, []);

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await caronaRepository.atualizarCarona(
            rideId,
            {
                ...dadosAtualizados,
                availableSeats: dadosAtualizados.totalSeats - passageirosVinculados.length,
                status:
                    requerConfirmacao
                    || String(caronaAtual.status).toUpperCase() === 'PENDING_PASSENGER_CONFIRMATION'
                        ? 'PENDING_PASSENGER_CONFIRMATION'
                        : 'SCHEDULED'
            },
            connection
        );

        if (requerConfirmacao) {
            // HP-RIDE-007 | Alteracao relevante exige nova confirmacao dos passageiros.
            await caronaRepository.marcarAceitosAguardandoConfirmacao(
                rideId,
                connection
            );

            for (const passenger of passageirosVinculados) {
                await notificationRepository.criar(
                    {
                        userId: passenger.requesterId,
                        rideId,
                        type: 'ride_updated',
                        title: 'Carona alterada',
                        message: 'O motorista alterou dados importantes da carona. Confirme se voce ainda quer continuar nesta corrida.',
                        actionRequired: true
                    },
                    connection
                );
            }
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    return buscarPorId(rideId);
}

async function cancelarCarona(rideId, driverId) {
    // HP-RIDE-008 | Cancela corrida logicamente e notifica passageiros vinculados.
    const carona = await caronaRepository.buscarPorId(rideId);

    if (!carona || Number(carona.driverId) !== Number(driverId)) {
        throw new Error('Voce nao tem permissao para cancelar esta carona.');
    }

    if (String(carona.status).toUpperCase() === 'CANCELED') {
        throw new Error('Carona ja cancelada.');
    }

    const passageiros = [
        ...await rideRequestRepository.listarAceitasPorCarona(rideId),
        ...await rideRequestRepository.listarAguardandoConfirmacaoPorCarona(rideId)
    ];

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await caronaRepository.atualizarStatus(rideId, 'CANCELED', connection);

        for (const passenger of passageiros) {
            await notificationRepository.criar(
                {
                    userId: passenger.requesterId,
                    rideId,
                    type: 'ride_cancelled',
                    title: 'Carona cancelada',
                    message: 'O motorista cancelou uma carona em que voce estava vinculado.',
                    actionRequired: false
                },
                connection
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    return buscarPorId(rideId);
}

async function aceitarAlteracao(rideId, passengerId) {
    // HP-RIDE-009 | Passageiro confirma que aceita continuar apos alteracao.
    const request =
        await rideRequestRepository.buscarConfirmacaoPendente(rideId, passengerId);

    if (!request) {
        throw new Error('Nao ha alteracao pendente para esta carona.');
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await caronaRepository.aceitarAlteracao(rideId, passengerId, connection);
        await notificationRepository.resolverPorUsuarioRideTipo(
            passengerId,
            rideId,
            'ride_updated',
            connection
        );
        await notificationRepository.criar(
            {
                userId: request.driverId,
                rideId,
                type: 'passenger_accepted_update',
                title: 'Passageiro confirmou alteracao',
                message: `${request.requesterName || 'Um passageiro'} aceitou continuar na carona alterada.`,
                actionRequired: false
            },
            connection
        );

        const pendentes =
            await rideRequestRepository.listarAguardandoConfirmacaoPorCarona(
                rideId,
                connection
            );

        if (!pendentes.length) {
            await caronaRepository.atualizarStatus(rideId, 'SCHEDULED', connection);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    return buscarPorId(rideId);
}

async function rejeitarAlteracao(rideId, passengerId) {
    // HP-RIDE-010 | Passageiro rejeita alteracao, sai da corrida e libera vaga.
    const request =
        await rideRequestRepository.buscarConfirmacaoPendente(rideId, passengerId);

    if (!request) {
        throw new Error('Nao ha alteracao pendente para esta carona.');
    }

    const carona = await caronaRepository.buscarPorId(rideId);
    const novaQuantidade = Math.min(
        Number(carona.totalSeats || 0),
        Number(carona.availableSeats || 0) + 1
    );

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await caronaRepository.rejeitarAlteracao(rideId, passengerId, connection);
        await caronaRepository.atualizarVagas(rideId, novaQuantidade, connection);
        await notificationRepository.resolverPorUsuarioRideTipo(
            passengerId,
            rideId,
            'ride_updated',
            connection
        );
        await notificationRepository.criar(
            {
                userId: request.driverId,
                rideId,
                type: 'passenger_rejected_update',
                title: 'Passageiro recusou alteracao',
                message: `${request.requesterName || 'Um passageiro'} recusou a alteracao e saiu da carona.`,
                actionRequired: false
            },
            connection
        );

        const pendentes =
            await rideRequestRepository.listarAguardandoConfirmacaoPorCarona(
                rideId,
                connection
            );

        if (!pendentes.length) {
            await caronaRepository.atualizarStatus(rideId, 'SCHEDULED', connection);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    return buscarPorId(rideId);
}

module.exports = {
    criarCarona,
    buscarCaronas,
    listarProximasPorUsuario,
    listarHistoricoPorUsuario,
    buscarPorId,
    editarCarona,
    cancelarCarona,
    aceitarAlteracao,
    rejeitarAlteracao
};
