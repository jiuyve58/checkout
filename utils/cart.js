const BORROW_KEY = 'borrowList';

export function getCart() {
	return uni.getStorageSync(BORROW_KEY) || [];
}

export function setCart(cart) {
	uni.setStorageSync(BORROW_KEY, cart);
}

export function addToCart(book, quantity = 1) {
	const cart = getCart();
	const existingIndex = cart.findIndex(item => item._id === book._id);
	if (existingIndex > -1) {
		cart[existingIndex].quantity += quantity;
		if (book.borrowDays) {
			cart[existingIndex].borrowDays = book.borrowDays;
		}
	} else {
		cart.push({
			_id: book._id,
			name: book.name,
			author: book.author || '',
			code: book.code || '',
			year: book.year || null,
			image: book.image,
			price: book.price || 14,
			borrowDays: book.borrowDays || 14,
			quantity: quantity
		});
	}
	setCart(cart);
	return cart;
}

export function updateCartItem(productId, field, value) {
	const cart = getCart();
	const index = cart.findIndex(item => item._id === productId);
	if (index > -1) {
		if (field === 'quantity' && value <= 0) {
			cart.splice(index, 1);
		} else {
			cart[index][field] = value;
		}
		setCart(cart);
	}
	return cart;
}

export function updateCartItemQuantity(productId, quantity) {
	return updateCartItem(productId, 'quantity', quantity);
}

export function clearCart() {
	setCart([]);
	return [];
}

export function getCartTotal() {
	const cart = getCart();
	let totalCount = 0;
	let totalPrice = 0;
	cart.forEach(item => {
		totalCount += item.quantity;
		totalPrice += item.price * item.quantity;
	});
	return { totalCount, totalPrice };
}

export function removeFromCart(productId) {
	const cart = getCart();
	const index = cart.findIndex(item => item._id === productId);
	if (index > -1) {
		cart.splice(index, 1);
		setCart(cart);
	}
	return cart;
}

export function removeFromCartBySize(productId) {
	return removeFromCart(productId);
}
