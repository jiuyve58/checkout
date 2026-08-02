<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title">借阅记录</view>
        <view class="uni-sub-title">共 {{ allData.length }} 条记录</view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="搜索书名/用户名" />
        <button class="uni-button" type="default" size="mini" @click="search">搜索</button>
        <button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
      </view>
    </view>
    <view class="stat-bar">
      <view class="stat-item">全部：<text class="stat-num">{{ allData.length }}</text></view>
      <view class="stat-item">借阅中：<text class="stat-num">{{ typeCount('borrowed') }}</text></view>
      <view class="stat-item">已归还：<text class="stat-num">{{ typeCount('returned') }}</text></view>
    </view>
    <view class="uni-container">
      <uni-table ref="table" :loading="loading" :emptyText="errorMsg || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
        <uni-tr>
          <uni-th align="center">书名</uni-th>
          <uni-th align="center">用户名</uni-th>
          <uni-th align="center">借阅日期</uni-th>
          <uni-th align="center">到期日期</uni-th>
          <uni-th align="center">归还日期</uni-th>
          <uni-th align="center">状态</uni-th>
          <uni-th align="center">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item, index) in data" :key="index">
          <uni-td align="center">{{ item.product_name || '-' }}</uni-td>
          <uni-td align="center">{{ item.user_name || '-' }}</uni-td>
          <uni-td align="center">{{ formatTime(item.borrow_date) }}</uni-td>
          <uni-td align="center">{{ formatTime(item.due_date) }}</uni-td>
          <uni-td align="center">{{ item.return_date ? formatTime(item.return_date) : '-' }}</uni-td>
          <uni-td align="center">
            <text class="tag" :class="statusClass(item.status)">{{ statusText(item.status) }}</text>
          </uni-td>
          <uni-td align="center">
            <view class="uni-group">
              <button
                v-if="item.status === 'borrowed' || item.status === 'overdue'"
                @click="returnBook(item)"
                class="uni-button"
                size="mini"
                type="primary">
                归还
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
  </view>
</template>

<script>
  import { borrowRecordsApi } from '@/utils/admin-api.js';

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
      };
    },
    computed: {
      filteredData() {
        let result = [...this.allData];
        if (this.query) {
          const q = this.query.trim().toLowerCase();
          result = result.filter(item =>
            (item.product_name && item.product_name.toLowerCase().includes(q)) ||
            (item.user_name && item.user_name.toLowerCase().includes(q))
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
          this.allData = await borrowRecordsApi.getList();
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
        return this.selectedIndexs.map(i => this.data[i]._id);
      },
      async delTable() {
        const ids = this.selectedItems();
        if (!ids.length) return;
        uni.showModal({
          title: '确认删除',
          content: `确定删除选中的 ${ids.length} 条记录吗？`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await borrowRecordsApi.batchRemove(ids);
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
          content: '确定删除该借阅记录吗？',
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await borrowRecordsApi.batchRemove([item._id]);
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
      async returnBook(item) {
        uni.showModal({
          title: '确认归还',
          content: `确定归还《${item.product_name}》吗？`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await borrowRecordsApi.returnBook(item._id);
                uni.showToast({ title: '归还成功' });
                this.loadData();
              } catch (err) {
                uni.showModal({ content: err.message || '归还失败', showCancel: false });
              } finally {
                uni.hideLoading();
              }
            }
          }
        });
      },
      typeCount(status) {
        return this.allData.filter(i => i.status === status).length;
      },
      statusText(status) {
        const map = { borrowed: '借阅中', returned: '已归还', overdue: '已逾期' };
        return map[status] || status;
      },
      statusClass(status) {
        const map = { borrowed: 'tag-warning', returned: 'tag-success', overdue: 'tag-danger' };
        return map[status] || 'tag-info';
      },
      formatTime(t) {
        if (!t) return '-';
        const d = new Date(t);
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      },
    }
  };
</script>

<style>
  .stat-bar {
    display: flex;
    gap: 24px;
    padding: 12px 16px;
    background: #f4f6fa;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #606266;
  }
  .stat-num {
    color: #409eff;
    font-weight: 600;
    margin-left: 4px;
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
</style>
