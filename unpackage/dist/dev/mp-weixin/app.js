"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const config_index = require("./config/index.js");
if (!Math) {
  "./pages/welcome/welcome.js";
  "./pages/book-menu/book-menu.js";
  "./pages/login/login.js";
  "./pages/coffee-product-detail/coffee-product-detail.js";
  "./pages/book-pay/book-pay.js";
  "./pages/shuku/shuku.js";
  "./pages/shujia/shujia.js";
  "./pages/jilu/jilu.js";
  "./pages/wode/wode.js";
}
const _sfc_main = {
  globalData: {
    searchText: ""
  },
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:8", "App Launch");
    if (common_vendor.wx$1.cloud) {
      common_vendor.wx$1.cloud.init({
        env: config_index.config.CLOUD_ENV,
        traceUser: true
      });
    }
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:19", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:22", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
