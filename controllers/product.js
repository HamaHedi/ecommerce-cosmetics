const Product = require('../models/product')
const ErrorHandler = require('../utils/errorHandler')
const APIFeatures = require('../utils/apiFeatures')
const AsyncHandler = require('express-async-handler')
const ObjectID = require('mongodb').ObjectId
const path = require('path')
const fs = require('fs')
const category = require('../models/category')
const user = require('../models/user')
const order = require('../models/order')

// @desc    Get All Products?keyword=
// @route   GET /api/products
// @access  Public
exports.getStatistics = AsyncHandler(async (req, res, next) => {
	// Get the count of categories
	const categoryCount = await category.countDocuments();

	// Get the count of users
	const userCount = await user.countDocuments();

	// Get the count of products
	const productCount = await Product.countDocuments();

	// Get the count of orders
	const orderCount = await order.countDocuments();

	// Get the count of products for each category
	const categoryProductCounts = await Product.aggregate([
		{
			$group: {
				_id: "$category",
				count: { $sum: 1 }
			}
		}
	]);
	const outOfStockCount = await Product.countDocuments({ stock: 0 });

	// Format the result to create an object with category names and their respective product counts
	const categoryCounts = {};
	categoryProductCounts.forEach(category => {
		categoryCounts[category._id] = category.count;
	});

	res.status(200).json({
		success: true,
		categoryCount,
		userCount,
		productCount,
		outOfStockCount,
		orderCount,
		categoryProductCounts: categoryCounts
	});
});


exports.getProducts = AsyncHandler(async (req, res, next) => {
	const resPerPage = 8
	const productsCount = await Product.countDocuments()

	const apiFeaturesCountTest = new APIFeatures(Product.find(), req.query).search().filter()
	const productsCountTest = await apiFeaturesCountTest.query
	const filteredProductsCount = productsCountTest.length
	const apiFeatures = new APIFeatures(Product.find(), req.query)
		.search()
		.filter()
		.pagination(resPerPage)

	const products = await apiFeatures.query

	res.status(200).json({
		success: true,
		productsCount,
		resPerPage,
		filteredProductsCount,
		products,
	})
})

exports.getNewProducts = AsyncHandler(async (req, res, next) => {

	const newProducts = await Product.find({ isNew: true });

	res.status(200).json({
		success: true,
		newProducts,
	})
})
exports.getPromoProducts = AsyncHandler(async (req, res, next) => {
	const limit = 20;

	const promoProducts = await Product.find({ oldPrice: { $gt: 0 } })
		.sort({ createdAt: -1 })  // Sort by newest first
		.limit(limit);

	res.status(200).json({
		success: true,
		count: promoProducts.length,
		promoProducts,
	});
});
// @desc    Get Single Product
// @route   GET /api/products/:id
// @access  Public
exports.getSingleProduct = AsyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.params.id)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	res.status(200).json({
		success: true,
		product,
	})
})

// Get all products (Admin)  =>   /api/admin/products
// exports.getAdminProducts = AsyncHandler(async (req, res, next) => {
// 	const products = await Product.find()

// 	res.status(200).json({
// 		success: true,
// 		products,
// 	})
// })

// Admin: bulk-update products from CSV (matched by _id) =>  POST /api/admin/products/import
// Updates name/price/oldPrice/stock for existing products (round-trip with the CSV export).
exports.importProducts = AsyncHandler(async (req, res, next) => {
	const { products } = req.body;
	if (!Array.isArray(products) || products.length === 0) {
		return next(new ErrorHandler('Aucun produit à importer', 400));
	}

	let updated = 0;
	let skipped = 0;
	for (const p of products) {
		if (!p.id) {
			skipped++;
			continue;
		}
		const set = {};
		if (p.name) set.name = p.name;
		if (p.price !== '' && p.price != null && !isNaN(Number(p.price)))
			set.price = Number(p.price);
		if (p.oldPrice !== '' && p.oldPrice != null && !isNaN(Number(p.oldPrice)))
			set.oldPrice = Number(p.oldPrice);
		if (p.stock !== '' && p.stock != null && !isNaN(Number(p.stock)))
			set.stock = Number(p.stock);

		if (Object.keys(set).length === 0) {
			skipped++;
			continue;
		}
		try {
			const r = await Product.updateOne({ _id: p.id }, { $set: set });
			if (r.modifiedCount || r.nModified) updated++;
			else skipped++;
		} catch (e) {
			skipped++;
		}
	}

	res.status(200).json({ success: true, updated, skipped });
});

