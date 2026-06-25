const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const notificationsController = require('../controllers/notificationsController');

const routes = express.Router();

routes.get('/', authMiddleware, notificationsController.listar);
routes.patch('/:notificationId/read', authMiddleware, notificationsController.marcarComoLida);

module.exports = routes;
