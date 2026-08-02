module.exports = {
	_before: function () {

	},
5	getList() {
		const db = uniCloud.database();
		return db.collection('coffee-categories')
			.where({
				enabled: true
			})
			.orderBy('sort', 'asc')
			.get();
	}
}