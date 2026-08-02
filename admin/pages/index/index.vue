<template>
  <view class="fix-top-window">
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title">仪表盘</view>
        <view class="uni-sub-title">系统数据概览</view>
      </view>
      <view class="uni-group">
        <button class="uni-button" type="default" size="mini" @click="loadData">刷新数据</button>
      </view>
    </view>
    <view class="uni-container">
      <!-- 业务统计卡片 -->
      <view class="stat-cards mb-m">
        <view class="stat-card">
          <view class="stat-card-label">累计用户</view>
          <view class="stat-card-value">{{ stats.totalUsers }}</view>
        </view>
        <view class="stat-card">
          <view class="stat-card-label">今日登录</view>
          <view class="stat-card-value">{{ stats.todayLogin }}</view>
        </view>
        <view class="stat-card">
          <view class="stat-card-label">今日注册</view>
          <view class="stat-card-value">{{ stats.todayRegister }}</view>
        </view>
        <view class="stat-card">
          <view class="stat-card-label">累计登录次数</view>
          <view class="stat-card-value">{{ stats.totalLogins }}</view>
        </view>
      </view>

      <view class="stat-cards mb-m">
        <view class="stat-card stat-card-green">
          <view class="stat-card-label">借阅中</view>
          <view class="stat-card-value">{{ stats.totalBorrowed }}</view>
        </view>
        <view class="stat-card stat-card-orange">
          <view class="stat-card-label">已归还</view>
          <view class="stat-card-value">{{ stats.totalReturned }}</view>
        </view>
      </view>

      <view class="quick-entry">
        <view class="quick-title">快捷入口</view>
        <view class="quick-list">
          <view class="quick-item" @click="navTo('/pages/book-categories/list')">
            <view class="quick-icon">📑</view>
            <text class="quick-text">分类管理</text>
          </view>
          <view class="quick-item" @click="navTo('/pages/book-products/list')">
            <view class="quick-icon">📚</view>
            <text class="quick-text">图书管理</text>
          </view>
          <view class="quick-item" @click="navTo('/pages/users/list')">
            <view class="quick-icon">👥</view>
            <text class="quick-text">用户管理</text>
          </view>
          <view class="quick-item" @click="navTo('/pages/borrow-records/list')">
            <view class="quick-icon">📋</view>
            <text class="quick-text">借阅记录</text>
          </view>
          <view class="quick-item" @click="navTo('/pages/login-records/list')">
            <view class="quick-icon">🔑</view>
            <text class="quick-text">登录记录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import { statsApi } from '@/utils/admin-api.js';

  export default {
    data() {
      return {
        stats: {
          totalUsers: 0,
          todayLogin: 0,
          todayRegister: 0,
          totalLogins: 0,
          totalBorrowed: 0,
          totalReturned: 0,
        },
      };
    },
    onReady() {
      this.loadData();
    },
    methods: {
      async loadData() {
        try {
          this.stats = await statsApi.getOverview();
        } catch (e) {
          console.error('加载统计数据失败:', e);
        }
      },
      navTo(url) {
        uni.navigateTo({ url });
      },
    },
  };
</script>

<style>
  .uni-stat-card-header {
    display: flex;
    justify-content: space-between;
    color: #555;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 0;
    margin-bottom: 15px;
  }

  .stat-cards {
    display: flex;
    gap: 16px;
  }
  .stat-card {
    flex: 1;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s;
  }
  .stat-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  .stat-card-green {
    border-left: 4px solid #67c23a;
  }
  .stat-card-orange {
    border-left: 4px solid #e6a23c;
  }
  .stat-card-label {
    color: #909399;
    font-size: 13px;
    margin-bottom: 8px;
  }
  .stat-card-value {
    color: #409eff;
    font-size: 32px;
    font-weight: 600;
  }
  .stat-card-green .stat-card-value {
    color: #67c23a;
  }
  .stat-card-orange .stat-card-value {
    color: #e6a23c;
  }

  .quick-entry {
    margin-top: 24px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 20px;
  }
  .quick-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }
  .quick-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
  .quick-item {
    width: 120px;
    padding: 20px 10px;
    text-align: center;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .quick-item:hover {
    background: #f5f7fa;
    border-color: #409eff;
  }
  .quick-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
  .quick-text {
    font-size: 13px;
    color: #606266;
  }
</style>
