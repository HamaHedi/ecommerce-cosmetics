const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
			maxLength: 40,
		},
		discountType: {
			type: String,
			enum: ['percent', 'fixed'],
			default: 'percent',
		},
		discountValue: {
			type: Number,
			required: true,
			min: 0,
		},
		minOrder: {
			type: Number,
			default: 0,
		},
		expiresAt: {
			type: Date,
		},
		active: {
			type: Boolean,
			default: true,
		},
		usageLimit: {
			type: Number,
			default: 0, // 0 = unlimited
		},
		usedCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Coupon', couponSchema)
