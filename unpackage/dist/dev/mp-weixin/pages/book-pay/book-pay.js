"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cart = require("../../utils/cart.js");
const utils_coffeeStore = require("../../utils/coffee-store.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  data() {
    return {
      cartItems: [],
      subtotal: 0,
      depositPerBook: 50,
      paymentMethod: "wechat",
      currentUser: null
    };
  },
  computed: {
    totalCount() {
      return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    },
    depositTotal() {
      return this.totalCount * this.depositPerBook;
    },
    total() {
      return this.subtotal + this.depositTotal;
    },
    borrowDate() {
      const d = /* @__PURE__ */ new Date();
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    },
    returnDate() {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() + 14);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    }
  },
  onLoad() {
    if (!utils_user.isLoggedIn()) {
      common_vendor.index.showModal({
        title: "提示",
        content: "请先登录后再借阅图书",
        confirmText: "去登录",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.navigateTo({ url: "/pages/login/login" });
          } else {
            common_vendor.index.navigateBack();
          }
        }
      });
      return;
    }
    this.currentUser = utils_user.getCurrentUser();
    this.loadCart();
  },
  methods: {
    loadCart() {
      var cart = utils_cart.getCart();
      this.cartItems = cart.map((item) => ({
        ...item,
        image: utils_coffeeStore.resolveImageUrl(item.image)
      }));
      var total = utils_cart.getCartTotal();
      this.subtotal = total.totalPrice;
    },
    formatPrice(price) {
      if (!price)
        return "0";
      return price.toFixed(0);
    },
    goBack() {
      common_vendor.index.navigateBack();
    },
    selectPayment(method) {
      this.paymentMethod = method;
    },
    handleBorrow() {
      if (this.cartItems.length === 0) {
        common_vendor.index.showToast({ title: "借阅列表为空", icon: "none" });
        return;
      }
      var that = this;
      common_vendor.index.showModal({
        title: "确认借阅",
        content: "共借阅 " + this.totalCount + " 本书\n押金：￥" + this.depositTotal + "\n到期日期：" + this.returnDate,
        confirmText: "确认借阅",
        success: function(res) {
          if (res.confirm) {
            that.submitBorrow();
          }
        }
      });
    },
    onImageError(e) {
      e.target.src = "/static/book-placeholder-1.png";
    },
    async submitBorrow() {
      if (!this.currentUser || !this.currentUser.user_id) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "借阅中...", mask: true });
      try {
        for (var i = 0; i < this.cartItems.length; i++) {
          var item = this.cartItems[i];
          for (var j = 0; j < item.quantity; j++) {
            var res = await utils_coffeeStore.borrowApi.borrow(
              String(item._id),
              this.currentUser.user_id,
              this.currentUser.user_name,
              14
            );
            if (res && res.code !== 0) {
              throw new Error(res.message || "借阅失败");
            }
          }
        }
        utils_cart.clearCart();
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "借阅成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(function() {
          common_vendor.index.redirectTo({ url: "/pages/jilu/jilu" });
        }, 1500);
      } catch (err) {
        common_vendor.index.hideLoading();
        var msg = err && err.message ? err.message : "借阅失败";
        if (msg.indexOf("网络请求失败") !== -1) {
          msg = "服务器未启动，请先启动后端服务";
        }
        common_vendor.index.showModal({
          title: "借阅失败",
          content: msg,
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
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args), "72"),
    c: $data.currentUser
  }, $data.currentUser ? {
    d: common_vendor.p({
      type: "person",
      size: "26",
      color: "#FFFFFF"
    }),
    e: common_vendor.t($data.currentUser.user_name),
    f: common_vendor.t($data.currentUser.user_id),
    g: common_vendor.p({
      type: "right",
      size: "18",
      color: "#B0A89E"
    })
  } : {}, {
    h: common_vendor.t($options.totalCount),
    i: common_vendor.f($data.cartItems, (item, k0, i0) => {
      return {
        a: item.image,
        b: common_vendor.o((...args) => $options.onImageError && $options.onImageError(...args), item._id),
        c: common_vendor.t(item.name),
        d: common_vendor.t(item.author),
        e: common_vendor.t(item.price),
        f: common_vendor.t(item.quantity),
        g: item._id
      };
    }),
    j: common_vendor.p({
      type: "calendar",
      size: "18",
      color: "#8B5A2B"
    }),
    k: common_vendor.t($options.borrowDate),
    l: common_vendor.p({
      type: "clock",
      size: "18",
      color: "#FFFFFF"
    }),
    m: common_vendor.t($options.returnDate),
    n: common_vendor.p({
      type: "wallet",
      size: "18",
      color: "#8B5A2B"
    }),
    o: common_vendor.p({
      type: "book",
      size: "18",
      color: "#8B5A2B"
    }),
    p: common_vendor.t($options.totalCount),
    q: common_vendor.p({
      type: "chatbubble",
      size: "20",
      color: "#FFFFFF"
    }),
    r: $data.paymentMethod === "wechat"
  }, $data.paymentMethod === "wechat" ? {
    s: common_vendor.p({
      type: "checkmarkempty",
      size: "14",
      color: "#FFFFFF"
    })
  } : {}, {
    t: $data.paymentMethod === "wechat" ? 1 : "",
    v: $data.paymentMethod === "wechat" ? 1 : "",
    w: common_vendor.o(($event) => $options.selectPayment("wechat"), "bd"),
    x: common_vendor.p({
      type: "wallet",
      size: "20",
      color: "#FFFFFF"
    }),
    y: $data.paymentMethod === "balance"
  }, $data.paymentMethod === "balance" ? {
    z: common_vendor.p({
      type: "checkmarkempty",
      size: "14",
      color: "#FFFFFF"
    })
  } : {}, {
    A: $data.paymentMethod === "balance" ? 1 : "",
    B: $data.paymentMethod === "balance" ? 1 : "",
    C: common_vendor.o(($event) => $options.selectPayment("balance"), "2a"),
    D: common_vendor.t($options.formatPrice($data.subtotal)),
    E: common_vendor.t($options.totalCount),
    F: common_vendor.t($options.depositTotal),
    G: common_vendor.t($options.formatPrice($options.total)),
    H: common_vendor.t($options.formatPrice($options.total)),
    I: common_vendor.p({
      type: "arrowright",
      size: "18",
      color: "#FFFFFF"
    }),
    J: common_vendor.o((...args) => $options.handleBorrow && $options.handleBorrow(...args), "31")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/book-pay/book-pay.js.map
