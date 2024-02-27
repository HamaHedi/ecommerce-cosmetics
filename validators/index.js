const { validationResult } = require('express-validator')

exports.runValidation = (req, res, next) => {
	const errors = validationResult(req)

	if (!errors.isEmpty()) {
		let err = {}

		errors.array().forEach((error) => {
			err[error['param']] = error.msg
		})

		return res.status(422).json({
			errors: err,
		})
	}

	next()
}
