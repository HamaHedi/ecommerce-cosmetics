const Order = require('../models/order')
const Product = require('../models/product')
const Coupon = require('../models/coupon')

const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')

// Create a new order   =>  /api/order/new
exports.newOrder = AsyncHandler(async (req, res, next) => {
	const {
		orderItems,
		shippingInfo,
		itemsPrice,
		taxPrice,
		shippingPrice,
		totalPrice,
		couponCode,
		discount,
		deliveryGovernorate,
	} = req.body

	const order = await Order.create({
		orderItems,
		shippingInfo,
		itemsPrice,
		taxPrice,
		shippingPrice,
		totalPrice,
		couponCode,
		discount: discount || 0,
		deliveryGovernorate,
		user: req.user._id,
	})

	// Increment coupon usage (best-effort, never blocks the order)
	if (couponCode) {
		try {
			await Coupon.updateOne(
				{ code: String(couponCode).toUpperCase().trim() },
				{ $inc: { usedCount: 1 } }
			)
		} catch (e) {
			/* ignore */
		}
	}

	res.status(200).json({
		success: true,
		order,
	})
})

// Get single order   =>   /api/order/:id
exports.getSingleOrder = AsyncHandler(async (req, res, next) => {
	const order = await Order.findById(req.params.id).populate('user', 'name email')

	if (!order) {
		return next(new ErrorHandler('No Order found with this ID', 404))
	}

	res.status(200).json({
		success: true,
		order,
	})
})

// Get logged in user orders   =>   /api/orders/me
exports.myOrders = AsyncHandler(async (req, res, next) => {
	const orders = await Order.find({ user: req.user.id })

	res.status(200).json({
		success: true,
		orders,
	})
})

// Get all orders - ADMIN  =>   /api/admin/orders/
exports.allOrders = AsyncHandler(async (req, res, next) => {
	const orders = await Order.find()

	let totalAmount = 0

	orders.forEach((order) => {
		totalAmount += order.totalPrice
	})

	res.status(200).json({
		success: true,
		totalAmount,
		orders,
	})
})

// Update / Process order - ADMIN  =>   /api/admin/order/:id
exports.updateOrder = AsyncHandler(async (req, res, next) => {
	const order = await Order.findById(req.params.id)

	if (order.orderStatus === 'Delivered' && req.body.status === 'Delivered') {
		return next(new ErrorHandler('You have already delivered this order', 400))
	}

	// Only deduct stock when the order transitions into "Delivered" — not on
	// every update, and not for Cancelled / Returned statuses.
	if (req.body.status === 'Delivered' && order.orderStatus !== 'Delivered') {
		for (const item of order.orderItems) {
			await updateStock(item.product, item.quantity)
		}
		order.deliveredAt = Date.now()
	}

	order.orderStatus = req.body.status

	await order.save()

	res.status(200).json({
		success: true,
	})
})

async function updateStock(id, quantity) {
	const product = await Product.findById(id)

	product.stock = product.stock - quantity

	await product.save({ validateBeforeSave: false })
}

// Delete order   =>   /api/admin/order/:id
exports.deleteOrder = AsyncHandler(async (req, res, next) => {
	const order = await Order.findById(req.params.id)

	if (!order) {
		return next(new ErrorHandler('No Order found with this ID', 404))
	}

	await order.remove()

	res.status(200).json({
		success: true,
	})
})
