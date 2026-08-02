"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cart = require("../../utils/cart.js");
const utils_coffeeStore = require("../../utils/coffee-store.js");
const utils_user = require("../../utils/user.js");
const utils_mockData = require("../../utils/mock-data.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      selectedCategory: "",
      categories: [],
      coffeeList: [],
      searchKeyword: "",
      cartTotal: { totalCount: 0, totalPrice: 0 },
      cartItems: [],
      showCartList: false,
      currentNav: "home",
      currentDate: "",
      currentUser: null
    };
  },
  computed: {
    featuredBook() {
      return this.coffeeList.length > 0 ? this.coffeeList[0] : null;
    },
    hotBooks() {
      return this.coffeeList.slice(1, 5).map((book, i) => ({
        ...book,
        image: book.image || "/static/book-placeholder-" + (i + 1) + ".png"
      }));
    },
    newBooks() {
      return this.coffeeList.slice(0, 6).map((book, i) => ({
        ...book,
        code: book.code || "BK-" + String(i + 1).padStart(4, "0"),
        year: book.year || 2020,
        image: book.image || "/static/book-placeholder-" + (i + 1) + ".png"
      }));
    }
  },
  onLoad() {
    this.initDate();
    this.loadCategories();
    this.loadProducts();
    this.loadCurrentUser();
  },
  onShow() {
    this.updateCartTotal();
    this.loadCurrentUser();
  },
  methods: {
    initDate() {
      const now = /* @__PURE__ */ new Date();
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      this.currentDate = `${days[now.getDay()]} · ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    },
    toggleCartList() {
      this.showCartList = !this.showCartList;
      if (this.showCartList)
        this.loadCartItems();
    },
    toggleBorrowList() {
      if (!utils_user.isLoggedIn()) {
        common_vendor.index.showModal({
          title: "提示",
          content: "请先登录后查看书架",
          confirmText: "去登录",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.navigateTo({ url: "/pages/login/login" });
            }
          }
        });
        return;
      }
      common_vendor.index.redirectTo({ url: "/pages/shujia/shujia" });
    },
    switchNav(nav) {
      if (nav === "library") {
        common_vendor.index.redirectTo({ url: "/pages/shuku/shuku" });
      } else if (nav === "history") {
        if (!utils_user.isLoggedIn()) {
          common_vendor.index.showModal({
            title: "提示",
            content: "请先登录后查看借阅记录",
            confirmText: "去登录",
            success: (res) => {
              if (res.confirm)
                common_vendor.index.navigateTo({ url: "/pages/login/login" });
            }
          });
          return;
        }
        common_vendor.index.redirectTo({ url: "/pages/jilu/jilu" });
      } else if (nav === "profile") {
        if (!utils_user.isLoggedIn()) {
          common_vendor.index.navigateTo({ url: "/pages/login/login" });
        } else {
          common_vendor.index.redirectTo({ url: "/pages/wode/wode" });
        }
      }
    },
    loadCartItems() {
      this.cartItems = utils_cart.getCart();
    },
    updateCartTotal() {
      this.cartTotal = utils_cart.getCartTotal();
      this.loadCartItems();
    },
    loadCategories() {
      const coffeeCategoriesObj = utils_coffeeStore.importObject("get-coffee-categories");
      coffeeCategoriesObj.getList().then((res) => {
        const list = res && res.data ? res.data : Array.isArray(res) ? res : null;
        if (list && list.length > 0) {
          this.categories = list;
          this.selectedCategory = list[0]._id;
        } else {
          this.categories = utils_mockData.getMockCategories();
          this.selectedCategory = this.categories[0]._id;
        }
      }).catch((err) => {
        common_vendor.index.__f__("warn", "at pages/book-menu/book-menu.vue:323", "分类数据加载失败，使用mock数据:", err.message);
        this.categories = utils_mockData.getMockCategories();
        this.selectedCategory = this.categories[0]._id;
      });
    },
    loadProducts(categoryId = "") {
      const coffeeProductsObj = utils_coffeeStore.importObject("get-coffee-products");
      coffeeProductsObj.getList(categoryId).then((res) => {
        const list = res && res.data ? res.data : Array.isArray(res) ? res : null;
        if (list && list.length > 0) {
          this.coffeeList = this.formatProducts(list);
        } else {
          this.coffeeList = this.formatProducts(utils_mockData.getMockProducts(categoryId));
        }
      }).catch((err) => {
        common_vendor.index.__f__("warn", "at pages/book-menu/book-menu.vue:338", "商品数据加载失败，使用mock数据:", err.message);
        this.coffeeList = this.formatProducts(utils_mockData.getMockProducts(categoryId));
      });
    },
    formatProducts(list) {
      return list.map((item) => ({
        _id: item._id,
        name: item.name,
        author: item.author || "未知作者",
        code: item.code || "",
        year: item.year || null,
        description: item.description || "",
        price: item.price ? (item.price / 100).toFixed(0) : 14,
        image: utils_coffeeStore.resolveImageUrl(item.image),
        rating: item.rating || 4.8
      }));
    },
    onImageError(e, book, index) {
      if (!book)
        return;
      const idx = typeof index === "number" ? index : 0;
      const fallback = "/static/book-placeholder-" + (idx % 4 + 1) + ".png";
      if (book.image !== fallback) {
        book.image = fallback;
        this.$forceUpdate();
      }
    },
    doSearch() {
      const keyword = this.searchKeyword.trim().toLowerCase();
      if (!keyword) {
        this.loadProducts(this.selectedCategory);
        return;
      }
      const coffeeProductsObj = utils_coffeeStore.importObject("get-coffee-products");
      coffeeProductsObj.getList(this.selectedCategory).then((res) => {
        const list = res && res.data ? res.data : Array.isArray(res) ? res : utils_mockData.getMockProducts(this.selectedCategory);
        const filtered = list.filter(
          (item) => (item.name || "").toLowerCase().includes(keyword) || (item.author || "").toLowerCase().includes(keyword)
        );
        this.coffeeList = this.formatProducts(filtered);
      }).catch(() => {
        const list = utils_mockData.getMockProducts(this.selectedCategory);
        const filtered = list.filter(
          (item) => (item.name || "").toLowerCase().includes(keyword) || (item.author || "").toLowerCase().includes(keyword)
        );
        this.coffeeList = this.formatProducts(filtered);
      });
    },
    clearSearch() {
      this.searchKeyword = "";
      this.loadProducts(this.selectedCategory);
    },
    decreaseQty(item) {
      if (item.quantity > 1) {
        utils_cart.updateCartItemQuantity(item._id, item.quantity - 1);
      } else {
        utils_cart.removeFromCart(item._id);
      }
      this.updateCartTotal();
    },
    increaseQty(item) {
      utils_cart.updateCartItemQuantity(item._id, item.quantity + 1);
      this.updateCartTotal();
    },
    goDetail(book) {
      common_vendor.index.setStorageSync("currentCoffee", {
        _id: book._id,
        name: book.name,
        author: book.author,
        code: book.code,
        year: book.year,
        description: book.description,
        price: book.price,
        image: book.image,
        rating: book.rating,
        stock: book.stock
      });
      common_vendor.index.navigateTo({ url: "/pages/coffee-product-detail/coffee-product-detail?id=" + book._id });
    },
    loadCurrentUser() {
      this.currentUser = utils_user.isLoggedIn() ? utils_user.getCurrentUser() : null;
    },
    goProfile() {
      if (!utils_user.isLoggedIn()) {
        common_vendor.index.navigateTo({ url: "/pages/login/login" });
      } else {
        common_vendor.index.redirectTo({ url: "/pages/wode/wode" });
      }
    },
    handleClearCart() {
      utils_cart.clearCart();
      this.updateCartTotal();
      this.showCartList = false;
      common_vendor.index.showToast({ title: "借阅列表已清空", icon: "success" });
    },
    handleCheckout() {
      const cart = utils_cart.getCart();
      if (cart.length === 0) {
        common_vendor.index.showToast({ title: "借阅列表为空", icon: "none" });
        return;
      }
      common_vendor.index.navigateTo({ url: "/pages/book-pay/book-pay" });
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
  return common_vendor.e({
    a: common_vendor.t($data.currentDate),
    b: $data.currentUser && $data.currentUser.avatar ? $data.currentUser.avatar : "/static/avatar-placeholder.png",
    c: common_vendor.o((...args) => $options.goProfile && $options.goProfile(...args), "ff"),
    d: common_vendor.t($data.currentUser ? $data.currentUser.user_name + "，" : ""),
    e: common_vendor.p({
      type: "search",
      size: "18",
      color: "#999"
    }),
    f: common_vendor.o((...args) => $options.doSearch && $options.doSearch(...args), "e4"),
    g: $data.searchKeyword,
    h: common_vendor.o(($event) => $data.searchKeyword = $event.detail.value, "9c"),
    i: $options.featuredBook
  }, $options.featuredBook ? {
    j: $options.featuredBook.image,
    k: common_vendor.o(($event) => $options.onImageError($event, $options.featuredBook), "17"),
    l: common_vendor.t($options.featuredBook.name),
    m: common_vendor.t($options.featuredBook.code || "B-8571"),
    n: common_vendor.t($options.featuredBook.author),
    o: common_vendor.t($options.featuredBook.description),
    p: common_vendor.t($options.featuredBook.rating),
    q: common_vendor.o(($event) => $options.goDetail($options.featuredBook), "2d")
  } : {}, {
    r: common_vendor.f($options.hotBooks, (book, index, i0) => {
      return {
        a: book.image,
        b: common_vendor.o(($event) => $options.onImageError($event, book, index), index),
        c: common_vendor.t(book.name),
        d: index,
        e: common_vendor.o(($event) => $options.goDetail(book), index)
      };
    }),
    s: common_vendor.f($options.newBooks, (book, index, i0) => {
      return {
        a: book.image,
        b: common_vendor.o(($event) => $options.onImageError($event, book, index), index),
        c: common_vendor.t(book.name),
        d: common_vendor.t(book.code),
        e: common_vendor.t(book.author),
        f: common_vendor.t(book.year),
        g: index,
        h: common_vendor.o(($event) => $options.goDetail(book), index)
      };
    }),
    t: common_assets._imports_1,
    v: common_assets._imports_2,
    w: common_vendor.o(($event) => $options.switchNav("library"), "0a"),
    x: common_assets._imports_3,
    y: $data.cartTotal.totalCount > 0
  }, $data.cartTotal.totalCount > 0 ? {
    z: common_vendor.t($data.cartTotal.totalCount > 9 ? "9+" : $data.cartTotal.totalCount)
  } : {}, {
    A: common_vendor.o((...args) => $options.toggleBorrowList && $options.toggleBorrowList(...args), "f1"),
    B: common_assets._imports_4,
    C: common_vendor.o(($event) => $options.switchNav("history"), "05"),
    D: common_assets._imports_5,
    E: common_vendor.o(($event) => $options.switchNav("profile"), "4f"),
    F: $data.cartTotal.totalCount > 0
  }, $data.cartTotal.totalCount > 0 ? common_vendor.e({
    G: $data.showCartList
  }, $data.showCartList ? {
    H: common_vendor.o((...args) => $options.toggleCartList && $options.toggleCartList(...args), "4d")
  } : {}, {
    I: common_vendor.p({
      type: "book",
      size: "18",
      color: "#FFFFFF"
    }),
    J: common_vendor.t($data.cartTotal.totalCount),
    K: common_vendor.t($data.showCartList ? "收起" : "展开"),
    L: common_vendor.p({
      type: $data.showCartList ? "up" : "down",
      size: "14",
      color: "#FFFFFF"
    }),
    M: common_vendor.o((...args) => $options.toggleCartList && $options.toggleCartList(...args), "57"),
    N: $data.showCartList
  }, $data.showCartList ? {
    O: common_vendor.f($data.cartItems, (item, k0, i0) => {
      return {
        a: item.image,
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.author),
        d: common_vendor.t(item.price),
        e: "fedc50a4-3-" + i0,
        f: common_vendor.o(($event) => $options.decreaseQty(item), item._id),
        g: common_vendor.t(item.quantity),
        h: "fedc50a4-4-" + i0,
        i: common_vendor.o(($event) => $options.increaseQty(item), item._id),
        j: item._id
      };
    }),
    P: common_vendor.p({
      type: "minus",
      size: "12",
      color: "#3D2817"
    }),
    Q: common_vendor.p({
      type: "plus",
      size: "12",
      color: "#3D2817"
    })
  } : {}, {
    R: common_vendor.p({
      type: "trash",
      size: "14",
      color: "#3D2817"
    }),
    S: common_vendor.o((...args) => $options.handleClearCart && $options.handleClearCart(...args), "e1"),
    T: common_vendor.p({
      type: "right",
      size: "14",
      color: "#FFFFFF"
    }),
    U: common_vendor.o((...args) => $options.handleCheckout && $options.handleCheckout(...args), "45"),
    V: common_vendor.o(() => {
    }, "13"),
    W: $data.showCartList ? 1 : ""
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/book-menu/book-menu.js.map
