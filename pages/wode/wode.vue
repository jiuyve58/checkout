<template>
	<view class="page-container">
		<view class="header-area" v-if="!isLoggedIn">
			<view class="profile-top logged-out" @click="goLogin">
				<view class="avatar-wrap">
					<image class="avatar" src="/static/avatar-placeholder.png" mode="aspectFill"></image>
				</view>
				<view class="user-info">
					<text class="user-name">未登录</text>
					<text class="user-id">点击登录 / 注册账号</text>
				</view>
				<view class="login-arrow">
					<text class="arrow-icon">›</text>
				</view>
			</view>
		</view>

		<view class="header-area" v-else>
			<view class="profile-top">
				<view class="avatar-wrap">
					<image class="avatar" :src="user.avatar || '/static/avatar-placeholder.png'" mode="aspectFill" @error="onImageError"></image>
					<view class="online-dot"></view>
				</view>
				<view class="user-info">
					<text class="user-name">{{ user.user_name }}</text>
					<text class="user-id">会员 No. {{ user.user_id }}</text>
					<view class="member-badge">
						<text class="member-icon">★</text>
						<text class="member-text">{{ user.member_level === 'vip' ? 'VIP会员' : '普通会员' }}</text>
					</view>
				</view>
			</view>
		</view>

		<scroll-view class="content-area" scroll-y>
			<block v-if="!isLoggedIn">
				<view class="login-prompt-card">
					<view class="prompt-icon">📖</view>
					<text class="prompt-title">登录后享受更多服务</text>
					<text class="prompt-desc">登录后可借阅图书、查看借阅记录、管理书架</text>
					<view class="prompt-btn" @click="goLogin">
						<text class="prompt-btn-text">立即登录</text>
					</view>
				</view>
			</block>

			<block v-else>
				<view class="stats-bar">
					<view class="stat-item">
						<text class="stat-value">{{ stats.total }}</text>
						<text class="stat-label">累计借阅</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-value">{{ stats.active }}</text>
						<text class="stat-label">借阅中</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-value">{{ stats.returned }}</text>
						<text class="stat-label">已归还</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-value">{{ stats.overdue }}</text>
						<text class="stat-label">已逾期</text>
					</view>
				</view>

				<view class="section-card" v-if="currentBorrows.length > 0">
					<view class="card-header">
						<text class="card-title">当前借阅</text>
						<text class="card-hint">{{ currentBorrows.length }}本借阅中</text>
					</view>
					<view class="current-borrow" v-for="item in currentBorrows" :key="item._id">
						<image class="borrow-cover" :src="item.image" mode="aspectFill" @error="onImageError"></image>
						<view class="borrow-detail">
							<text class="borrow-title">{{ item.product_name }}</text>
							<text class="borrow-author">到期: {{ formatDate(item.due_date) }}</text>
							<view class="borrow-actions">
								<view class="return-btn" @click="handleReturn(item)">
									<text class="return-text">归还</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<view class="section-card empty-borrows" v-else>
					<text class="empty-text">暂无借阅中的图书</text>
					<view class="browse-btn" @click="goLibrary">
						<text class="browse-text">去书库选书</text>
					</view>
				</view>

				<view class="menu-section">
					<text class="menu-title">借阅服务</text>
					<view class="menu-list">
						<view class="menu-item" v-for="item in serviceItems" :key="item.key" @click="goService(item.key)">
							<view class="menu-left">
								<view class="menu-icon-wrap">
									<text class="menu-icon">{{ item.icon }}</text>
								</view>
								<text class="menu-text">{{ item.name }}</text>
							</view>
							<view class="menu-right">
								<view class="menu-badge" v-if="item.badge">{{ item.badge }}</view>
								<text class="menu-arrow">›</text>
							</view>
						</view>
					</view>
				</view>

				<view class="menu-section">
					<text class="menu-title">账户设置</text>
					<view class="menu-list">
						<view class="menu-item" @click="goProfileEdit">
							<view class="menu-left">
								<view class="menu-icon-wrap">
									<text class="menu-icon">◉</text>
								</view>
								<text class="menu-text">修改昵称</text>
							</view>
							<view class="menu-right">
								<text class="menu-arrow">›</text>
							</view>
						</view>
						<view class="menu-item" @click="goUsernameEdit">
							<view class="menu-left">
								<view class="menu-icon-wrap">
									<text class="menu-icon">@</text>
								</view>
								<text class="menu-text">修改用户名</text>
							</view>
							<view class="menu-right">
								<text class="menu-arrow">›</text>
							</view>
						</view>
						<view class="menu-item" @click="handleLogout">
							<view class="menu-left">
								<view class="menu-icon-wrap logout-icon">
									<text class="menu-icon">↻</text>
								</view>
								<text class="menu-text logout-text">退出登录</text>
							</view>
							<view class="menu-right">
								<text class="menu-arrow">›</text>
							</view>
						</view>
					</view>
				</view>
			</block>

			<view class="bottom-space"></view>
		</scroll-view>

		<view class="bottom-nav">
			<view class="nav-item" @click="goHome">
				<image class="nav-icon" src="/static/nav/home.png" mode="aspectFit"></image>
				<text class="nav-label">首页</text>
			</view>
			<view class="nav-item" @click="goLibrary">
				<image class="nav-icon" src="/static/nav/library.png" mode="aspectFit"></image>
				<text class="nav-label">书库</text>
			</view>
			<view class="nav-item" @click="goShelf">
				<image class="nav-icon" src="/static/nav/shelf.png" mode="aspectFit"></image>
				<text class="nav-label">书架</text>
			</view>
			<view class="nav-item" @click="goHistory">
				<image class="nav-icon" src="/static/nav/history.png" mode="aspectFit"></image>
				<text class="nav-label">记录</text>
			</view>
			<view class="nav-item active">
				<image class="nav-icon" src="/static/nav/profile.png" mode="aspectFit"></image>
				<text class="nav-label">我的</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { borrowApi, resolveImageUrl } from '@/utils/coffee-api.js';
	import { getCurrentUser, updateUserName, updateUserInfo, isLoggedIn, logout as doLogout } from '@/utils/user.js';

	export default {
		data() {
			return {
				isLoggedIn: false,
				user: { user_id: '', user_name: '' },
				stats: { total: 0, active: 0, returned: 0, overdue: 0 },
				currentBorrows: [],
				serviceItems: [
					{ key: 'history', name: '借阅记录', icon: '◷', badge: '' },
					{ key: 'wishlist', name: '心愿书单', icon: '♡', badge: '' }
				]
			};
		},
		onLoad() {
			this.loadUser();
		},
		onShow() {
			this.loadUser();
			if (this.isLoggedIn) {
				this.loadBorrowStats();
			}
		},
		methods: {
			loadUser() {
				this.isLoggedIn = isLoggedIn();
				if (this.isLoggedIn) {
					this.user = getCurrentUser();
				} else {
					this.user = { user_id: '', user_name: '' };
					this.stats = { total: 0, active: 0, returned: 0, overdue: 0 };
					this.currentBorrows = [];
				}
			},
			async loadBorrowStats() {
				try {
					const user = getCurrentUser();
					if (!user) return;
					const res = await borrowApi.getRecords(user.user_id);
					const all = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
					this.stats = {
						total: all.length,
						active: all.filter(r => r.status === 'borrowed').length,
						returned: all.filter(r => r.status === 'returned').length,
						overdue: all.filter(r => r.status === 'overdue').length
					};
					this.currentBorrows = all
						.filter(r => r.status === 'borrowed' || r.status === 'overdue')
						.map(r => ({
							...r,
							_id: r._id || r.id,
							image: resolveImageUrl(r.product_image || '')
						}));
				} catch (err) {
					console.error('获取借阅统计失败:', err);
				}
			},
			formatDate(dateStr) {
				if (!dateStr) return '-';
				const d = new Date(dateStr);
				return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
			},
			handleReturn(item) {
				uni.showModal({
					title: '确认归还',
					content: `确认归还《${item.product_name}》？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '归还中...' });
							try {
								await borrowApi.returnBook(item._id);
								uni.hideLoading();
								uni.showToast({ title: '归还成功', icon: 'success' });
								this.loadBorrowStats();
							} catch (err) {
								uni.hideLoading();
								uni.showToast({ title: err.message || '归还失败', icon: 'none' });
							}
						}
					}
				});
			},
			goService(key) {
				if (key === 'history') {
					uni.navigateTo({ url: '/pages/jilu/jilu' });
				} else if (key === 'wishlist') {
					uni.showToast({ title: '心愿书单', icon: 'none' });
				}
			},
			goProfileEdit() {
				uni.showModal({
					title: '修改昵称',
					editable: true,
					placeholderText: '请输入新昵称',
					success: (res) => {
						if (res.confirm && res.content) {
							this.user = updateUserName(res.content);
							uni.showToast({ title: '修改成功', icon: 'success' });
						}
					}
				});
			},
			goUsernameEdit() {
				uni.showModal({
					title: '修改用户名',
					content: this.user.username || '',
					editable: true,
					placeholderText: '请输入新用户名',
					success: async (res) => {
						if (!res.confirm) return;
						const username = String(res.content || '').trim();
						if (username.length < 3 || username.length > 30) {
							uni.showToast({ title: '用户名需为3到30个字符', icon: 'none' });
							return;
						}
						if (username === this.user.username) {
							uni.showToast({ title: '用户名未修改', icon: 'none' });
							return;
						}
						try {
							this.user = await updateUserInfo(this.user.user_id, { username });
							uni.showToast({ title: '修改成功', icon: 'success' });
						} catch (err) {
							uni.showToast({ title: err.message || '修改失败', icon: 'none' });
						}
					}
				});
			},
			goLogin() {
				uni.navigateTo({ url: '/pages/login/login' });
			},
			handleLogout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							doLogout();
							this.loadUser();
							uni.showToast({ title: '已退出登录', icon: 'success' });
						}
					}
				});
			},
			goHome() {
				uni.reLaunch({ url: '/pages/book-menu/book-menu' });
			},
			goLibrary() {
				uni.redirectTo({ url: '/pages/shuku/shuku' });
			},
			goShelf() {
				if (!this.isLoggedIn) {
					uni.showModal({
						title: '提示',
						content: '请先登录后查看书架',
						confirmText: '去登录',
						success: (res) => {
							if (res.confirm) this.goLogin();
						}
					});
					return;
				}
				uni.redirectTo({ url: '/pages/shujia/shujia' });
			},
			goHistory() {
				if (!this.isLoggedIn) {
					uni.showModal({
						title: '提示',
						content: '请先登录后查看借阅记录',
						confirmText: '去登录',
						success: (res) => {
							if (res.confirm) this.goLogin();
						}
					});
					return;
				}
				uni.redirectTo({ url: '/pages/jilu/jilu' });
			},
			onImageError(e) {
				e.target.src = '/static/book-placeholder-1.png';
			}
		}
	}
</script>

<style lang="scss">
	.page-container {
		width: 100%;
		height: 100vh;
		background-color: #FAFAF8;
		display: flex;
		flex-direction: column;
	}

	.header-area {
		padding: 60px 24px 24px;
		background: linear-gradient(180deg, #F2ECE0 0%, #FAFAF8 85%);
	}

	.profile-top {
		display: flex;
		align-items: center;
		gap: 16px;

		&.logged-out {
			cursor: pointer;
		}
	}

	.avatar-wrap {
		position: relative;
	}

	.avatar {
		width: 72px;
		height: 72px;
		border-radius: 36px;
		background-color: #E8DFD0;
		border: 3px solid #FFFFFF;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.online-dot {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 14px;
		height: 14px;
		background-color: #27AE60;
		border-radius: 7px;
		border: 2px solid #FFFFFF;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.user-name {
		font-size: 24px;
		font-weight: 700;
		color: #3D2817;
	}

	.user-id {
		font-size: 13px;
		color: #8B7355;
	}

	.login-arrow {
		margin-left: auto;
		width: 36px;
		height: 36px;
		background-color: #FFFFFF;
		border-radius: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(60, 40, 20, 0.08);
	}

	.arrow-icon {
		font-size: 20px;
		color: #8B7355;
		font-weight: 300;
	}

	.member-badge {
		display: inline-flex;
		align-items: center;
		background: linear-gradient(135deg, #F5C542 0%, #E8A020 100%);
		padding: 4px 12px;
		border-radius: 12px;
		margin-top: 4px;
	}

	.member-icon {
		font-size: 11px;
		color: #FFFFFF;
		margin-right: 4px;
	}

	.member-text {
		font-size: 12px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.content-area {
		flex: 1;
		padding: 0 24px;
	}

	.login-prompt-card {
		background-color: #FFFFFF;
		border-radius: 16px;
		padding: 40px 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 8px;
		box-shadow: 0 2px 16px rgba(60, 40, 20, 0.05);
	}

	.prompt-icon {
		font-size: 48px;
		margin-bottom: 12px;
	}

	.prompt-title {
		font-size: 18px;
		font-weight: 700;
		color: #3D2817;
		margin-bottom: 8px;
	}

	.prompt-desc {
		font-size: 14px;
		color: #8B7355;
		text-align: center;
		line-height: 1.5;
		margin-bottom: 24px;
	}

	.prompt-btn {
		background: linear-gradient(135deg, #3D2817 0%, #5C3A1F 100%);
		border-radius: 24px;
		padding: 12px 40px;
	}

	.prompt-btn-text {
		font-size: 15px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.stats-bar {
		display: flex;
		background-color: #FFFFFF;
		border-radius: 16px;
		padding: 20px 0;
		margin-top: 8px;
		box-shadow: 0 2px 16px rgba(60, 40, 20, 0.05);
	}

	.stat-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 700;
		color: #3D2817;
		line-height: 1.2;
	}

	.stat-label {
		font-size: 12px;
		color: #8B7355;
		margin-top: 4px;
	}

	.stat-divider {
		width: 1px;
		height: 28px;
		background-color: #E8DFD0;
	}

	.section-card {
		background-color: #FFFFFF;
		border-radius: 16px;
		padding: 16px;
		margin-top: 20px;
		box-shadow: 0 2px 16px rgba(60, 40, 20, 0.05);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14px;
	}

	.card-title {
		font-size: 16px;
		font-weight: 700;
		color: #3D2817;
	}

	.card-hint {
		font-size: 12px;
		font-weight: 600;
		color: #E67E22;
	}

	.current-borrow {
		display: flex;
		gap: 14px;
	}

	.borrow-cover {
		width: 70px;
		height: 92px;
		border-radius: 8px;
		flex-shrink: 0;
		background-color: #E8DFD0;
	}

	.borrow-detail {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.borrow-title {
		font-size: 15px;
		font-weight: 700;
		color: #3D2817;
		display: block;
	}

	.borrow-author {
		font-size: 12px;
		color: #8B7355;
		display: block;
		margin-top: 2px;
	}

	.borrow-actions {
		margin-top: 10px;
	}

	.return-btn {
		background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		border-radius: 14px;
		padding: 8px 20px;
		display: inline-flex;
	}

	.return-text {
		font-size: 13px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.empty-borrows {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 30px 20px;
	}

	.empty-text {
		font-size: 15px;
		color: #8B7355;
		margin-bottom: 16px;
	}

	.browse-btn {
		background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		border-radius: 20px;
		padding: 10px 30px;
	}

	.browse-text {
		font-size: 14px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.menu-section {
		margin-top: 24px;
	}

	.menu-title {
		font-size: 14px;
		font-weight: 600;
		color: #3D2817;
		display: block;
		margin-bottom: 10px;
		padding-left: 4px;
	}

	.menu-list {
		background-color: #FFFFFF;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 2px 16px rgba(60, 40, 20, 0.05);
	}

	.menu-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 18px;
		border-bottom: 1px solid #F5ECD7;

		&:last-child {
			border-bottom: none;
		}
	}

	.menu-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.menu-icon-wrap {
		width: 32px;
		height: 32px;
		background-color: #F5ECD7;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;

		&.logout-icon {
			background-color: rgba(231, 76, 60, 0.1);
		}
	}

	.menu-icon {
		font-size: 16px;
		color: #8B5A2B;
	}

	.logout-icon .menu-icon {
		color: #E74C3C;
	}

	.menu-text {
		font-size: 15px;
		font-weight: 500;
		color: #3D2817;

		&.logout-text {
			color: #E74C3C;
		}
	}

	.menu-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.menu-badge {
		min-width: 18px;
		height: 18px;
		background-color: #E74C3C;
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 5px;
		font-size: 11px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.menu-arrow {
		font-size: 20px;
		color: #B0A89E;
		font-weight: 300;
	}

	.bottom-space {
		height: 120px;
	}

	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 72px;
		background-color: #FFFFFF;
		display: flex;
		justify-content: space-around;
		align-items: flex-start;
		padding: 8px 16px 16px;
		z-index: 50;
		box-shadow: 0 -2px 24px rgba(60, 40, 20, 0.06);
		border-radius: 24px 24px 0 0;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding-top: 4px;
		position: relative;

		&.active {
			.nav-label {
				color: #3D2817;
				font-weight: 600;
			}
			.nav-icon {
				opacity: 1;
			}
		}
	}

	.nav-icon {
		width: 24px;
		height: 24px;
		margin-bottom: 2px;
		opacity: 0.55;
		transition: opacity 0.15s ease;
	}

	.nav-label {
		font-size: 11px;
		color: #B0A89E;
		transition: color 0.15s ease;
	}
</style>