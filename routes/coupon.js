const express = require('express')
const router = express.Router()

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const {
	getCoupons,
	createCoupon,
	deleteCoupon,
	validateCoupon,
} = require('../controllers/coupon')

// Public: validate a coupon at checkout
router.route('/coupon/validate').post(validateCoupon)

// Admin: manage coupons
router
	.route('/coupons')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getCoupons)
router
	.route('/coupons')
	.post(isAuthenticatedUser, authorizeRoles('admin'), createCoupon)
router
	.route('/coupons/:id')
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCoupon)

module.exports = router
