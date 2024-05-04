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

// @desc    Update Brnad
// @route   PUT /api/admin/products/:id
// @access  Private
// @Role 	admin
exports.updateBrand = AsyncHandler(async (req, res, next) => {
	let brand = await Brand.findById(req.params.id)

	if (!brand) {
		return next(new ErrorHandler('Brand not found', 404))
	}
	const oldTitle = brand.title;
    const newTitle = req.body.title;

    // Find products associated with the old subcategory
    const products = await Product.find({ brand: oldTitle });

    if (products.length > 0) {
        let promises = [];

        // Update category for each product
        products.forEach((product) => {
            product.category = newTitle;
            promises.push(
                Product.findByIdAndUpdate(product._id, product, {
                    new: true,
                    runValidators: true,
                    useFindAndModify: false,
                })
            );
        });

        await Promise.all(promises);
    }

	if (req.files) {
		brand.images.forEach(async (image) => {
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
		} catch (error) {
			return next(new ErrorHandler('Error uploading files!', 400))
		}
	}
	brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	})

	res.status(200).json({
		success: true,
		brand,
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




exports.deleteBrand = AsyncHandler(async (req, res, next) => {
	const brand = await Brand.findById(req.params.id)

	if (!brand) {
		return next(new ErrorHandler('No Brand found with this ID', 404))
	}

	const products = await Product.find({ brand: brand.title })
	if (products) {
		let promises = []
		products.forEach((product) => {
			product.brand = ''
			promises.push(
				Product.findByIdAndUpdate(product._id, product, {
					new: true,
					runValidators: true,
					useFindAndModify: false,
				})
			)
		})
		await Promise.all(promises)
	}

	await brand.remove()

	res.status(200).json({
		success: true,
	})
})
