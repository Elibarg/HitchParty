const vehicleRepository = require('../repositories/vehicleRepository');

function mapVehicle(row, index = 0) {
    return {
        id: row.id,
        userId: row.user_id,
        brand: row.brand,
        model: row.model,
        licensePlate: row.license_plate,
        plate: row.license_plate,
        color: row.color,
        year: row.year,
        seats: 5,
        primary: index === 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function validateVehicle(vehicle) {
    if (!vehicle.brand || !vehicle.model || !vehicle.licensePlate) {
        throw new Error('Marca, modelo e placa são obrigatórios.');
    }

    if (!/^[A-Z0-9]{7}$/.test(vehicle.licensePlate)) {
        throw new Error('Informe uma placa válida com 7 caracteres.');
    }
}

async function listVehicles(userId) {
    const vehicles = await vehicleRepository.listByUserId(userId);

    return vehicles.map(mapVehicle);
}

async function createVehicle(userId, payload) {
    const vehicle = {
        brand: payload.brand?.trim(),
        model: payload.model?.trim(),
        licensePlate: (payload.licensePlate || payload.plate || '').trim().toUpperCase(),
        color: payload.color?.trim(),
        year: payload.year ? Number(payload.year) : null
    };

    validateVehicle(vehicle);

    const createdVehicle = await vehicleRepository.create(userId, vehicle);
    const vehicles = await vehicleRepository.listByUserId(userId);
    const index = vehicles.findIndex(item => item.id === createdVehicle.id);

    return mapVehicle(createdVehicle, index);
}

async function updateVehicle(userId, vehicleId, payload) {
    const vehicle = {
        brand: payload.brand?.trim(),
        model: payload.model?.trim(),
        licensePlate: (payload.licensePlate || payload.plate || '').trim().toUpperCase(),
        color: payload.color?.trim(),
        year: payload.year ? Number(payload.year) : null
    };

    validateVehicle(vehicle);

    const updatedVehicle = await vehicleRepository.updateByIdForUser(
        vehicleId,
        userId,
        vehicle
    );

    if (!updatedVehicle) {
        throw new Error('Veículo não encontrado.');
    }

    const vehicles = await vehicleRepository.listByUserId(userId);
    const index = vehicles.findIndex(item => item.id === updatedVehicle.id);

    return mapVehicle(updatedVehicle, index);
}

async function deleteVehicle(userId, vehicleId) {
    const deleted = await vehicleRepository.deleteByIdForUser(vehicleId, userId);

    if (!deleted) {
        throw new Error('Veículo não encontrado.');
    }
}

module.exports = {
    listVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle
};
