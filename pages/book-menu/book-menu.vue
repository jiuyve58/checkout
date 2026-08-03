<template>
	<view class="page-container">
		<view class="page-bg"></view>

		<scroll-view class="main-scroll" scroll-y :show-scrollbar="false">
			<view class="content">
				<view class="header-area">
					<view class="header-top">
						<view class="date-info">
							<text class="date-text">{{ currentDate }}</text>
						</view>
						<view class="user-avatar" @click="goProfile">
							<image class="avatar-img" :src="currentUser && currentUser.avatar ? currentUser.avatar : '/static/avatar-placeholder.png'" mode="aspectFill"></image>
						</view>
					</view>
					<view class="greeting">
						<text class="greeting-text">{{ currentUser ? currentUser.user_name + '，' : '' }}好书相伴，</text>
						<text class="greeting-text">静好岁月。</text>
					</view>
				</view>

				<view class="search-area">
					<view class="search-box">
						<uni-icons type="search" size="18" color="#999"></uni-icons>
						<input class="search-input" type="text" v-model="searchKeyword" placeholder="搜索书名、作者、ISBN..." placeholder-class="search-placeholder" confirm-type="search" @confirm="doSearch" />
					</view>
				</view>

				<view class="section-01" v-if="featuredBook">
					<view class="section-header">
						<view class="section-label">
							<text class="label-symbol">§</text>
							<text class="label-num">01</text>
							<text class="label-dot">·</text>
							<text class="label-text">编辑推荐</text>
						</view>
						<view class="more-dots">
							<view class="dot"></view>
							<view class="dot"></view>
							<view class="dot"></view>
						</view>
					</view>
					<view class="featured-card" @click="goDetail(featuredBook)">
						<view class="featured-cover-wrap">
							<image class="featured-cover" :src="featuredBook.image" mode="aspectFill" @error="onImageError($event, featuredBook)"></image>
						</view>
						<view class="featured-info">
							<view class="featured-top-row">
								<text class="featured-title">{{ featuredBook.name }}</text>
								<text class="featured-code-tag">{{ featuredBook.code || 'B-8571' }}</text>
							</view>
							<text class="featured-author">{{ featuredBook.author }}</text>
							<text class="featured-desc">{{ featuredBook.description }}</text>
							<view class="featured-bottom">
								<view class="rating-row">
									<view class="stars">
										<text class="star">★</text>
										<text class="star">★</text>
										<text class="star">★</text>
										<text class="star">★</text>
										<text class="star star-half">★</text>
									</view>
									<text class="rating-num">{{ featuredBook.rating }}</text>
								</view>
								<view class="reserved-tag">
									<text class="reserved-text">{{ featuredBook.stock > 0 ? '可借阅' : '暂无库存' }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<view class="section-02">
					<view class="section-header">
						<view class="section-label">
							<text class="label-symbol">§</text>
							<text class="label-num">02</text>
							<text class="label-dot">·</text>
							<text class="label-text">热门借阅</text>
						</view>
					</view>
					<scroll-view class="hot-scroll" scroll-x :show-scrollbar="false">
						<view class="hot-list">
							<view class="hot-item" v-for="(book, index) in hotBooks" :key="index" @click="goDetail(book)">
								<view class="hot-cover-wrap">
									<image class="hot-cover" :src="book.image" mode="aspectFill" @error="onImageError($event, book, index)"></image>
								</view>
								<text class="hot-name">{{ book.name }}</text>
							</view>
						</view>
					</scroll-view>
				</view>

				<view class="section-03">
					<view class="section-header">
						<view class="section-label">
							<text class="label-symbol">§</text>
							<text class="label-num">03</text>
							<text class="label-dot">·</text>
							<text class="label-text">最新上架</text>
						</view>
					</view>
					<view class="new-list">
						<view class="new-item" v-for="(book, index) in newBooks" :key="index" @click="goDetail(book)">
							<view class="new-cover-wrap">
								<image class="new-cover" :src="book.image" mode="aspectFill" @error="onImageError($event, book, index)"></image>
							</view>
							<view class="new-info">
								<view class="new-top">
									<text class="new-name">{{ book.name }}</text>
									<text class="new-code">{{ book.code }}</text>
								</view>
								<text class="new-meta">{{ book.author }} · {{ book.year }}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="bottom-space"></view>
			</view>
		</scroll-view>

		<view class="bottom-nav">
			<view class="nav-item active">
				<image class="nav-icon" src="/static/nav/home.png" mode="aspectFit"></image>
				<text class="nav-label">首页</text>
			</view>
			<view class="nav-item" @click="switchNav('library')">
				<image class="nav-icon" src="/static/nav/library.png" mode="aspectFit"></image>
				<text class="nav-label">书库</text>
			</view>
			<view class="nav-item" @click="toggleBorrowList">
				<image class="nav-icon" src="/static/nav/shelf.png" mode="aspectFit"></image>
				<view class="cart-badge" v-if="cartTotal.totalCount > 0">
					<text class="badge-num">{{ cartTotal.totalCount > 9 ? '9+' : cartTotal.totalCount }}</text>
				</view>
				<text class="nav-label">书架</text>
			</view>
			<view class="nav-item" @click="switchNav('history')">
				<image class="nav-icon" src="/static/nav/history.png" mode="aspectFit"></image>
				<text class="nav-label">记录</text>
			</view>
			<view class="nav-item" @click="switchNav('profile')">
				<image class="nav-icon" src="/static/nav/profile.png" mode="aspectFit"></image>
				<text class="nav-label">我的</text>
			</view>
		</view>

		<view class="cart-popup" v-if="cartTotal.totalCount > 0">
			<view class="cart-popup-mask" v-if="showCartList" @click="toggleCartList"></view>
			<view class="cart-popup-inner" :class="{ 'show-list': showCartList }">
				<view class="cart-header" @click="toggleCartList">
					<view class="cart-info">
						<view class="cart-badge-icon">
							<uni-icons type="book" size="18" color="#FFFFFF"></uni-icons>
						</view>
						<view class="cart-detail">
							<text class="cart-label">借阅列表</text>
							<text class="cart-count">共 {{ cartTotal.totalCount }} 本书</text>
						</view>
					</view>
					<view class="cart-toggle">
						<text class="toggle-text">{{ showCartList ? '收起' : '展开' }}</text>
						<uni-icons :type="showCartList ? 'up' : 'down'" size="14" color="#FFFFFF"></uni-icons>
					</view>
				</view>
				<view class="cart-list" v-if="showCartList">
					<view class="cart-list-item" v-for="item in cartItems" :key="item._id">
						<image class="item-img" :src="item.image" mode="aspectFill"></image>
						<view class="item-info">
							<text class="item-name">{{ item.name }}</text>
							<text class="item-author">{{ item.author }}</text>
							<view class="item-bottom">
								<view class="qty-control">
									<view class="qty-btn" @click="decreaseQty(item)">
										<uni-icons type="minus" size="12" color="#3D2817"></uni-icons>
									</view>
									<text class="item-qty">{{ item.quantity }}</text>
									<view class="qty-btn" @click="increaseQty(item)">
										<uni-icons type="plus" size="12" color="#3D2817"></uni-icons>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
				<view class="cart-footer" @click.stop>
					<view class="clear-btn" @click="handleClearCart">
						<uni-icons type="trash" size="14" color="#3D2817"></uni-icons>
						<text class="clear-text">清空</text>
					</view>
					<view class="checkout-btn" @click="handleCheckout">
						<text class="checkout-text">确认借阅</text>
						<uni-icons type="right" size="14" color="#FFFFFF"></uni-icons>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getCart, getCartTotal, updateCartItemQuantity, removeFromCart, clearCart } from '@/utils/cart.js';
	import { importObject, resolveImageUrl } from '@/utils/coffee-api.js';
	import { getCurrentUser, isLoggedIn } from '@/utils/user.js';
	
	export default {
		data() {
			return {
				selectedCategory: '',
				categories: [],
				coffeeList: [],
				searchKeyword: '',
				cartTotal: { totalCount: 0 },
				cartItems: [],
				showCartList: false,
				currentNav: 'home',
				currentDate: '',
				currentUser: null
			};
		},
		computed: {
			featuredBook() {
				return this.coffeeList.length > 0 ? this.coffeeList[0] : null;
			},
			hotBooks() {
				return this.coffeeList.slice(1, 5).map((book, i) => ({
					...book,
					image: book.image || '/static/book-placeholder-' + (i + 1) + '.png'
				}));
			},
			newBooks() {
				return this.coffeeList.slice(0, 6).map((book, i) => ({
					...book,
					code: book.code || 'BK-' + String(i + 1).padStart(4, '0'),
					year: book.year || 2020,
					image: book.image || '/static/book-placeholder-' + (i + 1) + '.png'
				}));
			}
		},
		onLoad() {
			this.initDate();
			this.loadCategories();
			this.loadProducts();
			this.loadCurrentUser();
		},
		onShow() {
			this.updateCartTotal();
			this.loadCurrentUser();
		},
		methods: {
			initDate() {
			const now = new Date();
			const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
			const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
			this.currentDate = `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
		},
			toggleCartList() {
				this.showCartList = !this.showCartList;
				if (this.showCartList) this.loadCartItems();
			},
			toggleBorrowList() {
				if (!isLoggedIn()) {
					uni.showModal({
						title: '提示',
						content: '请先登录后查看书架',
						confirmText: '去登录',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({ url: '/pages/login/login' });
							}
						}
					});
					return;
				}
				uni.redirectTo({ url: '/pages/shujia/shujia' });
			},
			switchNav(nav) {
				if (nav === 'library') {
					uni.redirectTo({ url: '/pages/shuku/shuku' });
				} else if (nav === 'history') {
					if (!isLoggedIn()) {
						uni.showModal({
							title: '提示',
							content: '请先登录后查看借阅记录',
							confirmText: '去登录',
							success: (res) => {
								if (res.confirm) uni.navigateTo({ url: '/pages/login/login' });
							}
						});
						return;
					}
					uni.redirectTo({ url: '/pages/jilu/jilu' });
				} else if (nav === 'profile') {
					if (!isLoggedIn()) {
						uni.navigateTo({ url: '/pages/login/login' });
					} else {
						uni.redirectTo({ url: '/pages/wode/wode' });
					}
				}
			},
			loadCartItems() {
				this.cartItems = getCart();
			},
			updateCartTotal() {
				this.cartTotal = getCartTotal();
				this.loadCartItems();
			},
			loadCategories() {
				const coffeeCategoriesObj = importObject('get-coffee-categories');
				coffeeCategoriesObj.getList().then(res => {
					const list = res && res.data ? res.data : (Array.isArray(res) ? res : null);
					if (list && list.length > 0) {
						this.categories = list;
						this.selectedCategory = list[0]._id;
					} else {
						this.categories = [];
						this.selectedCategory = '';
					}
				}).catch(err => {
					console.error('分类数据加载失败:', err);
					this.categories = [];
					this.selectedCategory = '';
				});
			},
			loadProducts(categoryId = '') {
				const coffeeProductsObj = importObject('get-coffee-products');
				coffeeProductsObj.getList(categoryId).then(res => {
					const list = res && res.data ? res.data : (Array.isArray(res) ? res : null);
					if (list && list.length > 0) {
						this.coffeeList = this.formatProducts(list);
					} else {
						this.coffeeList = [];
					}
				}).catch(err => {
					console.error('图书数据加载失败:', err);
					this.coffeeList = [];
					uni.showToast({ title: '图书数据加载失败', icon: 'none' });
				});
			},
			formatProducts(list) {
				return list.map(item => ({
					_id: item._id,
					name: item.name,
					author: item.author || '未知作者',
					code: item.code || '',
					year: item.year || null,
					description: item.description || '',
					image: resolveImageUrl(item.image),
					rating: item.rating || 4.8,
					stock: Number(item.stock) || 0,
					on_sale: item.on_sale !== false,
					category_id: item.category_id
				}));
			},
			onImageError(e, book, index) {
				if (!book) return;
				const idx = (typeof index === 'number') ? index : 0;
				const fallback = '/static/book-placeholder-' + ((idx % 4) + 1) + '.png';
				if (book.image !== fallback) {
					book.image = fallback;
					this.$forceUpdate();
				}
			},
			doSearch() {
				const keyword = this.searchKeyword.trim().toLowerCase();
				if (!keyword) { this.loadProducts(this.selectedCategory); return; }
				const coffeeProductsObj = importObject('get-coffee-products');
				coffeeProductsObj.getList(this.selectedCategory).then(res => {
					const list = res && res.data ? res.data : (Array.isArray(res) ? res : []);
					const filtered = list.filter(item =>
						(item.name || '').toLowerCase().includes(keyword) ||
						(item.author || '').toLowerCase().includes(keyword)
					);
					this.coffeeList = this.formatProducts(filtered);
				}).catch(err => {
					console.error('搜索图书失败:', err);
					this.coffeeList = [];
					uni.showToast({ title: '搜索失败', icon: 'none' });
				});
			},
			clearSearch() {
				this.searchKeyword = '';
				this.loadProducts(this.selectedCategory);
			},
			decreaseQty(item) {
				if (item.quantity > 1) {
					updateCartItemQuantity(item._id, item.quantity - 1);
				} else {
					removeFromCart(item._id);
				}
				this.updateCartTotal();
			},
			increaseQty(item) {
				if (Number.isFinite(Number(item.stock)) && item.quantity >= Number(item.stock)) {
					uni.showToast({ title: '已达到可借库存', icon: 'none' });
					return;
				}
				updateCartItemQuantity(item._id, item.quantity + 1);
				this.updateCartTotal();
			},
			goDetail(book) {
				uni.setStorageSync('currentCoffee', {
					_id: book._id, name: book.name, author: book.author,
					code: book.code, year: book.year, description: book.description,
					image: book.image, rating: book.rating,
					stock: book.stock
				});
				uni.navigateTo({ url: '/pages/coffee-product-detail/coffee-product-detail?id=' + book._id });
			},
			loadCurrentUser() {
				this.currentUser = isLoggedIn() ? getCurrentUser() : null;
			},
			goProfile() {
				if (!isLoggedIn()) {
					uni.navigateTo({ url: '/pages/login/login' });
				} else {
					uni.redirectTo({ url: '/pages/wode/wode' });
				}
			},
			handleClearCart() {
				clearCart();
				this.updateCartTotal();
				this.showCartList = false;
				uni.showToast({ title: '借阅列表已清空', icon: 'success' });
			},
			handleCheckout() {
				const cart = getCart();
				if (cart.length === 0) {
					uni.showToast({ title: '借阅列表为空', icon: 'none' });
					return;
				}
				uni.navigateTo({ url: '/pages/book-pay/book-pay' });
			}
		}
	}
</script>

<style lang="scss">
	.page-container {
		width: 100%;
		min-height: 100vh;
		position: relative;
		background-color: #FAFAF8;
	}

	.page-bg {
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 420px;
		background: linear-gradient(180deg, #F2ECE0 0%, #FAFAF8 85%);
	}

	.main-scroll {
		position: relative;
		height: 100vh;
	}

	.content {
		padding: 48px 20px 0;
	}

	.header-area {
		margin-bottom: 24px;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.date-info {
		display: flex;
		align-items: center;
	}

	.date-text {
		font-size: 12px;
		color: #8B7355;
		font-weight: 600;
		letter-spacing: 1px;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 20px;
		overflow: hidden;
		background-color: #E8DFD0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
	}

	.greeting {
		display: flex;
		flex-direction: column;
	}

	.greeting-text {
		font-size: 30px;
		font-weight: 700;
		color: #3D2817;
		line-height: 1.3;
	}

	.search-area {
		margin-bottom: 32px;
	}

	.search-box {
		display: flex;
		align-items: center;
		background-color: #FFFFFF;
		border-radius: 14px;
		height: 48px;
		padding: 0 16px;
		border: 1px solid #EDE6DC;
		box-shadow: 0 2px 12px rgba(60, 40, 20, 0.04);
	}

	.search-input {
		flex: 1;
		font-size: 14px;
		color: #3D2817;
		height: 100%;
		margin-left: 10px;
	}

	.search-placeholder {
		font-size: 14px;
		color: #B0A89E;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.label-symbol {
		font-size: 13px;
		color: #8B5A2B;
		font-weight: 600;
	}

	.label-num {
		font-size: 13px;
		color: #8B5A2B;
		font-weight: 700;
	}

	.label-dot {
		font-size: 13px;
		color: #B0A89E;
	}

	.label-text {
		font-size: 15px;
		font-weight: 700;
		color: #3D2817;
		margin-left: 2px;
	}

	.more-dots {
		display: flex;
		gap: 3px;
	}

	.more-dots .dot {
		width: 5px;
		height: 5px;
		border-radius: 3px;
		background-color: #B0A89E;
	}

	.section-01 {
		margin-bottom: 32px;
	}

	.featured-card {
		background: linear-gradient(135deg, #4A3020 0%, #6B4028 100%);
		border-radius: 18px;
		padding: 18px;
		display: flex;
		gap: 16px;
		box-shadow: 0 8px 28px rgba(74, 48, 32, 0.22);
	}

	.featured-cover-wrap {
		width: 105px;
		height: 140px;
		border-radius: 10px;
		overflow: hidden;
		flex-shrink: 0;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
	}

	.featured-cover {
		width: 100%;
		height: 100%;
	}

	.featured-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 2px 0;
	}

	.featured-top-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 4px;
	}

	.featured-title {
		font-size: 18px;
		font-weight: 700;
		color: #FFFFFF;
		flex: 1;
		margin-right: 8px;
	}

	.featured-code-tag {
		font-size: 10px;
		color: #F5C542;
		font-weight: 600;
		background-color: rgba(245, 197, 66, 0.15);
		padding: 3px 7px;
		border-radius: 6px;
		flex-shrink: 0;
	}

	.featured-author {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
		margin-bottom: 6px;
	}

	.featured-desc {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.55);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: 10px;
	}

	.featured-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.rating-row {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.stars {
		display: flex;
		gap: 0px;
	}

	.star {
		font-size: 12px;
		color: #F5C542;
	}

	.star-half {
		color: rgba(245, 197, 66, 0.4);
	}

	.rating-num {
		font-size: 13px;
		font-weight: 600;
		color: #FFFFFF;
	}

	.reserved-tag {
		background-color: rgba(245, 197, 66, 0.15);
		border: 1px solid rgba(245, 197, 66, 0.4);
		border-radius: 10px;
		padding: 4px 10px;
	}

	.reserved-text {
		font-size: 11px;
		font-weight: 600;
		color: #F5C542;
	}

	.section-02 {
		margin-bottom: 32px;
	}

	.hot-scroll {
		width: 100%;
		white-space: nowrap;
	}

	.hot-list {
		display: inline-flex;
		gap: 14px;
	}

	.hot-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 96px;
		flex-shrink: 0;
	}

	.hot-cover-wrap {
		width: 96px;
		height: 128px;
		border-radius: 8px;
		overflow: hidden;
		background-color: #E8DFD0;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
		margin-bottom: 8px;
	}

	.hot-cover {
		width: 100%;
		height: 100%;
	}

	.hot-name {
		font-size: 12px;
		font-weight: 600;
		color: #3D2817;
		text-align: center;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.section-03 {
		margin-bottom: 0;
	}

	.new-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.new-item {
		display: flex;
		gap: 14px;
		padding: 4px 0;
	}

	.new-cover-wrap {
		width: 56px;
		height: 74px;
		border-radius: 6px;
		overflow: hidden;
		flex-shrink: 0;
		background-color: #E8DFD0;
	}

	.new-cover {
		width: 100%;
		height: 100%;
	}

	.new-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 6px;
	}

	.new-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.new-name {
		font-size: 15px;
		font-weight: 600;
		color: #3D2817;
	}

	.new-code {
		font-size: 11px;
		color: #FFFFFF;
		font-weight: 600;
		background-color: #8B5A2B;
		padding: 3px 8px;
		border-radius: 5px;
	}

	.new-meta {
		font-size: 12px;
		color: #8B7355;
	}

	.bottom-space {
		height: 140px;
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

	.cart-badge {
		position: absolute;
		top: -4px;
		right: -6px;
		min-width: 16px;
		height: 16px;
		background-color: #E74C3C;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 4px;
		border: 2px solid #FFFFFF;
	}

	.badge-num {
		font-size: 9px;
		font-weight: 700;
		color: #FFFFFF;
	}

	.cart-popup {
		position: fixed;
		left: 0; right: 0;
		bottom: 72px;
		z-index: 100;
	}

	.cart-popup-mask {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 99;
	}

	.cart-popup-inner {
		background: linear-gradient(135deg, #3D2817 0%, #5C3A1F 100%);
		border-radius: 28px 28px 0 0;
		padding: 18px 20px 22px;
		box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.2);
		position: relative;
		z-index: 101;

		&.show-list {
			max-height: 70vh;
			display: flex;
			flex-direction: column;
		}
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
		width: 44px;
		height: 44px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cart-detail {
		display: flex;
		flex-direction: column;
	}

	.cart-label {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
	}

	.cart-count {
		font-size: 15px;
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
		justify-content: flex-end;
		align-items: center;
	}

	.qty-control {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.qty-btn {
		width: 24px;
		height: 24px;
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.item-qty {
		font-size: 14px;
		font-weight: 500;
		color: #FFFFFF;
		min-width: 20px;
		text-align: center;
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
