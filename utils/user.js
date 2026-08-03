import { request } from './coffee-store.js';
const USER_KEY = 'currentUser';
const TOKEN_KEY = 'authToken';

export function getCurrentUser() {
	try {
		const user = uni.getStorageSync(USER_KEY);
		if (user) return JSON.parse(user);
	} catch (e) {}
	return null;
}

export function getToken() {
	try {
		return uni.getStorageSync(TOKEN_KEY) || '';
	} catch (e) {
		return '';
	}
}

export function isLoggedIn() {
	return !!getCurrentUser() && !!getToken();
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

export async function login(username, password) {
	const res = await request('POST', '/api/login', { username, password });
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

export function logout() {
	clearUser();
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
