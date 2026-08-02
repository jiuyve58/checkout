const http = require('http');
const fs = require('fs');
const path = require('path');
const XLSX = require('./lib/xlsx.full.min.js');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '数据库');
const EXCEL_FILE = path.join(DATA_DIR, 'data.xlsx');
const JSON_FILE = path.join(DATA_DIR, 'data.json');
const STATIC_DIR = path.join(__dirname, 'static');
const UPLOAD_DIR = path.join(STATIC_DIR, 'covers');

const CATEGORY_COLS = ['_id', 'name', 'sort', 'enabled'];
const PRODUCT_COLS = ['_id', 'name', 'author', 'code', 'year', 'description', 'price', 'image', 'category_id', 'on_sale', 'rating', 'stock'];
const BORROW_RECORD_COLS = ['_id', 'user_id', 'user_name', 'product_id', 'product_name', 'product_code', 'borrow_date', 'due_date', 'return_date', 'status'];
const USER_COLS = ['id', 'username', 'nickname', 'email', 'phone', 'status', 'created_at', 'login_count'];

const defaultData = {
  categories: [
    { _id: 'c1', name: '全部', sort: 0, enabled: true },
    { _id: 'c2', name: '文学小说', sort: 1, enabled: true },
    { _id: 'c3', name: '科技计算机', sort: 2, enabled: true },
    { _id: 'c4', name: '历史人文', sort: 3, enabled: true },
    { _id: 'c5', name: '艺术设计', sort: 4, enabled: true },
    { _id: 'c6', name: '教育学习', sort: 5, enabled: true }
  ],
  products: [
    { _id: 'p1', name: '百年孤独', description: '魔幻现实主义文学的代表作，讲述布恩迪亚家族七代人的传奇故事', author: '加西亚·马尔克斯', code: 'BK-LIT-001', year: 1967, price: 14, image: '/static/books/book-BK-LIT-001.jpg', category_id: 'c2', on_sale: true, rating: 4.8, stock: 1 },
    { _id: 'p2', name: '活着', description: '讲述农村人福贵悲惨的人生遭遇，展现生命的韧性', author: '余华', code: 'BK-LIT-002', year: 1993, price: 10, image: '/static/books/book-BK-LIT-002.jpg', category_id: 'c2', on_sale: true, rating: 4.9, stock: 1 },
    { _id: 'p3', name: '深入理解计算机系统', description: 'CSAPP经典教材，全面讲解计算机系统知识', author: 'Randal E.Bryant', code: 'BK-TECH-001', year: 2016, price: 30, image: '/static/books/book-BK-TECH-001.jpg', category_id: 'c3', on_sale: true, rating: 4.7, stock: 1 },
    { _id: 'p4', name: '算法导论', description: '算法学习的经典之作，适合计算机专业学生', author: 'Thomas H.Cormen', code: 'BK-TECH-002', year: 2009, price: 28, image: '/static/books/book-BK-TECH-002.jpg', category_id: 'c3', on_sale: true, rating: 4.6, stock: 1 },
    { _id: 'p5', name: '人类简史', description: '从动物到上帝，一部震撼的人类发展史', author: '尤瓦尔·赫拉利', code: 'BK-HIS-001', year: 2014, price: 16, image: '/static/books/book-BK-HIS-001.jpg', category_id: 'c4', on_sale: true, rating: 4.8, stock: 1 },
    { _id: 'p6', name: '万历十五年', description: '以大历史观看明朝兴衰，剖析中国历史文化', author: '黄仁宇', code: 'BK-HIS-002', year: 1982, price: 12, image: '/static/books/book-BK-HIS-002.jpg', category_id: 'c4', on_sale: true, rating: 4.5, stock: 1 },
    { _id: 'p7', name: '设计心理学', description: '从心理学角度解读设计原则与方法', author: '唐纳德·A·诺曼', code: 'BK-ART-001', year: 2015, price: 20, image: '/static/books/book-BK-ART-001.jpg', category_id: 'c5', on_sale: true, rating: 4.6, stock: 1 },
    { _id: 'p8', name: '配色设计原理', description: '色彩搭配的艺术与科学，设计师必备手册', author: '内田广由纪', code: 'BK-ART-002', year: 2009, price: 18, image: '/static/books/book-BK-ART-002.jpg', category_id: 'c5', on_sale: true, rating: 4.4, stock: 1 },
    { _id: 'p9', name: '高效能人士的七个习惯', description: '史蒂芬·柯维的经典励志著作', author: '史蒂芬·柯维', code: 'BK-EDU-001', year: 1989, price: 15, image: '/static/books/book-BK-EDU-001.jpg', category_id: 'c6', on_sale: true, rating: 4.5, stock: 1 },
    { _id: 'p10', name: '刻意练习', description: '如何从新手到大师，学习方法的革命', author: '安德斯·艾利克森', code: 'BK-EDU-002', year: 2016, price: 13, image: '/static/books/book-BK-EDU-002.jpg', category_id: 'c6', on_sale: true, rating: 4.6, stock: 1 },
    { _id: 'p11', name: '三体', description: '中国科幻文学的巅峰之作，探讨宇宙文明', author: '刘慈欣', code: 'BK-LIT-003', year: 2008, price: 22, image: '/static/books/book-BK-LIT-003.jpg', category_id: 'c2', on_sale: true, rating: 4.9, stock: 1 },
    { _id: 'p12', name: 'JavaScript高级程序设计', description: '前端开发必读经典，深入理解JS语言', author: 'Matt Frisbie', code: 'BK-TECH-003', year: 2020, price: 35, image: '/static/books/book-BK-TECH-003.jpg', category_id: 'c3', on_sale: true, rating: 4.7, stock: 1 }
  ],
  borrowRecords: [],
  users: [
    { id: 'u_demo_user_001', username: 'demo', nickname: '演示用户', email: 'demo@example.com', phone: '13800000000', status: 'active', created_at: '2026-01-01T00:00:00.000Z', login_count: 1 }
  ],
  loginRecords: []
};

