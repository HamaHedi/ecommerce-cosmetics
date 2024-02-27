const User = require('../models/user')

const generateAdmin = async () => {
	try {
		const users = await User.find()

		if (users.length === 0) {
			await User.create({
				name: 'Admin',
				email: 'root@toor.admin',
				password: 'root@toor',
				role: 'admin',
				about: 'Admin is the role with the highest level of access to your website.',
			})
			console.log('Admin Created Successfully')
		}
	} catch (error) {
		console.log(error.message)
	}
}

module.exports = generateAdmin
