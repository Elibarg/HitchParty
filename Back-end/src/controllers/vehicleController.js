const vehicleService = require('../services/vehicleService');

async function listVehicles(req, res) {
    try {
        const vehicles = await vehicleService.listVehicles(req.user.id);

        return res.status(200).json({
            vehicles
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Erro ao carregar veículos.'
        });
    }
}

async function createVehicle(req, res) {
    try {
        const vehicle = await vehicleService.createVehicle(
            req.user.id,
            req.body
        );

        return res.status(201).json({
            message: 'Veículo cadastrado com sucesso.',
            vehicle
        });
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
}

async function updateVehicle(req, res) {
    try {
        const vehicle = await vehicleService.updateVehicle(
            req.user.id,
            req.params.id,
            req.body
        );

        return res.status(200).json({
            message: 'Veículo atualizado com sucesso.',
            vehicle
        });
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
}

async function deleteVehicle(req, res) {
    try {
        await vehicleService.deleteVehicle(
            req.user.id,
            req.params.id
        );

        return res.status(200).json({
            message: 'Veículo removido com sucesso.'
        });
    } catch (error) {
        return res.status(404).json({
            error: error.message
        });
    }
}

module.exports = {
    listVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle
};
