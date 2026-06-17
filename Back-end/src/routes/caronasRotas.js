const express = require('express');
const router = express.Router();

const rideController = require('../controllers/rideController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/search', rideController.searchRides);
router.post('/', authenticate, rideController.createRide);

module.exports = router;
