<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title"></view>
        <view class="uni-sub-title"></view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="请输入书名/作者搜索" />
        <button class="uni-button" type="default" size="mini" @click="search">搜索</button>
        <button class="uni-button" type="default" size="mini" @click="navigateTo('./add')">新增图书</button>
        <button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="delTable">批量删除</button>
        <download-excel class="hide-on-phone" :fields="exportExcel.fields" :data="exportExcelData" :type="exportExcel.type" :name="exportExcel.filename">
          <button class="uni-button" type="primary" size="mini">导出 Excel</button>
        </download-excel>
      </view>
    </view>
    <view class="uni-container">
      <uni-table ref="table" :loading="loading" :emptyText="errorMsg || '没有更多数据'" border stripe type="selection" @selection-change="selectionChange">
        <uni-tr>
          <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'name')" sortable @sort-change="sortChange($event, 'name')">图书名称</uni-th>
          <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'author')" sortable @sort-change="sortChange($event, 'author')">作者</uni-th>
          <uni-th align="center" filter-type="search" @filter-change="filterChange($event, 'code')" sortable @sort-change="sortChange($event, 'code')">图书编号</uni-th>
          <uni-th align="center" filter-type="range" @filter-change="filterChange($event, 'price')" sortable @sort-change="sortChange($event, 'price')">借阅价格</uni-th>
          <uni-th align="center">图书封面</uni-th>
          <uni-th align="center" sortable @sort-change="sortChange($event, 'category_id')">所属分类</uni-th>
          <uni-th align="center" sortable @sort-change="sortChange($event, 'rating')">评分</uni-th>
          <uni-th align="center" sortable @sort-change="sortChange($event, 'on_sale')">是否可借</uni-th>
          <uni-th align="center">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(item,index) in data" :key="index">
          <uni-td align="center">{{item.name}}</uni-td>
          <uni-td align="center">{{item.author || '-'}}</uni-td>
          <uni-td align="center">{{item.code || '-'}}</uni-td>
          <uni-td align="center">￥{{item.price}}</uni-td>
          <uni-td align="center"><image :src="item.image" :style="imageStyles" mode="aspectFill"></image></uni-td>
          <uni-td align="center">{{item.category_id}}</uni-td>
          <uni-td align="center">{{item.rating || 4.8}}</uni-td>
          <uni-td align="center">{{item.on_sale == true ? '✅' : '❌'}}</uni-td>
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
  import { productsApi } from '../../utils/admin-api.js';
  import config from '@/config/index.js';

  const pageSize = 20

  export default {
    data() {
      return {
        query: '',
        allData: [],
        sortBy: '',
        sortOrder: '',
        selectedIndexs: [],
        loading: false,
        errorMsg: '',
        currentPage: 1,
        pageSize,
        imageStyles: {
          width: 60,
          height: 80
        },
        exportExcel: {
          "filename": "books.xls",
          "type": "xls",
          "fields": {
            "图书名称": "name",
            "作者": "author",
            "图书编号": "code",
            "出版年份": "year",
            "借阅价格": "price",
            "图书封面": "image",
            "所属分类": "category_id",
            "是否可借": "on_sale",
            "评分": "rating",
            "内容简介": "description"
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
          result = result.filter(item => 
            (item.name && item.name.toLowerCase().includes(query)) ||
            (item.author && item.author.toLowerCase().includes(query)) ||
            (item.description && item.description.toLowerCase().includes(query))
          );
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
          const data = await productsApi.getList();
          this.allData = data.map(item => ({
            ...item,
            _id: item._id || String(item.id),
            image: this.resolveImageUrl(item.image)
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
      resolveImageUrl(imagePath) {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return config.API_BASE + imagePath;
      },
      search() {
        this.currentPage = 1;
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
          content: `确定删除选中的 ${ids.length} 条图书数据吗？`,
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await productsApi.batchRemove(ids);
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
          content: '确定删除该图书吗？',
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ mask: true });
              try {
                await productsApi.remove(id);
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
