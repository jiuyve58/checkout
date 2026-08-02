import config from '@/config/index.js';
const API_BASE = config.API_BASE;

function getToken() {
	return uni.getStorageSync('admin_token') || '';
}

function request(method, path, data) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: API_BASE + path,
			method: method,
			data: data,
			header: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + getToken()
			},
			success(res) {
				if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.code === 0) {
					resolve(res.data.data !== undefined ? res.data.data : res.data);
				} else {
					reject(new Error((res.data && res.data.message) || '请求失败: ' + res.statusCode));
				}
			},
			fail(err) {
				reject(new Error(err.errMsg || '网络请求失败'));
			}
		});
	});
}

export const authApi = {
	login(username, password) {
		return request('POST', '/api/login', { username, password });
	},
	adminRegister(username, password, nickname) {
		return request('POST', '/api/admin-register', { username, password, nickname });
	},
	logout() {
		uni.removeStorageSync('admin_token');
		uni.removeStorageSync('admin_user');
	},
	getUserInfo() {
		const user = uni.getStorageSync('admin_user');
		return user ? JSON.parse(user) : null;
	},
	isLogin() {
		return !!getToken();
	},
	isAdmin() {
		const user = this.getUserInfo();
		return user && user.role === 'admin';
	}
};

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

export const usersApi = {
	getList(keyword = '', status = '') {
		const parts = [];
		if (keyword) parts.push('keyword=' + encodeURIComponent(keyword));
		if (status) parts.push('status=' + encodeURIComponent(status));
		const query = parts.length ? '?' + parts.join('&') : '';
		return request('GET', '/api/users' + query);
	},
	getDetail(id) {
		return request('GET', `/api/users/${id}`);
	},
	update(id, data) {
		return request('PUT', `/api/user/${id}`, data);
	},
	remove(id) {
		return request('DELETE', `/api/users/${id}`);
	},
	batchRemove(ids) {
		return request('POST', '/api/users/batch-delete', { ids });
	}
};

export const borrowRecordsApi = {
	getList(user_id = '', status = '') {
		const parts = [];
		if (user_id) parts.push('user_id=' + encodeURIComponent(user_id));
		if (status) parts.push('status=' + encodeURIComponent(status));
		const query = parts.length ? '?' + parts.join('&') : '';
		return request('GET', '/api/borrow-records' + query);
	},
	returnBook(record_id) {
		return request('POST', '/api/return', { record_id });
	},
	batchRemove(ids) {
		return request('POST', '/api/borrow-records/batch-delete', { ids });
	}
};

export const loginRecordsApi = {
	getList(user_id = '', login_type = '') {
		const parts = [];
		if (user_id) parts.push('user_id=' + encodeURIComponent(user_id));
		if (login_type) parts.push('login_type=' + encodeURIComponent(login_type));
		const query = parts.length ? '?' + parts.join('&') : '';
		return request('GET', '/api/login-records' + query);
	}
};

export const statsApi = {
	getOverview() {
		return Promise.all([
			request('GET', '/api/login-records'),
			request('GET', '/api/users'),
			request('GET', '/api/borrow-records')
		]).then(([loginRecords, users, borrowRecords]) => {
			const today = new Date();
			const p = n => String(n).padStart(2, '0');
			const todayStr = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;
			return {
				totalUsers: users.length,
				todayLogin: loginRecords.filter(i => i.login_type === 'login' && i.login_time && i.login_time.startsWith(todayStr)).length,
				todayRegister: loginRecords.filter(i => i.login_type === 'register' && i.login_time && i.login_time.startsWith(todayStr)).length,
				totalLogins: loginRecords.filter(i => i.login_type === 'login').length,
				totalBorrowed: borrowRecords.filter(i => i.status === 'borrowed').length,
				totalReturned: borrowRecords.filter(i => i.status === 'returned').length
			};
		});
	}
};

export const uploadApi = {
	async uploadImage(filePath) {
		return new Promise((resolve, reject) => {
			// #ifdef H5
			const xhr = new XMLHttpRequest();
			xhr.open('GET', filePath, true);
			xhr.responseType = 'blob';
			xhr.onload = () => {
				const reader = new FileReader();
				reader.onloadend = () => {
					const base64 = reader.result;
					uni.request({
						url: API_BASE + '/api/upload',
						method: 'POST',
						data: { image: base64 },
						header: { 'Content-Type': 'application/json' },
						success: (r) => {
							if (r.statusCode >= 200 && r.statusCode < 300 && r.data && r.data.code === 0) {
								resolve(r.data.data.path);
							} else {
								reject(new Error((r.data && r.data.message) || '上传失败'));
							}
						},
						fail: reject
					});
				};
				reader.readAsDataURL(xhr.response);
			};
			xhr.onerror = () => reject(new Error('读取文件失败'));
			xhr.send();
			// #endif
			// #ifndef H5
			const fsManager = uni.getFileSystemManager();
			fsManager.readFile({
				filePath,
				encoding: 'base64',
				success: (res) => {
					const base64 = `data:image/jpeg;base64,${res.data}`;
					uni.request({
						url: API_BASE + '/api/upload',
						method: 'POST',
						data: { image: base64 },
						header: { 'Content-Type': 'application/json' },
						success: (r) => {
							if (r.statusCode >= 200 && r.statusCode < 300 && r.data && r.data.code === 0) {
								resolve(r.data.data.path);
							} else {
								reject(new Error((r.data && r.data.message) || '上传失败'));
							}
						},
						fail: reject
					});
				},
				fail: reject
			});
			// #endif
		});
	}
};

export const menusApi = {
	getList() {
		return request('GET', '/api/menus');
	}
};

export default {
	authApi,
	categoriesApi,
	productsApi,
	usersApi,
	borrowRecordsApi,
	loginRecordsApi,
	statsApi,
	uploadApi,
	menusApi
};
