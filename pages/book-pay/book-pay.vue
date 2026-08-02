<template>
	<view class="page-container">
		<view class="nav-bar">
			<view class="back-btn" @click="goBack">
				<uni-icons type="back" size="24" color="#3D2817"></uni-icons>
			</view>
			<text class="page-title">确认借阅</text>
			<view class="placeholder"></view>
		</view>

		<scroll-view class="content" scroll-y>
			<view class="user-card" v-if="currentUser">
				<view class="user-icon">
					<uni-icons type="person" size="26" color="#FFFFFF"></uni-icons>
				</view>
				<view class="user-info">
					<view class="user-row">
						<text class="user-name">读者：{{ currentUser.user_name }}</text>
						<view class="user-tag">认证读者</view>
					</view>
					<text class="user-id">读者证号：{{ currentUser.user_id }}</text>
				</view>
				<view class="user-arrow">
					<uni-icons type="right" size="18" color="#B0A89E"></uni-icons>
				</view>
			</view>

			<view class="section-card">
				<view class="section-tag">
					<text class="tag-symbol">§</text>
					<text class="tag-title">借阅图书清单</text>
					<view class="book-count-wrap">
						<text class="book-count">共 {{ totalCount }} 本</text>
					</view>
				</view>
				<view class="book-list">
					<view class="book-item" v-for="item in cartItems" :key="item._id">
						<image class="book-img" :src="item.image" mode="aspectFill" @error="onImageError"></image>
						<view class="book-info">
							<text class="book-name">{{ item.name }}</text>
							<text class="book-author">{{ item.author }}</text>
							<view class="book-bottom">
								<text class="book-price">￥{{ item.price }}</text>
								<view class="qty-badge">x{{ item.quantity }}</view>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view class="section-card">
				<view class="section-tag">
					<text class="tag-symbol">§</text>
					<text class="tag-title">借阅信息</text>
				</view>
				<view class="info-grid">
					<view class="info-item">
						<view class="info-icon">
							<uni-icons type="calendar" size="18" color="#8B5A2B"></uni-icons>
						</view>
						<view class="info-content">
							<text class="info-label">借阅日期</text>
							<text class="info-value">{{ borrowDate }}</text>
						</view>
					</view>
					<view class="info-item highlight">
						<view class="info-icon">
							<uni-icons type="clock" size="18" color="#FFFFFF"></uni-icons>
						</view>
						<view class="info-content">
							<text class="info-label light">到期日期</text>
							<text class="info-value light">{{ returnDate }}</text>
						</view>
					</view>
					<view class="info-item">
						<view class="info-icon">
							<uni-icons type="wallet" size="18" color="#8B5A2B"></uni-icons>
						</view>
						<view class="info-content">
							<text class="info-label">借阅天数</text>
							<text class="info-value">14 天</text>
						</view>
					</view>
					<view class="info-item">
						<view class="info-icon">
							<uni-icons type="book" size="18" color="#8B5A2B"></uni-icons>
						</view>
						<view class="info-content">
							<text class="info-label">借阅数量</text>
							<text class="info-value">{{ totalCount }} 本</text>
						</view>
					</view>
				</view>
			</view>

			<view class="section-card">
				<view class="section-tag">
					<text class="tag-symbol">§</text>
					<text class="tag-title">押金说明</text>
				</view>
				<view class="deposit-list">
					<view class="deposit-item">
						<view class="deposit-dot"></view>
						<text class="deposit-text">每本书押金 ￥50，按时归还全额退还</text>
					</view>
					<view class="deposit-item">
						<view class="deposit-dot warn"></view>
						<text class="deposit-text">逾期每日扣除押金 ￥2/天</text>
					</view>
					<view class="deposit-item">
						<view class="deposit-dot danger"></view>
						<text class="deposit-text">图书损坏或丢失将扣除全部押金</text>
					</view>
				</view>
			</view>

			<view class="section-card">
				<view class="section-tag">
					<text class="tag-symbol">§</text>
					<text class="tag-title">押金支付方式</text>
				</view>
				<view class="payment-list">
					<view class="payment-item" :class="{ active: paymentMethod === 'wechat' }" @click="selectPayment('wechat')">
						<view class="payment-icon wechat">
							<uni-icons type="chatbubble" size="20" color="#FFFFFF"></uni-icons>
						</view>
						<text class="payment-name">微信支付</text>
						<view class="payment-radio" :class="{ checked: paymentMethod === 'wechat' }">
							<uni-icons v-if="paymentMethod === 'wechat'" type="checkmarkempty" size="14" color="#FFFFFF"></uni-icons>
						</view>
					</view>
					<view class="payment-item" :class="{ active: paymentMethod === 'balance' }" @click="selectPayment('balance')">
						<view class="payment-icon balance">
							<uni-icons type="wallet" size="20" color="#FFFFFF"></uni-icons>
						</view>
						<text class="payment-name">余额支付</text>
						<text class="payment-balance">余额 ￥320.00</text>
						<view class="payment-radio" :class="{ checked: paymentMethod === 'balance' }">
							<uni-icons v-if="paymentMethod === 'balance'" type="checkmarkempty" size="14" color="#FFFFFF"></uni-icons>
						</view>
					</view>
				</view>
			</view>

			<view class="section-card summary-card">
				<view class="summary-row">
					<text class="summary-label">图书借阅费</text>
					<text class="summary-value">￥{{ formatPrice(subtotal) }}</text>
				</view>
				<view class="summary-row">
					<text class="summary-label">押金（￥50 × {{ totalCount }}本）</text>
					<text class="summary-value">￥{{ depositTotal }}</text>
				</view>
				<view class="summary-divider"></view>
				<view class="summary-row total-row">
					<text class="summary-label total-label">应付总计</text>
					<text class="summary-value total-value">￥{{ formatPrice(total) }}</text>
				</view>
			</view>

			<view style="height: 140px;"></view>
		</scroll-view>

		<view class="bottom-bar">
			<view class="bottom-info">
				<text class="total-label">应付</text>
				<text class="total-price">￥{{ formatPrice(total) }}</text>
			</view>
			<view class="confirm-btn" @click="handleBorrow">
				<text class="confirm-text">确认借阅</text>
				<uni-icons type="arrowright" size="18" color="#FFFFFF"></uni-icons>
			</view>
		</view>
	</view>
