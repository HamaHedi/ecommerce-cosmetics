const { check } = require('express-validator')

exports.productValidator = [
	check('name')
		.not()
		.isEmpty()
		.withMessage('Please enter product name')
		.isLength({ max: 100 })
		.withMessage('Product name cannot exceed 100 characters'),

	check('price')
		.not()
		.isEmpty()
		.withMessage('Please enter product price')
		.isInt({ min: 1 })
		.withMessage('Price must be greater than 0')
		.isLength({ max: 5 })
		.withMessage('Product price cannot exceed 5 characters'),

	check('category').not().isEmpty().withMessage('Please select category for this product'),

	check('stock')
		.not()
		.isEmpty()
		.withMessage('Please enter product stock')
		.isLength({ max: 5 })
		.withMessage('Product stock cannot exceed 5 characters'),
]

exports.productReviewValidator = [
	check('rating').not().isEmpty().withMessage('Please enter product rating'),

	check('comment').not().isEmpty().withMessage('Please enter product comment'),

	check('productId').not().isEmpty().withMessage('Please enter product product id'),
]
