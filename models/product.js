const mongoose = require('mongoose')
const colorSchema = new mongoose.Schema({
	name: {
	  type: String,
	  required: true,
	},
	value: {
	  type: String,
	  required: true,
	}
  });
  
const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxLength: 100,
		},
		oldPrice: {
			type: Number,
			maxLength: 5,
			default: 0.0,
		},
	    colors: {
			type: [colorSchema],
			required: false,
		  },
		price: {
			type: Number,
			required: true,
			maxLength: 5,
			default: 0.0,
		},
		description: {
			type: String,
			required: false,
		},
		ratings: {
			type: Number,
			default: 0,
		},
		images: [
			{
				filename: {
					type: String,
					required: true,
				},
				path: {
					type: String,
					required: true,
				},
			},
		],
		category: {
			type: String,
			required: false,
		},
		brand: {
			type: String,
			required: false,
		},
		subcategory: {
			type: String,
			required: false,
		},
		seller: {
			type: String,
			required: false,
		},
		stock: {
			type: Number,
			required: true,
			maxLength: 5,
			default: 0,
		},
		numOfReviews: {
			type: Number,
			default: 0,
		},
		reviews: [
			{
				user: {
					type: mongoose.Schema.ObjectId,
					ref: 'User',
					required: true,
				},
				name: {
					type: String,
					required: true,
				},
				avatar: {
					type: String,
					required: true,
				},
				rating: {
					type: Number,
					required: true,
				},
				comment: {
					type: String,
					required: true,
				},
			},
		],
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Product', productSchema)