</template>

<script>
import { getCart, getCartTotal, clearCart } from '@/utils/cart.js';
import { resolveImageUrl } from '@/utils/coffee-api.js';
import { getCurrentUser, isLoggedIn } from '@/utils/user.js';
import { borrowApi } from '@/utils/coffee-store.js';

export default {
	data() {
		return {
			cartItems: [],
			subtotal: 0,
			depositPerBook: 50,
			paymentMethod: 'wechat',
			currentUser: null
		};
	},
	computed: {
		totalCount() {
			return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
		},
		depositTotal() {
			return this.totalCount * this.depositPerBook;
		},
		total() {
			return this.subtotal + this.depositTotal;
		},
		borrowDate() {
			const d = new Date();
			return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
		},
		returnDate() {
			const d = new Date();
			d.setDate(d.getDate() + 14);
			return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
		}
	},
	onLoad() {
		if (!isLoggedIn()) {
			uni.showModal({
				title: '提示',
				content: '请先登录后再借阅图书',
				confirmText: '去登录',
				success: (res) => {
					if (res.confirm) {
						uni.navigateTo({ url: '/pages/login/login' });
					} else {
						uni.navigateBack();
					}
				}
			});
			return;
		}
		this.currentUser = getCurrentUser();
		this.loadCart();
	},
	methods: {
		loadCart() {
			var cart = getCart();
			this.cartItems = cart.map(item => ({
				...item,
				image: resolveImageUrl(item.image)
			}));
			var total = getCartTotal();
			this.subtotal = total.totalPrice;
		},
		formatPrice(price) {
			if (!price) return '0';
			return price.toFixed(0);
		},
		goBack() {
			uni.navigateBack();
		},
		selectPayment(method) {
			this.paymentMethod = method;
		},
		handleBorrow() {
			if (this.cartItems.length === 0) {
				uni.showToast({ title: '借阅列表为空', icon: 'none' });
				return;
			}
			var that = this;
			uni.showModal({
				title: '确认借阅',
				content: '共借阅 ' + this.totalCount + ' 本书\n押金：￥' + this.depositTotal + '\n到期日期：' + this.returnDate,
				confirmText: '确认借阅',
				success: function(res) {
					if (res.confirm) {
						that.submitBorrow();
					}
				}
			});
		},
		onImageError(e) {
			e.target.src = '/static/book-placeholder-1.png';
		},
		async submitBorrow() {
			var that = this;
			if (!this.currentUser || !this.currentUser.user_id) {
				uni.showToast({ title: '请先登录', icon: 'none' });
				return;
			}
			uni.showLoading({ title: '借阅中...', mask: true });
			try {
				for (var i = 0; i < this.cartItems.length; i++) {
					var item = this.cartItems[i];
					for (var j = 0; j < item.quantity; j++) {
						var res = await borrowApi.borrow(
							String(item._id),
							this.currentUser.user_id,
							this.currentUser.user_name,
							14
						);
						if (res && res.code !== 0) {
							throw new Error(res.message || '借阅失败');
						}
					}
				}
				clearCart();
				uni.hideLoading();
				uni.showToast({
					title: '借阅成功',
					icon: 'success',
					duration: 1500
				});
				setTimeout(function() {
					uni.redirectTo({ url: '/pages/jilu/jilu' });
				}, 1500);
			} catch (err) {
				uni.hideLoading();
				var msg = err && err.message ? err.message : '借阅失败';
				if (msg.indexOf('网络请求失败') !== -1) {
					msg = '服务器未启动，请先启动后端服务';
				}
				uni.showModal({
					title: '借阅失败',
					content: msg,
					showCancel: false
				});
			}
		}
	}
}
</script>

