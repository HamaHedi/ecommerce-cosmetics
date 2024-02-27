const express = require('express')
const router = express.Router()

const {
	getAll,
	getSingle,
	createCategory,
	updateCategory,
	deleteCategory,
} = require('../controllers/category')

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

// Import Validators
const { runValidation } = require('../validators')
const { categoryValidator } = require('../validators/category')

router
	.route('/admin/category')
	.get(getAll)
	.post(
		isAuthenticatedUser,
		authorizeRoles('admin'),
		categoryValidator,
		runValidation,
		createCategory
	)

router
	.route('/admin/category/:id')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getSingle)
	.put(
		isAuthenticatedUser,
		authorizeRoles('admin'),
		categoryValidator,
		runValidation,
		updateCategory
	)
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCategory)

module.exports = router
