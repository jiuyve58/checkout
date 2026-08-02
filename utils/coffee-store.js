import config from '@/config/index.js';
const API_BASE = config.API_BASE;

export function resolveImageUrl(imagePath) {
	if (!imagePath) return '';
	if (imagePath.startsWith('http')) {
		try {
			const urlObj = new URL(imagePath);
			if (urlObj.hostname.includes('images.unsplash.com')) {
				return imagePath;
			}
			return imagePath;
		} catch (e) {
			return imagePath;
		}
	}
	if (imagePath.startsWith('data:')) return imagePath;
	if (imagePath.startsWith('/static/covers/')) {
		return API_BASE + imagePath;
	}
	if (imagePath.startsWith('/static/')) {
		return imagePath;
	}
	if (imagePath.startsWith('static/')) {
		return '/' + imagePath;
	}
	if (imagePath.startsWith('/uploads/')) {
		return API_BASE + imagePath;
	}
	return API_BASE + imagePath;
}

export function getFallbackImage(book, index) {
	if (book && book.image && !book.image.startsWith('http')) {
		return book.image;
	}
	return '/static/book-placeholder-' + ((index % 4) + 1) + '.png';
}

export function request(method, path, data) {
	return new Promise((resolve, reject) => {
		const handleSuccess = (res) => {
			if (res.statusCode >= 200 && res.statusCode < 300) {
				resolve(res.data);
			} else {
				const msg = (res.data && res.data.message) ? res.data.message : ('请求失败: ' + res.statusCode);
				reject(new Error(msg));
			}
		};
		const handleFail = (err) => {
			console.error('请求失败:', err);
			const code = err && (err.errCode || err.errno);
			const detail = err && (err.errMsg || err.message);
			const message = [code, detail].filter(Boolean).join(' ');
			reject(new Error(message || '网络请求失败，请检查云托管服务是否正常'));
		};

		const httpFallback = (reason) => {
			console.warn('callContainer降级HTTP:', reason || '');
			uni.request({
				url: API_BASE + path,
				method,
				data,
				timeout: 30000,
				header: { 'Content-Type': 'application/json' },
				success: handleSuccess,
				fail: handleFail
			});
		};

		// #ifdef MP-WEIXIN
		if (wx.cloud && wx.cloud.callContainer) {
			wx.cloud.callContainer({
				config: {
					env: config.CLOUD_ENV
				},
				path,
				method,
				data,
				header: {
					'X-WX-SERVICE': config.CLOUD_SERVICE,
					'Content-Type': 'application/json'
				},
				success: handleSuccess,
				fail: (err) => {
					const code = err && (err.errCode || err.errno);
					if (code === 102002 || /超时|timeout/i.test(err && err.errMsg || '')) {
						httpFallback('请求超时');
					} else {
						handleFail(err);
					}
				}
			});
			return;
		}
		// #endif

		httpFallback('不支持callContainer');
	});
}

export const categoriesApi = {
	getList() {
		return request('GET', '/api/categories');
	},
	create(item) {
		return request('POST', '/api/categories', item);
	},
	update(id, item) {
		return request('PUT', `/api/categories/${id}`, item);
	},
	remove(id) {
		return request('DELETE', `/api/categories/${id}`);
	},
	batchRemove(ids) {
		return request('POST', '/api/categories/batch-delete', { ids });
	}
};

export const productsApi = {
	getList(categoryId = '') {
		const param = categoryId ? `?category_id=${categoryId}` : '';
		return request('GET', `/api/products${param}`);
	},
	getDetail(id) {
		return request('GET', `/api/products/${id}`);
	},
	create(item) {
		return request('POST', '/api/products', item);
	},
	update(id, item) {
		return request('PUT', `/api/products/${id}`, item);
	},
	remove(id) {
		return request('DELETE', `/api/products/${id}`);
	},
	batchRemove(ids) {
		return request('POST', '/api/products/batch-delete', { ids });
	}
};

export function importObject(name) {
	switch (name) {
		case 'get-coffee-categories':
			return categoriesApi;
		case 'get-coffee-products':
			return productsApi;
		default:
			return null;
	}
}

export function resetData() {
	return request('GET', '/reset');
}

export const borrowApi = {
	borrow(product_id, user_id, user_name, days = 30) {
		return request('POST', '/api/borrow', { product_id, user_id, user_name, days });
	},
	returnBook(record_id) {
		return request('POST', '/api/return', { record_id });
	},
	getRecords(user_id = '', status = '') {
		var parts = [];
		if (user_id) parts.push('user_id=' + encodeURIComponent(user_id));
		if (status) parts.push('status=' + encodeURIComponent(status));
		var query = parts.length > 0 ? '?' + parts.join('&') : '';
		return request('GET', '/api/borrow-records' + query);
	}
};

export default {
	importObject,
	categoriesApi,
	productsApi,
	borrowApi,
	resetData
};
