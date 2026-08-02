module.exports = {
	_before: function () {

	},
	getList(categoryId = '') {
		const db = uniCloud.database();
		let query = { on_sale: true };
		if (categoryId) {
			query.category_id = categoryId;
		}
		return db.collection('coffee-products')
			.where(query)
			.orderBy('rating', 'desc')
			.orderBy('sort', 'asc')
			.limit(20)
			.get();
	},
	getDetail(id) {
		const db = uniCloud.database();
		return db.collection('coffee-products')
			.doc(id)
			.get();
	}
}