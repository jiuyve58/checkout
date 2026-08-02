<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title">用户管理</view>
        <view class="uni-sub-title">共 {{ allData.length }} 位用户</view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="搜索用户名/昵称" />
        <button class="uni-button" type="default" size="mini" @click="search">搜索</button>
        <button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
      </view>
    </view>
    <view class="uni-container">
      <uni-table ref="table" :loading="loading" :emptyText="errorMsg || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
        <uni-tr>
          <uni-th align="center">用户名</uni-th>
          <uni-th align="center">昵称</uni-th>
          <uni-th align="center">用户ID</uni-th>
          <uni-th align="center">会员等级</uni-th>
          <uni-th align="center">状态</uni-th>
          <uni-th align="center">借阅数</uni-th>
          <uni-th align="center">登录次数</uni-th>
          <uni-th align="center">注册时间</uni-th>
          <uni-th align="center">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item, index) in data" :key="index">
          <uni-td align="center">{{ item.username }}</uni-td>
          <uni-td align="center">{{ item.nickname || '-' }}</uni-td>
          <uni-td align="center" :title="item.id">{{ shortId(item.id) }}</uni-td>
          <uni-td align="center">
            <text class="tag" :class="item.member_level === 'vip' ? 'tag-warning' : 'tag-info'">
              {{ item.member_level === 'vip' ? 'VIP' : '普通' }}
            </text>
          </uni-td>
          <uni-td align="center">
            <text class="tag" :class="item.status === 'active' ? 'tag-success' : 'tag-danger'">
              {{ item.status === 'active' ? '正常' : '禁用' }}
            </text>
          </uni-td>
          <uni-td align="center">{{ item.borrow_count || 0 }}</uni-td>
          <uni-td align="center">{{ item.login_count || 0 }}</uni-td>
          <uni-td align="center">{{ formatTime(item.created_at) }}</uni-td>
          <uni-td align="center">
            <view class="uni-group">
              <button @click="viewDetail(item)" class="uni-button" size="mini" type="primary">详情</button>
              <button @click="toggleStatus(item)" class="uni-button" size="mini" :type="item.status === 'active' ? 'warn' : 'default'">
                {{ item.status === 'active' ? '禁用' : '启用' }}
              </button>
              <button @click="confirmDelete(item)" class="uni-button" size="mini" type="warn">删除</button>
            </view>
          </uni-td>
        </uni-tr>
      </uni-table>
      <view class="uni-pagination-box">
        <uni-pagination show-icon :page-size="pageSize" v-model="currentPage" :total="filteredData.length" @change="onPageChanged" />
      </view>
    </view>

    <!-- 用户详情弹窗 -->
    <uni-popup ref="detailPopup" type="center" :mask-click="true">
      <view class="detail-modal" v-if="detailData">
        <view class="detail-header">
          <text class="detail-title">用户详情</text>
          <text class="detail-close" @click="closeDetail">×</text>
        </view>
        <scroll-view scroll-y class="detail-body">
          <view class="detail-section">
            <view class="detail-row"><text class="detail-label">用户名：</text><text class="detail-value">{{ detailData.user.username }}</text></view>
            <view class="detail-row"><text class="detail-label">昵称：</text><text class="detail-value">{{ detailData.user.nickname || '-' }}</text></view>
            <view class="detail-row"><text class="detail-label">用户ID：</text><text class="detail-value">{{ detailData.user.id }}</text></view>
            <view class="detail-row"><text class="detail-label">邮箱：</text><text class="detail-value">{{ detailData.user.email || '-' }}</text></view>
            <view class="detail-row"><text class="detail-label">手机：</text><text class="detail-value">{{ detailData.user.phone || '-' }}</text></view>
            <view class="detail-row"><text class="detail-label">状态：</text><text class="detail-value">{{ detailData.user.status === 'active' ? '正常' : '禁用' }}</text></view>
            <view class="detail-row"><text class="detail-label">注册时间：</text><text class="detail-value">{{ formatTime(detailData.user.created_at) }}</text></view>
          </view>
          <view class="detail-section">
            <view class="section-title">借阅记录 ({{ detailData.borrow_records.length }})</view>
            <view class="record-item" v-for="(r, i) in detailData.borrow_records" :key="i">
              <view class="record-row">
                <text class="record-name">{{ r.product_name }}</text>
                <text class="tag" :class="r.status === 'borrowed' ? 'tag-warning' : 'tag-success'">
                  {{ r.status === 'borrowed' ? '借阅中' : '已归还' }}
                </text>
              </view>
              <view class="record-time">借阅：{{ formatTime(r.borrow_date) }}</view>
              <view class="record-time" v-if="r.return_date">归还：{{ formatTime(r.return_date) }}</view>
            </view>
            <view class="empty-text" v-if="!detailData.borrow_records.length">暂无借阅记录</view>
          </view>
          <view class="detail-section">
            <view class="section-title">登录记录 ({{ detailData.login_records.length }})</view>
            <view class="record-item" v-for="(l, i) in detailData.login_records" :key="i">
              <view class="record-row">
                <text class="record-name">{{ l.login_type === 'register' ? '注册' : '登录' }}</text>
                <text class="record-time">{{ formatTime(l.login_time) }}</text>
              </view>
              <view class="record-time">IP：{{ l.ip || '-' }}</view>
            </view>
            <view class="empty-text" v-if="!detailData.login_records.length">暂无登录记录</view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
  import { usersApi } from '@/utils/admin-api.js';

  const pageSize = 20;

  export default {
    data() {
      return {
        query: '',
        allData: [],
        selectedIndexs: [],
        loading: false,
        errorMsg: '',
        currentPage: 1,
        pageSize,
        detailData: null,
      };
    },
    computed: {
      filteredData() {
        let result = [...this.allData];
        if (this.query) {
          const q = this.query.trim().toLowerCase();
          result = result.filter(item =>
            (item.username && item.username.toLowerCase().includes(q)) ||
            (item.nickname && item.nickname.toLowerCase().includes(q))
          );
        }
        return result;
      },
      data() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredData.slice(start, start + this.pageSize);
      },
    },
    onReady() {
      this.loadData();
    },
    methods: {
      async loadData() {
        this.loading = true;
        this.errorMsg = '';
        try {
          this.allData = await usersApi.getList();
        } catch (err) {
          this.errorMsg = err.message || '加载失败';
          uni.showModal({ content: err.message || '加载失败', showCancel: false });
        } finally {
          this.loading = false;
        }
      },
      search() {
        this.currentPage = 1;
      },
      onPageChanged(e) {
        this.selectedIndexs.length = 0;
        this.$refs.table.clearSelection();
        this.currentPage = e.current;
      },
      selectionChange(e) {
        this.selectedIndexs = e.detail.index;
      },
      selectedItems() {
        return this.selectedIndexs.map(i => this.data[i].id);
      },
      async delTable() {
        const ids = this.selectedItems();
        if (!ids.length) return;
        uni.showModal({
          title: '确认删除',
          content: `确定删除选中的 ${ids.length} 个用户吗？`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await usersApi.batchRemove(ids);
                uni.showToast({ title: '删除成功' });
                this.selectedIndexs = [];
                this.$refs.table.clearSelection();
                this.loadData();
              } catch (err) {
                uni.showModal({ content: err.message || '删除失败', showCancel: false });
              } finally {
                uni.hideLoading();
              }
            }
          }
        });
      },
      confirmDelete(item) {
        uni.showModal({
          title: '确认删除',
          content: `确定删除用户 ${item.username} 吗？`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await usersApi.remove(item.id);
                uni.showToast({ title: '删除成功' });
                this.loadData();
              } catch (err) {
                uni.showModal({ content: err.message || '删除失败', showCancel: false });
              } finally {
                uni.hideLoading();
              }
            }
          }
        });
      },
      async toggleStatus(item) {
        const newStatus = item.status === 'active' ? 'disabled' : 'active';
        uni.showLoading({ mask: true });
        try {
          await usersApi.update(item.id, { status: newStatus });
          uni.showToast({ title: newStatus === 'active' ? '已启用' : '已禁用' });
          this.loadData();
        } catch (err) {
          uni.showModal({ content: err.message || '操作失败', showCancel: false });
        } finally {
          uni.hideLoading();
        }
      },
      async viewDetail(item) {
        uni.showLoading({ mask: true });
        try {
          this.detailData = await usersApi.getDetail(item.id);
          this.$refs.detailPopup.open();
        } catch (err) {
          uni.showModal({ content: err.message || '加载失败', showCancel: false });
        } finally {
          uni.hideLoading();
        }
      },
      closeDetail() {
        this.$refs.detailPopup.close();
        this.detailData = null;
      },
      shortId(id) {
        if (!id) return '-';
        return id.length > 14 ? id.slice(0, 12) + '…' : id;
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

  .detail-modal {
    width: 600px;
    max-height: 80vh;
    background: #fff;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
  }
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }
  .detail-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
  .detail-close {
    font-size: 24px;
    color: #909399;
    cursor: pointer;
    line-height: 1;
  }
  .detail-body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }
  .detail-section {
    margin-bottom: 20px;
  }
  .detail-row {
    display: flex;
    padding: 6px 0;
    font-size: 13px;
  }
  .detail-label {
    color: #909399;
    width: 90px;
    flex-shrink: 0;
  }
  .detail-value {
    color: #303133;
    flex: 1;
    word-break: break-all;
  }
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #ebeef5;
  }
  .record-item {
    padding: 10px;
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
    color: #303133;
    font-weight: 500;
  }
  .record-time {
    font-size: 12px;
    color: #909399;
  }
  .empty-text {
    text-align: center;
    color: #c0c4cc;
    font-size: 13px;
    padding: 20px;
  }
</style>
