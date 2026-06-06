const express = require('express')
const router = express.Router()

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const {
	getNotifications,
	markAllRead,
	markRead,
	deleteNotification,
} = require('../controllers/notification')

router
	.route('/admin/notifications')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getNotifications)
router
	.route('/admin/notifications/read-all')
	.put(isAuthenticatedUser, authorizeRoles('admin'), markAllRead)
router
	.route('/admin/notifications/:id/read')
	.put(isAuthenticatedUser, authorizeRoles('admin'), markRead)
router
	.route('/admin/notifications/:id')
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteNotification)

module.exports = router