<style lang="scss">
	.page-container {
		width: 100%;
		min-height: 100vh;
		background-color: #FAF6F0;
	}

	.nav-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 52px 20px 16px;
		background-color: #FAF6F0;
	}

	.back-btn {
		width: 44px;
		height: 44px;
		background-color: #FFFFFF;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.page-title {
		font-weight: 700;
		font-size: 20px;
		color: #3D2817;
	}

	.placeholder {
		width: 44px;
	}

	.content {
		padding: 0 20px;
		height: calc(100vh - 120px);
	}

	.user-card {
		display: flex;
		align-items: center;
		gap: 14px;
		background-color: #FFFFFF;
		border-radius: 20px;
		padding: 18px;
		margin-bottom: 16px;
	}

	.user-icon {
		width: 52px;
		height: 52px;
		background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-info {
		flex: 1;
	}

	.user-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.user-name {
		font-size: 16px;
		font-weight: 600;
		color: #3D2817;
	}

	.user-tag {
		background-color: rgba(58, 176, 128, 0.12);
		color: #3AB080;
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 6px;
	}

	.user-id {
		font-size: 13px;
		color: #8B5A2B;
	}

	.user-arrow {
		flex-shrink: 0;
	}

	.section-card {
		background-color: #FFFFFF;
		border-radius: 20px;
		padding: 20px;
		margin-bottom: 16px;
	}

	.section-tag {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 16px;
	}

	.tag-symbol {
		font-size: 14px;
		color: #8B5A2B;
		font-weight: 600;
	}

	.tag-title {
		font-size: 16px;
		font-weight: 700;
		color: #3D2817;
		flex: 1;
	}

	.book-count-wrap {
		background-color: #F0E8DC;
		border-radius: 10px;
		padding: 4px 12px;
	}

	.book-count {
		font-size: 12px;
		font-weight: 600;
		color: #8B5A2B;
	}

	.book-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.book-item {
		display: flex;
		gap: 14px;
		padding: 12px;
		background-color: #FAF6F0;
		border-radius: 16px;
	}

	.book-img {
		width: 56px;
		height: 78px;
		border-radius: 10px;
		flex-shrink: 0;
		background-color: #F0E8DC;
	}

	.book-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.book-name {
		font-size: 15px;
		font-weight: 600;
		color: #3D2817;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.book-author {
		font-size: 13px;
		color: #8B5A2B;
	}

	.book-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.book-price {
		font-size: 15px;
		font-weight: 700;
		color: #8B5A2B;
	}

	.qty-badge {
		background-color: #F0E8DC;
		color: #8B5A2B;
		font-size: 12px;
		font-weight: 600;
		padding: 3px 10px;
		border-radius: 8px;
	}

	.info-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.info-item {
		width: calc(50% - 6px);
		display: flex;
		align-items: center;
		gap: 12px;
		background-color: #FAF6F0;
		border-radius: 16px;
		padding: 14px;

		&.highlight {
			background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);

			.info-icon {
				background: rgba(255, 255, 255, 0.2);
			}
		}
	}

	.info-icon {
		width: 40px;
		height: 40px;
		background-color: #FFFFFF;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.info-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.info-label {
		font-size: 12px;
		color: #999;

		&.light {
			color: rgba(255, 255, 255, 0.75);
		}
	}

	.info-value {
		font-size: 14px;
		font-weight: 700;
		color: #3D2817;

		&.light {
			color: #FFFFFF;
		}
	}

	.deposit-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.deposit-item {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.deposit-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #3AB080;
		flex-shrink: 0;

		&.warn {
			background-color: #F5C542;
		}

		&.danger {
			background-color: #E74C3C;
		}
	}

	.deposit-text {
		font-size: 13px;
		color: #5C4A3A;
		line-height: 1.5;
	}

	.payment-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.payment-item {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 14px;
		border-radius: 16px;
		background-color: #FAF6F0;
		margin-bottom: 10px;

		&.active {
			background-color: rgba(139, 90, 43, 0.08);
			border: 1.5px solid #8B5A2B;
		}

		&:last-child {
			margin-bottom: 0;
		}
	}

	.payment-icon {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&.wechat {
			background: linear-gradient(135deg, #3AB080 0%, #2E8B65 100%);
		}

		&.balance {
			background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		}
	}

	.payment-name {
		flex: 1;
		font-size: 15px;
		font-weight: 600;
		color: #3D2817;
	}

	.payment-balance {
		font-size: 13px;
		color: #8B5A2B;
		margin-right: 8px;
	}

	.payment-radio {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 2px solid #D4C9BE;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&.checked {
			background-color: #8B5A2B;
			border-color: #8B5A2B;
		}
	}

	.summary-card {
		padding: 18px 20px;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.summary-label {
		font-size: 14px;
		color: #6B5B4F;
	}

	.summary-value {
		font-size: 14px;
		font-weight: 600;
		color: #3D2817;
	}

	.summary-divider {
		height: 1px;
		background-color: rgba(139, 90, 43, 0.1);
		margin: 14px 0;
	}

	.total-row {
		margin-bottom: 0;
	}

	.total-label {
		font-size: 15px;
		font-weight: 600;
		color: #3D2817;
	}

	.total-value {
		font-size: 24px;
		font-weight: 700;
		color: #8B5A2B;
	}

	.bottom-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #FFFFFF;
		padding: 14px 20px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
		border-radius: 28px 28px 0 0;
		z-index: 50;
	}

	.bottom-info {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.total-label {
		font-size: 13px;
		color: #999;
	}

	.total-price {
		font-size: 26px;
		font-weight: 700;
		color: #8B5A2B;
	}

	.confirm-btn {
		height: 54px;
		padding: 0 32px;
		background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		border-radius: 27px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		box-shadow: 0 4px 16px rgba(139, 90, 43, 0.3);
	}

	.confirm-text {
		font-size: 16px;
		font-weight: 600;
		color: #FFFFFF;
	}
</style>
