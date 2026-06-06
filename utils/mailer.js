const nodemailer = require('nodemailer')

// Shared Gmail transporter (same credentials used elsewhere in the app)
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'mohamedbenjedida18@gmail.com',
		pass: 'svov yfdf fzzd qqec',
	},
})

// Fire-and-forget email helper. Never throws so it can't break the request flow.
async function sendMail({ to, subject, html, text }) {
	try {
		await transporter.sendMail({
			from: 'Lagha Shop <mohamedbenjedida18@gmail.com>',
			to,
			subject,
			text,
			html,
		})
	} catch (err) {
		console.log('Email send failed:', err.message)
	}
}

module.exports = { sendMail, transporter }
