const StockAlert = require('../models/stockAlert')
const Product = require('../models/product')
const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')

// Public: subscribe to a back-in-stock alert  =>  POST /api/products/:id/notify
exports.subscribeStockAlert = AsyncHandler(async (req, res, next) => {
	const { email } = req.body
	if (!email) return next(new ErrorHandler('Email requis', 400))

	const product = await Product.findById(req.params.id)
	if (!product) return next(new ErrorHandler('Produit introuvable', 404))

	const exists = await StockAlert.findOne({
		product: product._id,
		email: String(email).toLowerCase().trim(),
		notified: false,
	})
	if (!exists) {
		await StockAlert.create({
			product: product._id,
			productName: product.name,
			email: String(email).toLowerCase().trim(),
		})
	}

	res.status(201).json({
		success: true,
		message: 'Vous serez prévenu dès le retour en stock.',
	})
})

// Admin: list pending alerts  =>  GET /api/admin/stock-alerts
exports.getStockAlerts = AsyncHandler(async (req, res) => {
	const alerts = await StockAlert.find({ notified: false }).sort('-createdAt')

	// group counts per product (handy summary)
	const summary = {}
	alerts.forEach((a) => {
		const key = a.productName || String(a.product)
		summary[key] = (summary[key] || 0) + 1
	})

	res.status(200).json({ success: true, count: alerts.length, alerts, summary })
})
