<template>
  <view class="page-container">
    <view class="header">
      <view class="title">登录记录</view>
      <view class="toolbar">
        <input class="search-input" v-model="searchKeyword" placeholder="搜索用户名/昵称/IP" @confirm="handleSearch" />
        <view class="btn btn-primary" @click="handleSearch">搜索</view>
        <view class="btn btn-default" @click="handleReset">重置</view>
        <view class="btn btn-default" @click="loadData">刷新</view>
      </view>
    </view>

    <view class="stat-bar">
      <view class="stat-item">总记录：<text class="stat-num">{{ allData.length }}</text></view>
      <view class="stat-item">登录：<text class="stat-num">{{ typeCount('login') }}</text></view>
      <view class="stat-item">注册：<text class="stat-num">{{ typeCount('register') }}</text></view>
      <view class="stat-item">独立用户：<text class="stat-num">{{ uniqueUserCount }}</text></view>
    </view>

    <view class="table-wrap">
      <view class="table-header">
        <view class="th th-index">序号</view>
        <view class="th th-user">用户名</view>
        <view class="th th-nick">昵称</view>
        <view class="th th-uid">用户ID</view>
        <view class="th th-ip">IP地址</view>
        <view class="th th-type">方式</view>
        <view class="th th-device">客户端</view>
        <view class="th th-time">登录时间</view>
      </view>
      <view class="table-body">
        <view v-for="(item, idx) in pagedData" :key="item.id" class="table-row">
          <view class="td td-index">{{ (currentPage - 1) * pageSize + idx + 1 }}</view>
          <view class="td td-user">{{ item.username }}</view>
          <view class="td td-nick">{{ item.nickname }}</view>
          <view class="td td-uid" :title="item.user_id">{{ shortUid(item.user_id) }}</view>
          <view class="td td-ip">{{ item.ip || '-' }}</view>
          <view class="td td-type">
            <text class="tag" :class="item.login_type === 'register' ? 'tag-success' : 'tag-info'">{{ item.login_type === 'register' ? '注册' : '登录' }}</text>
          </view>
          <view class="td td-device" :title="item.user_agent">{{ parseDevice(item.user_agent) }}</view>
          <view class="td td-time">{{ formatTime(item.login_time) }}</view>
        </view>
        <view v-if="pagedData.length === 0" class="empty">暂无登录记录</view>
      </view>
    </view>

    <view class="pagination">
      <view class="btn btn-default" :class="{ disabled: currentPage <= 1 }" @click="changePage(currentPage - 1)">上一页</view>
      <view class="page-info">{{ currentPage }} / {{ totalPages }}</view>
      <view class="btn btn-default" :class="{ disabled: currentPage >= totalPages }" @click="changePage(currentPage + 1)">下一页</view>
    </view>
  </view>
</template>

<script>
import { loginRecordsApi } from '@/utils/admin-api.js';

export default {
  data() {
    return {
      allData: [],
      searchKeyword: '',
      currentPage: 1,
      pageSize: 10
    };
  },
  computed: {
    filteredData() {
      const kw = this.searchKeyword.trim().toLowerCase();
      if (!kw) return this.allData;
      return this.allData.filter(item =>
        (item.username && item.username.toLowerCase().includes(kw)) ||
        (item.nickname && item.nickname.toLowerCase().includes(kw)) ||
        (item.ip && item.ip.toLowerCase().includes(kw))
      );
    },
    pagedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredData.slice(start, start + this.pageSize);
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
    },
    uniqueUserCount() {
      return new Set(this.allData.map(i => i.user_id)).size;
    }
  },
  created() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        uni.showLoading({ title: '加载中' });
        this.allData = await loginRecordsApi.getList();
      } catch (e) {
        uni.showToast({ title: e.message || '加载失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },
    handleSearch() {
      this.currentPage = 1;
    },
    handleReset() {
      this.searchKeyword = '';
      this.currentPage = 1;
    },
    changePage(p) {
      if (p < 1 || p > this.totalPages) return;
      this.currentPage = p;
    },
    typeCount(type) {
      return this.allData.filter(i => i.login_type === type).length;
    },
    shortUid(uid) {
      if (!uid) return '-';
      return uid.length > 14 ? uid.slice(0, 12) + '…' : uid;
    },
    parseDevice(ua) {
      if (!ua) return '-';
      let os = '未知';
      if (/Windows/i.test(ua)) os = 'Windows';
      else if (/Mac OS/i.test(ua)) os = 'Mac';
      else if (/Android/i.test(ua)) os = 'Android';
      else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
      else if (/Linux/i.test(ua)) os = 'Linux';
      let client = '浏览器';
      if (/MicroMessenger/i.test(ua)) client = '微信';
      else if (/Edg/i.test(ua)) client = 'Edge';
      else if (/Chrome/i.test(ua)) client = 'Chrome';
      else if (/Firefox/i.test(ua)) client = 'Firefox';
      else if (/Safari/i.test(ua)) client = 'Safari';
      return os + ' / ' + client;
    },
    formatTime(t) {
      if (!t) return '-';
      const d = new Date(t);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  }
};
</script>

<style lang="scss">
.page-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.title { font-size: 20px; font-weight: 600; color: #333; }
.toolbar { display: flex; align-items: center; gap: 10px; }
.search-input { width: 240px; height: 34px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 13px; outline: none; box-sizing: border-box; }
.search-input:focus { border-color: #409eff; }
.btn { height: 34px; line-height: 34px; padding: 0 16px; border-radius: 4px; font-size: 13px; cursor: pointer; user-select: none; }
.btn-primary { background: #409eff; color: #fff; }
.btn-default { background: #fff; color: #606266; border: 1px solid #dcdfe6; }
.btn-default.disabled { color: #c0c4cc; cursor: not-allowed; }
.stat-bar { display: flex; gap: 24px; padding: 12px 16px; background: #f4f6fa; border-radius: 4px; margin-bottom: 16px; font-size: 13px; color: #606266; }
.stat-num { color: #409eff; font-weight: 600; margin-left: 4px; }
.table-wrap { border: 1px solid #ebeef5; border-radius: 4px; overflow: hidden; }
.table-header, .table-row { display: flex; align-items: center; }
.table-header { background: #fafafa; }
.table-row { border-top: 1px solid #ebeef5; }
.table-row:hover { background: #f5f7fa; }
.th, .td { padding: 10px 8px; font-size: 13px; color: #606266; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.th { color: #909399; font-weight: 600; }
.th-index, .td-index { width: 60px; flex-shrink: 0; text-align: center; }
.th-user, .td-user { width: 120px; flex-shrink: 0; }
.th-nick, .td-nick { width: 120px; flex-shrink: 0; }
.th-uid, .td-uid { width: 150px; flex-shrink: 0; }
.th-ip, .td-ip { width: 140px; flex-shrink: 0; }
.th-type, .td-type { width: 80px; flex-shrink: 0; text-align: center; }
.th-device, .td-device { width: 160px; flex-shrink: 0; }
.th-time, .td-time { flex: 1; }
.tag { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
.tag-info { background: #ecf5ff; color: #409eff; }
.tag-success { background: #f0f9eb; color: #67c23a; }
.empty { padding: 40px; text-align: center; color: #c0c4cc; font-size: 14px; }
.pagination { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.page-info { font-size: 13px; color: #606266; }
</style>
