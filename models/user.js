const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			maxLength: 30,
		},
		about: String,
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false,
		},
		avatar: {
			type: String,
			default: '/users/default-user.png',
		},
		role: {
			type: String,
			default: 'user',
		},
		resetPasswordToken: String,
		resetPasswordExpire: Date,
	},
	{
		timestamps: true,
	}
)

// Encrypting password before saving user
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next()
	}

	this.password = await bcrypt.hash(this.password, 10)
})

// Compare user password
userSchema.methods.comparePassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password)
}

// Return JWT token
userSchema.methods.getJwtToken = function () {
	return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_TIME,
	})
}

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
	// Generate token
	const resetToken = crypto.randomBytes(20).toString('hex')

	// Hash and set to resetPasswordToken
	this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

	// Set token expire time
	this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

	return resetToken
}

module.exports = mongoose.model('User', userSchema)
