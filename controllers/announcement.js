const Announcement = require('../models/announcement')
const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')

// Public: active announcements for the home announce bar
exports.getAnnouncements = AsyncHandler(async (req, res) => {
	const announcements = await Announcement.find({ active: true }).sort('order createdAt')
	res.status(200).json({ success: true, count: announcements.length, announcements })
})

// Admin: list every announcement (active or not)
exports.getAllAnnouncements = AsyncHandler(async (req, res) => {
	const announcements = await Announcement.find().sort('order createdAt')
	res.status(200).json({ success: true, count: announcements.length, announcements })
})

// Admin: create an announcement
exports.createAnnouncement = AsyncHandler(async (req, res, next) => {
	const { text, icon, order, active } = req.body

	if (!text || !String(text).trim()) {
		return next(new ErrorHandler('Announcement text is required', 400))
	}

	const announcement = await Announcement.create({
		text: String(text).trim(),
		icon: icon ? String(icon).trim() : undefined,
		order: Number(order) || 0,
		active: active === undefined ? true : !!active,
	})

	res.status(201).json({ success: true, announcement })
})

// Admin: update an announcement (text / icon / order / active toggle)
exports.updateAnnouncement = AsyncHandler(async (req, res, next) => {
	const announcement = await Announcement.findById(req.params.id)
	if (!announcement) return next(new ErrorHandler('Announcement not found', 404))

	const { text, icon, order, active } = req.body
	if (text !== undefined) announcement.text = String(text).trim()
	if (icon !== undefined) announcement.icon = String(icon).trim()
	if (order !== undefined) announcement.order = Number(order) || 0
	if (active !== undefined) announcement.active = !!active

	await announcement.save()
	res.status(200).json({ success: true, announcement })
})

// Admin: delete an announcement
exports.deleteAnnouncement = AsyncHandler(async (req, res, next) => {
	const announcement = await Announcement.findById(req.params.id)
	if (!announcement) return next(new ErrorHandler('Announcement not found', 404))
	await announcement.deleteOne()
	res.status(200).json({ success: true, message: 'Announcement deleted' })
})
