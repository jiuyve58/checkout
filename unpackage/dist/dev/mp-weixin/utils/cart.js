"use strict";
const common_vendor = require("../common/vendor.js");
const BORROW_KEY = "borrowList";
function getCart() {
  return common_vendor.index.getStorageSync(BORROW_KEY) || [];
}
function setCart(cart) {
  common_vendor.index.setStorageSync(BORROW_KEY, cart);
}
function addToCart(book, quantity = 1) {
  const cart = getCart();
  const existingIndex = cart.findIndex((item) => item._id === book._id);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
    if (book.borrowDays) {
      cart[existingIndex].borrowDays = book.borrowDays;
    }
  } else {
    cart.push({
      _id: book._id,
      name: book.name,
      author: book.author || "",
      code: book.code || "",
      year: book.year || null,
      image: book.image,
      price: book.price || 14,
      borrowDays: book.borrowDays || 14,
      quantity
    });
  }
  setCart(cart);
  return cart;
}
function updateCartItem(productId, field, value) {
  const cart = getCart();
  const index = cart.findIndex((item) => item._id === productId);
  if (index > -1) {
    if (field === "quantity" && value <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index][field] = value;
    }
    setCart(cart);
  }
  return cart;
}
function updateCartItemQuantity(productId, quantity) {
  return updateCartItem(productId, "quantity", quantity);
}
function clearCart() {
  setCart([]);
  return [];
}
function getCartTotal() {
  const cart = getCart();
  let totalCount = 0;
  let totalPrice = 0;
  cart.forEach((item) => {
    totalCount += item.quantity;
    totalPrice += item.price * item.quantity;
  });
  return { totalCount, totalPrice };
}
function removeFromCart(productId) {
  const cart = getCart();
  const index = cart.findIndex((item) => item._id === productId);
  if (index > -1) {
    cart.splice(index, 1);
    setCart(cart);
  }
  return cart;
}
exports.addToCart = addToCart;
exports.clearCart = clearCart;
exports.getCart = getCart;
exports.getCartTotal = getCartTotal;
exports.removeFromCart = removeFromCart;
exports.updateCartItemQuantity = updateCartItemQuantity;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/cart.js.map
