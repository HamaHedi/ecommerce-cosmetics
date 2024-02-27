const User = require('../models/user')
const Product = require('../models/product')
const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')
const sendToken = require('../utils/jwtToken')
const crypto = require('crypto')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const path = require('path')
const fs = require('fs')

// @desc    Register user
// @route   POST /api/register
// @access  Public
exports.register = AsyncHandler(async (req, res, next) => {
	const user = await User.create(req.body)

	sendToken(user, 200, res)
})

// @desc    Login user
// @route   POST /api/login
// @access  Public
exports.login = AsyncHandler(async (req, res, next) => {
	const { email, password } = req.body

	const user = await User.findOne({ email }).select('+password')

	if (!user || !(await user.comparePassword(password))) {
		return next(new ErrorHandler('Invalid email or password!', 401))
	}

	sendToken(user, 200, res)
})

// @desc    Logout user
// @route   GET /api/logout
// @access  Public
exports.logout = AsyncHandler(async (req, res, next) => {
	res.cookie('token', null, {
		expires: new Date(Date.now()),
		httpOnly: true,
	})

	res.status(200).json({
		success: true,
		message: 'Logged out',
	})
})

// @desc    Forgot password
// @route   POST /api/password/forgot
// @access  Public
exports.forgotPassword = AsyncHandler(async (req, res, next) => {
	const { email } = req.body

	const user = await User.findOne({ email })

	if (!user) {
		return next(new ErrorHandler('User not found with this email!', 404))
	}

	// Get reset token
	const resetToken = user.getResetPasswordToken()

	await user.save({ validateBeforeSave: false })

	// Create reset password url
	let resetUrl = `${req.protocol}://${req.get('host')}/password/reset/${resetToken}`
	// let resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`

	const emailData = {
		from: process.env.EMAIL_FROM,
		to: email,
		subject: `Password Recovery`,
		html: `
                <h1>Your password reset token is as follow:</h1>
                <a href="${resetUrl}">${resetUrl}</a>
                <hr />
                <p>If you have not requested this email, then ignore it.</p>
            `,
	}

	sgMail
		.send(emailData)
		.then((sent) => {
			return res.json({
				message: `Email has been sent to ${email}. Follow the instruction to reset your password.`,
			})
		})
		.catch(async (err) => {
			user.resetPasswordToken = undefined
			user.resetPasswordExpire = undefined

			await user.save({ validateBeforeSave: false })

			return next(new ErrorHandler(err.message, 500))
		})
})

// @desc    Reset Password
// @route   PUT /api/password/reset/:token
// @access  Public
exports.resetPassword = AsyncHandler(async (req, res, next) => {
	// Hash URL Token
	const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: { $gt: Date.now() },
	})

	if (!user) {
		return next(new ErrorHandler('Password reset token is invalid or has been expired!', 400))
	}

	if (req.body.password !== req.body.confirmPassword) {
		return next(new ErrorHandler('Password does not match!', 400))
	}

	// Setup new password
	user.password = req.body.password

	user.resetPasswordToken = undefined
	user.resetPasswordExpire = undefined

	await user.save()

	sendToken(user, 200, res)
})

// @desc    Get currently logged in user details
// @route   GET /api/me
// @access  Private
exports.getUserProfile = AsyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id)

	res.status(200).json({
		success: true,
		user,
	})
})

// @desc    Change password
// @route   PUT /api/password/update
// @access  Private
exports.updatePassword = AsyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id).select('+password')

	// Check previous user password
	const isMatched = await user.comparePassword(req.body.oldPassword)
	if (!isMatched) {
		return next(new ErrorHandler('Old password is incorrect!', 400))
	}

	user.password = req.body.password
	await user.save()

	sendToken(user, 200, res)
})

// @desc    Update user profile
// @route   PUT /api/me/update
// @access  Private
exports.updateProfile = AsyncHandler(async (req, res, next) => {
	try {
		if (req.files) {
			const file = req.files.file

			let user = await User.findById(req.user.id)

			let imagePath = path.join(__dirname, '../public', user.avatar)
			if (fs.existsSync(imagePath) && user.avatar !== '/users/default-user.png') {
				await fs.unlink(imagePath, async (err) => {
					console.log('user photo deleted successfully')
				})
			}

			if (
				(file.mimetype === 'image/png' ||
					file.mimetype === 'image/jpg' ||
					file.mimetype === 'image/jpeg') &&
				!file.truncated
			) {
				const fileName =
					path.parse(file.name).name +
					'-' +
					Date.now() +
					'-' +
					Math.round(Math.random() * 1e9) +
					path.extname(file.name)

				const savePath = path.join(__dirname, '../public', 'users', fileName)

				await file.mv(savePath)

				req.body.avatar = `/users/${fileName}`
			} else {
				return next(new ErrorHandler('Only png, jpg, jpeg files are allowed', 400))
			}
		}

		const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
			new: true,
			runValidators: true,
			useFindAndModify: false,
		})

		res.status(200).json({
			success: true,
			user: updatedUser,
		})
	} catch (error) {
		return next(new ErrorHandler('Error uploading file!', 400))
	}
})

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private
// @Role 	admin
exports.allUsers = AsyncHandler(async (req, res, next) => {
	const users = await User.find()

	res.status(200).json({
		success: true,
		users,
	})
})

// @desc    Get user details
// @route   GET /api/admin/user/:id
// @access  Private
// @Role 	admin
exports.getUserDetails = AsyncHandler(async (req, res, next) => {
	const user = await User.findById(req.params.id)

	if (!user) {
		return next(new ErrorHandler(`User does not found with id: ${req.params.id}!`))
	}

	res.status(200).json({
		success: true,
		user,
	})
})

// @desc    Update user profile
// @route   PUT /api/admin/user/:id
// @access  Private
// @Role 	admin
exports.updateUser = AsyncHandler(async (req, res, next) => {
	const newUserData = {
		name: req.body.name,
		email: req.body.email,
		role: req.body.role,
	}

	const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	})

	res.status(200).json({
		success: true,
		user,
	})
})

// @desc    Delete user
// @route   DELETE /api/admin/user/:id
// @access  Private
// @Role 	admin
exports.deleteUser = AsyncHandler(async (req, res, next) => {
	const user = await User.findById(req.params.id)

	if (!user) {
		return next(new ErrorHandler(`User does not found with id: ${req.params.id}!`))
	}

	let imagePath = path.join(__dirname, '../public', user.avatar)
	if (fs.existsSync(imagePath) && user.avatar !== '/users/default-user.png') {
		await fs.unlink(path.join(__dirname, '../public', user.avatar), async (err) => {
			console.log('user photo deleted successfully')
		})
	}

	const products = await Product.find({ user: req.params.id })

	products.forEach(async (product) => {
		product.user = null

		await Product.findByIdAndUpdate(product._id, product, {
			new: true,
			runValidators: true,
			useFindAndModify: false,
		})
	})

	await user.remove()

	res.status(200).json({
		success: true,
	})
})
