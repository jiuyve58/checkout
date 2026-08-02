const categories = [
	{
		_id: 'c1',
		name: '全部',
		sort: 0,
		enabled: true
	},
	{
		_id: 'c2',
		name: '浓缩咖啡',
		sort: 1,
		enabled: true
	},
	{
		_id: 'c3',
		name: '拿铁',
		sort: 2,
		enabled: true
	},
	{
		_id: 'c4',
		name: '卡布奇诺',
		sort: 3,
		enabled: true
	},
	{
		_id: 'c5',
		name: '摩卡',
		sort: 4,
		enabled: true
	},
	{
		_id: 'c6',
		name: '冷萃',
		sort: 5,
		enabled: true
	}
];

const products = [
	{
		_id: 'p1',
		name: '美式咖啡',
		description: '经典美式，浓郁香醇，回味悠长',
		price: 25000,
		image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=200&h=200&fit=crop',
		category_id: 'c2',
		on_sale: true,
		rating: 4.5
	},
	{
		_id: 'p2',
		name: '意式浓缩',
		description: '纯正意式风味，浓郁口感',
		price: 20000,
		image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
		category_id: 'c2',
		on_sale: true,
		rating: 4.8
	},
	{
		_id: 'p3',
		name: '香草拿铁',
		description: '香甜香草与拿铁的完美结合',
		price: 35000,
		image: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=200&h=200&fit=crop',
		category_id: 'c3',
		on_sale: true,
		rating: 4.6
	},
	{
		_id: 'p4',
		name: '焦糖拿铁11',
		description: '焦糖的甜蜜与拿铁的丝滑',
		price: 38000,
		image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
		category_id: 'c3',
		on_sale: true,
		rating: 4.7
	},
	{
		_id: 'p5',
		name: '经典卡布奇诺',
		description: '绵密奶泡与浓缩咖啡的完美搭配',
		price: 32000,
		image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop',
		category_id: 'c4',
		on_sale: true,
		rating: 4.5
	},
	{
		_id: 'p6',
		name: '榛果卡布奇诺',
		description: '榛果香气增添咖啡的层次感',
		price: 36000,
		image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop',
		category_id: 'c4',
		on_sale: true,
		rating: 4.4
	},
	{
		_id: 'p7',
		name: '巧克力摩卡',
		description: '浓郁巧克力与咖啡的完美融合',
		price: 40000,
		image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=200&h=200&fit=crop',
		category_id: 'c5',
		on_sale: true,
		rating: 4.9
	},
	{
		_id: 'p8',
		name: '白摩卡',
		description: '白巧克力的丝滑与咖啡的醇厚',
		price: 42000,
		image: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=200&h=200&fit=crop',
		category_id: 'c5',
		on_sale: true,
		rating: 4.6
	},
	{
		_id: 'p9',
		name: '手冲冷萃',
		description: '低温萃取，口感清爽干净',
		price: 45000,
		image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
		category_id: 'c6',
		on_sale: true,
		rating: 4.8
	},
	{
		_id: 'p10',
		name: '氮气冷萃',
		description: '氮气气泡带来绵密口感',
		price: 48000,
		image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=200&h=200&fit=crop',
		category_id: 'c6',
		on_sale: true,
		rating: 4.7
	},
	{
		_id: 'p11',
		name: '抹茶拿铁',
		description: '日式抹茶与牛奶的完美结合',
		price: 38000,
		image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=200&h=200&fit=crop',
		category_id: 'c3',
		on_sale: true,
		rating: 4.5
	},
	{
		_id: 'p12',
		name: '蜂蜜咖啡',
		description: '天然蜂蜜增添咖啡的甘甜',
		price: 30000,
		image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop',
		category_id: 'c2',
		on_sale: true,
		rating: 4.3
	}
];

export function getCategories() {
	return categories.filter(c => c.enabled).sort((a, b) => a.sort - b.sort);
}

export function getProducts(categoryId = '') {
	let result = products.filter(p => p.on_sale);
	if (categoryId && categoryId !== 'c1') {
		result = result.filter(p => p.category_id === categoryId);
	}
	return result.sort((a, b) => b.rating - a.rating).slice(0, 20);
}

export function getProductById(id) {
	return products.find(p => p._id === id);
}

export default {
	getCategories,
	getProducts,
	getProductById
};
