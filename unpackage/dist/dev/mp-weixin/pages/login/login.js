"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_user = require("../../utils/user.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLogin: true,
      submitting: false,
      showPwd: false,
      errorMsg: "",
      isModal: false,
      form: {
        username: "",
        nickname: "",
        password: "",
        confirmPassword: ""
      }
    };
  },
  onLoad(options) {
    if (options && options.modal === "1") {
      this.isModal = true;
    }
    if (utils_user.isLoggedIn()) {
      common_vendor.index.navigateBack();
    }
  },
  methods: {
    switchMode(loginMode) {
      this.isLogin = loginMode;
      this.errorMsg = "";
      this.form = { username: "", nickname: "", password: "", confirmPassword: "" };
    },
    async handleSubmit() {
      if (this.submitting)
        return;
      this.errorMsg = "";
      if (!this.form.username.trim()) {
        this.errorMsg = "请输入用户名";
        return;
      }
      if (!this.form.password) {
        this.errorMsg = "请输入密码";
        return;
      }
      if (!this.isLogin) {
        if (this.form.password.length < 6) {
          this.errorMsg = "密码至少6位";
          return;
        }
        if (this.form.password !== this.form.confirmPassword) {
          this.errorMsg = "两次密码不一致";
          return;
        }
      }
      this.submitting = true;
      try {
        let user;
        if (this.isLogin) {
          user = await utils_user.login(this.form.username.trim(), this.form.password);
        } else {
          user = await utils_user.register(this.form.username.trim(), this.form.password, this.form.nickname.trim());
        }
        common_vendor.index.showToast({ title: this.isLogin ? "登录成功" : "注册成功", icon: "success" });
        setTimeout(() => {
          if (this.isModal) {
            common_vendor.index.$emit("loginSuccess", user);
            common_vendor.index.navigateBack();
          } else {
            common_vendor.index.reLaunch({ url: "/pages/book-menu/book-menu" });
          }
        }, 800);
      } catch (err) {
        this.errorMsg = err.message || "操作失败";
      } finally {
        this.submitting = false;
      }
    },
    handleClose() {
      if (this.isModal) {
        common_vendor.index.navigateBack();
      } else {
        common_vendor.index.reLaunch({ url: "/pages/book-menu/book-menu" });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: common_vendor.t($data.isLogin ? "欢迎回来，请登录" : "创建账号，开启阅读之旅"),
    c: $data.isLogin ? 1 : "",
    d: common_vendor.o(($event) => $options.switchMode(true), "b7"),
    e: !$data.isLogin ? 1 : "",
    f: common_vendor.o(($event) => $options.switchMode(false), "30"),
    g: $data.form.username,
    h: common_vendor.o(($event) => $data.form.username = $event.detail.value, "ac"),
    i: !$data.isLogin
  }, !$data.isLogin ? {
    j: $data.form.nickname,
    k: common_vendor.o(($event) => $data.form.nickname = $event.detail.value, "f5")
  } : {}, {
    l: !$data.showPwd,
    m: $data.form.password,
    n: common_vendor.o(($event) => $data.form.password = $event.detail.value, "92"),
    o: common_vendor.t($data.showPwd ? "隐藏" : "显示"),
    p: common_vendor.o(($event) => $data.showPwd = !$data.showPwd, "a5"),
    q: !$data.isLogin
  }, !$data.isLogin ? {
    r: $data.form.confirmPassword,
    s: common_vendor.o(($event) => $data.form.confirmPassword = $event.detail.value, "94")
  } : {}, {
    t: $data.errorMsg
  }, $data.errorMsg ? {
    v: common_vendor.t($data.errorMsg)
  } : {}, {
    w: common_vendor.t($data.submitting ? "处理中..." : $data.isLogin ? "登 录" : "注 册"),
    x: $data.submitting ? 1 : "",
    y: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args), "c9"),
    z: $data.isLogin
  }, $data.isLogin ? {
    A: common_vendor.o(($event) => $options.switchMode(false), "70")
  } : {
    B: common_vendor.o(($event) => $options.switchMode(true), "87")
  }, {
    C: !$data.isModal
  }, !$data.isModal ? {
    D: common_vendor.o((...args) => $options.handleClose && $options.handleClose(...args), "cc")
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