function normalizeRow(row, cols) {
  const obj = {};
  cols.forEach(col => {
    let val = row[col];
    if (col === 'enabled' || col === 'on_sale') {
      if (typeof val === 'string') {
        val = val === 'true' || val === 'TRUE' || val === '1' || val === '是';
      }
      val = val === true || val === 1;
    } else if (col === 'sort' || col === 'year' || col === 'stock') {
      const n = parseInt(val);
      val = isNaN(n) ? (col === 'stock' ? 1 : 0) : n;
    } else if (col === 'price' || col === 'rating') {
      const n = parseFloat(val);
      val = isNaN(n) ? 0 : n;
    } else if (val === undefined || val === null) {
      val = '';
    }
    obj[col] = val;
  });
  return obj;
}

function loadData() {
  try {
    if (fs.existsSync(EXCEL_FILE)) {
      const buf = fs.readFileSync(EXCEL_FILE);
      const wb = XLSX.read(buf, { type: 'buffer' });
      const result = { categories: [], products: [], borrowRecords: [], users: [], loginRecords: [] };
      if (wb.SheetNames.includes('categories')) {
        const ws = wb.Sheets['categories'];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        result.categories = rows.map(r => normalizeRow(r, CATEGORY_COLS));
      }
      if (wb.SheetNames.includes('products')) {
        const ws = wb.Sheets['products'];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        result.products = rows.map(r => normalizeRow(r, PRODUCT_COLS));
      }
      if (wb.SheetNames.includes('borrow_records')) {
        const ws = wb.Sheets['borrow_records'];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        result.borrowRecords = rows.map(r => normalizeRow(r, BORROW_RECORD_COLS));
      }
      if (wb.SheetNames.includes('users')) {
        const ws = wb.Sheets['users'];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        result.users = rows.map(r => normalizeRow(r, USER_COLS));
      }
      if (wb.SheetNames.includes('login_records')) {
        const ws = wb.Sheets['login_records'];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        result.loginRecords = rows;
      }
      result.products = result.products.map(p => ({
        ...p,
        stock: p.stock || 1
      }));
      return result;
    }
    if (fs.existsSync(JSON_FILE)) {
      const raw = fs.readFileSync(JSON_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!data.borrowRecords) data.borrowRecords = [];
      if (!data.users) data.users = [];
      if (!data.loginRecords) data.loginRecords = [];
      data.products = data.products.map(p => ({ ...p, stock: p.stock || 1 }));
      return data;
    }
  } catch (e) {
    console.error('读取数据失败:', e.message);
  }
  const cloned = JSON.parse(JSON.stringify(defaultData));
  saveData(cloned);
  return cloned;
}

