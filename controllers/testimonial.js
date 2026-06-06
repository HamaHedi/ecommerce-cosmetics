const Testimonial = require('../models/testimonial')
const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')
const path = require('path')
const fs = require('fs')

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const isImage = (file) =>
	file && ALLOWED.includes(path.extname(file.name).toLowerCase())

// Public: approved testimonials for the home "Avis de nos clients" section
exports.getApprovedTestimonials = AsyncHandler(async (req, res) => {
	const testimonials = await Testimonial.find({ approved: true }).sort('-createdAt').limit(30)
	res.status(200).json({ success: true, count: testimonials.length, testimonials })
})

// Public: submit an opinion (optionally with an image). Stays unapproved.
exports.createTestimonial = AsyncHandler(async (req, res, next) => {
	const { name, role, text, rating } = req.body

	if (!name || !String(name).trim() || !text || !String(text).trim()) {
		return next(new ErrorHandler('Nom et avis sont requis', 400))
	}

	let image
	if (req.files && req.files.files) {
		const file = Array.isArray(req.files.files) ? req.files.files[0] : req.files.files
		if (!isImage(file)) {
			return next(new ErrorHandler('Format d’image non supporté', 400))
		}
		const fileName =
			path.parse(file.name).name +
			'-' +
			Date.now() +
			'-' +
			Math.round(Math.random() * 1e9) +
			path.extname(file.name)
		const savePath = path.join(__dirname, '../public', 'testimonials', fileName)
		await file.mv(savePath)
		image = { filename: fileName, path: '/testimonials/' + fileName }
	}

	const testimonial = await Testimonial.create({
		name: String(name).trim(),
		role: role ? String(role).trim() : undefined,
		text: String(text).trim(),
		rating: Math.min(5, Math.max(1, Number(rating) || 5)),
		image,
		user: req.user ? req.user._id : undefined,
		approved: false,
	})

	res.status(201).json({
		success: true,
		message: 'Merci ! Votre avis sera publié après validation.',
		testimonial,
	})
})

// Admin: list every testimonial (approved or pending)
exports.getAllTestimonials = AsyncHandler(async (req, res) => {
	const testimonials = await Testimonial.find().sort('-createdAt')
	res.status(200).json({ success: true, count: testimonials.length, testimonials })
})

// Admin: approve / unapprove a testimonial
exports.updateTestimonial = AsyncHandler(async (req, res, next) => {
	const testimonial = await Testimonial.findById(req.params.id)
	if (!testimonial) return next(new ErrorHandler('Avis introuvable', 404))

	if (req.body.approved !== undefined) {
		testimonial.approved =
			req.body.approved === false || req.body.approved === 'false' ? false : true
	}
	await testimonial.save()

	res.status(200).json({ success: true, testimonial })
})

// Admin: delete a testimonial (+ its image file)
exports.deleteTestimonial = AsyncHandler(async (req, res, next) => {
	const testimonial = await Testimonial.findById(req.params.id)
	if (!testimonial) return next(new ErrorHandler('Avis introuvable', 404))

	if (testimonial.image && testimonial.image.path) {
		try {
			const p = path.join(__dirname, '../public', testimonial.image.path)
			if (fs.existsSync(p)) fs.unlinkSync(p)
		} catch (e) {
			/* ignore file errors */
		}
	}

	await testimonial.deleteOne()
	res.status(200).json({ success: true, message: 'Avis supprimé' })
})
