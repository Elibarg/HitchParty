const rideRepository = require('../repositories/rideRepository');
const vehicleRepository = require('../repositories/vehicleRepository');

function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function mapRide(row) {
    const departureTime = new Date(row.departure_time);

    return {
        id: row.id,
        driverId: row.driver_id,
        driverName: row.driver_name,
        origin: row.origin,
        destination: row.destination,
        route: `${row.origin} → ${row.destination}`,
        date: departureTime.toLocaleDateString('pt-BR'),
        time: departureTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        vehicle: [row.vehicle_brand, row.vehicle_model].filter(Boolean).join(' '),
        seats: row.available_seats,
        seat: `${row.available_seats} vagas`,
        price: formatCurrency(row.suggested_price),
        notes: row.description || '',
        rating: Number(row.driver_rating || 0),
        trips: 0
    };
}

function mapUpcomingRide(row) {
    return mapRide({
        ...row,
        driver_name: null,
        driver_rating: 0,
        vehicle_brand: null,
        vehicle_model: null
    });
}

async function searchRides(filters) {
    const rides = await rideRepository.listScheduled(filters);

    return rides.map(mapRide);
}

async function createRide(userId, payload) {
    const vehicle = await vehicleRepository.findByIdForUser(
        payload.vehicleId,
        userId
    );

    if (!vehicle) {
        throw new Error('Veículo não encontrado.');
    }

    const totalSeats = Number(payload.seats || payload.totalSeats);

    if (!payload.origin || !payload.destination || !payload.departureTime) {
        throw new Error('Origem, destino e data de saída são obrigatórios.');
    }

    if (!totalSeats || totalSeats < 1 || totalSeats > 8) {
        throw new Error('Informe uma quantidade de vagas entre 1 e 8.');
    }

    return rideRepository.create(userId, {
        vehicleId: payload.vehicleId,
        origin: payload.origin,
        destination: payload.destination,
        departureTime: payload.departureTime,
        totalSeats,
        suggestedPrice: payload.suggestedPrice || payload.price,
        description: payload.description || payload.notes
    });
}

async function listUpcomingRides(userId) {
    const rides = await rideRepository.listUpcomingByUserId(userId);

    return rides.map(mapUpcomingRide);
}

module.exports = {
    searchRides,
    createRide,
    listUpcomingRides
};
