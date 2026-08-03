import { request } from './coffee-store.js';
const USER_KEY = 'currentUser';
const TOKEN_KEY = 'authToken';

function b64decode(str) {
	try {
		str = String(str).replace(/-/g, '+').replace(/_/g, '/');
		while (str.length % 4) str += '=';
		const buf = uni.base64ToArrayBuffer(str);
		const arr = new Uint8Array(buf);
		let s = '';
		for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
		return decodeURIComponent(escape(s));
	} catch (e) { return ''; }
}

function isTokenValid(token) {
	if (!token) return false;
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return true;
		const payload = JSON.parse(b64decode(parts[1]));
		if (payload && payload.exp) {
			return payload.exp > Date.now();
		}
		return true;
	} catch (e) { return true; }
}

export function getCurrentUser() {
	try {
		const user = uni.getStorageSync(USER_KEY);
		if (user) return JSON.parse(user);
	} catch (e) {}
	return null;
}

export function getToken() {
	try {
		const token = uni.getStorageSync(TOKEN_KEY) || '';
		if (token && !isTokenValid(token)) {
			clearUser();
			return '';
		}
		return token;
	} catch (e) {
		return '';
	}
}

export function isLoggedIn() {
	const user = getCurrentUser();
	const token = getToken();
	return !!user && !!token && isTokenValid(token);
}

export function setCurrentUser(user) {
	try {
		uni.setStorageSync(USER_KEY, JSON.stringify(user));
	} catch (e) {}
}

export function setToken(token) {
	try {
		uni.setStorageSync(TOKEN_KEY, token);
	} catch (e) {}
}

export function clearUser() {
	try {
		uni.removeStorageSync(USER_KEY);
		uni.removeStorageSync(TOKEN_KEY);
	} catch (e) {}
}

export async function validateSession() {
        const cachedUser = getCurrentUser();
        const token = getToken();
        if (!cachedUser || !cachedUser.user_id || !token) {
                clearUser();
                return null;
        }

        try {
                const res = await request('GET', `/api/user/${encodeURIComponent(cachedUser.user_id)}`);
                if (res.code !== 0 || !res.data || res.data.status !== 'active') {
                        clearUser();
                        return null;
                }
                const serverUser = res.data;
                const userInfo = {
                        user_id: serverUser.id || serverUser._id,
                        user_name: serverUser.nickname || serverUser.username,
                        username: serverUser.username,
                        avatar: serverUser.avatar || '',
                        email: serverUser.email || '',
                        phone: serverUser.phone || '',
                        member_level: serverUser.member_level || 'normal'
                };
                setCurrentUser(userInfo);
                return userInfo;
        } catch (error) {
                if (error.statusCode === 401 || error.statusCode === 404 || !getToken()) {
                        clearUser();
                        return null;
                }
                return cachedUser;
        }
}

export async function login(username, password) {
        const res = await request('POST', '/api/login', { username, password }, {
                timeout: 8000,
                timeoutMessage: '登录服务响应超时，请稍后重试',
                networkErrorMessage: '无法连接登录服务，请稍后重试'
        });
	if (res.code === 0 && res.data) {
		setToken(res.data.token);
		const userInfo = {
			user_id: res.data.user.id,
			user_name: res.data.user.nickname || res.data.user.username,
			username: res.data.user.username,
			avatar: res.data.user.avatar || '',
			email: res.data.user.email || '',
			phone: res.data.user.phone || '',
			member_level: res.data.user.member_level || 'normal'
		};
		setCurrentUser(userInfo);
		return userInfo;
	}
	throw new Error(res.message || '登录失败');
}

export async function register(username, password, nickname) {
	const res = await request('POST', '/api/register', { username, password, nickname });
	if (res.code === 0 && res.data) {
		setToken(res.data.token);
		const userInfo = {
			user_id: res.data.user.id,
			user_name: res.data.user.nickname || res.data.user.username,
			username: res.data.user.username,
			avatar: res.data.user.avatar || '',
			email: res.data.user.email || '',
			phone: res.data.user.phone || '',
			member_level: res.data.user.member_level || 'normal'
		};
		setCurrentUser(userInfo);
		return userInfo;
	}
	throw new Error(res.message || '注册失败');
}

export async function logout() {
	try {
		await request('POST', '/api/logout');
	} finally {
		clearUser();
	}
}

export async function updateUserInfo(userId, fields) {
	const res = await request('PUT', `/api/user/${userId}`, fields);
	if (res.code === 0 && res.data) {
		const user = getCurrentUser();
		const updated = {
			...user,
			user_name: res.data.nickname || user.user_name,
			username: res.data.username || user.username,
			avatar: res.data.avatar || user.avatar,
			email: res.data.email || user.email,
			phone: res.data.phone || user.phone
		};
		setCurrentUser(updated);
		return updated;
	}
	throw new Error(res.message || '更新失败');
}

export function updateUserName(name) {
	const user = getCurrentUser();
	if (user) {
		user.user_name = name;
		setCurrentUser(user);
	}
	return user;
}
