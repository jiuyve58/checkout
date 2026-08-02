"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cart = require("../../utils/cart.js");
const utils_coffeeStore = require("../../utils/coffee-store.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  data() {
    return {
      product: {
        name: "",
        author: "",
        description: "",
        price: 14,
        image: "",
        rating: 4.8,
        code: "A-0001",
        year: "2020",
        stock: 1
      },
      selectedDuration: 14,
      durations: [
        { value: 7, label: "7天", price: 0 },
        { value: 14, label: "14天", price: 0 },
        { value: 30, label: "30天", price: 5 }
      ],
      deposit: 50,
      cartTotal: {
        totalCount: 0,
        totalPrice: 0
      },
      cartItems: [],
      showCartList: false,
      showFullDesc: false
    };
  },
  computed: {
    returnDate() {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() + this.selectedDuration);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    },
    isAvailable() {
      return (this.product.stock || 0) > 0;
    }
  },
  onLoad(options) {
    if (options && options.id) {
      this.loadDetail(decodeURIComponent(options.id));
      this.updateCartTotal();
      return;
    }
    const coffeeData = common_vendor.index.getStorageSync("currentCoffee");
    if (coffeeData) {
      this.product = {
        name: coffeeData.name || "",
        author: coffeeData.author || "未知作者",
        description: coffeeData.description || "暂无书籍简介",
        price: coffeeData.price ? (coffeeData.price / 100).toFixed(0) : 14,
        image: utils_coffeeStore.resolveImageUrl(coffeeData.image) || "https://picsum.photos/seed/book/300/400",
        rating: coffeeData.rating || 4.8,
        _id: coffeeData._id,
        code: coffeeData.code || "A-0001",
        year: coffeeData.year || "2020",
        stock: coffeeData.stock !== void 0 ? coffeeData.stock : 5
      };
    }
    this.updateCartTotal();
  },
  methods: {
    selectDuration(value) {
      this.selectedDuration = value;
    },
    onProductImageError() {
      if (this.product.image && !this.product.image.startsWith("/static/")) {
        this.product.image = "/static/book-placeholder-1.png";
        this.$forceUpdate();
      }
    },
    toggleDesc() {
      this.showFullDesc = !this.showFullDesc;
    },
    toggleCartList() {
      this.showCartList = !this.showCartList;
      if (this.showCartList) {
        this.loadCartItems();
      }
    },
    toggleBorrowList() {
      if (this.cartTotal.totalCount > 0) {
        this.showCartList = !this.showCartList;
        if (this.showCartList) {
          this.loadCartItems();
        }
      }
    },
    loadCartItems() {
      const cart = utils_cart.getCart();
      this.cartItems = cart.map((item) => ({
        ...item,
        cartId: item._id
      }));
    },
    updateCartTotal() {
      this.cartTotal = utils_cart.getCartTotal();
      this.loadCartItems();
    },
    loadDetail(id) {
      const productsObj = utils_coffeeStore.importObject("get-coffee-products");
      productsObj.getDetail(id).then((res) => {
        const item = res && res.data ? res.data : res && res._id ? res : null;
        if (item) {
          this.product = {
            _id: item._id,
            name: item.name || "",
            author: item.author || "未知作者",
            description: item.description || "暂无书籍简介",
            price: item.price ? (item.price / 100).toFixed(0) : 14,
            image: utils_coffeeStore.resolveImageUrl(item.image) || "/static/book-placeholder-1.png",
            rating: item.rating || 4.8,
            code: item.code || "A-0001",
            year: item.year || "2020",
            stock: item.stock !== void 0 ? item.stock : 5
          };
        }
      }).catch((err) => {
        common_vendor.index.__f__("warn", "at pages/coffee-product-detail/coffee-product-detail.vue:293", "获取图书详情失败，使用默认数据:", err.message);
        this.product = {
          _id: id,
          name: "未知书籍",
          author: "未知作者",
          description: "暂无书籍简介",
          price: 14,
          image: "/static/book-placeholder-1.png",
          rating: 4.8,
          code: "A-0001",
          year: "2020",
          stock: 5
        };
      });
    },
    addToBorrowList() {
      if (!this.product._id) {
        common_vendor.index.showToast({ title: "图书信息加载中", icon: "none" });
        return;
      }
      if (!this.isAvailable) {
        common_vendor.index.showToast({ title: "库存不足，无法借阅", icon: "none" });
        return;
      }
      const cart = utils_cart.getCart();
      const existingItem = cart.find((item) => item._id === this.product._id);
      if (existingItem) {
        utils_cart.updateCartItemQuantity(this.product._id, existingItem.quantity + 1);
      } else {
        utils_cart.addToCart({
          _id: this.product._id,
          name: this.product.name,
          author: this.product.author,
          code: this.product.code,
          year: this.product.year,
          price: this.product.price,
          image: this.product.image,
          borrowDays: this.selectedDuration
        }, 1);
      }
      this.updateCartTotal();
      common_vendor.index.showToast({ title: "已加入借阅列表", icon: "success" });
    },
    goBack() {
      common_vendor.index.navigateBack();
    },
    goHome() {
      common_vendor.index.navigateBack();
    },
    handleClearCart() {
      utils_cart.clearCart();
      this.updateCartTotal();
      this.showCartList = false;
      common_vendor.index.showToast({ title: "借阅列表已清空", icon: "success" });
    },
    async handleCheckout() {
      const cart = utils_cart.getCart();
      if (cart.length === 0) {
        common_vendor.index.showToast({ title: "借阅列表为空", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "处理借阅中..." });
      const user = utils_user.getCurrentUser();
      if (!user || !user.user_id) {
        common_vendor.index.hideLoading();
        common_vendor.index.showModal({ title: "提示", content: "请先登录后再借阅", showCancel: false });
        return;
      }
      const failedItems = [];
      let lastError = "";
      for (const item of cart) {
        try {
          const res = await utils_coffeeStore.borrowApi.borrow(item._id, user.user_id, user.user_name, item.borrowDays || 30);
          if (res && res.code !== 0) {
            throw new Error(res.message || "借阅失败");
          }
        } catch (err) {
          failedItems.push(item.name);
          lastError = err && err.message ? err.message : "借阅失败";
        }
      }
      common_vendor.index.hideLoading();
      if (failedItems.length === 0) {
        utils_cart.clearCart();
        this.updateCartTotal();
        common_vendor.index.showToast({ title: "借阅成功！", icon: "success" });
        setTimeout(() => {
          common_vendor.index.navigateTo({ url: "/pages/jilu/jilu" });
        }, 1e3);
      } else {
        common_vendor.index.showModal({
          title: "借阅失败",
          content: `${failedItems.join("、")} 借阅失败：${lastError}`,
          showCancel: false
        });
      }
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
    a: common_vendor.p({
      type: "back",
      size: "24",
      color: "#3D2817"
    }),
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args), "90"),
    c: common_vendor.p({
      type: "heart",
      size: "22",
      color: "#3D2817"
    }),
    d: common_vendor.p({
      type: "upload",
      size: "22",
      color: "#3D2817"
    }),
    e: $data.product.image,
    f: common_vendor.o((...args) => $options.onProductImageError && $options.onProductImageError(...args), "cc"),
    g: common_vendor.t($data.product.name),
    h: common_vendor.t($data.product.code || "A-0001"),
    i: common_vendor.t($data.product.author),
    j: common_vendor.t($data.product.year || "2020"),
    k: common_vendor.p({
      type: "star",
      size: "16",
      color: "#F5C542"
    }),
    l: common_vendor.p({
      type: "star",
      size: "16",
      color: "#F5C542"
    }),
    m: common_vendor.p({
      type: "star",
      size: "16",
      color: "#F5C542"
    }),
    n: common_vendor.p({
      type: "star",
      size: "16",
      color: "#F5C542"
    }),
    o: common_vendor.p({
      type: "starhalf",
      size: "16",
      color: "#F5C542"
    }),
    p: common_vendor.t($data.product.rating),
    q: common_vendor.t($data.product.price),
    r: common_vendor.p({
      type: $options.isAvailable ? "checkmarkempty" : "closeempty",
      size: "14",
      color: $options.isAvailable ? "#3AB080" : "#E74C3C"
    }),
    s: common_vendor.t($options.isAvailable ? "可借阅" : "已借出"),
    t: !$options.isAvailable ? 1 : "",
    v: $options.isAvailable
  }, $options.isAvailable ? {
    w: common_vendor.t($data.product.stock)
  } : {}, {
    x: !$options.isAvailable ? 1 : "",
    y: common_vendor.f($data.durations, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.label),
        b: item.price > 0
      }, item.price > 0 ? {
        c: common_vendor.t(item.price)
      } : {}, {
        d: $data.selectedDuration === item.value
      }, $data.selectedDuration === item.value ? {
        e: common_vendor.t($options.returnDate)
      } : {}, {
        f: $data.selectedDuration === item.value ? 1 : "",
        g: item.value,
        h: common_vendor.o(($event) => $options.selectDuration(item.value), item.value)
      });
    }),
    z: common_vendor.t($data.product.description),
    A: $data.showFullDesc ? 1 : "",
    B: common_vendor.t($data.showFullDesc ? "收起" : "展开更多"),
    C: common_vendor.p({
      type: $data.showFullDesc ? "up" : "down",
      size: "14",
      color: "#8B5A2B"
    }),
    D: common_vendor.o((...args) => $options.toggleDesc && $options.toggleDesc(...args), "f7"),
    E: common_vendor.p({
      type: "wallet",
      size: "20",
      color: "#8B5A2B"
    }),
    F: common_vendor.t($data.deposit),
    G: common_vendor.p({
      type: "calendar",
      size: "20",
      color: "#8B5A2B"
    }),
    H: common_vendor.t($options.returnDate),
    I: common_vendor.p({
      type: "home",
      size: "24",
      color: "#6B5B4F"
    }),
    J: common_vendor.o((...args) => $options.goHome && $options.goHome(...args), "d6"),
    K: common_vendor.p({
      type: "shoppingcart",
      size: "24",
      color: "#6B5B4F"
    }),
    L: $data.cartTotal.totalCount > 0
  }, $data.cartTotal.totalCount > 0 ? {
    M: common_vendor.t($data.cartTotal.totalCount)
  } : {}, {
    N: common_vendor.o((...args) => $options.toggleBorrowList && $options.toggleBorrowList(...args), "20"),
    O: common_vendor.p({
      type: "book",
      size: "20",
      color: "#FFFFFF"
    }),
    P: common_vendor.o((...args) => $options.addToBorrowList && $options.addToBorrowList(...args), "8d"),
    Q: $data.cartTotal.totalCount > 0
  }, $data.cartTotal.totalCount > 0 ? common_vendor.e({
    R: $data.showCartList
  }, $data.showCartList ? {
    S: common_vendor.o((...args) => $options.toggleCartList && $options.toggleCartList(...args), "1a")
  } : {}, {
    T: common_vendor.p({
      type: "book",
      size: "18",
      color: "#FFFFFF"
    }),
    U: common_vendor.t($data.cartTotal.totalCount),
    V: common_vendor.t($data.cartTotal.totalCount),
    W: common_vendor.t($data.showCartList ? "收起" : "展开"),
    X: common_vendor.p({
      type: $data.showCartList ? "up" : "down",
      size: "16",
      color: "#FFFFFF"
    }),
    Y: common_vendor.o((...args) => $options.toggleCartList && $options.toggleCartList(...args), "5e"),
    Z: $data.showCartList
  }, $data.showCartList ? {
    aa: common_vendor.f($data.cartItems, (item, k0, i0) => {
      return {
        a: item.image,
        b: common_vendor.t(item.name),
        c: common_vendor.t(item.author),
        d: common_vendor.t(item.price),
        e: common_vendor.t(item.quantity),
        f: item._id
      };
    })
  } : {}, {
    ab: common_vendor.p({
      type: "trash",
      size: "16",
      color: "#3D2817"
    }),
    ac: common_vendor.o((...args) => $options.handleClearCart && $options.handleClearCart(...args), "e7"),
    ad: common_vendor.p({
      type: "right",
      size: "16",
      color: "#FFFFFF"
    }),
    ae: common_vendor.o((...args) => $options.handleCheckout && $options.handleCheckout(...args), "87"),
    af: common_vendor.o(() => {
    }, "8d"),
    ag: $data.showCartList ? 1 : ""
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/coffee-product-detail/coffee-product-detail.js.map
