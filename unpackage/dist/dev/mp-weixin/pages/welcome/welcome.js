"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      displayBooks: [
        { image: "/static/book-placeholder-1.png" },
        { image: "/static/book-placeholder-2.png" },
        { image: "/static/book-placeholder-3.png" },
        { image: "/static/book-placeholder-4.png" },
        { image: "/static/book-placeholder-5.png" }
      ]
    };
  },
  methods: {
    getBookStyle(index) {
      const offset = index * 18;
      const rotate = (index - 2) * 3;
      return {
        transform: `translateX(${offset}px) rotate(${rotate}deg)`,
        zIndex: index
      };
    },
    enterLibrary() {
      common_vendor.index.reLaunch({ url: "/pages/book-menu/book-menu" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.displayBooks, (book, index, i0) => {
      return {
        a: book.image,
        b: index,
        c: common_vendor.s($options.getBookStyle(index))
      };
    }),
    b: common_vendor.o((...args) => $options.enterLibrary && $options.enterLibrary(...args), "fa")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/welcome/welcome.js.map
