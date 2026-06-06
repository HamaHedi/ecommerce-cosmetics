const express = require('express')
const router = express.Router()

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
const {
	getApprovedTestimonials,
	createTestimonial,
	getAllTestimonials,
	updateTestimonial,
	deleteTestimonial,
} = require('../controllers/testimonial')

// Public: read approved testimonials + submit a new opinion
router.route('/testimonials').get(getApprovedTestimonials).post(createTestimonial)

// Admin: moderate testimonials
router
	.route('/admin/testimonials')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getAllTestimonials)
router
	.route('/admin/testimonials/:id')
	.put(isAuthenticatedUser, authorizeRoles('admin'), updateTestimonial)
	.delete(isAuthenticatedUser, authorizeRoles('admin'), deleteTestimonial)

module.exports = router