function saveData(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  try {
    const wb = XLSX.utils.book_new();
    const catRows = data.categories.map(c => {
      const r = {};
      CATEGORY_COLS.forEach(col => r[col] = c[col] !== undefined ? c[col] : '');
      return r;
    });
    const prodRows = data.products.map(p => {
      const r = {};
      PRODUCT_COLS.forEach(col => r[col] = p[col] !== undefined ? p[col] : '');
      return r;
    });
    const recordRows = (data.borrowRecords || []).map(br => {
      const r = {};
      BORROW_RECORD_COLS.forEach(col => r[col] = br[col] !== undefined ? br[col] : '');
      return r;
    });
    const userRows = (data.users || []).map(u => {
      const r = {};
      USER_COLS.forEach(col => r[col] = u[col] !== undefined ? u[col] : '');
      return r;
    });
    const wsCat = XLSX.utils.json_to_sheet(catRows, { header: CATEGORY_COLS });
    const wsProd = XLSX.utils.json_to_sheet(prodRows, { header: PRODUCT_COLS });
    const wsRecord = XLSX.utils.json_to_sheet(recordRows, { header: BORROW_RECORD_COLS });
    const wsUser = XLSX.utils.json_to_sheet(userRows, { header: USER_COLS });
    wsCat['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 8 }, { wch: 10 }];
    wsProd['!cols'] = [{ wch: 10 }, { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 8 }, { wch: 50 }, { wch: 10 }, { wch: 42 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 8 }];
    wsRecord['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }];
    wsUser['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 24 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'categories');
    XLSX.utils.book_append_sheet(wb, wsProd, 'products');
    XLSX.utils.book_append_sheet(wb, wsRecord, 'borrow_records');
    XLSX.utils.book_append_sheet(wb, wsUser, 'users');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(EXCEL_FILE, buf);
  } catch (e) {
    console.error('Excel写入失败，降级为JSON存储:', e.message);
    fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2));
  }
}

function genId(prefix, arr) {
  let maxNum = 0;
  arr.forEach(item => {
    const num = parseInt(String(item._id || '').replace(prefix, ''));
    if (!isNaN(num) && num > maxNum) maxNum = num;
  });
  return `${prefix}${maxNum + 1}`;
}

function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const MENUS = [
  {
    menu_id: 'book-manage',
    text: '图书管理',
    icon: 'admin-icons-shezhi',
    value: '',
    children: [
      { menu_id: 'book-categories', text: '图书分类', icon: 'admin-icons-icons', value: '/pages/book-categories/list' },
      { menu_id: 'book-products', text: '图书列表', icon: 'admin-icons-table', value: '/pages/book-products/list' }
    ]
  },
  {
    menu_id: 'demo',
    text: '静态功能演示',
    icon: 'admin-icons-kaifashili',
    value: '',
    children: [
      { menu_id: 'icons', text: '图标', icon: 'admin-icons-icon', value: '/pages/demo/icons/icons' },
      { menu_id: 'table', text: '表格', icon: 'admin-icons-table', value: '/pages/demo/table/table' }
    ]
  },
  { menu_id: 'admin-doc', text: 'uni-admin 文档', icon: 'admin-icons-doc', value: 'https://uniapp.dcloud.net.cn/uniCloud/admin' }
];

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJSON(res, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname.startsWith('/static/')) {
      const relativePath = pathname.replace('/static/', '');
      const filePath = path.join(STATIC_DIR, relativePath);
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(STATIC_DIR)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
      res.writeHead(404); res.end('Not Found'); return;
    }

    if (req.method === 'POST' && pathname === '/upload') {
      const body = await parseBody(req);
      const { image } = body;
      if (!image) { sendJSON(res, { error: '缺少图片数据' }, 400); return; }
      const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) { sendJSON(res, { error: '图片格式无效' }, 400); return; }
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const base64Data = match[2];
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      const publicPath = `/static/covers/${fileName}`;
      sendJSON(res, { code: 0, data: { path: publicPath } });
      return;
    }

    const data = loadData();
    let apiPath = pathname;
    if (apiPath.startsWith('/api')) apiPath = apiPath.slice(4);
    const segments = apiPath.split('/').filter(Boolean);
    const resource = segments[0];
    const action = segments[1];
    const itemId = segments[2];

    const ok = (res, data, code = 0) => sendJSON(res, { code, data });
    const okMsg = (res, message) => sendJSON(res, { code: 0, message });
    const errRes = (res, message, code = 400) => sendJSON(res, { code, message }, code);

    if (resource === 'health') {
      sendJSON(res, { status: 'ok', uptime: process.uptime() });
    } else if (resource === 'categories') {
      if (req.method === 'GET' && (!action || action === 'list')) {
        const sorted = [...data.categories].sort((a, b) => a.sort - b.sort);
        ok(res, sorted);
      } else if (req.method === 'POST' && (!action || action === 'create')) {
        const body = await parseBody(req);
        const newItem = { ...body, _id: genId('c', data.categories) };
        data.categories.push(newItem);
        saveData(data);
        ok(res, newItem);
      } else if (req.method === 'POST' && action === 'batch-delete') {
        const body = await parseBody(req);
        const ids = body.ids || [];
        data.categories = data.categories.filter(c => !ids.some(id => String(c._id) === String(id)));
        data.products = data.products.filter(p => !ids.some(id => String(p.category_id) === String(id)));
        saveData(data);
        okMsg(res, `成功删除 ${ids.length} 条记录`);
      } else if (req.method === 'GET' && action === 'detail' && itemId) {
        const item = data.categories.find(c => String(c._id) === String(itemId));
        ok(res, item || null);
      } else if (req.method === 'PUT' && action) {
        const body = await parseBody(req);
        const idx = data.categories.findIndex(c => String(c._id) === String(action));
        if (idx !== -1) {
          data.categories[idx] = { ...data.categories[idx], ...body };
          saveData(data);
          okMsg(res, '操作成功');
        } else {
          errRes(res, 'Not found', 404);
        }
      } else if (req.method === 'DELETE' && action) {
        data.categories = data.categories.filter(c => String(c._id) !== String(action));
        data.products = data.products.filter(p => String(p.category_id) !== String(action));
        saveData(data);
        okMsg(res, '删除成功');
      } else {
        errRes(res, 'Not found', 404);
      }
    } else if (resource === 'products') {
      if (req.method === 'GET' && (!action || action === 'list')) {
        const categoryId = url.searchParams.get('category_id');
        let result = [...data.products];
        if (categoryId && categoryId !== 'all') {
          result = result.filter(p => String(p.category_id) === String(categoryId));
        }
        ok(res, result);
      } else if (req.method === 'POST' && (!action || action === 'create')) {
        const body = await parseBody(req);
        const newItem = { ...body, _id: genId('p', data.products), stock: body.stock || 1 };
        data.products.push(newItem);
        saveData(data);
        ok(res, newItem);
      } else if (req.method === 'POST' && action === 'batch-delete') {
        const body = await parseBody(req);
        const ids = body.ids || [];
        data.products = data.products.filter(p => !ids.some(id => String(p._id) === String(id)));
        saveData(data);
        okMsg(res, `成功删除 ${ids.length} 条记录`);
      } else if (req.method === 'GET' && action === 'detail' && itemId) {
        const item = data.products.find(p => String(p._id) === String(itemId));
        ok(res, item || null);
      } else if (req.method === 'PUT' && action) {
        const body = await parseBody(req);
        const idx = data.products.findIndex(p => String(p._id) === String(action));
        if (idx !== -1) {
          data.products[idx] = { ...data.products[idx], ...body };
          saveData(data);
          okMsg(res, '操作成功');
        } else {
          errRes(res, 'Not found', 404);
        }
      } else if (req.method === 'DELETE' && action) {
        data.products = data.products.filter(p => String(p._id) !== String(action));
        saveData(data);
        okMsg(res, '删除成功');
      } else {
        errRes(res, 'Not found', 404);
      }
    } else if (resource === 'users') {
      if (req.method === 'GET' && (!action || action === 'list')) {
        const kw = url.searchParams.get('keyword') || '';
        let result = [...(data.users || [])];
        if (kw) {
          const k = kw.toLowerCase();
          result = result.filter(u =>
            (u.username && u.username.toLowerCase().includes(k)) ||
            (u.nickname && u.nickname.toLowerCase().includes(k))
          );
        }
        result = result.map(u => {
          const borrowCount = (data.borrowRecords || []).filter(br => String(br.user_id) === String(u.id) && br.status === 'borrowed').length;
          return { ...u, borrow_count: borrowCount };
        });
        ok(res, result);
      } else if (req.method === 'GET' && action === 'detail' && itemId) {
        const user = (data.users || []).find(u => String(u.id) === String(itemId));
        if (!user) { errRes(res, '用户不存在', 404); return; }
        const borrowRecords = (data.borrowRecords || []).filter(br => String(br.user_id) === String(itemId));
        const loginRecords = (data.loginRecords || []).filter(lr => String(lr.user_id) === String(itemId));
        ok(res, { user, borrow_records: borrowRecords, login_records: loginRecords });
      } else if (req.method === 'POST' && action === 'batch-delete') {
        const body = await parseBody(req);
        const ids = body.ids || [];
        data.users = (data.users || []).filter(u => !ids.some(id => String(u.id) === String(id)));
        saveData(data);
        okMsg(res, `成功删除 ${ids.length} 条记录`);
      } else if (req.method === 'DELETE' && action) {
        data.users = (data.users || []).filter(u => String(u.id) !== String(action));
        saveData(data);
        okMsg(res, '删除成功');
      } else {
        errRes(res, 'Not found', 404);
      }
    } else if (resource === 'user') {
      if (req.method === 'PUT' && action) {
        const body = await parseBody(req);
        const idx = (data.users || []).findIndex(u => String(u.id) === String(action));
        if (idx !== -1) {
          data.users[idx] = { ...data.users[idx], ...body };
          saveData(data);
          okMsg(res, '操作成功');
        } else {
          errRes(res, '用户不存在', 404);
        }
      } else {
        errRes(res, 'Not found', 404);
      }
    } else if (resource === 'borrow') {
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { product_id, user_id, user_name, days } = body;
        if (!product_id || !user_id) {
          errRes(res, '缺少必要参数', 400);
          return;
        }
        const productIdx = data.products.findIndex(p => String(p._id) === String(product_id));
        if (productIdx === -1) {
          errRes(res, '图书不存在', 404);
          return;
        }
        const product = data.products[productIdx];
        const stock = product.stock || 0;
        if (stock <= 0) {
          errRes(res, '库存不足，无法借阅', 400);
          return;
        }
        const activeRecord = data.borrowRecords.find(br =>
          String(br.product_id) === String(product_id) &&
          String(br.user_id) === String(user_id) &&
          br.status === 'borrowed'
        );
        if (activeRecord) {
          errRes(res, '您已借阅此书，尚未归还', 400);
          return;
        }
        const borrowDays = days || 30;
        const borrowDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + borrowDays);
        const newRecord = {
          _id: genId('br', data.borrowRecords),
          user_id: user_id,
          user_name: user_name || '读者',
          product_id: product_id,
          product_name: product.name,
          product_code: product.code,
          borrow_date: borrowDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          return_date: '',
          status: 'borrowed'
        };
        data.borrowRecords.push(newRecord);
        data.products[productIdx].stock = stock - 1;
        saveData(data);
        ok(res, newRecord);
      } else {
        errRes(res, 'Not found', 404);
      }
    } else if (resource === 'return') {
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { record_id } = body;
        if (!record_id) {
          errRes(res, '缺少借阅记录ID', 400);
          return;
        }
        const recordIdx = data.borrowRecords.findIndex(br => String(br._id) === String(record_id));
        if (recordIdx === -1) {
          errRes(res, '借阅记录不存在', 404);
          return;
        }
        const record = data.borrowRecords[recordIdx];
        if (record.status !== 'borrowed') {
          errRes(res, '该记录已归还', 400);
          return;
        }
        const returnDate = new Date();
        data.borrowRecords[recordIdx].status = 'returned';
        data.borrowRecords[recordIdx].return_date = returnDate.toISOString().split('T')[0];
        const productIdx = data.products.findIndex(p => String(p._id) === String(record.product_id));
        if (productIdx !== -1) {
          data.products[productIdx].stock = (data.products[productIdx].stock || 0) + 1;
        }
        saveData(data);
        okMsg(res, '归还成功');
      } else {
        errRes(res, 'Not found', 404);
      }
    } else if (resource === 'borrow-records') {
      if (req.method === 'GET') {
        const userId = url.searchParams.get('user_id');
        const status = url.searchParams.get('status');
        let result = [...(data.borrowRecords || [])];
        if (userId) {
          result = result.filter(br => String(br.user_id) === String(userId));
        }
        if (status) {
          result = result.filter(br => br.status === status);
        }
        result.sort((a, b) => new Date(b.borrow_date) - new Date(a.borrow_date));
        ok(res, result);
      } else if (req.method === 'POST' && action === 'batch-delete') {
        const body = await parseBody(req);
        const ids = body.ids || [];
        data.borrowRecords = (data.borrowRecords || []).filter(br => !ids.some(id => String(br._id) === String(id)));
        saveData(data);
        okMsg(res, `成功删除 ${ids.length} 条记录`);
      } else if (req.method === 'DELETE' && action) {
        data.borrowRecords = (data.borrowRecords || []).filter(br => String(br._id) !== String(action));
        saveData(data);
        okMsg(res, '删除成功');
      } else {
        errRes(res, 'Not found', 404);
      }
    } else if (resource === 'menus') {
      ok(res, MENUS);
    } else if (resource === 'reset') {
      saveData(defaultData);
      okMsg(res, '重置成功');
    } else {
      errRes(res, 'Not found', 404);
    }
  } catch (err) {
    console.error('Server error:', err);
    sendJSON(res, { error: err.message }, 500);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Library API server running at http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Data dir: ${DATA_DIR}`);
  console.log(`Excel file: ${EXCEL_FILE}`);
});