const express = require('express')
const router = express.Router()

const {
	getProducts,
	getSingleProduct,
	getAdminProducts,
	createProduct,
	updateProduct,
	deleteProduct,
	createProductReview,
	getProductReviews,
	deleteReview,
} = require('../controllers/product')

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

// Import Validators
const { runValidation } = require('../validators')
const { productValidator, productReviewValidator } = require('../validators/product')

router.route('/products').get(getProducts)
router.route('/products/:id').get(getSingleProduct)

router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts)
router
	.route('/admin/products')
	.post(
		isAuthenticatedUser,
		authorizeRoles('admin'),
		productValidator,
		runValidation,
		createProduct
	)
router
	.route('/admin/products/:id')
	.put(
		isAuthenticatedUser,
		authorizeRoles('admin'),
		productValidator,
		runValidation,
		updateProduct
	)
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct)

router
	.route('/review')
	.put(isAuthenticatedUser, productReviewValidator, runValidation, createProductReview)
router.route('/reviews').get(getProductReviews)
router.route('/reviews').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteReview)

module.exports = router
