const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema(
	{
		text: {
			type: String,
			required: true,
			trim: true,
			maxLength: 160,
		},
		icon: {
			type: String,
			default: 'fa-bullhorn',
			trim: true,
		},
		order: {
			type: Number,
			default: 0,
		},
		active: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Announcement', announcementSchema)
