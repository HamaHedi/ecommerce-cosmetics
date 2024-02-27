const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			maxLength: 100,
			unique: true,
		},
		description: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Category', categorySchema)
