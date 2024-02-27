const Product = require('../models/product')
const ErrorHandler = require('../utils/errorHandler')
const APIFeatures = require('../utils/apiFeatures')
const AsyncHandler = require('express-async-handler')
const ObjectID = require('mongodb').ObjectId
const path = require('path')
const fs = require('fs')

// @desc    Get All Products?keyword=
// @route   GET /api/products
// @access  Public
exports.getProducts = AsyncHandler(async (req, res, next) => {
	const resPerPage = 6
	const productsCount = await Product.countDocuments()

	const apiFeaturesCountTest = new APIFeatures(Product.find(), req.query).search().filter()
	const productsCountTest = await apiFeaturesCountTest.query
	const filteredProductsCount = productsCountTest.length

	const apiFeatures = new APIFeatures(Product.find(), req.query)
		.search()
		.filter()
		.pagination(resPerPage)

	const products = await apiFeatures.query

	res.status(200).json({
		success: true,
		productsCount,
		resPerPage,
		filteredProductsCount,
		products,
	})
})

// @desc    Get Single Product
// @route   GET /api/products/:id
// @access  Public
exports.getSingleProduct = AsyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.params.id)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	res.status(200).json({
		success: true,
		product,
	})
})

// Get all products (Admin)  =>   /api/admin/products
exports.getAdminProducts = AsyncHandler(async (req, res, next) => {
	const products = await Product.find()

	res.status(200).json({
		success: true,
		products,
	})
})

// @desc    Create Product
// @route   POST /api/admin/products
// @access  Private
// @Role 	admin
exports.createProduct = AsyncHandler(async (req, res, next) => {
	if (!req.files) {
		return next(new ErrorHandler('No image uploaded!', 400))
	}

	try {
		const files = req.files.files
		let images = []

		if (Array.isArray(files)) {
			//multiple files
			let promises = []

			files.forEach((file) => {
				if (check(file)) {
					const fileName =
						path.parse(file.name).name +
						'-' +
						Date.now() +
						'-' +
						Math.round(Math.random() * 1e9) +
						path.extname(file.name)

					const savePath = path.join(__dirname, '../public', 'products', fileName)

					promises.push(file.mv(savePath))

					images.push({
						filename: fileName,
						path: '/products/' + fileName,
					})
				}
			})

			await Promise.all(promises)
		} else {
			// single file
			if (check(files)) {
				const fileName =
					path.parse(files.name).name +
					'-' +
					Date.now() +
					'-' +
					Math.round(Math.random() * 1e9) +
					path.extname(files.name)

				const savePath = path.join(__dirname, '../public', 'products', fileName)

				await files.mv(savePath)

				images.push({
					filename: fileName,
					path: '/products/' + fileName,
				})
			}
		}

		if (images.length === 0) {
			return next(new ErrorHandler('Only .png, .jpg and .jpeg format allowed!', 400))
		}

		req.body.images = images

		const product = await Product.create(req.body)

		res.status(201).json({
			success: true,
			product,
		})
	} catch (error) {
		return next(new ErrorHandler('Error uploading files!', 400))
	}

	function check(file) {
		if (
			(file.mimetype === 'image/png' ||
				file.mimetype === 'image/jpg' ||
				file.mimetype === 'image/jpeg') &&
			!file.truncated
		) {
			return true
		}
		return false
	}
})

