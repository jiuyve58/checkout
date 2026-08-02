<template>
	<view class="page-container">
		<view class="bg-decoration">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
		</view>

		<scroll-view class="form-scroll" scroll-y>
			<view class="form-header">
				<view class="logo-wrap">
					<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
				</view>
				<text class="app-title">书香借阅</text>
				<text class="app-subtitle">{{ isLogin ? '欢迎回来，请登录' : '创建账号，开启阅读之旅' }}</text>
			</view>

			<view class="form-tabs">
				<view class="tab-item" :class="{ active: isLogin }" @click="switchMode(true)">
					<text class="tab-text">登录</text>
				</view>
				<view class="tab-item" :class="{ active: !isLogin }" @click="switchMode(false)">
					<text class="tab-text">注册</text>
				</view>
			</view>

			<view class="form-body">
				<view class="input-group">
					<view class="input-icon">
						<text class="icon-text">◎</text>
					</view>
					<input class="form-input" type="text" v-model="form.username" placeholder="请输入用户名" placeholder-class="input-placeholder" />
				</view>

				<view class="input-group" v-if="!isLogin">
					<view class="input-icon">
						<text class="icon-text">◉</text>
					</view>
					<input class="form-input" type="text" v-model="form.nickname" placeholder="请输入昵称（选填）" placeholder-class="input-placeholder" />
				</view>

				<view class="input-group">
					<view class="input-icon">
						<text class="icon-text">✦</text>
					</view>
					<input class="form-input" :password="!showPwd" type="text" v-model="form.password" placeholder="请输入密码（至少6位）" placeholder-class="input-placeholder" />
					<view class="toggle-pwd" @click="showPwd = !showPwd">
						<text class="toggle-text">{{ showPwd ? '隐藏' : '显示' }}</text>
					</view>
				</view>

				<view class="input-group" v-if="!isLogin">
					<view class="input-icon">
						<text class="icon-text">✦</text>
					</view>
					<input class="form-input" :password="true" type="text" v-model="form.confirmPassword" placeholder="请再次输入密码" placeholder-class="input-placeholder" />
				</view>

				<view class="error-tip" v-if="errorMsg">
					<text class="error-text">{{ errorMsg }}</text>
				</view>

				<view class="submit-btn" :class="{ loading: submitting }" @click="handleSubmit">
					<text class="submit-text">{{ submitting ? '处理中...' : (isLogin ? '登 录' : '注 册') }}</text>
				</view>

				<view class="form-footer" v-if="isLogin">
					<text class="footer-text">还没有账号？</text>
					<text class="footer-link" @click="switchMode(false)">立即注册</text>
				</view>
				<view class="form-footer" v-else>
					<text class="footer-text">已有账号？</text>
					<text class="footer-link" @click="switchMode(true)">去登录</text>
				</view>
			</view>
		</scroll-view>

		<view class="close-btn" @click="handleClose" v-if="!isModal">
			<text class="close-icon">×</text>
		</view>
	</view>
</template>

<script>
	import { login, register, isLoggedIn } from '@/utils/user.js';

	export default {
		data() {
			return {
				isLogin: true,
				submitting: false,
				showPwd: false,
				errorMsg: '',
				isModal: false,
				form: {
					username: '',
					nickname: '',
					password: '',
					confirmPassword: ''
				}
			};
		},
		onLoad(options) {
			if (options && options.modal === '1') {
				this.isModal = true;
			}
			if (isLoggedIn()) {
				uni.navigateBack();
			}
		},
		methods: {
			switchMode(loginMode) {
				this.isLogin = loginMode;
				this.errorMsg = '';
				this.form = { username: '', nickname: '', password: '', confirmPassword: '' };
			},
			async handleSubmit() {
				if (this.submitting) return;
				this.errorMsg = '';

				if (!this.form.username.trim()) {
					this.errorMsg = '请输入用户名';
					return;
				}
				if (!this.form.password) {
					this.errorMsg = '请输入密码';
					return;
				}
				if (!this.isLogin) {
					if (this.form.password.length < 6) {
						this.errorMsg = '密码至少6位';
						return;
					}
					if (this.form.password !== this.form.confirmPassword) {
						this.errorMsg = '两次密码不一致';
						return;
					}
				}

				this.submitting = true;
				try {
					let user;
					if (this.isLogin) {
						user = await login(this.form.username.trim(), this.form.password);
					} else {
						user = await register(this.form.username.trim(), this.form.password, this.form.nickname.trim());
					}
					uni.showToast({ title: this.isLogin ? '登录成功' : '注册成功', icon: 'success' });
					setTimeout(() => {
						if (this.isModal) {
							uni.$emit('loginSuccess', user);
							uni.navigateBack();
						} else {
							uni.reLaunch({ url: '/pages/book-menu/book-menu' });
						}
					}, 800);
				} catch (err) {
					this.errorMsg = err.message || '操作失败';
				} finally {
					this.submitting = false;
				}
			},
			handleClose() {
				if (this.isModal) {
					uni.navigateBack();
				} else {
					uni.reLaunch({ url: '/pages/book-menu/book-menu' });
				}
			}
		}
	}
