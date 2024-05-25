const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			trim: true,
			maxLength: 100,
		},
        name: {
			type: String,
			required: true,
			maxLength: 100,
		},
        message: {
			type: String,
			required: true,
		},
	
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Message', messageSchema)
