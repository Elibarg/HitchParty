const express = require('express');
const router = express.Router();

const vehicleController = require('../controllers/vehicleController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/', authenticate, vehicleController.listVehicles);
router.post('/', authenticate, vehicleController.createVehicle);
router.put('/:id', authenticate, vehicleController.updateVehicle);
router.delete('/:id', authenticate, vehicleController.deleteVehicle);

module.exports = router;
