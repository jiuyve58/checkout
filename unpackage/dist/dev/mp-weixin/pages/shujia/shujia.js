"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_user = require("../../utils/user.js");
const utils_coffeeStore = require("../../utils/coffee-store.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      borrowingList: [],
      reservedList: [],
      wishList: [],
      currentUser: null,
      isLoggedIn: false,
      stats: { total: 0, borrowing: 0, returned: 0 }
    };
  },
  onLoad() {
    this.loadData();
  },
  onShow() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.isLoggedIn = utils_user.isLoggedIn();
      if (!this.isLoggedIn) {
        this.borrowingList = [];
        this.stats = { total: 0, borrowing: 0, returned: 0 };
        return;
      }
      this.currentUser = utils_user.getCurrentUser();
      try {
        const res = await utils_coffeeStore.borrowApi.getRecords(this.currentUser.user_id);
        const list = res && res.data ? res.data : Array.isArray(res) ? res : [];
        this.borrowingList = list.filter((r) => r.status === "borrowed" || r.status === "overdue").map((r) => ({
          ...r,
          _id: r._id || r.id,
          name: r.product_name,
          author: r.product_author || "",
          image: utils_coffeeStore.resolveImageUrl(r.product_image || ""),
          days_left: this.calcDaysLeft(r.due_date),
          borrow_date: this.formatDate(r.borrow_date),
          due_date: this.formatDate(r.due_date)
        }));
        this.stats = {
          total: list.length,
          borrowing: list.filter((r) => r.status === "borrowed" || r.status === "overdue").length,
          returned: list.filter((r) => r.status === "returned").length
        };
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/shujia/shujia.vue:171", "加载书架数据失败", err);
      }
      this.wishList = [
        { name: "挪威的森林", image: "/static/book-placeholder-1.png" },
        { name: "百年孤独", image: "/static/book-placeholder-2.png" },
        { name: "白夜行", image: "/static/book-placeholder-3.png" },
        { name: "小王子", image: "/static/book-placeholder-4.png" }
      ];
    },
    formatDate(dateStr) {
      if (!dateStr)
        return "";
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    },
    calcDaysLeft(dueDate) {
      if (!dueDate)
        return 0;
      const due = new Date(dueDate);
      const now = /* @__PURE__ */ new Date();
      const diff = Math.ceil((due - now) / (1e3 * 60 * 60 * 24));
      return diff;
    },
    handleReturn(item) {
      common_vendor.index.showModal({
        title: "确认归还",
        content: `确认归还《${item.name}》？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_coffeeStore.borrowApi.returnBook(item._id);
              common_vendor.index.showToast({ title: "归还成功", icon: "success" });
              this.loadData();
            } catch (err) {
              common_vendor.index.showToast({ title: err.message || "归还失败", icon: "none" });
            }
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
    goHistory() {
      common_vendor.index.redirectTo({ url: "/pages/jilu/jilu" });
    },
    goProfile() {
      if (!utils_user.isLoggedIn()) {
        common_vendor.index.navigateTo({ url: "/pages/login/login" });
      } else {
        common_vendor.index.redirectTo({ url: "/pages/wode/wode" });
      }
    },
    goLogin() {
      common_vendor.index.navigateTo({ url: "/pages/login/login" });
    },
    onImageError(e) {
      e.target.src = "/static/book-placeholder-1.png";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.currentUser ? $data.currentUser.user_name : "未登录"),
    b: common_vendor.t($data.stats.total),
    c: common_vendor.t($data.stats.borrowing),
    d: common_vendor.t($data.stats.returned),
    e: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    f: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "d4")
  } : {}, {
    g: $data.isLoggedIn && $data.borrowingList.length > 0
  }, $data.isLoggedIn && $data.borrowingList.length > 0 ? {
    h: common_vendor.f($data.borrowingList, (item, k0, i0) => {
      return {
        a: item.image,
        b: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), item._id),
        c: common_vendor.t(item.name),
        d: common_vendor.t(item.author),
        e: common_vendor.t(item.borrow_date),
        f: common_vendor.t(item.days_left >= 0 ? item.days_left + " 天后到期" : "已逾期"),
        g: common_vendor.t(item.due_date),
        h: common_vendor.o(($event) => $options.handleReturn(item), item._id),
        i: item._id
      };
    })
  } : {}, {
    i: $data.reservedList.length > 0
  }, $data.reservedList.length > 0 ? {
    j: common_vendor.f($data.reservedList, (item, k0, i0) => {
      return {
        a: item.image,
        b: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), item._id),
        c: common_vendor.t(item.name),
        d: common_vendor.t(item.author),
        e: item._id
      };
    })
  } : {}, {
    k: common_vendor.f($data.wishList, (book, index, i0) => {
      return {
        a: book.image,
        b: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), index),
        c: common_vendor.t(book.name),
        d: index
      };
    }),
    l: common_assets._imports_1,
    m: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "53"),
    n: common_assets._imports_2,
    o: common_vendor.o((...args) => $options.goLibrary && $options.goLibrary(...args), "ad"),
    p: common_assets._imports_3,
    q: common_assets._imports_4,
    r: common_vendor.o((...args) => $options.goHistory && $options.goHistory(...args), "b4"),
    s: common_assets._imports_5,
    t: common_vendor.o((...args) => $options.goProfile && $options.goProfile(...args), "7a")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/shujia/shujia.js.map
