<template>
	<view class="page-container">
		<view class="header-area">
			<text class="page-label">MY SHELF · 我的书架</text>
			<text class="page-title">{{ currentUser ? currentUser.user_name : '未登录' }}的书架</text>
			<view class="stats-row">
				<view class="stat-item">
					<text class="stat-num">{{ stats.total }}</text>
					<text class="stat-unit">累计借阅</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-num">{{ stats.borrowing }}</text>
					<text class="stat-unit">借阅中</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-num">{{ stats.returned }}</text>
					<text class="stat-unit">已归还</text>
				</view>
			</view>
		</view>

		<scroll-view class="content-area" scroll-y>
			<view class="empty-state" v-if="!isLoggedIn">
				<view class="empty-icon">🔐</view>
				<text class="empty-text">请先登录</text>
				<text class="empty-hint">登录后查看你的书架</text>
				<view class="login-btn" @click="goLogin">
					<text class="login-btn-text">立即登录</text>
				</view>
			</view>
			<view class="section" v-if="isLoggedIn && borrowingList.length > 0">
				<view class="section-header">
					<text class="section-symbol">§</text>
					<text class="section-text">借阅中</text>
				</view>
				<view class="borrow-card" v-for="item in borrowingList" :key="item._id">
					<image class="borrow-cover" :src="item.image" mode="aspectFill" @error="onImageError"></image>
					<view class="borrow-info">
						<text class="borrow-title">{{ item.name }}</text>
						<text class="borrow-author">{{ item.author }}</text>
						<text class="borrow-date">借出日期 {{ item.borrow_date }}</text>
						<view class="borrow-tags">
							<view class="tag-expire">
								<text class="tag-expire-text">{{ item.days_left >= 0 ? item.days_left + ' 天后到期' : '已逾期' }}</text>
							</view>
							<view class="tag-date">
								<text class="tag-date-text">到期日 {{ item.due_date }}</text>
							</view>
						</view>
					</view>
					<view class="return-btn" @click="handleReturn(item)">
						<text class="return-btn-text">归还</text>
					</view>
				</view>
			</view>

			<view class="section" v-if="reservedList.length > 0">
				<view class="section-header">
					<text class="section-symbol">§</text>
					<text class="section-text">已预约</text>
				</view>
				<view class="borrow-card" v-for="item in reservedList" :key="item._id">
					<image class="borrow-cover" :src="item.image" mode="aspectFill" @error="onImageError"></image>
					<view class="borrow-info">
						<text class="borrow-title">{{ item.name }}</text>
						<text class="borrow-author">{{ item.author }}</text>
						<view class="tag-reserved">
							<text class="tag-reserved-text">归还后通知取书</text>
						</view>
					</view>
				</view>
			</view>

			<view class="section">
				<view class="section-header">
					<text class="section-symbol">§</text>
					<text class="section-text">心愿书单</text>
				</view>
				<scroll-view class="wish-scroll" scroll-x>
					<view class="wish-list">
						<view class="wish-item" v-for="(book, index) in wishList" :key="index">
							<view class="wish-cover-wrap">
								<image class="wish-cover" :src="book.image" mode="aspectFill" @error="onImageError"></image>
							</view>
							<text class="wish-name">{{ book.name }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

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
			<view class="nav-item active">
				<image class="nav-icon" src="/static/nav/shelf.png" mode="aspectFit"></image>
				<text class="nav-label">书架</text>
			</view>
			<view class="nav-item" @click="goHistory">
				<image class="nav-icon" src="/static/nav/history.png" mode="aspectFit"></image>
				<text class="nav-label">记录</text>
			</view>
			<view class="nav-item" @click="goProfile">
				<image class="nav-icon" src="/static/nav/profile.png" mode="aspectFit"></image>
				<text class="nav-label">我的</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { getCurrentUser, isLoggedIn } from '@/utils/user.js';
	import { borrowApi } from '@/utils/coffee-store.js';
	import { resolveImageUrl } from '@/utils/coffee-store.js';

	export default {
		data() {
			return {
				borrowingList: [],
				reservedList: [],
				wishList: [],
				currentUser: null,
				isLoggedIn: false,
				stats: { total: 0, borrowing: 0, returned: 0 }
			};
		},
		onLoad() {
			this.loadData();
		},
		onShow() {
			this.loadData();
		},
		methods: {
			async loadData() {
				this.isLoggedIn = isLoggedIn();
				if (!this.isLoggedIn) {
					this.borrowingList = [];
					this.stats = { total: 0, borrowing: 0, returned: 0 };
					return;
				}
				this.currentUser = getCurrentUser();
				try {
					const res = await borrowApi.getRecords(this.currentUser.user_id);
					const list = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
					this.borrowingList = list.filter(r => r.status === 'borrowed' || r.status === 'overdue').map(r => ({
					...r,
					_id: r._id || r.id,
					name: r.product_name,
					author: r.product_author || '',
					image: resolveImageUrl(r.product_image || ''),
					days_left: this.calcDaysLeft(r.due_date),
					borrow_date: this.formatDate(r.borrow_date),
					due_date: this.formatDate(r.due_date)
				}));
					this.stats = {
						total: list.length,
						borrowing: list.filter(r => r.status === 'borrowed' || r.status === 'overdue').length,
						returned: list.filter(r => r.status === 'returned').length
					};
				} catch (err) {
					console.error('加载书架数据失败', err);
				}
				this.wishList = [
					{ name: '挪威的森林', image: '/static/book-placeholder-1.png' },
					{ name: '百年孤独', image: '/static/book-placeholder-2.png' },
					{ name: '白夜行', image: '/static/book-placeholder-3.png' },
					{ name: '小王子', image: '/static/book-placeholder-4.png' }
				];
			},
			formatDate(dateStr) {
				if (!dateStr) return '';
				const d = new Date(dateStr);
				return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			},
			calcDaysLeft(dueDate) {
				if (!dueDate) return 0;
				const due = new Date(dueDate);
				const now = new Date();
				const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
				return diff;
			},
			handleReturn(item) {
				uni.showModal({
					title: '确认归还',
					content: `确认归还《${item.name}》？`,
					success: async (res) => {
						if (res.confirm) {
							try {
								await borrowApi.returnBook(item._id);
								uni.showToast({ title: '归还成功', icon: 'success' });
								this.loadData();
							} catch (err) {
								uni.showToast({ title: err.message || '归还失败', icon: 'none' });
							}
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
			goHistory() {
				uni.redirectTo({ url: '/pages/jilu/jilu' });
			},
			goProfile() {
				if (!isLoggedIn()) {
					uni.navigateTo({ url: '/pages/login/login' });
				} else {
					uni.redirectTo({ url: '/pages/wode/wode' });
				}
			},
			goLogin() {
				uni.navigateTo({ url: '/pages/login/login' });
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
		padding: 50px 24px 20px;
		background: linear-gradient(180deg, #F2ECE0 0%, #FAFAF8 85%);
	}

	.page-label {
		font-size: 13px;
		color: #8B7355;
		letter-spacing: 2px;
		font-weight: 500;
	}

	.page-title {
		font-size: 32px;
		font-weight: 700;
		color: #3D2817;
		display: block;
		margin-top: 6px;
		margin-bottom: 20px;
	}

	.stats-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		background-color: #FFFFFF;
		border-radius: 16px;
		padding: 18px 16px;
		box-shadow: 0 2px 16px rgba(60, 40, 20, 0.05);
	}

	.stat-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-num {
		font-size: 26px;
		font-weight: 700;
		color: #3D2817;
		line-height: 1.2;
	}

	.stat-unit {
		font-size: 12px;
		color: #8B7355;
		margin-top: 4px;
	}

	.stat-divider {
		width: 1px;
		height: 30px;
		background-color: #E8DFD0;
	}

	.content-area {
		flex: 1;
		padding: 0 24px;
	}

	.section {
		margin-top: 24px;
	}

	.section-header {
		display: flex;
		align-items: center;
		margin-bottom: 14px;
	}

	.section-symbol {
		font-size: 18px;
		color: #8B5A2B;
		font-weight: 700;
		margin-right: 4px;
	}

	.section-text {
		font-size: 16px;
		font-weight: 700;
		color: #3D2817;
	}

	.borrow-card {
		display: flex;
		gap: 14px;
		background-color: #FFFFFF;
		border-radius: 16px;
		padding: 14px;
		margin-bottom: 12px;
		box-shadow: 0 2px 16px rgba(60, 40, 20, 0.05);
	}

	.borrow-cover {
		width: 80px;
		height: 105px;
		border-radius: 8px;
		flex-shrink: 0;
		background-color: #E8DFD0;
	}

	.borrow-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.borrow-title {
		font-size: 16px;
		font-weight: 700;
		color: #3D2817;
		display: block;
	}

	.borrow-author {
		font-size: 13px;
		color: #8B7355;
		display: block;
		margin-top: 2px;
	}

	.borrow-date {
		font-size: 12px;
		color: #B0A89E;
		display: block;
		margin-top: 6px;
	}

	.borrow-tags {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.tag-expire {
		background-color: rgba(245, 197, 66, 0.15);
		padding: 4px 10px;
		border-radius: 6px;
	}

	.tag-expire-text {
		font-size: 11px;
		font-weight: 600;
		color: #D4A017;
	}

	.tag-date {
		background-color: rgba(139, 90, 43, 0.1);
		padding: 4px 10px;
		border-radius: 6px;
	}

	.tag-date-text {
		font-size: 11px;
		font-weight: 600;
		color: #8B5A2B;
	}

	.tag-reserved {
		background-color: rgba(46, 213, 115, 0.15);
		padding: 4px 10px;
		border-radius: 6px;
		margin-top: 8px;
		align-self: flex-start;
	}

	.tag-reserved-text {
		font-size: 12px;
		font-weight: 600;
		color: #27AE60;
	}

	.wish-scroll {
		white-space: nowrap;
	}

	.wish-list {
		display: flex;
		gap: 16px;
		padding-bottom: 8px;
	}

	.wish-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 90px;
		flex-shrink: 0;
	}

	.wish-cover-wrap {
		width: 90px;
		height: 120px;
		border-radius: 10px;
		overflow: hidden;
		background-color: #E8DFD0;
		margin-bottom: 8px;
		box-shadow: 0 4px 14px rgba(60, 40, 20, 0.08);
	}

	.wish-cover {
		width: 100%;
		height: 100%;
	}

	.wish-name {
		font-size: 12px;
		font-weight: 600;
		color: #3D2817;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80px 0;
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.empty-text {
		font-size: 16px;
		font-weight: 600;
		color: #3D2817;
		margin-bottom: 8px;
	}

	.empty-hint {
		font-size: 13px;
		color: #B0A89E;
		margin-bottom: 20px;
	}

	.login-btn {
		background: linear-gradient(135deg, #3D2817 0%, #5C3A1F 100%);
		border-radius: 24px;
		padding: 10px 36px;
	}

	.login-btn-text {
		font-size: 14px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.return-btn {
		background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		border-radius: 12px;
		padding: 8px 16px;
		align-self: center;
		flex-shrink: 0;
	}

	.return-btn-text {
		font-size: 13px;
		font-weight: 600;
		color: #FFFFFF;
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

	.center-icon {
		width: 28px;
		height: 28px;
	}

	.nav-label {
		font-size: 11px;
		color: #B0A89E;
		transition: color 0.15s ease;
	}
</style>
