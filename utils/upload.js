const multer = require('multer')
const path = require('path')

const storageProduct = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/products/')
	},
	filename: function (req, file, cb) {
		const uniqueSuffix =
			Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
		cb(null, path.parse(file.originalname).name + '-' + uniqueSuffix)
	},
})

exports.uploadProduct = multer({
	storage: storageProduct,
	limits: {
		fileSize: 1024 * 1024 * 10,
	},
	fileFilter: (req, file, cb) => {
		if (
			file.mimetype == 'image/png' ||
			file.mimetype == 'image/jpg' ||
			file.mimetype == 'image/jpeg'
		) {
			cb(null, true)
		} else {
			cb(null, false)
			return cb(new Error('Only .png, .jpg and .jpeg format allowed!'))
		}
	},
})

const storageUser = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/users/')
	},
	filename: function (req, file, cb) {
		const uniqueSuffix =
			Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
		cb(null, path.parse(file.originalname).name + '-' + uniqueSuffix)
	},
})

exports.uploadUser = multer({
	storage: storageUser,
	limits: {
		fileSize: 1024 * 1024 * 10,
	},
	fileFilter: (req, file, cb) => {
		if (
			file.mimetype == 'image/png' ||
			file.mimetype == 'image/jpg' ||
			file.mimetype == 'image/jpeg'
		) {
			cb(null, true)
		} else {
			cb(null, false)
			return cb(new Error('Only .png, .jpg and .jpeg format allowed!'))
		}
	},
})