exports.getAdminProducts = AsyncHandler(async (req, res, next) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 5;
	const searchQuery = req.query.search || ''; // Get search query from request
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;

	// Create a filter for searching by name, using a case-insensitive regex
	const searchFilter = searchQuery ? { name: { $regex: searchQuery, $options: 'i' } } : {};

	// Get total count of products matching the search query
	const totalProducts = await Product.countDocuments(searchFilter);
	const totalPages = Math.ceil(totalProducts / limit);

	// Fetch products with pagination and search filtering
	const products = await Product.find(searchFilter)
		.sort({ createdAt: -1 })
		.limit(limit)
		.skip(startIndex);

	const pagination = {
		currentPage: page,
		totalPages: totalPages,
		totalProducts: totalProducts
	};

	res.status(200).json({
		success: true,
		pagination: pagination,
		products: products
	});
});



// @desc    Create Product
// @route   POST /api/admin/products
// @access  Private
// @Role 	admin

exports.createProduct = AsyncHandler(async (req, res, next) => {
	if (!req.files) {
		return next(new ErrorHandler('No image uploaded!', 400));
	}
	try {


		const files = req.files.files;
		let images = [];
		const certificatess = req.files.certificates; // Checking if certificates are provided
		let certificates = [];

		// Process image files
		if (Array.isArray(files)) {
			// Multiple files
			let promises = [];

			files.forEach((file) => {
				if (check(file)) {
					const fileName =
						path.parse(file.name).name +
						'-' +
						Date.now() +
						'-' +
						Math.round(Math.random() * 1e9) +
						path.extname(file.name);

					const savePath = path.join(__dirname, '../public', 'products', fileName);

					promises.push(file.mv(savePath));

					images.push({
						filename: fileName,
						path: '/products/' + fileName,
					});
				}
			});

			await Promise.all(promises);
		} else {
			// Single file
			if (check(files)) {
				const fileName =
					path.parse(files.name).name +
					'-' +
					Date.now() +
					'-' +
					Math.round(Math.random() * 1e9) +
					path.extname(files.name);

				const savePath = path.join(__dirname, '../public', 'products', fileName);

				await files.mv(savePath);

				images.push({
					filename: fileName,
					path: '/products/' + fileName,
				});
			}
		}

		// Only process certificates if they are provided
		if (certificatess) {
			if (Array.isArray(certificatess)) {
				// Multiple files
				let promises = [];

				certificatess.forEach((file) => {
					if (check(file)) {
						const fileName =
							path.parse(file.name).name +
							'-' +
							Date.now() +
							'-' +
							Math.round(Math.random() * 1e9) +
							path.extname(file.name);

						const savePath = path.join(__dirname, '../public', 'certificates', fileName);

						promises.push(file.mv(savePath));

						certificates.push({
							filename: fileName,
							path: '/certificates/' + fileName,
						});
					}
				});

				await Promise.all(promises);
			} else {
				// Single file
				if (check(certificatess)) {
					const fileName =
						path.parse(certificatess.name).name +
						'-' +
						Date.now() +
						'-' +
						Math.round(Math.random() * 1e9) +
						path.extname(certificatess.name);

					const savePath = path.join(__dirname, '../public', 'certificates', fileName);

					await certificatess.mv(savePath);

					certificates.push({
						filename: fileName,
						path: '/certificates/' + fileName,
					});
				}
			}
		}

		// Check for images validity
		if (images.length === 0) {
			return next(new ErrorHandler('Only .png, .jpg and .jpeg format allowed!', 400));
		}

		// Attach images and certificates to the request body
		req.body.images = images;
		req.body.certificates = certificates;

		// Parse the colors field from JSON string
		if (req.body?.colors) {
			try {
				req.body.colors = JSON.parse(req.body.colors);
			} catch (error) {
				return next(new ErrorHandler('Invalid colors format!', 400));
			}
		}
		if (req.body?.sizes) {
			try {
				req.body.sizes = JSON.parse(req.body.sizes);
			} catch (error) {
				return next(new ErrorHandler('Invalid sizes', 400));
			}
		}
		// Create the product
		const product = await Product.create(req.body);

		// Send the response
		res.status(201).json({
			success: true,
			product,
		});
	} catch (error) {
		return next(new ErrorHandler('Error uploading files!', 400));
	}

	// Helper function to validate file types
	function check(file) {
		if (
			(file.mimetype === 'image/png' ||
				file.mimetype === 'image/jpg' ||
				file.mimetype === 'image/jpeg') &&
			!file.truncated
		) {
			return true;
		}
		return false;
	}
});


