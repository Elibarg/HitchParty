const rideService = require('../services/rideService');
const userService = require('../services/userService');

async function getDashboard(req, res) {
    try {
        const [user, upcomingRides] = await Promise.all([
            userService.getCurrentUser(req.user.id),
            rideService.listUpcomingRides(req.user.id)
        ]);

        return res.status(200).json({
            user,
            stats: {
                ridesCount: user.ridesCount,
                vehiclesCount: user.vehiclesCount,
                messagesCount: user.messagesCount,
                ratingValue: user.ratingValue
            },
            upcomingRides,
            recentActivity: []
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Erro ao carregar dashboard.'
        });
    }
}

module.exports = {
    getDashboard
};
