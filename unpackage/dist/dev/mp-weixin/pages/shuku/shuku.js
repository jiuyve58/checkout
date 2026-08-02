"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_coffeeStore = require("../../utils/coffee-store.js");
const utils_mockData = require("../../utils/mock-data.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      keyword: "",
      activeCategory: "",
      allBooks: [],
      categories: []
    };
  },
  computed: {
    filteredBooks() {
      let list = this.allBooks;
      if (this.activeCategory) {
        list = list.filter((b) => b.category_id === this.activeCategory);
      }
      if (this.keyword.trim()) {
        const kw = this.keyword.trim().toLowerCase();
        list = list.filter(
          (b) => b.name.toLowerCase().includes(kw) || b.author && b.author.toLowerCase().includes(kw) || b.code && b.code.toLowerCase().includes(kw)
        );
      }
      return list;
    }
  },
  onLoad() {
    this.loadCategories();
    this.loadBooks();
  },
  methods: {
    async loadCategories() {
      try {
        const res = await utils_coffeeStore.categoriesApi.getList();
        const list = res && (res.data || res);
        this.categories = Array.isArray(list) ? list : utils_mockData.getMockCategories();
      } catch (err) {
        this.categories = utils_mockData.getMockCategories();
      }
    },
    async loadBooks() {
      try {
        const res = await utils_coffeeStore.productsApi.getList();
        const list = res && (res.data || (Array.isArray(res) ? res : []));
        if (!Array.isArray(list) || list.length === 0) {
          this.useMockData();
          return;
        }
        this.allBooks = list.map((b) => ({
          ...b,
          image: utils_coffeeStore.resolveImageUrl(b.image),
          category_id: b.category_id || "1",
          on_sale: b.on_sale !== false
        }));
      } catch (err) {
        this.useMockData();
      }
    },
    useMockData() {
      this.allBooks = utils_mockData.getMockProducts().map((b) => ({
        ...b,
        image: utils_coffeeStore.resolveImageUrl(b.image),
        category_id: b.category_id || "1",
        on_sale: true
      }));
      this.categories = utils_mockData.getMockCategories();
    },
    switchCategory(cat) {
      this.activeCategory = cat;
    },
    onSearch() {
    },
    getStatusClass(book) {
      if (book.on_sale === false)
        return "tag-reserved";
      if (book._id === "p3" || book._id === "p8" || book._id === "p6")
        return "tag-borrowing";
      return "tag-available";
    },
    getStatusText(book) {
      if (book.on_sale === false)
        return "已预约";
      if (book._id === "p3" || book._id === "p8" || book._id === "p6")
        return "借阅中";
      return "可借阅";
    },
    goDetail(book) {
      common_vendor.index.navigateTo({ url: "/pages/coffee-product-detail/coffee-product-detail?id=" + book._id });
    },
    goHome() {
      common_vendor.index.reLaunch({ url: "/pages/book-menu/book-menu" });
    },
    goShelf() {
      common_vendor.index.redirectTo({ url: "/pages/shujia/shujia" });
    },
    goHistory() {
      common_vendor.index.redirectTo({ url: "/pages/jilu/jilu" });
    },
    goProfile() {
      common_vendor.index.redirectTo({ url: "/pages/wode/wode" });
    },
    onImageError(e) {
      e.target.src = "/static/book-placeholder-1.png";
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      type: "search",
      size: "16",
      color: "#8B7355"
    }),
    b: common_vendor.o((...args) => $options.onSearch && $options.onSearch(...args), "50"),
    c: $data.keyword,
    d: common_vendor.o(($event) => $data.keyword = $event.detail.value, "14"),
    e: $data.activeCategory === "" ? 1 : "",
    f: common_vendor.o(($event) => $options.switchCategory(""), "08"),
    g: $data.activeCategory === "文学小说" ? 1 : "",
    h: common_vendor.o(($event) => $options.switchCategory("文学小说"), "cb"),
    i: $data.activeCategory === "悬疑推理" ? 1 : "",
    j: common_vendor.o(($event) => $options.switchCategory("悬疑推理"), "9a"),
    k: $data.activeCategory === "童话寓言" ? 1 : "",
    l: common_vendor.o(($event) => $options.switchCategory("童话寓言"), "6b"),
    m: $data.activeCategory === "散文杂文" ? 1 : "",
    n: common_vendor.o(($event) => $options.switchCategory("散文杂文"), "1a"),
    o: $data.activeCategory === "历史传记" ? 1 : "",
    p: common_vendor.o(($event) => $options.switchCategory("历史传记"), "0e"),
    q: common_vendor.t($options.filteredBooks.length),
    r: common_vendor.f($options.filteredBooks, (book, k0, i0) => {
      return {
        a: book.image,
        b: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), book._id),
        c: common_vendor.t(book.name),
        d: common_vendor.t(book.author),
        e: common_vendor.t(book.code),
        f: common_vendor.t($options.getStatusText(book)),
        g: common_vendor.n($options.getStatusClass(book)),
        h: book._id,
        i: common_vendor.o(($event) => $options.goDetail(book), book._id)
      };
    }),
    s: common_assets._imports_1,
    t: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "e4"),
    v: common_assets._imports_2,
    w: common_assets._imports_3,
    x: common_vendor.o((...args) => $options.goShelf && $options.goShelf(...args), "3d"),
    y: common_assets._imports_4,
    z: common_vendor.o((...args) => $options.goHistory && $options.goHistory(...args), "1e"),
    A: common_assets._imports_5,
    B: common_vendor.o((...args) => $options.goProfile && $options.goProfile(...args), "1a")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/shuku/shuku.js.map
