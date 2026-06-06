const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema(
	{
		image: {
			filename: { type: String, required: true },
			path: { type: String, required: true },
		},
		title: { type: String },
		subtitle: { type: String },
		link: { type: String },
		sortOrder: { type: Number, default: 0 },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true }
)

module.exports = mongoose.model('Banner', bannerSchema)
