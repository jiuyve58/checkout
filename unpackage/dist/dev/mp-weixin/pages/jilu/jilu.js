"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_coffeeStore = require("../../utils/coffee-store.js");
const utils_user = require("../../utils/user.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      records: [],
      loading: false,
      activeTab: "all",
      isLoggedIn: false
    };
  },
  computed: {
    filteredRecords() {
      if (this.activeTab === "all") {
        return this.records;
      }
      return this.records.filter((r) => r.status === this.activeTab);
    },
    groupedRecords() {
      const map = {};
      this.filteredRecords.forEach((r) => {
        const month = this.getMonth(r.borrow_date);
        if (!map[month])
          map[month] = [];
        map[month].push(r);
      });
      return Object.keys(map).map((month) => ({ month, records: map[month] }));
    }
  },
  onLoad() {
    this.loadRecords();
  },
  onShow() {
    this.loadRecords();
  },
  methods: {
    async loadRecords() {
      this.isLoggedIn = utils_user.isLoggedIn();
      if (!this.isLoggedIn) {
        this.records = [];
        return;
      }
      this.loading = true;
      try {
        const user = utils_user.getCurrentUser();
        if (!user) {
          this.records = [];
          return;
        }
        const res = await utils_coffeeStore.borrowApi.getRecords(user.user_id);
        const list = res && res.data ? res.data : Array.isArray(res) ? res : [];
        this.records = list.map((r) => ({
          ...r,
          _id: r._id || r.id,
          image: utils_coffeeStore.resolveImageUrl(r.product_image || ""),
          month: this.getMonth(r.borrow_date)
        }));
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/jilu/jilu.vue:163", "获取借阅记录失败:", err);
      }
      this.loading = false;
    },
    getMonth(dateStr) {
      if (!dateStr)
        return "";
      const d = new Date(dateStr);
      return `${d.getFullYear()}年${d.getMonth() + 1}月`;
    },
    formatDate(dateStr) {
      if (!dateStr)
        return "-";
      const d = new Date(dateStr);
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    },
    getStatusText(status) {
      const map = {
        borrowed: "借阅中",
        returned: "已归还",
        overdue: "已逾期"
      };
      return map[status] || status;
    },
    async handleReturn(item) {
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
              this.loadRecords();
            } catch (err) {
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({ title: err.message || "归还失败", icon: "none" });
            }
          }
        }
      });
    },
    loadMore() {
    },
    goHome() {
      common_vendor.index.reLaunch({ url: "/pages/book-menu/book-menu" });
    },
    goLibrary() {
      common_vendor.index.redirectTo({ url: "/pages/shuku/shuku" });
    },
    goShelf() {
      common_vendor.index.redirectTo({ url: "/pages/shujia/shujia" });
    },
    goProfile() {
      common_vendor.index.redirectTo({ url: "/pages/wode/wode" });
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
    a: common_vendor.t($data.records.length),
    b: $data.activeTab === "all" ? 1 : "",
    c: common_vendor.o(($event) => $data.activeTab = "all", "0e"),
    d: $data.activeTab === "borrowed" ? 1 : "",
    e: common_vendor.o(($event) => $data.activeTab = "borrowed", "ec"),
    f: $data.activeTab === "returned" ? 1 : "",
    g: common_vendor.o(($event) => $data.activeTab = "returned", "97"),
    h: !$data.isLoggedIn
  }, !$data.isLoggedIn ? {
    i: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args), "12")
  } : $options.filteredRecords.length === 0 && !$data.loading ? {} : {}, {
    j: $options.filteredRecords.length === 0 && !$data.loading,
    k: common_vendor.f($options.groupedRecords, (group, k0, i0) => {
      return {
        a: common_vendor.t(group.month),
        b: common_vendor.f(group.records, (item, k1, i1) => {
          return common_vendor.e({
            a: item.image,
            b: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), item._id),
            c: common_vendor.t(item.product_name),
            d: common_vendor.t($options.getStatusText(item.status)),
            e: common_vendor.n(item.status),
            f: common_vendor.t(item.product_code),
            g: common_vendor.t($options.formatDate(item.borrow_date)),
            h: common_vendor.t($options.formatDate(item.due_date)),
            i: item.status === "borrowed" || item.status === "overdue"
          }, item.status === "borrowed" || item.status === "overdue" ? {
            j: common_vendor.o(($event) => $options.handleReturn(item), item._id)
          } : item.status === "returned" ? {
            l: common_vendor.t($options.formatDate(item.return_date))
          } : {}, {
            k: item.status === "returned",
            m: item._id
          });
        }),
        c: group.month
      };
    }),
    l: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args), "61"),
    m: common_assets._imports_1,
    n: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "60"),
    o: common_assets._imports_2,
    p: common_vendor.o((...args) => $options.goLibrary && $options.goLibrary(...args), "f5"),
    q: common_assets._imports_3,
    r: common_vendor.o((...args) => $options.goShelf && $options.goShelf(...args), "37"),
    s: common_assets._imports_4,
    t: common_assets._imports_5,
    v: common_vendor.o((...args) => $options.goProfile && $options.goProfile(...args), "ee")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/jilu/jilu.js.map