// @desc    Update Product
// @route   PUT /api/admin/products/:id
// @access  Private
// @Role 	admin
exports.updateProduct = AsyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	if (req.files) {
		product.images.forEach(async (image) => {
			let imagePath = path.join(__dirname, '../public', image.path)

			if (fs.existsSync(imagePath)) {
				await fs.unlink(imagePath, async (err) => {
					console.log('file deleted successfully')
				})
			}
		})

		try {
			const files = req.files.files
			let images = []

			if (Array.isArray(files)) {
				//multiple files
				let promises = []

				files.forEach((file) => {
					if (check(file)) {
						const fileName =
							path.parse(file.name).name +
							'-' +
							Date.now() +
							'-' +
							Math.round(Math.random() * 1e9) +
							path.extname(file.name)

						const savePath = path.join(__dirname, '../public', 'products', fileName)

						promises.push(file.mv(savePath))

						images.push({
							filename: fileName,
							path: '/products/' + fileName,
						})
					}
				})

				await Promise.all(promises)
			} else {
				// single file
				if (check(files)) {
					const fileName =
						path.parse(files.name).name +
						'-' +
						Date.now() +
						'-' +
						Math.round(Math.random() * 1e9) +
						path.extname(files.name)

					const savePath = path.join(__dirname, '../public', 'products', fileName)

					await files.mv(savePath)

					images.push({
						filename: fileName,
						path: '/products/' + fileName,
					})
				}
			}

			if (images.length === 0) {
				return next(new ErrorHandler('Only .png, .jpg and .jpeg format allowed!', 400))
			}

			req.body.images = images
		} catch (error) {
			return next(new ErrorHandler('Error uploading files!', 400))
		}
	}

	product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	})

	res.status(200).json({
		success: true,
		product,
	})

	function check(file) {
		if (
			(file.mimetype === 'image/png' ||
				file.mimetype === 'image/jpg' ||
				file.mimetype === 'image/jpeg') &&
			!file.truncated
		) {
			return true
		}
		return false
	}
})

// @desc    Delete Product
// @route   DELETE /api/products/:id
// @access  Private
// @Role 	admin
exports.deleteProduct = AsyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	product.images.forEach(async (image) => {
		let imagePath = path.join(__dirname, '../public', image.path)

		if (fs.existsSync(imagePath)) {
			await fs.unlink(imagePath, async (err) => {
				console.log('file deleted successfully')
			})
		}
	})

	await product.remove()

	res.status(200).json({
		success: true,
		message: 'Product deleted successfully',
	})
})

// @desc    Create new review
// @route   PUT /api/review
// @access  Private
exports.createProductReview = AsyncHandler(async (req, res, next) => {
	const { rating, comment, productId } = req.body

	const review = {
		user: req.user._id,
		name: req.user.name,
		avatar: req.user.avatar,
		rating: Number(rating),
		comment,
	}

	const product = await Product.findById(productId)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	const isReviewed = product.reviews.find((r) => r.user.toString() === req.user._id.toString())

	if (isReviewed) {
		product.reviews.forEach((review) => {
			if (review.user.toString() === req.user._id.toString()) {
				review.comment = comment
				review.rating = rating
			}
		})
	} else {
		product.reviews.push(review)
		product.numOfReviews = product.reviews.length
	}

	product.ratings =
		product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

	await product.save({ validateBeforeSave: false })

	res.status(200).json({
		success: true,
	})
})

// @desc    Get Product Reviews
// @route   GET /api/reviews?id={id}
// @access  Public
exports.getProductReviews = AsyncHandler(async (req, res, next) => {
	if (!ObjectID.isValid(req.query.id)) {
		return next(new ErrorHandler('invalid id!', 400))
	}

	const product = await Product.findById(req.query.id)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	res.status(200).json({
		success: true,
		reviews: product.reviews,
	})
})

// @desc    Delete Product Review
// @route   DELETE /api/reviews?productId={id}&id={id}
// @access  Private
exports.deleteReview = AsyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.query.productId)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	const reviews = product.reviews.filter(
		(review) => review._id.toString() !== req.query.id.toString()
	)

	const numOfReviews = reviews.length

	const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

	await Product.findByIdAndUpdate(
		req.query.productId,
		{
			reviews,
			ratings,
			numOfReviews,
		},
		{
			new: true,
			runValidators: true,
			useFindAndModify: false,
		}
	)

	res.status(200).json({
		success: true,
	})
})
