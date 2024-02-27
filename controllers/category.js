const Category = require('../models/category')
const Product = require('../models/product')
const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')

exports.getAll = AsyncHandler(async (req, res, next) => {
	const category = await Category.find()

	res.status(200).json({
		success: true,
		category,
	})
})

exports.getSingle = AsyncHandler(async (req, res, next) => {
	const category = await Category.findById(req.params.id)

	if (!category) {
		return next(new ErrorHandler('Category not found', 404))
	}

	res.status(200).json({
		success: true,
		category,
	})
})

exports.createCategory = AsyncHandler(async (req, res, next) => {
	const category = await Category.create(req.body)

	res.status(200).json({
		success: true,
		category,
	})
})

exports.updateCategory = AsyncHandler(async (req, res, next) => {
	let category = await Category.findById(req.params.id)

	if (!category) {
		return next(new ErrorHandler('No Category found with this ID', 404))
	}

	const products = await Product.find({ category: category.title })
	if (products) {
		let promises = []
		products.forEach((product) => {
			product.category = req.body.title
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

	await Category.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	})

	res.status(200).json({
		success: true,
	})
})

exports.deleteCategory = AsyncHandler(async (req, res, next) => {
	const category = await Category.findById(req.params.id)

	if (!category) {
		return next(new ErrorHandler('No Category found with this ID', 404))
	}

	const products = await Product.find({ category: category.title })
	if (products) {
		let promises = []
		products.forEach((product) => {
			product.category = ''
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

	await category.remove()

	res.status(200).json({
		success: true,
	})
})
