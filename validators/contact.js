const { check } = require('express-validator')

exports.contactValidator = [
	check('name').not().isEmpty().withMessage('Please enter your name'),

	check('email').not().isEmpty().withMessage('Please enter your email'),

	check('description').not().isEmpty().withMessage('Please enter your message'),
]
