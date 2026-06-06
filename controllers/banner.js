const Banner = require('../models/banner')
const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')
const path = require('path')
const fs = require('fs')

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const isImage = (file) =>
	file && ALLOWED.includes(path.extname(file.name).toLowerCase())

// Public: active banners, ordered
exports.getBanners = AsyncHandler(async (req, res) => {
	const banners = await Banner.find({ active: true }).sort('sortOrder createdAt')
	res.status(200).json({ success: true, banners })
})

// Admin: all banners
exports.getAllBanners = AsyncHandler(async (req, res) => {
	const banners = await Banner.find().sort('sortOrder createdAt')
	res.status(200).json({ success: true, banners })
})

// Admin: create banner (image upload via express-fileupload, field "files")
exports.createBanner = AsyncHandler(async (req, res, next) => {
	if (!req.files || !req.files.files) {
		return next(new ErrorHandler('Aucune image envoyée !', 400))
	}
	const file = Array.isArray(req.files.files)
		? req.files.files[0]
		: req.files.files
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

	const savePath = path.join(__dirname, '../public', 'banners', fileName)
	await file.mv(savePath)

	const banner = await Banner.create({
		image: { filename: fileName, path: '/banners/' + fileName },
		title: req.body.title,
		subtitle: req.body.subtitle,
		link: req.body.link,
		sortOrder: Number(req.body.sortOrder) || 0,
		active: req.body.active === 'false' ? false : true,
	})

	res.status(201).json({ success: true, banner })
})

// Admin: update banner (active toggle / order / texts)
exports.updateBanner = AsyncHandler(async (req, res, next) => {
	const update = {}
	;['title', 'subtitle', 'link'].forEach((k) => {
		if (req.body[k] !== undefined) update[k] = req.body[k]
	})
	if (req.body.sortOrder !== undefined) update.sortOrder = Number(req.body.sortOrder)
	if (req.body.active !== undefined)
		update.active = req.body.active === 'false' ? false : !!req.body.active

	const banner = await Banner.findByIdAndUpdate(req.params.id, update, {
		new: true,
		runValidators: false,
	})
	if (!banner) return next(new ErrorHandler('Banner introuvable', 404))
	res.status(200).json({ success: true, banner })
})

// Admin: delete banner (+ file)
exports.deleteBanner = AsyncHandler(async (req, res, next) => {
	const banner = await Banner.findById(req.params.id)
	if (!banner) return next(new ErrorHandler('Banner introuvable', 404))
	try {
		const p = path.join(__dirname, '../public', banner.image.path)
		if (fs.existsSync(p)) fs.unlinkSync(p)
	} catch (e) {
		/* ignore file errors */
	}
	await banner.deleteOne()
	res.status(200).json({ success: true, message: 'Banner supprimé' })
})
