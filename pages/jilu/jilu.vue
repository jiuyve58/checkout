<template>
	<view class="page-container">
		<view class="header-area">
			<text class="page-label">HISTORY · 借阅记录</text>
			<text class="page-title">借阅历史</text>
			<text class="page-subtitle">累计借阅 {{ records.length }} 册</text>
		</view>

		<view class="tabs">
			<view class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
				<text class="tab-text">全部</text>
			</view>
			<view class="tab-item" :class="{ active: activeTab === 'borrowed' }" @click="activeTab = 'borrowed'">
				<text class="tab-text">借阅中</text>
			</view>
			<view class="tab-item" :class="{ active: activeTab === 'returned' }" @click="activeTab = 'returned'">
				<text class="tab-text">已归还</text>
			</view>
		</view>

		<scroll-view class="content-area" scroll-y @scrolltolower="loadMore">
			<view class="empty-state" v-if="!isLoggedIn">
				<view class="empty-icon">🔐</view>
				<text class="empty-text">请先登录</text>
				<text class="empty-hint">登录后查看借阅记录</text>
				<view class="login-btn" @click="goLogin">
					<text class="login-btn-text">立即登录</text>
				</view>
			</view>
			<view class="empty-state" v-else-if="filteredRecords.length === 0 && !loading">
				<view class="empty-icon">📚</view>
				<text class="empty-text">暂无借阅记录</text>
				<text class="empty-hint">去书库借一本好书吧</text>
			</view>

			<view class="month-section" v-for="group in groupedRecords" :key="group.month">
				<text class="month-label">{{ group.month }}</text>
				<view class="record-list">
					<view class="record-card" v-for="item in group.records" :key="item._id">
						<image class="record-cover" :src="item.image" mode="aspectFill" @error="onImageError(item)"></image>
						<view class="record-info">
							<view class="record-top">
								<text class="record-name">{{ item.product_name }}</text>
								<view class="record-status" :class="item.status">
									<text class="status-text">{{ getStatusText(item.status) }}</text>
								</view>
							</view>
							<text class="record-author">编号: {{ item.product_code }}</text>
							<view class="record-dates">
								<view class="date-block">
									<text class="date-label">借出</text>
									<text class="date-value">{{ formatDate(item.borrow_date) }}</text>
								</view>
								<view class="date-divider"></view>
								<view class="date-block">
									<text class="date-label">到期</text>
									<text class="date-value">{{ formatDate(item.due_date) }}</text>
								</view>
							</view>
							<view class="record-actions" v-if="item.status === 'borrowed' || item.status === 'overdue'">
								<view class="return-btn" @click="handleReturn(item)">
									<text class="return-text">归还</text>
								</view>
							</view>
							<view class="record-dates" v-else-if="item.status === 'returned'">
								<view class="date-block">
									<text class="date-label">归还</text>
									<text class="date-value">{{ formatDate(item.return_date) }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>
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
			<view class="nav-item" @click="goShelf">
				<image class="nav-icon" src="/static/nav/shelf.png" mode="aspectFit"></image>
				<text class="nav-label">书架</text>
			</view>
			<view class="nav-item active">
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
	import { borrowApi } from '@/utils/coffee-api.js';
	import { getCurrentUser, isLoggedIn } from '@/utils/user.js';
	import { resolveImageUrl } from '@/utils/coffee-store.js';

	export default {
		data() {
			return {
				records: [],
				loading: false,
				activeTab: 'all',
				isLoggedIn: false
			};
		},
		computed: {
			filteredRecords() {
				if (this.activeTab === 'all') {
					return this.records;
				}
				return this.records.filter(r => r.status === this.activeTab);
			},
			groupedRecords() {
				const map = {};
				this.filteredRecords.forEach(r => {
					const month = this.getMonth(r.borrow_date);
					if (!map[month]) map[month] = [];
					map[month].push(r);
				});
				return Object.keys(map).map(month => ({ month, records: map[month] }));
			}
		},
		onShow() {
			this.loadRecords();
		},
		methods: {
			async loadRecords() {
				if (this.loading) return;
				this.isLoggedIn = isLoggedIn();
				if (!this.isLoggedIn) {
					this.records = [];
					return;
				}
				this.loading = true;
				try {
					const user = getCurrentUser();
					if (!user) {
						this.records = [];
						return;
					}
					const res = await borrowApi.getRecords(user.user_id);
					const list = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
					this.records = list.map(r => ({
						...r,
						_id: r._id || r.id,
						image: resolveImageUrl(r.product_image || ''),
						month: this.getMonth(r.borrow_date)
					}));
				} catch (err) {
					console.error('获取借阅记录失败:', err);
					this.records = [];
				} finally {
					this.loading = false;
				}
			},
			getMonth(dateStr) {
				if (!dateStr) return '';
				const d = new Date(dateStr);
				return `${d.getFullYear()}年${d.getMonth() + 1}月`;
			},
			formatDate(dateStr) {
				if (!dateStr) return '-';
				const d = new Date(dateStr);
				return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
			},
			getStatusText(status) {
				const map = {
					borrowed: '借阅中',
					returned: '已归还',
					overdue: '已逾期'
				};
				return map[status] || status;
			},
			async handleReturn(item) {
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
								this.loadRecords();
							} catch (err) {
								uni.hideLoading();
								uni.showToast({ title: err.message || '归还失败', icon: 'none' });
							}
						}
					}
				});
			},
			loadMore() {},
			goHome() {
				uni.reLaunch({ url: '/pages/book-menu/book-menu' });
			},
			goLibrary() {
				uni.redirectTo({ url: '/pages/shuku/shuku' });
			},
			goShelf() {
				uni.redirectTo({ url: '/pages/shujia/shujia' });
			},
			goProfile() {
				uni.redirectTo({ url: '/pages/wode/wode' });
			},
			goLogin() {
				uni.navigateTo({ url: '/pages/login/login' });
			},
			onImageError(item) {
				if (item.image !== '/static/book-placeholder-1.png') {
					item.image = '/static/book-placeholder-1.png';
				}
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
	}

	.page-subtitle {
		font-size: 14px;
		color: #8B7355;
		display: block;
		margin-top: 4px;
	}

	.tabs {
		display: flex;
		gap: 8px;
		padding: 12px 24px;
		background-color: #FFFFFF;
		border-bottom: 1px solid #F0E8DC;
	}

	.tab-item {
		flex: 1;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #FAF6F0;
		border-radius: 18px;
		transition: all 0.2s ease;

		&.active {
			background-color: #3D2817;
		}
	}

	.tab-text {
		font-size: 14px;
		font-weight: 600;
		color: #8B7355;

		.active & {
			color: #FFFFFF;
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80px 0;
	}

	.empty-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}

	.empty-text {
		font-size: 16px;
		font-weight: 600;
		color: #3D2817;
		margin-bottom: 8px;
	}

	.empty-hint {
		font-size: 14px;
		color: #B0A89E;
	}

	.login-btn {
		background: linear-gradient(135deg, #3D2817 0%, #5C3A1F 100%);
		border-radius: 24px;
		padding: 10px 36px;
		margin-top: 16px;
	}

	.login-btn-text {
		font-size: 14px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.content-area {
		flex: 1;
		padding: 0 24px;
	}

	.month-section {
		margin-top: 24px;
	}

	.month-label {
		font-size: 14px;
		font-weight: 600;
		color: #3D2817;
		display: block;
		margin-bottom: 12px;
	}

	.record-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.record-card {
		display: flex;
		gap: 14px;
		background-color: #FFFFFF;
		border-radius: 14px;
		padding: 14px;
		box-shadow: 0 2px 14px rgba(60, 40, 20, 0.05);
	}

	.record-cover {
		width: 76px;
		height: 100px;
		border-radius: 8px;
		flex-shrink: 0;
		background-color: #E8DFD0;
	}

	.record-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.record-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.record-name {
		font-size: 16px;
		font-weight: 700;
		color: #3D2817;
		flex: 1;
		margin-right: 8px;
	}

	.record-status {
		font-size: 11px;
		font-weight: 600;
		padding: 3px 10px;
		border-radius: 5px;
		flex-shrink: 0;

		&.borrowed {
			background-color: rgba(52, 152, 219, 0.12);
			.status-text { color: #3498DB; }
		}
		&.returned {
			background-color: rgba(58, 176, 128, 0.12);
			.status-text { color: #3AB080; }
		}
		&.overdue {
			background-color: rgba(231, 76, 60, 0.12);
			.status-text { color: #E74C3C; }
		}
	}

	.status-text {
		font-size: 11px;
		font-weight: 600;
	}

	.record-actions {
		margin-top: 8px;
		display: flex;
		justify-content: flex-end;
	}

	.return-btn {
		background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		border-radius: 16px;
		padding: 6px 20px;
	}

	.return-text {
		font-size: 13px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.record-author {
		font-size: 13px;
		color: #8B7355;
		display: block;
	}

	.record-dates {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 4px;
	}

	.date-block {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.date-label {
		font-size: 11px;
		color: #B0A89E;
	}

	.date-value {
		font-size: 12px;
		font-weight: 600;
		color: #3D2817;
	}

	.date-divider {
		width: 1px;
		height: 12px;
		background-color: #E8DFD0;
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