// @desc    Update Product
// @route   PUT /api/admin/products/:id
// @access  Private
// @Role 	admin
exports.updateProduct = AsyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id);

	if (!product) {
		return next(new ErrorHandler('Product not found', 404));
	}

	// Handle subcategory update
	if (req.body.subcategory) {
		product.subcategory = req.body.subcategory;
	}

	// Handle image deletion and uploading new images
	if (req.files?.files) {
		product.images.forEach(async (image) => {
			let imagePath = path.join(__dirname, '../public', image.path);
			if (fs.existsSync(imagePath)) {
				await fs.unlink(imagePath, (err) => {
					if (err) console.log('Error deleting file:', err);
					else console.log('File deleted successfully');
				});
			}
		});

		try {
			const files = req.files.files;
			let images = [];

			if (Array.isArray(files)) {
				let promises = [];
				files.forEach((file) => {
					if (check(file)) {
						const fileName =
							path.parse(file.name).name +
							'-' +
							Date.now() +
							'-' +
							Math.round(Math.random() * 1e9) +
							path.extname(file.name);

						const savePath = path.join(__dirname, '../public', 'products', fileName);
						promises.push(file.mv(savePath));

						images.push({
							filename: fileName,
							path: '/products/' + fileName,
						});
					}
				});

				await Promise.all(promises);
			} else {
				if (check(files)) {
					const fileName =
						path.parse(files.name).name +
						'-' +
						Date.now() +
						'-' +
						Math.round(Math.random() * 1e9) +
						path.extname(files.name);

					const savePath = path.join(__dirname, '../public', 'products', fileName);
					await files.mv(savePath);

					images.push({
						filename: fileName,
						path: '/products/' + fileName,
					});
				}
			}

			if (images.length === 0) {
				return next(new ErrorHandler('Only .png, .jpg and .jpeg format allowed!', 400));
			}

			req.body.images = images;
		} catch (error) {
			return next(new ErrorHandler('Error uploading files!', 400));
		}
	}
	if (req.files?.certificates) {
		product.certificates.forEach(async (image) => {
			let imagePath = path.join(__dirname, '../public', image.path);
			if (fs.existsSync(imagePath)) {
				await fs.unlink(imagePath, (err) => {
					if (err) console.log('Error deleting file:', err);
					else console.log('File deleted successfully');
				});
			}
		});

		try {
			const files = req.files.certificates;
			let images = [];

			if (Array.isArray(files)) {
				let promises = [];
				files.forEach((file) => {
					if (check(file)) {
						const fileName =
							path.parse(file.name).name +
							'-' +
							Date.now() +
							'-' +
							Math.round(Math.random() * 1e9) +
							path.extname(file.name);

						const savePath = path.join(__dirname, '../public', 'certificates', fileName);
						promises.push(file.mv(savePath));

						images.push({
							filename: fileName,
							path: '/certificates/' + fileName,
						});
					}
				});

				await Promise.all(promises);
			} else {
				if (check(files)) {
					const fileName =
						path.parse(files.name).name +
						'-' +
						Date.now() +
						'-' +
						Math.round(Math.random() * 1e9) +
						path.extname(files.name);

					const savePath = path.join(__dirname, '../public', 'certificates', fileName);
					await files.mv(savePath);

					images.push({
						filename: fileName,
						path: '/certificates/' + fileName,
					});
				}
			}

			if (images.length === 0) {
				return next(new ErrorHandler('Only .png, .jpg and .jpeg format allowed!', 400));
			}

			req.body.certificates = images;
		} catch (error) {
			return next(new ErrorHandler('Error uploading files!', 400));
		}
	}
	// Parse the colors field from JSON string
	if (req.body.colors) {
		try {
			req.body.colors = JSON.parse(req.body.colors);
		} catch (error) {
			return next(new ErrorHandler('Invalid colors format!', 400));
		}
	}
	if (req.body?.sizes) {
		try {
			req.body.sizes = JSON.parse(req.body.sizes);
		} catch (error) {
			return next(new ErrorHandler('Invalid sizes', 400));
		}
	}
	// Update product
	product = await Product.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});

	res.status(200).json({
		success: true,
		product,
	});

	function check(file) {
		if (
			(file.mimetype === 'image/png' ||
				file.mimetype === 'image/jpg' ||
				file.mimetype === 'image/jpeg') &&
			!file.truncated
		) {
			return true;
		}
		return false;
	}
});

