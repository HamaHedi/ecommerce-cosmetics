const express = require('express')
const router = express.Router()
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const { getBrands, getSingleBrand, createBrand } = require('../controllers/brand')

router.route('/brands').get(getBrands)

router.route('/brands/:id').get(getSingleBrand)

router
	.route('/brands')
	.post(
		// isAuthenticatedUser,
		// authorizeRoles('admin'),
		createBrand
	)
// router
// 	.route('/admin/brands/:id')
// 	.put(
// 		isAuthenticatedUser,
// 		authorizeRoles('admin'),
// 		updateB
// 	)
// 	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct)


module.exports = router
