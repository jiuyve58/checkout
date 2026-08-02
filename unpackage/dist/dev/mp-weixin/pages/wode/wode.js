"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_coffeeStore = require("../../utils/coffee-store.js");
const utils_user = require("../../utils/user.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLoggedIn: false,
      user: { user_id: "", user_name: "" },
      stats: { total: 0, active: 0, returned: 0, overdue: 0 },
      currentBorrows: [],
      serviceItems: [
        { key: "history", name: "借阅记录", icon: "◷", badge: "" },
        { key: "wishlist", name: "心愿书单", icon: "♡", badge: "" }
      ]
    };
  },
  onLoad() {
    this.loadUser();
  },
  onShow() {
    this.loadUser();
    if (this.isLoggedIn) {
      this.loadBorrowStats();
    }
  },
  methods: {
    loadUser() {
      this.isLoggedIn = utils_user.isLoggedIn();
      if (this.isLoggedIn) {
        this.user = utils_user.getCurrentUser();
      } else {
        this.user = { user_id: "", user_name: "" };
        this.stats = { total: 0, active: 0, returned: 0, overdue: 0 };
        this.currentBorrows = [];
      }
    },
    async loadBorrowStats() {
      try {
        const user = utils_user.getCurrentUser();
        if (!user)
          return;
        const res = await utils_coffeeStore.borrowApi.getRecords(user.user_id);
        const all = res && res.data ? res.data : Array.isArray(res) ? res : [];
        this.stats = {
          total: all.length,
          active: all.filter((r) => r.status === "borrowed").length,
          returned: all.filter((r) => r.status === "returned").length,
          overdue: all.filter((r) => r.status === "overdue").length
        };
        this.currentBorrows = all.filter((r) => r.status === "borrowed" || r.status === "overdue").map((r) => ({
          ...r,
          _id: r._id || r.id,
          image: utils_coffeeStore.resolveImageUrl(r.product_image || "")
        }));
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/wode/wode.vue:228", "获取借阅统计失败:", err);
      }
    },
    formatDate(dateStr) {
      if (!dateStr)
        return "-";
      const d = new Date(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    },
    handleReturn(item) {
      common_vendor.index.showModal({
        title: "确认归还",
        content: `确认归还《${item.product_name}》？`,
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "归还中..." });
            try {
              await utils_coffeeStore.borrowApi.returnBook(item._id);
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({ title: "归还成功", icon: "success" });
              this.loadBorrowStats();
            } catch (err) {
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({ title: err.message || "归还失败", icon: "none" });
            }
          }
        }
      });
    },
    goService(key) {
      if (key === "history") {
        common_vendor.index.navigateTo({ url: "/pages/jilu/jilu" });
      } else if (key === "wishlist") {
        common_vendor.index.showToast({ title: "心愿书单", icon: "none" });
      }
    },
    goProfileEdit() {
      common_vendor.index.showModal({
        title: "修改昵称",
        editable: true,
        placeholderText: "请输入新昵称",
        success: (res) => {
          if (res.confirm && res.content) {
            this.user = utils_user.updateUserName(res.content);
            common_vendor.index.showToast({ title: "修改成功", icon: "success" });
          }
        }
      });
    },
    goLogin() {
      common_vendor.index.navigateTo({ url: "/pages/login/login" });
    },
    handleLogout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            utils_user.logout();
            this.loadUser();
            common_vendor.index.showToast({ title: "已退出登录", icon: "success" });
          }
        }
      });
    },
    goHome() {
      common_vendor.index.reLaunch({ url: "/pages/book-menu/book-menu" });
    },
    goLibrary() {
      common_vendor.index.redirectTo({ url: "/pages/shuku/shuku" });
    },
    goShelf() {
      if (!this.isLoggedIn) {
        common_vendor.index.showModal({
          title: "提示",
          content: "请先登录后查看书架",
          confirmText: "去登录",
          success: (res) => {
            if (res.confirm)
              this.goLogin();
          }
        });
        return;
      }
      common_vendor.index.redirectTo({ url: "/pages/shujia/shujia" });
    },
    goHistory() {
      if (!this.isLoggedIn) {
        common_vendor.index.showModal({
          title: "提示",
          content: "请先登录后查看借阅记录",
          confirmText: "去登录",
          success: (res) => {
            if (res.confirm)
              this.goLogin();
          }
        });
        return;
      }
      common_vendor.index.redirectTo({ url: "/pages/jilu/jilu" });
    },
    onImageError(e) {
      e.target.src = "/static/book-placeholder-1.png";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    b: common_assets._imports_0$1,
    c: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "49")
  } : {
    d: $data.user.avatar || "/static/avatar-placeholder.png",
    e: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), "f1"),
    f: common_vendor.t($data.user.user_name),
    g: common_vendor.t($data.user.user_id),
    h: common_vendor.t($data.user.member_level === "vip" ? "VIP会员" : "普通会员")
  }, {
    i: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    j: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "a6")
  } : common_vendor.e({
    k: common_vendor.t($data.stats.total),
    l: common_vendor.t($data.stats.active),
    m: common_vendor.t($data.stats.returned),
    n: common_vendor.t($data.stats.overdue),
    o: $data.currentBorrows.length > 0
  }, $data.currentBorrows.length > 0 ? {
    p: common_vendor.t($data.currentBorrows.length),
    q: common_vendor.f($data.currentBorrows, (item, k0, i0) => {
      return {
        a: item.image,
        b: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), item._id),
        c: common_vendor.t(item.product_name),
        d: common_vendor.t($options.formatDate(item.due_date)),
        e: common_vendor.o(($event) => $options.handleReturn(item), item._id),
        f: item._id
      };
    })
  } : {
    r: common_vendor.o((...args) => $options.goLibrary && $options.goLibrary(...args), "e4")
  }, {
    s: common_vendor.f($data.serviceItems, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.icon),
        b: common_vendor.t(item.name),
        c: item.badge
      }, item.badge ? {
        d: common_vendor.t(item.badge)
      } : {}, {
        e: item.key,
        f: common_vendor.o(($event) => $options.goService(item.key), item.key)
      });
    }),
    t: common_vendor.o((...args) => $options.goProfileEdit && $options.goProfileEdit(...args), "3c"),
    v: common_vendor.o((...args) => $options.handleLogout && $options.handleLogout(...args), "e9")
  }), {
    w: common_assets._imports_1,
    x: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "82"),
    y: common_assets._imports_2,
    z: common_vendor.o((...args) => $options.goLibrary && $options.goLibrary(...args), "d8"),
    A: common_assets._imports_3,
    B: common_vendor.o((...args) => $options.goShelf && $options.goShelf(...args), "22"),
    C: common_assets._imports_4,
    D: common_vendor.o((...args) => $options.goHistory && $options.goHistory(...args), "e9"),
    E: common_assets._imports_5
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/wode/wode.js.map