// @desc    Delete Product
// @route   DELETE /api/products/:id
// @access  Private
// @Role 	admin
exports.deleteProduct = AsyncHandler(async (req, res, next) => {
	let product = await Product.findById(req.params.id)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	product.images.forEach(async (image) => {
		let imagePath = path.join(__dirname, '../public', image.path)

		if (fs.existsSync(imagePath)) {
			await fs.unlink(imagePath, async (err) => {
				console.log('file deleted successfully')
			})
		}
	})

	await product.remove()

	res.status(200).json({
		success: true,
		message: 'Product deleted successfully',
	})
})

// @desc    Create new review
// @route   PUT /api/review
// @access  Private
exports.createProductReview = AsyncHandler(async (req, res, next) => {
	const { rating, comment, productId } = req.body

	const review = {
		user: req.user._id,
		name: req.user.name,
		avatar: req.user.avatar,
		rating: Number(rating),
		comment,
	}

	const product = await Product.findById(productId)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	const isReviewed = product.reviews.find((r) => r.user.toString() === req.user._id.toString())

	if (isReviewed) {
		product.reviews.forEach((review) => {
			if (review.user.toString() === req.user._id.toString()) {
				review.comment = comment
				review.rating = rating
			}
		})
	} else {
		product.reviews.push(review)
		product.numOfReviews = product.reviews.length
	}

	product.ratings =
		product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

	await product.save({ validateBeforeSave: false })

	res.status(200).json({
		success: true,
	})
})

// @desc    Get Product Reviews
// @route   GET /api/reviews?id={id}
// @access  Public
exports.getProductReviews = AsyncHandler(async (req, res, next) => {
	if (!ObjectID.isValid(req.query.id)) {
		return next(new ErrorHandler('invalid id!', 400))
	}

	const product = await Product.findById(req.query.id)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	res.status(200).json({
		success: true,
		reviews: product.reviews,
	})
})

// @desc    Delete Product Review
// @route   DELETE /api/reviews?productId={id}&id={id}
// @access  Private
exports.deleteReview = AsyncHandler(async (req, res, next) => {
	const product = await Product.findById(req.query.productId)

	if (!product) {
		return next(new ErrorHandler('Product not found', 404))
	}

	const reviews = product.reviews.filter(
		(review) => review._id.toString() !== req.query.id.toString()
	)

	const numOfReviews = reviews.length

	const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

	await Product.findByIdAndUpdate(
		req.query.productId,
		{
			reviews,
			ratings,
			numOfReviews,
		},
		{
			new: true,
			runValidators: true,
			useFindAndModify: false,
		}
	)

	res.status(200).json({
		success: true,
	})
})
