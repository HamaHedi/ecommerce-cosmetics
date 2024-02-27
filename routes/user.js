const express = require('express')
const router = express.Router()

const {
	register,
	login,
	logout,
	forgotPassword,
	resetPassword,
	getUserProfile,
	updatePassword,
	updateProfile,
	allUsers,
	getUserDetails,
	updateUser,
	deleteUser,
} = require('../controllers/user')

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

// Import Validators
const { runValidation } = require('../validators')
const {
	userRegisterValidator,
	userLoginValidator,
	userPasswordForgotValidator,
	userPasswordResetValidator,
	userPasswordUpdateValidator,
	userProfileUpdateValidator,
	userUpdateValidator,
} = require('../validators/user')

router.route('/register').post(userRegisterValidator, runValidation, register)
router.route('/login').post(userLoginValidator, runValidation, login)
router.route('/logout').get(logout)
router.route('/password/forgot').post(userPasswordForgotValidator, runValidation, forgotPassword)
router.route('/password/reset/:token').put(userPasswordResetValidator, runValidation, resetPassword)

router.route('/me').get(isAuthenticatedUser, getUserProfile)
router
	.route('/password/update')
	.put(isAuthenticatedUser, userPasswordUpdateValidator, runValidation, updatePassword)
router
	.route('/me/update')
	.put(isAuthenticatedUser, userProfileUpdateValidator, runValidation, updateProfile)

router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles('admin'), allUsers)
router
	.route('/admin/users/:id')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getUserDetails)
	.put(
		isAuthenticatedUser,
		authorizeRoles('admin'),
		userUpdateValidator,
		runValidation,
		updateUser
	)
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser)

module.exports = router
