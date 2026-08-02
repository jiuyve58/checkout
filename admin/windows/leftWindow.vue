<template>
  <scroll-view class="sidebar" scroll-y="true">
    <view class="menu-list">
      <view
        v-for="item in menuList"
        :key="item.menu_id"
        class="menu-group"
      >
        <view
          class="menu-item"
          :class="{ active: isActive(item) }"
          @click="toggleItem(item)"
        >
          <view class="menu-icon-wrap">
            <view class="icon-dot"></view>
          </view>
          <text class="menu-text">{{ item.text }}</text>
          <text class="expand-arrow" v-if="item.children">{{ item.expanded ? '−' : '+' }}</text>
        </view>
        <view class="sub-menu" v-if="item.children && item.expanded">
          <view
            v-for="child in item.children"
            :key="child.menu_id"
            class="menu-item sub-item"
            :class="{ active: isActive(child) }"
            @click="select(child)"
          >
            <view class="menu-icon-wrap">
              <view class="icon-dot small"></view>
            </view>
            <text class="menu-text">{{ child.text }}</text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script>
  import config from '@/config/index.js';
  export default {
    data() {
      return {
        menuList: [],
        currentMenu: '/',
      };
    },
    created() {
      this.loadMenuList();
    },
    methods: {
      loadMenuList() {
        uni.request({
          url: config.API_BASE + '/api/menus',
          method: 'GET',
          success: (res) => {
            if (res.statusCode === 200 && res.data && res.data.code === 0) {
              this.menuList = (res.data.data || []).map(item => ({ ...item, expanded: true }));
            }
          },
          fail: () => {
            console.error('加载菜单失败');
          }
        });
      },
      isActive(item) {
        return item.value && this.currentMenu && item.value === this.currentMenu;
      },
      toggleItem(item) {
        if (item.children) {
          item.expanded = !item.expanded;
        } else if (item.value) {
          this.select(item);
        }
      },
      select(item) {
        let url = item.value;
        if (!url) return;
        this.currentMenu = url;
        if (url.indexOf('http') === 0) {
          return window.open(url);
        }
        if (url[0] !== '/') {
          url = '/' + url;
        }
        uni.redirectTo({
          url: url,
          fail: () => {
            uni.showModal({
              title: '提示',
              content: '页面 ' + url + ' 跳转失败',
              showCancel: false,
            });
          },
        });
      },
    },
  };
</script>

<style lang="scss">
  .sidebar {
    position: fixed;
    width: 240px;
    height: calc(100vh - var(--top-window-height));
    box-sizing: border-box;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    background-color: #1e1e1e;
    padding: 10px 0;
  }
  .menu-list {
    padding: 0;
  }
  .menu-group {
    margin-bottom: 4px;
  }
  .menu-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;
  }
  .menu-item:hover {
    background-color: rgba(255, 255, 255, 0.06);
  }
  .menu-item.active {
    background-color: rgba(64, 158, 255, 0.15);
  }
  .menu-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background-color: #409eff;
    border-radius: 0 2px 2px 0;
  }
  .menu-icon-wrap {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
  }
  .icon-dot {
    width: 8px;
    height: 8px;
    background-color: #555;
    border-radius: 2px;
    transition: all 0.2s;
  }
  .icon-dot.small {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .menu-item.active .icon-dot {
    background-color: #409eff;
    transform: rotate(45deg);
    width: 10px;
    height: 10px;
  }
  .menu-text {
    flex: 1;
    font-size: 14px;
    color: #ccc;
  }
  .menu-item.active .menu-text {
    color: #409eff;
    font-weight: 500;
  }
  .expand-arrow {
    margin-left: 8px;
    font-size: 14px;
    color: #666;
    font-weight: 300;
  }
  .sub-menu {
    background-color: rgba(0, 0, 0, 0.2);
  }
  .sub-item {
    padding-left: 48px;
    padding-top: 10px;
    padding-bottom: 10px;
  }
</style>