const mongoose = require('mongoose')

const testimonialSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxLength: 60,
		},
		role: {
			type: String,
			trim: true,
			maxLength: 60,
		},
		text: {
			type: String,
			required: true,
			trim: true,
			maxLength: 600,
		},
		rating: {
			type: Number,
			default: 5,
			min: 1,
			max: 5,
		},
		image: {
			filename: { type: String },
			path: { type: String },
		},
		// Submitted opinions stay hidden until an admin approves them
		approved: {
			type: Boolean,
			default: false,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Testimonial', testimonialSchema)
