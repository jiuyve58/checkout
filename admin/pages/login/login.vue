<template>
  <view class="login-page">
    <view class="login-box">
      <view class="login-title">图书管理后台</view>
      <view class="login-subtitle">{{ mode === 'login' ? '请登录管理员账号' : '注册新管理员账号' }}</view>

      <view class="tab-bar">
        <view class="tab-item" :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</view>
        <view class="tab-item" :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</view>
      </view>

      <view v-if="mode === 'login'">
        <view class="form-item">
          <input class="form-input" type="text" v-model="form.username" placeholder="用户名" @confirm="onSubmit" />
        </view>
        <view class="form-item">
          <input class="form-input" type="password" v-model="form.password" placeholder="密码" @confirm="onSubmit" />
        </view>
        <view class="form-error" v-if="errorMsg">{{ errorMsg }}</view>
        <button class="login-btn" type="primary" :loading="loading" @click="onSubmit">登录</button>
        <view class="login-tip">默认管理员: admin / admin123</view>
      </view>

      <view v-else>
        <view class="form-item">
          <input class="form-input" type="text" v-model="reg.username" placeholder="用户名 (至少3位)" />
        </view>
        <view class="form-item">
          <input class="form-input" type="text" v-model="reg.nickname" placeholder="昵称 (可选)" />
        </view>
        <view class="form-item">
          <input class="form-input" type="password" v-model="reg.password" placeholder="密码 (至少6位)" />
        </view>
        <view class="form-item">
          <input class="form-input" type="password" v-model="reg.confirmPassword" placeholder="确认密码" />
        </view>
        <view class="form-error" v-if="errorMsg">{{ errorMsg }}</view>
        <button class="login-btn" type="primary" :loading="loading" @click="onRegister">注册并登录</button>
        <view class="login-tip">注册后将自动登录并跳转首页</view>
      </view>
    </view>
  </view>
</template>

<script>
  import { authApi } from '@/utils/admin-api.js';
  import config from '@/admin.config.js';

  export default {
    data() {
      return {
        mode: 'login',
        form: { username: '', password: '' },
        reg: { username: '', nickname: '', password: '', confirmPassword: '' },
        loading: false,
        errorMsg: '',
      };
    },
    methods: {
      async onSubmit() {
        if (!this.form.username || !this.form.password) {
          this.errorMsg = '请输入用户名和密码';
          return;
        }
        this.loading = true;
        this.errorMsg = '';
        try {
          const data = await authApi.login(this.form.username, this.form.password);
          if (data.user.role !== 'admin') {
            this.errorMsg = '该账号无管理权限，请使用管理员账号';
            return;
          }
          uni.setStorageSync('admin_token', data.token);
          uni.setStorageSync('admin_user', JSON.stringify(data.user));
          uni.showToast({ title: '登录成功', icon: 'success' });
          setTimeout(() => {
            uni.reLaunch({ url: config.index.url });
          }, 500);
        } catch (err) {
          this.errorMsg = err.message || '登录失败';
        } finally {
          this.loading = false;
        }
      },
      async onRegister() {
        if (!this.reg.username || !this.reg.password) {
          this.errorMsg = '请填写完整信息';
          return;
        }
        if (this.reg.username.length < 3) {
          this.errorMsg = '用户名至少3位';
          return;
        }
        if (this.reg.password.length < 6) {
          this.errorMsg = '密码至少6位';
          return;
        }
        if (this.reg.password !== this.reg.confirmPassword) {
          this.errorMsg = '两次密码不一致';
          return;
        }
        this.loading = true;
        this.errorMsg = '';
        try {
          const data = await authApi.adminRegister(this.reg.username, this.reg.password, this.reg.nickname);
          uni.setStorageSync('admin_token', data.token);
          uni.setStorageSync('admin_user', JSON.stringify(data.user));
          uni.showToast({ title: '注册成功', icon: 'success' });
          setTimeout(() => {
            uni.reLaunch({ url: config.index.url });
          }, 500);
        } catch (err) {
          this.errorMsg = err.message || '注册失败';
        } finally {
          this.loading = false;
        }
      },
    },
  };
</script>

<style>
  .login-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .login-box {
    width: 380px;
    background: #fff;
    border-radius: 8px;
    padding: 36px 30px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }
  .login-title {
    text-align: center;
    font-size: 22px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 6px;
  }
  .login-subtitle {
    text-align: center;
    font-size: 13px;
    color: #909399;
    margin-bottom: 20px;
  }
  .tab-bar {
    display: flex;
    margin-bottom: 24px;
    border-bottom: 1px solid #ebeef5;
  }
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    font-size: 14px;
    color: #909399;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .tab-item.active {
    color: #409eff;
    border-bottom-color: #409eff;
    font-weight: 600;
  }
  .form-item {
    margin-bottom: 16px;
  }
  .form-input {
    width: 100%;
    height: 40px;
    padding: 0 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-input:focus {
    border-color: #409eff;
  }
  .form-error {
    color: #f56c6c;
    font-size: 13px;
    margin-bottom: 12px;
    text-align: center;
  }
  .login-btn {
    width: 100%;
    height: 40px;
    line-height: 40px;
    font-size: 15px;
    margin-top: 6px;
  }
  .login-tip {
    text-align: center;
    font-size: 12px;
    color: #c0c4cc;
    margin-top: 14px;
  }
</style>
