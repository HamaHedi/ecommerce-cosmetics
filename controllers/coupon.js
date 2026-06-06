const Coupon = require('../models/coupon')
const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')

// Admin: list all coupons
exports.getCoupons = AsyncHandler(async (req, res) => {
	const coupons = await Coupon.find().sort('-createdAt')
	res.status(200).json({ success: true, count: coupons.length, coupons })
})

// Admin: create a coupon
exports.createCoupon = AsyncHandler(async (req, res, next) => {
	const {
		code,
		discountType,
		discountValue,
		minOrder,
		expiresAt,
		usageLimit,
		active,
	} = req.body

	if (!code || discountValue === undefined || discountValue === null) {
		return next(new ErrorHandler('Code and discount value are required', 400))
	}

	const coupon = await Coupon.create({
		code: String(code).toUpperCase().trim(),
		discountType: discountType === 'fixed' ? 'fixed' : 'percent',
		discountValue: Number(discountValue),
		minOrder: Number(minOrder) || 0,
		expiresAt: expiresAt ? new Date(expiresAt) : undefined,
		usageLimit: Number(usageLimit) || 0,
		active: active === undefined ? true : !!active,
	})

	res.status(201).json({ success: true, coupon })
})

// Admin: delete a coupon
exports.deleteCoupon = AsyncHandler(async (req, res, next) => {
	const coupon = await Coupon.findById(req.params.id)
	if (!coupon) return next(new ErrorHandler('Coupon not found', 404))
	await coupon.deleteOne()
	res.status(200).json({ success: true, message: 'Coupon deleted' })
})

// Public: validate a coupon against a cart total -> returns the discount amount
exports.validateCoupon = AsyncHandler(async (req, res, next) => {
	const { code, cartTotal } = req.body
	if (!code) return next(new ErrorHandler('Coupon code required', 400))

	const coupon = await Coupon.findOne({
		code: String(code).toUpperCase().trim(),
		active: true,
	})
	if (!coupon) return next(new ErrorHandler('Code promo invalide', 404))

	if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
		return next(new ErrorHandler('Code promo expiré', 400))
	}
	if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
		return next(new ErrorHandler('Code promo épuisé', 400))
	}

	const total = Number(cartTotal) || 0
	if (coupon.minOrder && total < coupon.minOrder) {
		return next(
			new ErrorHandler(`Minimum d'achat de ${coupon.minOrder} DT requis`, 400)
		)
	}

	const discount =
		coupon.discountType === 'percent'
			? (total * coupon.discountValue) / 100
			: Math.min(coupon.discountValue, total)

	res.status(200).json({
		success: true,
		coupon: {
			code: coupon.code,
			discountType: coupon.discountType,
			discountValue: coupon.discountValue,
		},
		discount: Number(discount.toFixed(2)),
	})
})
