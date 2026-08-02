<template>
	<view class="page-container">
		<view class="top-section">
			<view class="nav-bar">
				<view class="back-btn" @click="goBack">
					<uni-icons type="back" size="24" color="#3D2817"></uni-icons>
				</view>
				<view class="action-btns">
					<view class="action-btn">
						<uni-icons type="heart" size="22" color="#3D2817"></uni-icons>
					</view>
					<view class="action-btn">
						<uni-icons type="upload" size="22" color="#3D2817"></uni-icons>
					</view>
				</view>
			</view>
			<view class="book-img-wrap">
				<image class="book-img" :src="product.image" mode="aspectFill" @error="onProductImageError"></image>
			</view>
		</view>

		<view class="content-area">
			<view class="book-header">
				<view class="book-title-row">
					<text class="book-name">{{ product.name }}</text>
					<view class="book-code">{{ product.code || 'A-0001' }}</view>
				</view>
				<text class="book-author">{{ product.author }} · {{ product.year || '2020' }}</text>
				<view class="rating-row">
					<uni-icons type="star" size="16" color="#F5C542"></uni-icons>
					<uni-icons type="star" size="16" color="#F5C542"></uni-icons>
					<uni-icons type="star" size="16" color="#F5C542"></uni-icons>
					<uni-icons type="star" size="16" color="#F5C542"></uni-icons>
					<uni-icons type="starhalf" size="16" color="#F5C542"></uni-icons>
					<text class="rating-num">{{ product.rating }}</text>
					<text class="rating-count">(1,234 评价)</text>
				</view>
			</view>

			<view class="price-row">
				<view class="price-info">
					<text class="price-label">借阅价格</text>
					<text class="book-price">￥{{ product.price }}<text class="price-unit">/本</text></text>
				</view>
				<view class="available-tag" :class="{ 'out-of-stock': !isAvailable }">
					<uni-icons :type="isAvailable ? 'checkmarkempty' : 'closeempty'" size="14" :color="isAvailable ? '#3AB080' : '#E74C3C'"></uni-icons>
					<text class="available-text" :class="{ 'out': !isAvailable }">{{ isAvailable ? '可借阅' : '已借出' }}</text>
					<text class="stock-count" v-if="isAvailable">库存:{{ product.stock }}</text>
				</view>
			</view>

			<view class="duration-section">
				<view class="section-tag">
					<text class="tag-symbol">§</text>
					<text class="tag-title">借阅时长</text>
				</view>
				<view class="duration-list">
					<view class="duration-item" :class="{ active: selectedDuration === item.value }" v-for="item in durations" :key="item.value" @click="selectDuration(item.value)">
						<text class="duration-name">{{ item.label }}</text>
						<text class="duration-price" v-if="item.price > 0">+￥{{ item.price }}</text>
						<text class="duration-price free" v-else>免费</text>
						<view class="duration-return" v-if="selectedDuration === item.value">
							{{ returnDate }}到期
						</view>
					</view>
				</view>
			</view>

			<view class="desc-section">
				<view class="section-tag">
					<text class="tag-symbol">§</text>
					<text class="tag-title">内容简介</text>
				</view>
				<view class="desc-content" :class="{ expanded: showFullDesc }">
					<text class="desc-text">{{ product.description }}</text>
				</view>
				<view class="expand-btn" @click="toggleDesc">
					<text class="expand-text">{{ showFullDesc ? '收起' : '展开更多' }}</text>
					<uni-icons :type="showFullDesc ? 'up' : 'down'" size="14" color="#8B5A2B"></uni-icons>
				</view>
			</view>

			<view class="info-cards">
				<view class="info-card">
					<uni-icons type="wallet" size="20" color="#8B5A2B"></uni-icons>
					<view class="card-info">
						<text class="card-label">借阅押金</text>
						<text class="card-value">￥{{ deposit }}</text>
					</view>
				</view>
				<view class="info-card">
					<uni-icons type="calendar" size="20" color="#8B5A2B"></uni-icons>
					<view class="card-info">
						<text class="card-label">到期日期</text>
						<text class="card-value">{{ returnDate }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="bottom-bar">
			<view class="bottom-left">
				<view class="bottom-icon-btn" @click="goHome">
					<uni-icons type="home" size="24" color="#6B5B4F"></uni-icons>
				</view>
				<view class="bottom-icon-btn cart-btn" @click="toggleBorrowList">
					<uni-icons type="shoppingcart" size="24" color="#6B5B4F"></uni-icons>
					<view class="mini-badge" v-if="cartTotal.totalCount > 0">
						<text class="mini-badge-text">{{ cartTotal.totalCount }}</text>
					</view>
				</view>
			</view>
			<view class="borrow-btn" @click="addToBorrowList">
				<uni-icons type="book" size="20" color="#FFFFFF"></uni-icons>
				<text class="borrow-text">加入借阅列表</text>
			</view>
		</view>

		<view class="cart-popup" v-if="cartTotal.totalCount > 0">
			<view class="cart-popup-mask" v-if="showCartList" @click="toggleCartList"></view>
			<view class="cart-popup-inner" :class="{ 'show-list': showCartList }">
				<view class="cart-header" @click="toggleCartList">
					<view class="cart-info">
						<view class="cart-badge-icon">
							<uni-icons type="book" size="18" color="#FFFFFF"></uni-icons>
							<text class="badge-count">{{ cartTotal.totalCount }}</text>
						</view>
						<view class="cart-detail">
							<text class="cart-label">借阅列表</text>
							<text class="cart-price">共 {{ cartTotal.totalCount }} 本</text>
						</view>
					</view>
					<view class="cart-toggle">
						<text class="toggle-text">{{ showCartList ? '收起' : '展开' }}</text>
						<uni-icons :type="showCartList ? 'up' : 'down'" size="16" color="#FFFFFF"></uni-icons>
					</view>
				</view>
				
				<view class="cart-list" v-if="showCartList">
					<view class="cart-list-item" v-for="item in cartItems" :key="item._id">
						<image class="item-img" :src="item.image" mode="aspectFill"></image>
						<view class="item-info">
							<text class="item-name">{{ item.name }}</text>
							<text class="item-author">{{ item.author }}</text>
							<view class="item-bottom">
								<text class="item-price">￥{{ item.price }}</text>
								<text class="item-qty">x{{ item.quantity }}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="cart-footer" @click.stop>
					<view class="clear-btn" @click="handleClearCart">
						<uni-icons type="trash" size="16" color="#3D2817"></uni-icons>
						<text class="clear-text">清空</text>
					</view>
					<view class="checkout-btn" @click="handleCheckout">
						<text class="checkout-text">确认借阅</text>
						<uni-icons type="right" size="16" color="#FFFFFF"></uni-icons>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getCart, getCartTotal, addToCart as cartAdd, updateCartItemQuantity, clearCart } from '@/utils/cart.js';
	import { importObject, resolveImageUrl, borrowApi } from '@/utils/coffee-api.js';
	import { getCurrentUser } from '@/utils/user.js';
	
	export default {
		data() {
			return {
				product: {
					name: '',
					author: '',
					description: '',
					price: 14,
					image: '',
					rating: 4.8,
					code: 'A-0001',
					year: '2020',
					stock: 1
				},
				selectedDuration: 14,
				durations: [
					{ value: 7, label: '7天', price: 0 },
					{ value: 14, label: '14天', price: 0 },
					{ value: 30, label: '30天', price: 5 }
				],
				deposit: 50,
				cartTotal: {
					totalCount: 0,
					totalPrice: 0
				},
				cartItems: [],
				showCartList: false,
				showFullDesc: false
			};
		},
		computed: {
			returnDate() {
				const d = new Date();
				d.setDate(d.getDate() + this.selectedDuration);
				return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
			},
			isAvailable() {
				return (this.product.stock || 0) > 0;
			}
		},
		onLoad(options) {
			if (options && options.id) {
				this.loadDetail(decodeURIComponent(options.id));
				this.updateCartTotal();
				return;
			}
			const coffeeData = uni.getStorageSync('currentCoffee');
			if (coffeeData) {
				this.product = {
					name: coffeeData.name || '',
					author: coffeeData.author || '未知作者',
					description: coffeeData.description || '暂无书籍简介',
					price: coffeeData.price ? (coffeeData.price / 100).toFixed(0) : 14,
					image: resolveImageUrl(coffeeData.image) || 'https://picsum.photos/seed/book/300/400',
					rating: coffeeData.rating || 4.8,
					_id: coffeeData._id,
					code: coffeeData.code || 'A-0001',
					year: coffeeData.year || '2020',
					stock: coffeeData.stock !== undefined ? coffeeData.stock : 5
				};
			}
			this.updateCartTotal();
		},
		methods: {
			selectDuration(value) {
				this.selectedDuration = value;
			},
			onProductImageError() {
				if (this.product.image && !this.product.image.startsWith('/static/')) {
					this.product.image = '/static/book-placeholder-1.png';
					this.$forceUpdate();
				}
			},
			toggleDesc() {
				this.showFullDesc = !this.showFullDesc;
			},
			toggleCartList() {
				this.showCartList = !this.showCartList;
				if (this.showCartList) {
					this.loadCartItems();
				}
			},
			toggleBorrowList() {
				if (this.cartTotal.totalCount > 0) {
					this.showCartList = !this.showCartList;
					if (this.showCartList) {
						this.loadCartItems();
					}
				}
			},
			loadCartItems() {
				const cart = getCart();
				this.cartItems = cart.map(item => ({
					...item,
					cartId: item._id
				}));
			},
			updateCartTotal() {
				this.cartTotal = getCartTotal();
				this.loadCartItems();
			},
			loadDetail(id) {
				const productsObj = importObject('get-coffee-products');
				productsObj.getDetail(id).then(res => {
					const item = res && res.data ? res.data : (res && res._id ? res : null);
					if (item) {
						this.product = {
							_id: item._id,
							name: item.name || '',
							author: item.author || '未知作者',
							description: item.description || '暂无书籍简介',
							price: item.price ? (item.price / 100).toFixed(0) : 14,
							image: resolveImageUrl(item.image) || '/static/book-placeholder-1.png',
							rating: item.rating || 4.8,
							code: item.code || 'A-0001',
							year: item.year || '2020',
							stock: item.stock !== undefined ? item.stock : 5
						};
					}
				}).catch(err => {
					console.warn('获取图书详情失败，使用默认数据:', err.message);
					this.product = {
						_id: id,
						name: '未知书籍',
						author: '未知作者',
						description: '暂无书籍简介',
						price: 14,
						image: '/static/book-placeholder-1.png',
						rating: 4.8,
						code: 'A-0001',
						year: '2020',
						stock: 5
					};
				});
			},
			addToBorrowList() {
				if (!this.product._id) {
					uni.showToast({ title: '图书信息加载中', icon: 'none' });
					return;
				}
				if (!this.isAvailable) {
					uni.showToast({ title: '库存不足，无法借阅', icon: 'none' });
					return;
				}
				const cart = getCart();
				const existingItem = cart.find(item => item._id === this.product._id);
				if (existingItem) {
					updateCartItemQuantity(this.product._id, existingItem.quantity + 1);
				} else {
					cartAdd({
						_id: this.product._id,
						name: this.product.name,
						author: this.product.author,
						code: this.product.code,
						year: this.product.year,
						price: this.product.price,
						image: this.product.image,
						borrowDays: this.selectedDuration
					}, 1);
				}
				this.updateCartTotal();
				uni.showToast({ title: '已加入借阅列表', icon: 'success' });
			},
			goBack() {
				uni.navigateBack();
			},
			goHome() {
				uni.navigateBack();
			},
			handleClearCart() {
				clearCart();
				this.updateCartTotal();
				this.showCartList = false;
				uni.showToast({ title: '借阅列表已清空', icon: 'success' });
			},
			async handleCheckout() {
				const cart = getCart();
				if (cart.length === 0) {
					uni.showToast({ title: '借阅列表为空', icon: 'none' });
					return;
				}
				uni.showLoading({ title: '处理借阅中...' });
				const user = getCurrentUser();
				if (!user || !user.user_id) {
					uni.hideLoading();
					uni.showModal({ title: '提示', content: '请先登录后再借阅', showCancel: false });
					return;
				}
				const failedItems = [];
				let lastError = '';
				for (const item of cart) {
					try {
						const res = await borrowApi.borrow(item._id, user.user_id, user.user_name, item.borrowDays || 30);
						if (res && res.code !== 0) {
							throw new Error(res.message || '借阅失败');
						}
					} catch (err) {
						failedItems.push(item.name);
						lastError = err && err.message ? err.message : '借阅失败';
					}
				}
				uni.hideLoading();
				if (failedItems.length === 0) {
					clearCart();
					this.updateCartTotal();
					uni.showToast({ title: '借阅成功！', icon: 'success' });
					setTimeout(() => {
						uni.navigateTo({ url: '/pages/jilu/jilu' });
					}, 1000);
				} else {
					uni.showModal({
						title: '借阅失败',
						content: `${failedItems.join('、')} 借阅失败：${lastError}`,
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
		padding-bottom: 120px;
	}

	.top-section {
		position: relative;
		background: linear-gradient(180deg, #F5EEE3 0%, #FAF6F0 100%);
		padding-bottom: 30px;
	}

	.nav-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 52px 20px 16px;
	}

	.back-btn {
		width: 44px;
		height: 44px;
		background-color: #FFFFFF;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.action-btns {
		display: flex;
		gap: 10px;
	}

	.action-btn {
		width: 44px;
		height: 44px;
		background-color: #FFFFFF;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.book-img-wrap {
		display: flex;
		justify-content: center;
		padding: 16px 0 0;
	}

	.book-img {
		width: 180px;
		height: 250px;
		border-radius: 16px;
		box-shadow: 0 10px 30px rgba(139, 90, 43, 0.25);
		background-color: #F0E8DC;
	}

	.content-area {
		padding: 0 20px;
	}

	.book-header {
		background-color: #FFFFFF;
		border-radius: 20px;
		padding: 20px;
		margin-bottom: 16px;
	}

	.book-title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 8px;
	}

	.book-name {
		font-size: 22px;
		font-weight: 700;
		color: #3D2817;
		flex: 1;
		margin-right: 12px;
	}

	.book-code {
		background-color: #F0E8DC;
		color: #8B5A2B;
		font-size: 12px;
		font-weight: 600;
		padding: 4px 12px;
		border-radius: 10px;
		flex-shrink: 0;
	}

	.book-author {
		font-size: 14px;
		color: #8B5A2B;
		font-weight: 500;
		display: block;
		margin-bottom: 12px;
	}

	.rating-row {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.rating-num {
		font-size: 14px;
		font-weight: 600;
		color: #3D2817;
		margin-left: 6px;
	}

	.rating-count {
		font-size: 13px;
		color: #999;
		margin-left: 4px;
	}

	.price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #FFFFFF;
		border-radius: 20px;
		padding: 18px 20px;
		margin-bottom: 16px;
	}

	.price-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.price-label {
		font-size: 12px;
		color: #999;
	}

	.book-price {
		font-size: 26px;
		font-weight: 700;
		color: #8B5A2B;
	}

	.price-unit {
		font-size: 14px;
		font-weight: 500;
	}

	.available-tag {
		display: flex;
		align-items: center;
		gap: 4px;
		background-color: rgba(58, 176, 128, 0.12);
		border-radius: 12px;
		padding: 8px 14px;

		&.out-of-stock {
			background-color: rgba(231, 76, 60, 0.12);
		}
	}

	.available-text {
		font-size: 13px;
		font-weight: 600;
		color: #3AB080;

		&.out {
			color: #E74C3C;
		}
	}

	.stock-count {
		font-size: 12px;
		font-weight: 500;
		color: #8B5A2B;
		margin-left: 4px;
	}

	.duration-section {
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
	}

	.duration-list {
		display: flex;
		gap: 12px;
	}

	.duration-item {
		flex: 1;
		background-color: #FAF6F0;
		border-radius: 16px;
		padding: 14px 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		border: 2px solid transparent;
		position: relative;

		&.active {
			background-color: #8B5A2B;
			border-color: #8B5A2B;
		}
	}

	.duration-name {
		font-size: 16px;
		font-weight: 600;
		color: #3D2817;

		.active & {
			color: #FFFFFF;
		}
	}

	.duration-price {
		font-size: 12px;
		font-weight: 500;
		color: rgba(61, 40, 23, 0.7);

		&.free {
			color: #3AB080;
		}

		.active & {
			color: rgba(255, 255, 255, 0.85);

			&.free {
				color: #B8F0D0;
			}
		}
	}

	.duration-return {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 2px;
	}

	.desc-section {
		background-color: #FFFFFF;
		border-radius: 20px;
		padding: 20px;
		margin-bottom: 16px;
	}

	.desc-content {
		max-height: 80px;
		overflow: hidden;
		transition: max-height 0.3s ease;

		&.expanded {
			max-height: 500px;
		}
	}

	.desc-text {
		font-size: 14px;
		color: #5C4A3A;
		line-height: 1.7;
	}

	.expand-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid rgba(139, 90, 43, 0.08);
	}

	.expand-text {
		font-size: 13px;
		font-weight: 500;
		color: #8B5A2B;
	}

	.info-cards {
		display: flex;
		gap: 12px;
		margin-bottom: 20px;
	}

	.info-card {
		flex: 1;
		background-color: #FFFFFF;
		border-radius: 18px;
		padding: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.card-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.card-label {
		font-size: 12px;
		color: #999;
	}

	.card-value {
		font-size: 16px;
		font-weight: 700;
		color: #3D2817;
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
		gap: 14px;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
		border-radius: 28px 28px 0 0;
		z-index: 60;
	}

	.bottom-left {
		display: flex;
		gap: 10px;
	}

	.bottom-icon-btn {
		width: 48px;
		height: 48px;
		background-color: #FAF6F0;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.cart-btn {
		position: relative;
	}

	.mini-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 18px;
		height: 18px;
		background-color: #E74C3C;
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 4px;
		border: 2px solid #FFFFFF;
	}

	.mini-badge-text {
		font-size: 10px;
		font-weight: 700;
		color: #FFFFFF;
	}

	.borrow-btn {
		flex: 1;
		height: 52px;
		background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		border-radius: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		box-shadow: 0 4px 16px rgba(139, 90, 43, 0.3);
	}

	.borrow-text {
		font-size: 16px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.cart-popup {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 80px;
		z-index: 100;
	}

	.cart-popup-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 99;
	}

	.cart-popup-inner {
		background: linear-gradient(135deg, #3D2817 0%, #5C3A1F 100%);
		border-radius: 28px 28px 0 0;
		padding: 18px 20px 22px;
		box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease-out;
		position: relative;
		z-index: 101;

		&.show-list {
			max-height: 70vh;
			display: flex;
			flex-direction: column;
		}
	}

	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}

	.cart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.cart-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.cart-badge-icon {
		position: relative;
		width: 46px;
		height: 46px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.badge-count {
		position: absolute;
		top: -8px;
		right: -8px;
		min-width: 20px;
		height: 20px;
		background-color: #F5C542;
		border-radius: 10px;
		font-weight: 700;
		font-size: 11px;
		color: #3D2817;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 5px;
	}

	.cart-detail {
		display: flex;
		flex-direction: column;
	}

	.cart-label {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
	}

	.cart-price {
		font-size: 16px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.cart-toggle {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px 14px;
		background: rgba(255, 255, 255, 0.12);
		border-radius: 20px;
	}

	.toggle-text {
		font-size: 13px;
		font-weight: 500;
		color: #FFFFFF;
	}

	.cart-list {
		flex: 1;
		max-height: 300px;
		margin: 16px 0;
		overflow-y: auto;
	}

	.cart-list-item {
		display: flex;
		gap: 12px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		padding: 12px;
		margin-bottom: 10px;
	}

	.item-img {
		width: 48px;
		height: 66px;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.item-name {
		font-size: 14px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.item-author {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
	}

	.item-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.item-price {
		font-size: 14px;
		font-weight: 600;
		color: #F5C542;
	}

	.item-qty {
		font-size: 14px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
	}

	.cart-footer {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 14px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		flex-shrink: 0;
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		flex: 1;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 14px;
		padding: 14px;
	}

	.clear-text {
		font-size: 15px;
		font-weight: 600;
		color: #3D2817;
	}

	.checkout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		flex: 2;
		background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
		border-radius: 14px;
		padding: 14px;
	}

	.checkout-text {
		font-size: 15px;
		font-weight: 600;
		color: #FFFFFF;
	}
</style>
