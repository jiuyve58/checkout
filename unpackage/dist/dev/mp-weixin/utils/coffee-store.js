"use strict";
const common_vendor = require("../common/vendor.js");
const config_index = require("../config/index.js");
const API_BASE = config_index.config.API_BASE;
function resolveImageUrl(imagePath) {
  if (!imagePath)
    return "";
  if (imagePath.startsWith("http")) {
    try {
      const urlObj = new URL(imagePath);
      if (urlObj.hostname.includes("images.unsplash.com")) {
        return imagePath;
      }
      return imagePath;
    } catch (e) {
      return imagePath;
    }
  }
  if (imagePath.startsWith("data:"))
    return imagePath;
  if (imagePath.startsWith("/static/covers/")) {
    return API_BASE + imagePath;
  }
  if (imagePath.startsWith("/static/")) {
    return imagePath;
  }
  if (imagePath.startsWith("static/")) {
    return "/" + imagePath;
  }
  if (imagePath.startsWith("/uploads/")) {
    return API_BASE + imagePath;
  }
  return API_BASE + imagePath;
}
function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const handleSuccess = (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(res.data);
      } else {
        const msg = res.data && res.data.message ? res.data.message : "请求失败: " + res.statusCode;
        reject(new Error(msg));
      }
    };
    const handleFail = (err) => {
      common_vendor.index.__f__("error", "at utils/coffee-store.js:51", "请求失败:", err);
      const code = err && (err.errCode || err.errno);
      const detail = err && (err.errMsg || err.message);
      const message = [code, detail].filter(Boolean).join(" ");
      reject(new Error(message || "网络请求失败，请检查云托管服务是否正常"));
    };
    const httpFallback = (reason) => {
      common_vendor.index.__f__("warn", "at utils/coffee-store.js:59", "callContainer降级HTTP:", reason || "");
      common_vendor.index.request({
        url: API_BASE + path,
        method,
        data,
        timeout: 3e4,
        header: { "Content-Type": "application/json" },
        success: handleSuccess,
        fail: handleFail
      });
    };
    if (common_vendor.wx$1.cloud && common_vendor.wx$1.cloud.callContainer) {
      common_vendor.wx$1.cloud.callContainer({
        config: {
          env: config_index.config.CLOUD_ENV
        },
        path,
        method,
        data,
        header: {
          "X-WX-SERVICE": config_index.config.CLOUD_SERVICE,
          "Content-Type": "application/json"
        },
        success: handleSuccess,
        fail: (err) => {
          const code = err && (err.errCode || err.errno);
          if (code === 102002 || /超时|timeout/i.test(err && err.errMsg || "")) {
            httpFallback("请求超时");
          } else {
            handleFail(err);
          }
        }
      });
      return;
    }
    httpFallback("不支持callContainer");
  });
}
const categoriesApi = {
  getList() {
    return request("GET", "/api/categories");
  },
  create(item) {
    return request("POST", "/api/categories", item);
  },
  update(id, item) {
    return request("PUT", `/api/categories/${id}`, item);
  },
  remove(id) {
    return request("DELETE", `/api/categories/${id}`);
  },
  batchRemove(ids) {
    return request("POST", "/api/categories/batch-delete", { ids });
  }
};
const productsApi = {
  getList(categoryId = "") {
    const param = categoryId ? `?category_id=${categoryId}` : "";
    return request("GET", `/api/products${param}`);
  },
  getDetail(id) {
    return request("GET", `/api/products/${id}`);
  },
  create(item) {
    return request("POST", "/api/products", item);
  },
  update(id, item) {
    return request("PUT", `/api/products/${id}`, item);
  },
  remove(id) {
    return request("DELETE", `/api/products/${id}`);
  },
  batchRemove(ids) {
    return request("POST", "/api/products/batch-delete", { ids });
  }
};
function importObject(name) {
  switch (name) {
    case "get-coffee-categories":
      return categoriesApi;
    case "get-coffee-products":
      return productsApi;
    default:
      return null;
  }
}
const borrowApi = {
  borrow(product_id, user_id, user_name, days = 30) {
    return request("POST", "/api/borrow", { product_id, user_id, user_name, days });
  },
  returnBook(record_id) {
    return request("POST", "/api/return", { record_id });
  },
  getRecords(user_id = "", status = "") {
    var parts = [];
    if (user_id)
      parts.push("user_id=" + encodeURIComponent(user_id));
    if (status)
      parts.push("status=" + encodeURIComponent(status));
    var query = parts.length > 0 ? "?" + parts.join("&") : "";
    return request("GET", "/api/borrow-records" + query);
  }
};
exports.borrowApi = borrowApi;
exports.categoriesApi = categoriesApi;
exports.importObject = importObject;
exports.productsApi = productsApi;
exports.request = request;
exports.resolveImageUrl = resolveImageUrl;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/coffee-store.js.map
