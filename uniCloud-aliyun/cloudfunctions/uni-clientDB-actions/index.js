'use strict';
module.exports = {
	beforeDB(collectionName, action, params) {
		return {
			isContinue: true
		};
	},
	afterDB(collectionName, action, params, context) {
		return context;
	}
};