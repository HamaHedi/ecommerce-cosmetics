class APIFeatures {
	constructor(query, queryStr) {
		this.query = query
		this.queryStr = queryStr
	}

	search() {

		const keyword = this.queryStr.keyword
		
			? {
				
				$or: [
					{ name: { $regex:this.queryStr.keyword, $options: 'i' } },
					// { category: { $regex: this.queryStr.category, $options: 'i' } },
					// { subcategory: { $regex: this.queryStr.category, $options: 'i' } }
				]
			}
			: {}
	
		this.query = this.query.find({ ...keyword })
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
