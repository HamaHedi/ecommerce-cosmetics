const express = require('express')
const router = express.Router()

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const {
	getBanners,
	getAllBanners,
	createBanner,
	updateBanner,
	deleteBanner,
} = require('../controllers/banner')

// Public
router.route('/banners').get(getBanners)

// Admin
router
	.route('/admin/banners')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getAllBanners)
router
	.route('/admin/banners')
	.post(isAuthenticatedUser, authorizeRoles('admin'), createBanner)
router
	.route('/admin/banners/:id')
	.put(isAuthenticatedUser, authorizeRoles('admin'), updateBanner)
router
	.route('/admin/banners/:id')
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteBanner)

module.exports = router
