const Order = require('../models/order')
const Product = require('../models/product')
const Coupon = require('../models/coupon')

const ErrorHandler = require('../utils/errorHandler')
const AsyncHandler = require('express-async-handler')
const { sendMail } = require('../utils/mailer')
const { createNotification, notifyLowStock } = require('./notification')

// Admin email that should receive a copy of every new order
const ORDER_NOTIFY_EMAIL = 'Lyna.bourigua@gmail.com'

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

	// Admin in-app notification for the new order (best-effort)
	const itemCount = (orderItems || []).reduce(
		(acc, it) => acc + (Number(it.quantity) || 0),
		0
	)
	await createNotification({
		type: 'order',
		title: 'Nouvelle commande',
		message: `Commande de ${itemCount} article(s) — total DT ${Number(totalPrice).toFixed(2)}`,
		link: `/admin/order/${order._id}`,
		order: order._id,
	})

	// Email the admin about the new order (best-effort, fire-and-forget)
	const itemsHtml = (orderItems || [])
		.map((it) => {
			// La teinte distingue deux lignes d'un même produit : sans sa
			// référence, la commande est illisible pour la préparation.
			const teinte = it.teintRef
				? ` — teinte ${it.teintName ? `${it.teintName} ` : ''}<b>${it.teintRef}</b>`
				: ''
			return `<li>${it.name} × ${it.quantity} — DT ${Number(it.price).toFixed(
				2
			)}${teinte}</li>`
		})
		.join('')
	sendMail({
		to: ORDER_NOTIFY_EMAIL,
		subject: `🛍️ Nouvelle commande — DT ${Number(totalPrice).toFixed(2)}`,
		html: `
			<h2>Nouvelle commande reçue</h2>
			<p><b>Total :</b> DT ${Number(totalPrice).toFixed(2)}</p>
			<p><b>Livraison :</b> ${deliveryGovernorate || '—'} (DT ${Number(shippingPrice || 0).toFixed(2)})</p>
			${couponCode ? `<p><b>Code promo :</b> ${couponCode} (− DT ${Number(discount || 0).toFixed(2)})</p>` : ''}
			<p><b>Téléphone :</b> ${shippingInfo?.phoneNo || '—'}</p>
			<p><b>Adresse :</b> ${shippingInfo?.address || ''}, ${shippingInfo?.city || ''}</p>
			<h3>Articles</h3>
			<ul>${itemsHtml}</ul>
			<p>ID commande : ${order._id}</p>
		`,
	})

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

	// Notify admin if this product is now near-empty / out of stock
	await notifyLowStock(product)
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
