class APIFeatures {
	constructor(query, queryStr) {
		this.query = query
		this.queryStr = queryStr
	}

	search() {
		const raw = this.queryStr.keyword

		if (raw && String(raw).trim()) {
			// Escape regex special characters so user input can't break the query
			const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

			// Split the phrase into words and require EVERY word to match somewhere
			// (name / description / category / subcategory / brand / code). This makes
			// the search forgiving: word order, extra words and partial words all work,
			// so the user no longer needs the exact product name.
			const tokens = String(raw)
				.trim()
				.split(/\s+/)
				.filter(Boolean)
				.slice(0, 8)

			const fields = ['name', 'description', 'category', 'subcategory', 'brand', 'code']

			const andConditions = tokens.map((token) => {
				const regex = { $regex: escape(token), $options: 'i' }
				return { $or: fields.map((f) => ({ [f]: regex })) }
			})

			this.query = this.query.find(andConditions.length ? { $and: andConditions } : {})
		}

		return this
	}
	
	filter() {
		const queryCopy = { ...this.queryStr };

		// Remove fields from the query
		const removeFields = ['keyword', 'limit', 'page'];
		removeFields.forEach((el) => delete queryCopy[el]);
	
		// Handle subcategory filtering
		if (queryCopy.subcategory) {
			this.query = this.query.find({ subcategory: queryCopy.subcategory });
		}
	
		// Handle category filtering if provided
		if (queryCopy.category && !queryCopy.subcategory ) {
			this.query = this.query.find({ category: queryCopy.category });
		}
		if (queryCopy.brand) {
			this.query = this.query.find({ brand: queryCopy.brand });
		}
	
		// Advanced filter for price, ratings, etc.
		let queryStr = JSON.stringify(queryCopy);
		queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
	
		this.query = this.query.find(JSON.parse(queryStr));
		return this;
	}
	

	pagination(resPerPage) {
		const currentPage = Number(this.queryStr.page) || 1
		const skip = resPerPage * (currentPage - 1)

		this.query = this.query.limit(resPerPage).skip(skip)
		return this
	}
}

module.exports = APIFeatures
