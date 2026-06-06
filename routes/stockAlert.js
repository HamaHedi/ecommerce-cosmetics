const express = require('express')
const router = express.Router()

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const {
	subscribeStockAlert,
	getStockAlerts,
} = require('../controllers/stockAlert')

// Public
router.route('/products/:id/notify').post(subscribeStockAlert)

// Admin
router
	.route('/admin/stock-alerts')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getStockAlerts)

module.exports = router
