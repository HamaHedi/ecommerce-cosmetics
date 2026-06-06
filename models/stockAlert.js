const mongoose = require('mongoose')

const stockAlertSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		productName: { type: String },
		email: { type: String, required: true },
		notified: { type: Boolean, default: false },
	},
	{ timestamps: true }
)

module.exports = mongoose.model('StockAlert', stockAlertSchema)
