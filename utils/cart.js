const BORROW_KEY = 'borrowList';

export function getCart() {
	return uni.getStorageSync(BORROW_KEY) || [];
}

export function setCart(cart) {
	uni.setStorageSync(BORROW_KEY, cart);
}

export function addToCart(book, quantity = 1) {
	const cart = getCart();
	const currentStock = Number(book.stock);
	if (Number.isFinite(currentStock) && currentStock <= 0) {
		return cart;
	}
	const existingIndex = cart.findIndex(item => item._id === book._id);
	if (existingIndex > -1) {
		const stock = Number(book.stock);
		const nextQuantity = cart[existingIndex].quantity + quantity;
		cart[existingIndex].quantity = Number.isFinite(stock) && stock >= 0
			? Math.min(nextQuantity, stock)
			: nextQuantity;
		if (Number.isFinite(stock)) {
			cart[existingIndex].stock = stock;
		}
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
			stock: Number.isFinite(Number(book.stock)) ? Number(book.stock) : null,
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
	cart.forEach(item => {
		totalCount += item.quantity;
	});
	return { totalCount };
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