</script>

<style lang="scss">
	.page-container {
		width: 100%;
		min-height: 100vh;
		background-color: #FAFAF8;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.bg-decoration {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 500px;
		background: linear-gradient(180deg, #F2ECE0 0%, #FAFAF8 100%);
		overflow: hidden;
	}

	.circle {
		position: absolute;
		border-radius: 50%;
		opacity: 0.4;
	}

	.circle-1 {
		width: 200px;
		height: 200px;
		background: linear-gradient(135deg, #E8DFD0 0%, #D4C4A8 100%);
		top: -50px;
		right: -50px;
	}

	.circle-2 {
		width: 150px;
		height: 150px;
		background: linear-gradient(135deg, #F5ECD7 0%, #E8DFD0 100%);
		top: 100px;
		left: -40px;
	}

	.form-scroll {
		flex: 1;
		position: relative;
		z-index: 10;
	}

	.form-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80px 40px 30px;
	}

	.logo-wrap {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #3D2817 0%, #5C3A1F 100%);
		border-radius: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20px;
		box-shadow: 0 8px 28px rgba(61, 40, 23, 0.2);
	}

	.logo {
		width: 48px;
		height: 48px;
	}

	.app-title {
		font-size: 28px;
		font-weight: 700;
		color: #3D2817;
		letter-spacing: 4px;
	}

	.app-subtitle {
		font-size: 14px;
		color: #8B7355;
		margin-top: 8px;
	}

	.form-tabs {
		display: flex;
		background-color: #FFFFFF;
		border-radius: 28px;
		padding: 6px;
		margin: 20px 32px 0;
		box-shadow: 0 2px 16px rgba(60, 40, 20, 0.06);
	}

	.tab-item {
		flex: 1;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 22px;
		transition: all 0.2s ease;

		&.active {
			background: linear-gradient(135deg, #3D2817 0%, #5C3A1F 100%);

			.tab-text {
				color: #FFFFFF;
				font-weight: 600;
			}
		}
	}

	.tab-text {
		font-size: 15px;
		font-weight: 500;
		color: #8B7355;
	}

	.form-body {
		padding: 32px;
	}

	.input-group {
		display: flex;
		align-items: center;
		background-color: #FFFFFF;
		border-radius: 16px;
		padding: 0 16px;
		height: 56px;
		margin-bottom: 16px;
		box-shadow: 0 2px 12px rgba(60, 40, 20, 0.04);
		border: 1px solid transparent;
		transition: border-color 0.2s ease;

		&:focus-within {
			border-color: #8B5A2B;
		}
	}

	.input-icon {
		width: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-text {
		font-size: 18px;
		color: #8B5A2B;
	}

	.form-input {
		flex: 1;
		font-size: 15px;
		color: #3D2817;
		height: 56px;
	}

	.input-placeholder {
		color: #B0A89E;
		font-size: 14px;
	}

	.toggle-pwd {
		padding: 6px 10px;
	}

	.toggle-text {
		font-size: 12px;
		color: #8B5A2B;
		font-weight: 500;
	}

	.error-tip {
		background-color: rgba(231, 76, 60, 0.1);
		border-radius: 10px;
		padding: 10px 14px;
		margin-bottom: 16px;
	}

	.error-text {
		font-size: 13px;
		color: #E74C3C;
	}

	.submit-btn {
		background: linear-gradient(135deg, #3D2817 0%, #5C3A1F 100%);
		border-radius: 28px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 12px;
		box-shadow: 0 8px 28px rgba(61, 40, 23, 0.25);
		transition: transform 0.15s ease;

		&:active {
			transform: scale(0.98);
		}

		&.loading {
			opacity: 0.7;
			pointer-events: none;
		}
	}

	.submit-text {
		font-size: 17px;
		font-weight: 600;
		color: #FFFFFF;
		letter-spacing: 4px;
	}

	.form-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 24px;
	}

	.footer-text {
		font-size: 13px;
		color: #8B7355;
	}

	.footer-link {
		font-size: 13px;
		color: #8B5A2B;
		font-weight: 600;
		margin-left: 4px;
	}

	.close-btn {
		position: fixed;
		top: 50px;
		right: 20px;
		width: 40px;
		height: 40px;
		background-color: #FFFFFF;
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 12px rgba(60, 40, 20, 0.1);
		z-index: 100;
	}

	.close-icon {
		font-size: 24px;
		color: #8B7355;
		font-weight: 300;
	}
</style>