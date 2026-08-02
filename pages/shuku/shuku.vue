<template>
	<view class="page-container">
		<view class="header-area">
			<text class="page-label">CATALOGUE · 书库</text>
			<text class="page-title">探索藏书</text>
			<view class="search-bar">
				<uni-icons type="search" size="16" color="#8B7355"></uni-icons>
				<input class="search-input" placeholder="书名·作者·关键词" v-model="keyword" confirm-type="search" @confirm="onSearch" />
			</view>
		</view>

		<view class="tabs-row">
			<view class="tab-item" :class="{ active: activeCategory === '' }" @click="switchCategory('')">
				<text class="tab-text">全部</text>
			</view>
			<view class="tab-item" :class="{ active: activeCategory === '文学小说' }" @click="switchCategory('文学小说')">
				<text class="tab-text">文学</text>
			</view>
			<view class="tab-item" :class="{ active: activeCategory === '悬疑推理' }" @click="switchCategory('悬疑推理')">
				<text class="tab-text">推理</text>
			</view>
			<view class="tab-item" :class="{ active: activeCategory === '童话寓言' }" @click="switchCategory('童话寓言')">
				<text class="tab-text">童话</text>
			</view>
			<view class="tab-item" :class="{ active: activeCategory === '散文杂文' }" @click="switchCategory('散文杂文')">
				<text class="tab-text">杂文</text>
			</view>
			<view class="tab-item" :class="{ active: activeCategory === '历史传记' }" @click="switchCategory('历史传记')">
				<text class="tab-text">历史</text>
			</view>
		</view>

		<view class="count-row">
			<text class="count-text">共 {{ filteredBooks.length }} 册</text>
		</view>

		<scroll-view class="book-grid" scroll-y>
			<view class="grid-inner">
				<view class="book-card" v-for="book in filteredBooks" :key="book._id" @click="goDetail(book)">
					<view class="book-cover-wrap">
						<image class="book-cover" :src="book.image" mode="aspectFill" @error="onImageError"></image>
					</view>
					<text class="book-name">{{ book.name }}</text>
					<text class="book-author">{{ book.author }}</text>
					<view class="book-meta">
						<text class="book-code">{{ book.code }}</text>
						<view class="status-tag" :class="getStatusClass(book)">
							<text class="status-text">{{ getStatusText(book) }}</text>
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
			<view class="nav-item active">
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
			<view class="nav-item" @click="goProfile">
				<image class="nav-icon" src="/static/nav/profile.png" mode="aspectFit"></image>
				<text class="nav-label">我的</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { categoriesApi, productsApi, resolveImageUrl } from '@/utils/coffee-api.js';
	import { getMockProducts, getMockCategories } from '@/utils/mock-data.js';
	export default {
		data() {
			return {
				keyword: '',
				activeCategory: '',
				allBooks: [],
				categories: []
			};
		},
		computed: {
			filteredBooks() {
				let list = this.allBooks;
				if (this.activeCategory) {
					list = list.filter(b => b.category_id === this.activeCategory);
				}
				if (this.keyword.trim()) {
					const kw = this.keyword.trim().toLowerCase();
					list = list.filter(b =>
						b.name.toLowerCase().includes(kw) ||
						(b.author && b.author.toLowerCase().includes(kw)) ||
						(b.code && b.code.toLowerCase().includes(kw))
					);
				}
				return list;
			}
		},
		onLoad() {
			this.loadCategories();
			this.loadBooks();
		},
		methods: {
			async loadCategories() {
				try {
					const res = await categoriesApi.getList();
					const list = res && (res.data || res);
					this.categories = Array.isArray(list) ? list : getMockCategories();
				} catch (err) {
					this.categories = getMockCategories();
				}
			},
			async loadBooks() {
				try {
					const res = await productsApi.getList();
					const list = res && (res.data || (Array.isArray(res) ? res : []));
					if (!Array.isArray(list) || list.length === 0) {
						this.useMockData();
						return;
					}
					this.allBooks = list.map(b => ({
						...b,
						image: resolveImageUrl(b.image),
						category_id: b.category_id || '1',
						on_sale: b.on_sale !== false
					}));
				} catch (err) {
					this.useMockData();
				}
			},
			useMockData() {
				this.allBooks = getMockProducts().map(b => ({
					...b,
					image: resolveImageUrl(b.image),
					category_id: b.category_id || '1',
					on_sale: true
				}));
				this.categories = getMockCategories();
			},
			switchCategory(cat) {
				this.activeCategory = cat;
			},
			onSearch() {},
			getStatusClass(book) {
				if (book.on_sale === false) return 'tag-reserved';
				if (book._id === 'p3' || book._id === 'p8' || book._id === 'p6') return 'tag-borrowing';
				return 'tag-available';
			},
			getStatusText(book) {
				if (book.on_sale === false) return '已预约';
				if (book._id === 'p3' || book._id === 'p8' || book._id === 'p6') return '借阅中';
				return '可借阅';
			},
			goDetail(book) {
				uni.navigateTo({ url: '/pages/coffee-product-detail/coffee-product-detail?id=' + book._id });
			},
			goHome() {
				uni.reLaunch({ url: '/pages/book-menu/book-menu' });
			},
			goShelf() {
				uni.redirectTo({ url: '/pages/shujia/shujia' });
			},
			goHistory() {
				uni.redirectTo({ url: '/pages/jilu/jilu' });
			},
			goProfile() {
				uni.redirectTo({ url: '/pages/wode/wode' });
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
		padding: 50px 24px 16px;
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
		margin-bottom: 16px;
	}

	.search-bar {
		display: flex;
		align-items: center;
		background-color: #FFFFFF;
		border-radius: 24px;
		padding: 12px 18px;
		gap: 8px;
		box-shadow: 0 2px 16px rgba(60, 40, 20, 0.05);
	}

	.search-input {
		flex: 1;
		font-size: 14px;
		color: #3D2817;
		background: transparent;
		border: none;
		outline: none;
	}

	.tabs-row {
		display: flex;
		flex-direction: row;
		padding: 16px 24px 0;
		gap: 8px;
		overflow-x: auto;
	}

	.tab-item {
		padding: 8px 18px;
		border-radius: 20px;
		background-color: #FFFFFF;
		flex-shrink: 0;

		&.active {
			background-color: #3D2817;

			.tab-text {
				color: #FFFFFF;
			}
		}
	}

	.tab-text {
		font-size: 14px;
		font-weight: 500;
		color: #8B7355;
	}

	.count-row {
		padding: 12px 24px 8px;
	}

	.count-text {
		font-size: 13px;
		color: #8B7355;
	}

	.book-grid {
		flex: 1;
		padding: 0 24px;
	}

	.grid-inner {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 14px;
	}

	.book-card {
		width: calc(50% - 7px);
		background-color: #FFFFFF;
		border-radius: 14px;
		overflow: hidden;
		padding: 12px;
		box-shadow: 0 2px 14px rgba(60, 40, 20, 0.05);
	}

	.book-cover-wrap {
		width: 100%;
		height: 170px;
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 10px;
		background-color: #E8DFD0;
	}

	.book-cover {
		width: 100%;
		height: 100%;
	}

	.book-name {
		font-size: 15px;
		font-weight: 600;
		color: #3D2817;
		display: block;
		margin-bottom: 3px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.book-author {
		font-size: 12px;
		color: #8B7355;
		display: block;
		margin-bottom: 8px;
	}

	.book-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.book-code {
		font-size: 11px;
		color: #8B5A2B;
		font-weight: 600;
		background-color: #F5ECD7;
		padding: 3px 8px;
		border-radius: 5px;
	}

	.status-tag {
		padding: 3px 8px;
		border-radius: 5px;

		&.tag-available {
			background-color: rgba(46, 213, 115, 0.15);
			.status-text {
				color: #27AE60;
			}
		}

		&.tag-borrowing {
			background-color: rgba(241, 196, 15, 0.15);
			.status-text {
				color: #F39C12;
			}
		}

		&.tag-reserved {
			background-color: rgba(231, 76, 60, 0.15);
			.status-text {
				color: #E74C3C;
			}
		}
	}

	.status-text {
		font-size: 11px;
		font-weight: 600;
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
