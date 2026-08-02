"use strict";
const common_vendor = require("../common/vendor.js");
const utils_coffeeStore = require("./coffee-store.js");
const USER_KEY = "currentUser";
const TOKEN_KEY = "authToken";
function getCurrentUser() {
  try {
    const user = common_vendor.index.getStorageSync(USER_KEY);
    if (user)
      return JSON.parse(user);
  } catch (e) {
  }
  return null;
}
function getToken() {
  try {
    return common_vendor.index.getStorageSync(TOKEN_KEY) || "";
  } catch (e) {
    return "";
  }
}
function isLoggedIn() {
  return !!getCurrentUser() && !!getToken();
}
function setCurrentUser(user) {
  try {
    common_vendor.index.setStorageSync(USER_KEY, JSON.stringify(user));
  } catch (e) {
  }
}
function setToken(token) {
  try {
    common_vendor.index.setStorageSync(TOKEN_KEY, token);
  } catch (e) {
  }
}
function clearUser() {
  try {
    common_vendor.index.removeStorageSync(USER_KEY);
    common_vendor.index.removeStorageSync(TOKEN_KEY);
  } catch (e) {
  }
}
async function login(username, password) {
  const res = await utils_coffeeStore.request("POST", "/api/login", { username, password });
  if (res.code === 0 && res.data) {
    setToken(res.data.token);
    const userInfo = {
      user_id: res.data.user.id,
      user_name: res.data.user.nickname || res.data.user.username,
      username: res.data.user.username,
      avatar: res.data.user.avatar || "",
      email: res.data.user.email || "",
      phone: res.data.user.phone || "",
      member_level: res.data.user.member_level || "normal"
    };
    setCurrentUser(userInfo);
    return userInfo;
  }
  throw new Error(res.message || "登录失败");
}
async function register(username, password, nickname) {
  const res = await utils_coffeeStore.request("POST", "/api/register", { username, password, nickname });
  if (res.code === 0 && res.data) {
    setToken(res.data.token);
    const userInfo = {
      user_id: res.data.user.id,
      user_name: res.data.user.nickname || res.data.user.username,
      username: res.data.user.username,
      avatar: res.data.user.avatar || "",
      email: res.data.user.email || "",
      phone: res.data.user.phone || "",
      member_level: res.data.user.member_level || "normal"
    };
    setCurrentUser(userInfo);
    return userInfo;
  }
  throw new Error(res.message || "注册失败");
}
function logout() {
  clearUser();
}
function updateUserName(name) {
  const user = getCurrentUser();
  if (user) {
    user.user_name = name;
    setCurrentUser(user);
  }
  return user;
}
exports.getCurrentUser = getCurrentUser;
exports.isLoggedIn = isLoggedIn;
exports.login = login;
exports.logout = logout;
exports.register = register;
exports.updateUserName = updateUserName;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/user.js.map
