<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title">用户详情</view>
        <view class="uni-sub-title">{{ user.username || '-' }}</view>
      </view>
      <view class="uni-group">
        <button class="uni-button" type="default" size="mini" @click="goBack">返回</button>
      </view>
    </view>
    <view class="uni-container">
      <view class="loading" v-if="loading">加载中...</view>
      <view v-else-if="errorMsg" class="error-msg">{{ errorMsg }}</view>
      <block v-else-if="detail">
        <view class="detail-card">
          <view class="section-title">基本信息</view>
          <view class="info-row"><text class="info-label">用户名</text><text class="info-value">{{ detail.user.username }}</text></view>
          <view class="info-row"><text class="info-label">昵称</text><text class="info-value">{{ detail.user.nickname || '-' }}</text></view>
          <view class="info-row"><text class="info-label">用户ID</text><text class="info-value">{{ detail.user.id }}</text></view>
          <view class="info-row"><text class="info-label">状态</text>
            <text class="tag" :class="detail.user.status === 'active' ? 'tag-success' : 'tag-danger'">
              {{ detail.user.status === 'active' ? '正常' : '禁用' }}
            </text>
          </view>
          <view class="info-row"><text class="info-label">注册时间</text><text class="info-value">{{ formatTime(detail.user.created_at) }}</text></view>
        </view>

        <view class="detail-card">
          <view class="section-title">借阅记录 ({{ detail.borrow_records.length }})</view>
          <view class="record-item" v-for="(r, i) in detail.borrow_records" :key="i">
            <view class="record-row">
              <text class="record-name">{{ r.product_name }}</text>
              <text class="tag" :class="r.status === 'borrowed' ? 'tag-warning' : 'tag-success'">
                {{ r.status === 'borrowed' ? '借阅中' : '已归还' }}
              </text>
            </view>
            <view class="record-desc">
              借阅：{{ formatTime(r.borrow_date) }}
              <text v-if="r.return_date"> | 归还：{{ formatTime(r.return_date) }}</text>
            </view>
          </view>
          <view class="empty" v-if="!detail.borrow_records.length">暂无借阅记录</view>
        </view>

        <view class="detail-card">
          <view class="section-title">登录记录 ({{ detail.login_records.length }})</view>
          <view class="record-item" v-for="(l, i) in detail.login_records" :key="i">
            <view class="record-row">
              <text class="record-name">{{ l.login_type === 'register' ? '注册' : '登录' }}</text>
              <text class="record-time">{{ formatTime(l.login_time) }}</text>
            </view>
            <view class="record-desc">IP：{{ l.ip || '-' }}</view>
          </view>
          <view class="empty" v-if="!detail.login_records.length">暂无登录记录</view>
        </view>
      </block>
    </view>
  </view>
</template>

<script>
  import { usersApi } from '@/utils/admin-api.js';

  export default {
    data() {
      return {
        loading: false,
        errorMsg: '',
        detail: null,
      };
    },
    onLoad(options) {
      if (options.id) {
        this.loadData(options.id);
      } else {
        this.errorMsg = '缺少用户ID参数';
      }
    },
    methods: {
      async loadData(id) {
        this.loading = true;
        this.errorMsg = '';
        try {
          this.detail = await usersApi.getDetail(id);
        } catch (err) {
          this.errorMsg = err.message || '加载失败';
        } finally {
          this.loading = false;
        }
      },
      goBack() {
        uni.navigateBack();
      },
      formatTime(t) {
        if (!t) return '-';
        const d = new Date(t);
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
      },
    }
  };
</script>

<style>
  .loading, .error-msg {
    text-align: center;
    padding: 40px;
    color: #909399;
  }
  .error-msg { color: #f56c6c; }
  .detail-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;
  }
  .info-row {
    display: flex;
    padding: 8px 0;
    font-size: 13px;
  }
  .info-label {
    color: #909399;
    width: 90px;
    flex-shrink: 0;
  }
  .info-value {
    color: #303133;
    flex: 1;
    word-break: break-all;
  }
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
  }
  .tag-info { background: #ecf5ff; color: #409eff; }
  .tag-success { background: #f0f9eb; color: #67c23a; }
  .tag-warning { background: #fdf6ec; color: #e6a23c; }
  .tag-danger { background: #fef0f0; color: #f56c6c; }
  .record-item {
    padding: 10px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  .record-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .record-name {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }
  .record-desc {
    font-size: 12px;
    color: #909399;
  }
  .record-time {
    font-size: 12px;
    color: #909399;
  }
  .empty {
    text-align: center;
    color: #c0c4cc;
    font-size: 13px;
    padding: 20px;
  }
</style>
