const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ['order', 'low_stock'],
			required: true,
		},
		title: { type: String, required: true },
		message: { type: String, required: true },
		link: { type: String },
		read: { type: Boolean, default: false },
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
		},
		order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order',
		},
	},
	{ timestamps: true }
)

module.exports = mongoose.model('Notification', notificationSchema)
