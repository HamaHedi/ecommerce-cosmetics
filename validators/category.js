const { check } = require('express-validator')
const Category = require('../models/category')

exports.categoryValidator = [
	check('title')
		.not()
		.isEmpty()
		.withMessage('Please enter category title')
		.isLength({ max: 100 })
		.withMessage('Category title cannot exceed 100 characters')
		.custom((value, { req }) => {
			return new Promise((resolve, reject) => {
				Category.findOne({ title: req.body.title }, function (err, category) {
					if (err) {
						reject(new Error('Server Error'))
					}

					if (Boolean(category)) {
						reject(new Error('Category already exists'))
					}

					resolve(true)
				})
			})
		}),
]
