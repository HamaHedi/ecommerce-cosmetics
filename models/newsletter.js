const mongoose = require('mongoose')

const newsLetterSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			trim: true,
			maxLength: 100,
			unique: true,
		},
	
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('NewsLetter', newsLetterSchema)
