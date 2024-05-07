const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema(
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
        category: {
            type: String,
            required: true,
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
  
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model('Brand', brandSchema)
