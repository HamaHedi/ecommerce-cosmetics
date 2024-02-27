const User = require('../models/user')
const { check } = require('express-validator')

exports.userRegisterValidator = [
	check('name')
		.not()
		.isEmpty()
		.withMessage('Please enter name')
		.isLength({ max: 30 })
		.withMessage('Name cannot exceed 30 characters'),

	check('email')
		.isEmail()
		.withMessage('Must be a valid email address')
		.custom((value, { req }) => {
			return new Promise((resolve, reject) => {
				User.findOne({ email: req.body.email }, function (err, user) {
					if (err) {
						reject(new Error('Server Error'))
					}

					if (Boolean(user)) {
						reject(new Error('Email already exists'))
					}

					resolve(true)
				})
			})
		}),

	check('password')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters long'),
]

exports.userLoginValidator = [
	check('email').isEmail().withMessage('Must be a valid email address'),

	check('password')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters long'),
]

exports.userPasswordForgotValidator = [
	check('email').isEmail().withMessage('Must be a valid email address'),
]

exports.userPasswordResetValidator = [
	check('password')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters long'),

	check('confirmPassword')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters long'),
]

exports.userPasswordUpdateValidator = [
	check('password')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters long'),

	check('oldPassword')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters long'),
]

exports.userProfileUpdateValidator = [
	check('name')
		.not()
		.isEmpty()
		.withMessage('Please enter name')
		.isLength({ max: 30 })
		.withMessage('Name cannot exceed 30 characters'),

	check('email')
		.isEmail()
		.withMessage('Must be a valid email address')
		.custom((value, { req }) => {
			return new Promise((resolve, reject) => {
				if (req.user.email === req.body.email) {
					resolve(true)
				} else {
					User.findOne({ email: req.body.email }, function (err, user) {
						if (err) {
							reject(new Error('Server Error'))
						}

						if (Boolean(user)) {
							reject(new Error('Email already exists'))
						}

						resolve(true)
					})
				}
			})
		}),
]

exports.userUpdateValidator = [
	check('name')
		.not()
		.isEmpty()
		.withMessage('Please enter name')
		.isLength({ max: 30 })
		.withMessage('Name cannot exceed 30 characters'),

	check('email').isEmail().withMessage('Must be a valid email address'),

	check('role').not().isEmpty().withMessage('Please enter role'),
]
