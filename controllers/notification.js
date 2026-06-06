const Notification = require('../models/notification')
const AsyncHandler = require('express-async-handler')

// Low-stock threshold: a product is "near empty" at or below this many units
const LOW_STOCK_THRESHOLD = 5

// --- Internal helpers (used by other controllers) ---

// Create a notification (best-effort, never throws)
async function createNotification(data) {
	try {
		return await Notification.create(data)
	} catch (e) {
		console.log('Notification create failed:', e.message)
		return null
	}
}

// Create a low-stock notification for a product, avoiding duplicate unread ones
async function notifyLowStock(product) {
	try {
		if (!product || typeof product.stock !== 'number') return
		if (product.stock > LOW_STOCK_THRESHOLD) return

		const existing = await Notification.findOne({
			type: 'low_stock',
			product: product._id,
			read: false,
		})
		if (existing) return

		const outOfStock = product.stock <= 0
		await createNotification({
			type: 'low_stock',
			title: outOfStock ? 'Stock épuisé' : 'Stock faible',
			message: outOfStock
				? `« ${product.name} » est en rupture de stock.`
				: `« ${product.name} » : plus que ${product.stock} en stock.`,
			link: `/admin/product/${product._id}`,
			product: product._id,
		})
	} catch (e) {
		console.log('notifyLowStock failed:', e.message)
	}
}

// --- Admin endpoints ---

// GET /api/admin/notifications
exports.getNotifications = AsyncHandler(async (req, res) => {
	const notifications = await Notification.find().sort('-createdAt').limit(50)
	const unread = await Notification.countDocuments({ read: false })
	res.status(200).json({ success: true, unread, notifications })
})

// PUT /api/admin/notifications/read-all
exports.markAllRead = AsyncHandler(async (req, res) => {
	await Notification.updateMany({ read: false }, { read: true })
	res.status(200).json({ success: true })
})

// PUT /api/admin/notifications/:id/read
exports.markRead = AsyncHandler(async (req, res) => {
	await Notification.findByIdAndUpdate(req.params.id, { read: true })
	res.status(200).json({ success: true })
})

// DELETE /api/admin/notifications/:id
exports.deleteNotification = AsyncHandler(async (req, res) => {
	await Notification.findByIdAndDelete(req.params.id)
	res.status(200).json({ success: true })
})

module.exports.createNotification = createNotification
module.exports.notifyLowStock = notifyLowStock
module.exports.LOW_STOCK_THRESHOLD = LOW_STOCK_THRESHOLD
