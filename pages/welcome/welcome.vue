<template>
	<view class="page-container">
		<view class="bg-decoration">
			<view class="bg-gradient"></view>
			<view class="floating-shape shape-1"></view>
			<view class="floating-shape shape-2"></view>
		</view>

		<view class="content-wrapper">
			<view class="header-section">
				<text class="brand-text">ARÔME LIBRARY · 2026</text>
			</view>

			<view class="title-section">
				<text class="main-title">每一本书，</text>
				<text class="main-title">都是一段</text>
				<text class="main-title highlight">旅程。</text>
			</view>

			<view class="desc-section">
				<text class="desc-text">借一本好书，与作者相遇。馆藏 3,200 余册，随时借还。</text>
			</view>

			<view class="books-section">
				<view class="books-stack">
					<view class="book-item" v-for="(book, index) in displayBooks" :key="index" :style="getBookStyle(index)">
						<image class="book-cover" :src="book.image" mode="aspectFill"></image>
					</view>
				</view>
			</view>

			<view class="stats-section">
				<view class="stat-card">
					<text class="stat-value">3,200<span class="stat-plus">+</span></text>
					<text class="stat-label">馆藏册数</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-card">
					<text class="stat-value">1,840</text>
					<text class="stat-label">本月借阅</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-card">
					<text class="stat-value">4.8</text>
					<text class="stat-label">用户评分</text>
				</view>
			</view>

			<view class="button-section">
				<view class="enter-btn" @click="enterLibrary">
					<text class="btn-text">进入书库</text>
					<text class="btn-arrow">→</text>
				</view>
			</view>

			<view class="footer-section">
				<text class="footer-text">ARÔME · 图书借阅系统</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			displayBooks: [
				{ image: '/static/book-placeholder-1.png' },
				{ image: '/static/book-placeholder-2.png' },
				{ image: '/static/book-placeholder-3.png' },
				{ image: '/static/book-placeholder-4.png' },
				{ image: '/static/book-placeholder-5.png' }
			]
		};
	},
	methods: {
		getBookStyle(index) {
			const offset = index * 18;
			const rotate = (index - 2) * 3;
			return {
				transform: `translateX(${offset}px) rotate(${rotate}deg)`,
				zIndex: index
			};
		},
		enterLibrary() {
			uni.reLaunch({ url: '/pages/book-menu/book-menu' });
		}
	}
}
</script>

<style lang="scss">
.page-container {
	width: 100%;
	min-height: 100vh;
	background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
	position: relative;
	overflow: hidden;
}

.bg-decoration {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
}

.bg-gradient {
	position: absolute;
	top: -100px;
	right: -100px;
	width: 400px;
	height: 400px;
	background: radial-gradient(circle, rgba(139, 90, 43, 0.3) 0%, transparent 70%);
}

.floating-shape {
	position: absolute;
	border-radius: 50%;
	opacity: 0.1;
}

.shape-1 {
	width: 200px;
	height: 200px;
	background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
	top: 200px;
	left: -50px;
}

.shape-2 {
	width: 150px;
	height: 150px;
	background: linear-gradient(135deg, #D4C4A8 0%, #B8A68A 100%);
	bottom: 200px;
	right: -30px;
}

.content-wrapper {
	position: relative;
	z-index: 10;
	padding: 60px 32px 40px;
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

.header-section {
	margin-bottom: 40px;
}

.brand-text {
	font-size: 13px;
	letter-spacing: 3px;
	color: rgba(255, 255, 255, 0.6);
	font-weight: 500;
}

.title-section {
	margin-bottom: 24px;
}

.main-title {
	display: block;
	font-size: 42px;
	font-weight: 700;
	color: #FFFFFF;
	line-height: 1.2;
	letter-spacing: 1px;
}

.main-title.highlight {
	background: linear-gradient(135deg, #D4C4A8 0%, #8B7355 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.desc-section {
	margin-bottom: 50px;
}

.desc-text {
	font-size: 15px;
	color: rgba(255, 255, 255, 0.65);
	line-height: 1.6;
}

.books-section {
	margin-bottom: 50px;
}

.books-stack {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 180px;
	position: relative;
}

.book-item {
	position: absolute;
	width: 100px;
	height: 140px;
	border-radius: 8px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	transition: transform 0.3s ease;
}

.book-cover {
	width: 100%;
	height: 100%;
	border-radius: 8px;
	background-color: #2a2a3e;
}

.stats-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 20px;
	padding: 24px 20px;
	margin-bottom: 50px;
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.stat-value {
	font-size: 26px;
	font-weight: 700;
	color: #FFFFFF;
	line-height: 1;
}

.stat-plus {
	font-size: 18px;
	font-weight: 600;
	color: #D4C4A8;
}

.stat-label {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.5);
	margin-top: 6px;
}

.stat-divider {
	width: 1px;
	height: 30px;
	background: rgba(255, 255, 255, 0.15);
}

.button-section {
	flex: 1;
	display: flex;
	align-items: flex-end;
}

.enter-btn {
	width: 100%;
	height: 56px;
	background: linear-gradient(135deg, #8B5A2B 0%, #A0522D 100%);
	border-radius: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	box-shadow: 0 8px 32px rgba(139, 90, 43, 0.4);
	transition: transform 0.15s ease;
	margin-bottom: 30px;
}

.enter-btn:active {
	transform: scale(0.98);
}

.btn-text {
	font-size: 17px;
	font-weight: 600;
	color: #FFFFFF;
	letter-spacing: 2px;
}

.btn-arrow {
	font-size: 20px;
	color: #FFFFFF;
	font-weight: 300;
}

.footer-section {
	text-align: center;
	padding-bottom: 20px;
}

.footer-text {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.35);
	letter-spacing: 2px;
}
</style>