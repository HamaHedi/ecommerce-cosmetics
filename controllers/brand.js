const Product = require('../models/product')
const ErrorHandler = require('../utils/errorHandler')
const APIFeatures = require('../utils/apiFeatures')
const AsyncHandler = require('express-async-handler')
const ObjectID = require('mongodb').ObjectId
const path = require('path')
const fs = require('fs')
const Brand = require('../models/brand')




exports.getBrands = AsyncHandler(async (req, res, next) => {
	const resPerPage = 8
	const brandsCount = await Brand.countDocuments()

	const apiFeaturesCountTest = new APIFeatures(Brand.find(), req.query).search().filter()
	const brandsCountTest = await apiFeaturesCountTest.query
	const filteredBrandsCount = brandsCountTest.length

	const apiFeatures = new APIFeatures(Brand.find(), req.query)
		.search()
		.filter()
		.pagination(resPerPage)

	const brands = await apiFeatures.query

	res.status(200).json({
		success: true,
		brandsCount,
		resPerPage,
		filteredBrandsCount,
		brands,
	})
})

// @desc    Get Single Product
// @route   GET /api/products/:id
// @access  Public
exports.getSingleBrand = AsyncHandler(async (req, res, next) => {
	const brand = await Brand.findById(req.params.id)

	if (!brand) {
		return next(new ErrorHandler('Brand not found', 404))
	}

	res.status(200).json({
		success: true,
		brand,
	})
})



// @desc    Create Product
// @route   POST /api/admin/products
// @access  Private
// @Role 	admin
exports.createBrand = AsyncHandler(async (req, res, next) => {
	if (!req.files) {
		return next(new ErrorHandler('No image uploaded!', 400))
	}
console.log(req.body)
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

					const savePath = path.join(__dirname, '../public', 'brands', fileName)

					promises.push(file.mv(savePath))

					images.push({
						filename: fileName,
						path: '/brands/' + fileName,
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

				const savePath = path.join(__dirname, '../public', 'brands', fileName)

				await files.mv(savePath)

				images.push({
					filename: fileName,
					path: '/brands/' + fileName,
				})
			}
		}

		if (images.length === 0) {
			return next(new ErrorHandler('Only .png, .jpg and .jpeg format allowed!', 400))
		}

		req.body.images = images

		const brand = await Brand.create(req.body)

		res.status(201).json({
			success: true,
			brand,
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
// exports.updateProduct = AsyncHandler(async (req, res, next) => {
// 	let product = await Product.findById(req.params.id)

// 	if (!product) {
// 		return next(new ErrorHandler('Product not found', 404))
// 	}
// 	if (req.body.subcategory) {
// 		product.subcategory = req.body.subcategory;
// 	}

// 	if (req.files) {
// 		product.images.forEach(async (image) => {
// 			let imagePath = path.join(__dirname, '../public', image.path)

// 			if (fs.existsSync(imagePath)) {
// 				await fs.unlink(imagePath, async (err) => {
// 					console.log('file deleted successfully')
// 				})
// 			}
// 		})

// 		try {
// 			const files = req.files.files
// 			let images = []

// 			if (Array.isArray(files)) {
// 				//multiple files
// 				let promises = []

// 				files.forEach((file) => {
// 					if (check(file)) {
// 						const fileName =
// 							path.parse(file.name).name +
// 							'-' +
// 							Date.now() +
// 							'-' +
// 							Math.round(Math.random() * 1e9) +
// 							path.extname(file.name)

// 						const savePath = path.join(__dirname, '../public', 'products', fileName)

// 						promises.push(file.mv(savePath))

// 						images.push({
// 							filename: fileName,
// 							path: '/products/' + fileName,
// 						})
// 					}
// 				})

// 				await Promise.all(promises)
// 			} else {
// 				// single file
// 				if (check(files)) {
// 					const fileName =
// 						path.parse(files.name).name +
// 						'-' +
// 						Date.now() +
// 						'-' +
// 						Math.round(Math.random() * 1e9) +
// 						path.extname(files.name)

// 					const savePath = path.join(__dirname, '../public', 'products', fileName)

// 					await files.mv(savePath)

// 					images.push({
// 						filename: fileName,
// 						path: '/products/' + fileName,
// 					})
// 				}
// 			}

// 			if (images.length === 0) {
// 				return next(new ErrorHandler('Only .png, .jpg and .jpeg format allowed!', 400))
// 			}

// 			req.body.images = images
// 		} catch (error) {
// 			return next(new ErrorHandler('Error uploading files!', 400))
// 		}
// 	}
// 	product = await Product.findByIdAndUpdate(req.params.id, req.body, {
// 		new: true,
// 		runValidators: true,
// 		useFindAndModify: false,
// 	})

// 	res.status(200).json({
// 		success: true,
// 		product,
// 	})

// 	function check(file) {
// 		if (
// 			(file.mimetype === 'image/png' ||
// 				file.mimetype === 'image/jpg' ||
// 				file.mimetype === 'image/jpeg') &&
// 			!file.truncated
// 		) {
// 			return true
// 		}
// 		return false
// 	}
// })

// // @desc    Delete Product
// // @route   DELETE /api/products/:id
// // @access  Private
// // @Role 	admin
exports.deleteBrand = AsyncHandler(async (req, res, next) => {
	console.log(req.params.id)
	let brand = await Brand.findById(req.params.id)
    console.log(brand)
	if (!brand) {
		return next(new ErrorHandler('Brand not found', 404))
	}

	brand.images.forEach(async (image) => {
		let imagePath = path.join(__dirname, '../public', image.path)

		if (fs.existsSync(imagePath)) {
			await fs.unlink(imagePath, async (err) => {
				console.log('file deleted successfully')
			})
		}
	})

	await brand.remove()

	res.status(200).json({
		success: true,
		message: 'Brand deleted successfully',
	})
})

