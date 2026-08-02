<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title"></view>
        <view class="uni-sub-title"></view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入搜索内容" />
        <button class="uni-button" type="default" size="mini" @click="search">搜索</button>
        <button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增</button>
        <button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
        <download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
          <button class="uni-button" type="primary" size="mini">导出 Excel</button>
        </download-excel>
      </view>
    </view>
    <view class="uni-container">
      <uni-table ref="table" :loading="loading" :emptyText="errorMsg || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
        <uni-tr>
          <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'name')" sortable @sort-change="sortChange($event, 'name')">分类名称</uni-th>
          <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'sort')" sortable @sort-change="sortChange($event, 'sort')">排序权重</uni-th>
          <uni-th align="center" sortable @sort-change="sortChange($event, 'enabled')">是否启用</uni-th>
          <uni-th align="center">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item,index) in data" :key="index">
          <uni-td align="center">{{item.name}}</uni-td>
          <uni-td align="center">{{item.sort}}</uni-td>
          <uni-td align="center">{{item.enabled == true ? '✅' : '❌'}}</uni-td>
          <uni-td align="center">
            <view class="uni-group">
              <button @click="navigateTo('./edit?id='+item._id, false)" class="uni-button" size="mini" type="primary">修改</button>
              <button @click="confirmDelete(item._id)" class="uni-button" size="mini" type="warn">删除</button>
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
  import { categoriesApi } from '../../utils/admin-api.js';

  const pageSize = 20

  const orderByMapping = {
    "ascending": "asc",
    "descending": "desc"
  }

  export default {
    data() {
      return {
        query: '',
        allData: [],
        filterData: [],
        sortBy: '',
        sortOrder: '',
        selectedIndexs: [],
        loading: false,
        errorMsg: '',
        currentPage: 1,
        pageSize,
        exportExcel: {
          "filename": "coffee-categories.xls",
          "type": "xls",
          "fields": {
            "分类名称": "name",
            "排序权重": "sort",
            "是否启用": "enabled"
          }
        },
        exportExcelData: []
      }
    },
    computed: {
      filteredData() {
        let result = [...this.allData];
        if (this.query) {
          const query = this.query.trim().toLowerCase();
          result = result.filter(item => item.name.toLowerCase().includes(query));
        }
        if (this.sortBy) {
          result.sort((a, b) => {
            const va = a[this.sortBy];
            const vb = b[this.sortBy];
            if (va === vb) return 0;
            const cmp = va > vb ? 1 : -1;
            return this.sortOrder === 'descending' ? -cmp : cmp;
          });
        }
        return result;
      },
      data() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredData.slice(start, start + this.pageSize);
      }
    },
    watch: {
      filteredData: {
        handler(val) {
          this.exportExcelData = val;
        },
        immediate: true
      }
    },
    onLoad() {
      this._filter = {};
    },
    onReady() {
      this.loadData();
    },
    methods: {
      async loadData() {
        this.loading = true;
        this.errorMsg = '';
        try {
          const data = await categoriesApi.getList();
          this.allData = data.map(item => ({
            ...item,
            _id: item._id || String(item.id)
          }));
        } catch (err) {
          this.errorMsg = err.message || '加载失败';
          uni.showModal({
            content: err.message || '加载失败',
            showCancel: false
          });
        } finally {
          this.loading = false;
        }
      },
      search() {
        this.currentPage = 1;
        this.$nextTick(() => {});
      },
      onPageChanged(e) {
        this.selectedIndexs.length = 0;
        this.$refs.table.clearSelection();
        this.currentPage = e.current;
      },
      navigateTo(url, clear) {
        uni.navigateTo({
          url,
          events: {
            refreshData: () => {
              this.loadData();
            }
          }
        });
      },
      selectedItems() {
        return this.selectedIndexs.map(i => this.data[i]._id);
      },
      async delTable() {
        const ids = this.selectedItems();
        if (!ids.length) return;
        uni.showModal({
          title: '确认删除',
          content: `确定删除选中的 ${ids.length} 条数据吗？`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await categoriesApi.batchRemove(ids);
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
      selectionChange(e) {
        this.selectedIndexs = e.detail.index;
      },
      confirmDelete(id) {
        uni.showModal({
          title: '确认删除',
          content: '确定删除该条数据吗？',
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await categoriesApi.remove(id);
                uni.showToast({ title: '删除成功' });
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
      sortChange(e, name) {
        this.sortBy = name;
        this.sortOrder = e.order || '';
        this.selectedIndexs = [];
        this.$refs.table.clearSelection();
        this.currentPage = 1;
      },
      filterChange(e, name) {
        this._filter[name] = {
          type: e.filterType,
          value: e.filter
        };
        this.search();
      }
    }
  }
</script>

<style>
</style>
