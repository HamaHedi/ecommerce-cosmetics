const express = require('express')
const router = express.Router()

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const {
	getAnnouncements,
	getAllAnnouncements,
	createAnnouncement,
	updateAnnouncement,
	deleteAnnouncement,
} = require('../controllers/announcement')

// Public: active announcements for the home announce bar
router.route('/announcements').get(getAnnouncements)

// Admin: manage announcements
router
	.route('/admin/announcements')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getAllAnnouncements)
	.post(isAuthenticatedUser, authorizeRoles('admin'), createAnnouncement)
router
	.route('/admin/announcements/:id')
	.put(isAuthenticatedUser, authorizeRoles('admin'), updateAnnouncement)
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteAnnouncement)

module.exports = router
