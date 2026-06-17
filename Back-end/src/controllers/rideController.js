const rideService = require('../services/rideService');

async function searchRides(req, res) {
    try {
        const rides = await rideService.searchRides(req.query);

        return res.status(200).json(rides);
    } catch (error) {
        return res.status(500).json({
            error: 'Erro ao buscar caronas.'
        });
    }
}

async function createRide(req, res) {
    try {
        const rideId = await rideService.createRide(
            req.user.id,
            req.body
        );

        return res.status(201).json({
            message: 'Carona criada com sucesso.',
            rideId
        });
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
}

module.exports = {
    searchRides,
    createRide
};
