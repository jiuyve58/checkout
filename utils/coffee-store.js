import config from '@/config/index.js';
const API_BASE = config.API_BASE;
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';

function buildAuthHeader() {
	try {
		const token = uni.getStorageSync(TOKEN_KEY) || '';
		return token ? { 'Authorization': 'Bearer ' + token } : {};
	} catch (e) { return {}; }
}

function clearUserAuth() {
	try { uni.removeStorageSync(TOKEN_KEY); } catch (e) {}
	try { uni.removeStorageSync(USER_KEY); } catch (e) {}
}

function handleAuthError(statusCode, data) {
	if (statusCode === 401) {
		clearUserAuth();
	}
}

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

export function request(method, path, data, options = {}) {
	return new Promise((resolve, reject) => {
		const handleSuccess = (res) => {
			if (res.statusCode >= 200 && res.statusCode < 300) {
				resolve(res.data);
			} else {
				handleAuthError(res.statusCode, res.data);
				const msg = (res.data && res.data.message) ? res.data.message : ('请求失败: ' + res.statusCode);
                                const error = new Error(msg);
                                error.statusCode = res.statusCode;
                                reject(error);
			}
		};
		const handleFail = (err) => {
			console.error('请求失败:', err);
			const code = err && (err.errCode || err.errno);
			const detail = err && (err.errMsg || err.message);
                  if (/timeout|超时/i.test(detail || '')) {
                          const error = new Error(options.timeoutMessage || '请求超时，请稍后重试');
                          error.code = 'REQUEST_TIMEOUT';
                          reject(error);
                          return;
                  }
			const message = [code, detail].filter(Boolean).join(' ');
                  reject(new Error(options.networkErrorMessage || message || '网络请求失败，请检查云托管服务是否正常'));
		};

		const authHeader = buildAuthHeader();

		const httpFallback = (reason) => {
			uni.request({
				url: API_BASE + path,
				method,
				data,
                          timeout: options.timeout || 30000,
				header: { 'Content-Type': 'application/json', ...authHeader },
				success: handleSuccess,
				fail: (err) => {
					handleFail(err);
				}
			});
		};

		httpFallback('direct');
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
	return request('POST', '/api/reset-seed');
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
