const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { query, queryOne, create, update, remove, COLLECTIONS, cloudAvailable, importDataFromJson, seedDataFromLocal, waitForDb, initCloud } = require('./db');
const seedData = require('./seed-data');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.use(async (req, res, next) => {
  if (!cloudAvailable()) {
    await waitForDb(1200);
  }
  next();
});

app.use(express.static(__dirname));

app.get('/health', (req, res) => {
  res.json({
    code: 0,
    status: 'ok',
    time: new Date().toISOString(),
    db_mode: cloudAvailable() ? 'cloud' : 'disconnected',
    cloud_env: process.env.TCB_ENV || 'checkout-d1gm4la5ne5471bff',
    env_vars: {
      TCB_ENV: process.env.TCB_ENV || '(not set)',
      TENCENTCLOUD_SECRETID: process.env.TENCENTCLOUD_SECRETID ? 'set' : 'not set',
      TENCENTCLOUD_SECRETKEY: process.env.TENCENTCLOUD_SECRETKEY ? 'set' : 'not set',
      SCF_RUNTIME: process.env.SCF_RUNTIME || '(not scf)',
      TENCENTCLOUD_RUNENV: process.env.TENCENTCLOUD_RUNENV || '(not set)'
    }
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    await waitForDb(2000);
    if (!cloudAvailable()) {
      return res.status(503).json({ code: 503, message: '云数据库未连接' });
    }
    const cloudbase = require('@cloudbase/node-sdk');
    const envId = process.env.TCB_ENV || 'checkout-d1gm4la5ne5471bff';
    const app = cloudbase.init({ envId });
    const db = app.database();
    const _ = db.command;

    const results = {};
    for (const colName of ['users', 'books', 'categories']) {
      try {
        const col = db.collection(colName);
        const t0 = Date.now();
        const snapshot = await Promise.race([
          col.limit(1).get(),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
        ]);
        results[colName] = { count: snapshot.data.length, time: Date.now() - t0 + 'ms' };
      } catch (e) {
        results[colName] = { error: e.message };
      }
    }

    try {
      const t0 = Date.now();
      const col = db.collection('users');
      const snapshot = await Promise.race([
        col.where({ username: 'admin' }).limit(1).get(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
      ]);
      results['users_where_admin'] = { count: snapshot.data.length, time: Date.now() - t0 + 'ms' };
    } catch (e) {
      results['users_where_admin'] = { error: e.message };
    }

    res.json({ code: 0, data: results });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

function generateUserId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return 'u_' + timestamp + '_' + random;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_salt_zxc_2026').digest('hex');
}

function generateToken(userId) {
  return crypto.createHash('sha256').update(userId + '_' + Date.now() + '_' + Math.random()).digest('hex');
}

// Token 存储（内存，重启失效）
const validTokens = new Map(); // token -> userId

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }
  const token = authHeader.substring(7);
  const userId = validTokens.get(token);
  if (!userId) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }
  req.userId = userId;
  next();
}

function invalidateToken(token) {
  validTokens.delete(token);
}

function storeToken(token, userId) {
  validTokens.set(token, userId);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp.trim();
  return req.ip || (req.connection && req.connection.remoteAddress) || '';
}

function sanitizeUser(user) {
  return {
    id: user._id || user.id,
    username: user.username,
    nickname: user.nickname || user.username,
    avatar: user.avatar || '',
    email: user.email || '',
    phone: user.phone || '',
    member_level: user.member_level || 'normal',
    role: user.role || 'user',
    status: user.status || 'active',
    created_at: user.created_at
  };
}

async function recordLogin(user, req, loginType) {
  const record = {
    user_id: user._id || user.id,
    username: user.username,
    nickname: user.nickname || user.username,
    ip: getClientIp(req),
    user_agent: req.headers['user-agent'] || '',
    login_type: loginType,
    login_time: new Date().toISOString(),
    status: 'success'
  };
  await create(COLLECTIONS.LOGIN_RECORDS, record);
  return record;
}

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, nickname, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    if (username.length < 3) {
      return res.status(400).json({ code: 400, message: '用户名至少3位' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码至少6位' });
    }
    const existing = await queryOne(COLLECTIONS.USERS, { username });
    if (existing) {
      return res.status(409).json({ code: 409, message: '用户名已存在' });
    }
    const userId = generateUserId();
    const newUser = {
      _id: userId,
      username,
      password: hashPassword(password),
      nickname: nickname || username,
      avatar: '',
      email: '',
      phone: '',
      member_level: 'normal',
      role: role === 'admin' ? 'admin' : 'user',
      status: 'active',
      created_at: new Date().toISOString()
    };
    await create(COLLECTIONS.USERS, newUser);
    await recordLogin(newUser, req, 'register');
    const token = generateToken(userId);
    res.json({
      code: 0,
      data: {
        token,
        user: sanitizeUser(newUser)
      }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    const user = await queryOne(COLLECTIONS.USERS, { username });
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    if (user.password !== hashPassword(password)) {
      return res.status(401).json({ code: 401, message: '密码错误' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ code: 403, message: '账号已被禁用' });
    }
    const token = generateToken(user._id);
    storeToken(token, user._id);
    await update(COLLECTIONS.USERS, user._id, { last_login_at: new Date().toISOString() });
    await recordLogin(user, req, 'login');
    res.json({
      code: 0,
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    const user = await queryOne(COLLECTIONS.USERS, { username });
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    if (user.password !== hashPassword(password)) {
      return res.status(401).json({ code: 401, message: '密码错误' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ code: 403, message: '账号已被禁用' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '该账号无管理权限' });
    }
    const token = generateToken(user._id);
    storeToken(token, user._id);
    await update(COLLECTIONS.USERS, user._id, { last_login_at: new Date().toISOString() });
    await recordLogin(user, req, 'admin_login');
    res.json({
      code: 0,
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (err) {
    console.error('管理员登录失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/logout', authMiddleware, (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.substring(7) : null;
  if (token) invalidateToken(token);
  res.json({ code: 0, message: '退出成功' });
});

const PUBLIC_PATHS = ['/health', '/api/test-db', '/api/register', '/api/login', '/api/admin-login', '/api/admin-register', '/api/menus', '/api/login-records', '/api/import', '/api/import-from-json', '/api/reset-seed', '/'];
app.use((req, res, next) => {
  if (PUBLIC_PATHS.includes(req.path) || !req.path.startsWith('/api/')) return next();
  authMiddleware(req, res, next);
});

app.post('/api/admin-register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    if (username.length < 3) {
      return res.status(400).json({ code: 400, message: '用户名至少3位' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码至少6位' });
    }
    const existing = await queryOne(COLLECTIONS.USERS, { username });
    if (existing) {
      return res.status(409).json({ code: 409, message: '用户名已存在' });
    }
    const userId = generateUserId();
    const newUser = {
      _id: userId,
      username,
      password: hashPassword(password),
      nickname: nickname || username,
      avatar: '',
      email: '',
      phone: '',
      member_level: 'normal',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString()
    };
    await create(COLLECTIONS.USERS, newUser);
    await recordLogin(newUser, req, 'register');
    const token = generateToken(userId);
    res.json({
      code: 0,
      data: {
        token,
        user: sanitizeUser(newUser)
      }
    });
  } catch (err) {
    console.error('管理员注册失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await queryOne(COLLECTIONS.USERS, { _id: id });
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 0, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.put('/api/user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await queryOne(COLLECTIONS.USERS, { _id: id });
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    const { nickname, avatar, email, phone, status } = req.body;
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (Object.keys(updateData).length > 0) {
      await update(COLLECTIONS.USERS, id, updateData);
    }
    const updatedUser = await queryOne(COLLECTIONS.USERS, { _id: id });
    res.json({ code: 0, data: sanitizeUser(updatedUser) });
  } catch (err) {
    console.error('更新用户失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { keyword, status } = req.query;
    let condition = {};
    if (status) {
      condition.status = status;
    }
    const users = await query(COLLECTIONS.USERS, condition);
    const borrowRecords = await query(COLLECTIONS.BORROW_RECORDS);
    const loginRecords = await query(COLLECTIONS.LOGIN_RECORDS);
    let result = users.map(u => {
      const userId = u._id;
      const borrowCount = borrowRecords.filter(b => b.user_id === userId && b.status === 'borrowed').length;
      const loginCount = loginRecords.filter(l => l.user_id === userId).length;
      return {
        ...sanitizeUser(u),
        borrow_count: borrowCount,
        login_count: loginCount
      };
    });
    if (keyword) {
      const kw = String(keyword).toLowerCase();
      result = result.filter(u => 
        (u.username && u.username.toLowerCase().includes(kw)) ||
        (u.nickname && u.nickname.toLowerCase().includes(kw))
      );
    }
    result = result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ code: 0, data: result });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await queryOne(COLLECTIONS.USERS, { _id: id });
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    const borrowRecords = await query(COLLECTIONS.BORROW_RECORDS, { user_id: id });
    const loginRecords = await query(COLLECTIONS.LOGIN_RECORDS, { user_id: id });
    borrowRecords.sort((a, b) => new Date(b.borrow_date) - new Date(a.borrow_date));
    loginRecords.sort((a, b) => new Date(b.login_time) - new Date(a.login_time));
    res.json({
      code: 0,
      data: {
        user: sanitizeUser(user),
        borrow_records: borrowRecords,
        login_records: loginRecords
      }
    });
  } catch (err) {
    console.error('获取用户详情失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await queryOne(COLLECTIONS.USERS, { _id: id });
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    await remove(COLLECTIONS.USERS, id);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除用户失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await query(COLLECTIONS.CATEGORIES);
    res.json({ code: 0, data: categories });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, sort = 0, enabled = true } = req.body;
    if (!name) {
      return res.status(400).json({ code: 400, message: '分类名称不能为空' });
    }
    const newCategory = { name, sort, enabled };
    const result = await create(COLLECTIONS.CATEGORIES, newCategory);
    newCategory.id = parseInt(result.id);
    newCategory._id = String(result.id);
    res.json({ code: 0, data: { _id: result.id, id: parseInt(result.id), ...newCategory } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, sort, enabled } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sort !== undefined) updateData.sort = sort;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (Object.keys(updateData).length > 0) {
      await update(COLLECTIONS.CATEGORIES, id, updateData);
    }
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await remove(COLLECTIONS.CATEGORIES, id);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { category_id } = req.query;
    let condition = {};
    if (category_id && category_id !== 'all') {
      condition.category_id = parseInt(category_id);
    }
    const books = await query(COLLECTIONS.BOOKS, condition);
    const products = books
      .filter(b => b.on_sale)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (a.sort || 0) - (b.sort || 0))
      .slice(0, 20)
      .map(b => ({
        _id: b._id,
        name: b.name,
        description: b.description || '',
        price: b.price,
        image: b.image,
        category_id: b.category_id ? String(b.category_id) : null,
        on_sale: b.on_sale,
        rating: b.rating || 0,
        author: b.author || '',
        code: b.code || '',
        year: b.year || null,
        stock: b.stock !== undefined ? b.stock : 5
      }));
    res.json({ code: 0, data: products });
  } catch (err) {
    console.error('获取图书列表失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const product = await queryOne(COLLECTIONS.BOOKS, { _id: id });
    if (!product) {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }
    res.json({
      code: 0,
      data: {
        _id: product._id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        image: product.image,
        category_id: product.category_id ? String(product.category_id) : null,
        on_sale: product.on_sale,
        rating: product.rating || 0,
        author: product.author || '',
        code: product.code || '',
        year: product.year || null,
        stock: product.stock !== undefined ? product.stock : 5
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, image, category_id, on_sale = true, rating = 0, sort = 0, author, code, year, stock = 1, category_name } = req.body;
    const newProduct = {
      name,
      description: description || '',
      price,
      image: image || '',
      category_id: category_id ? parseInt(category_id) : null,
      category_name: category_name || '',
      on_sale,
      rating,
      sort,
      author: author || '',
      code: code || '',
      year: year || null,
      stock: stock
    };
    const result = await create(COLLECTIONS.BOOKS, newProduct);
    newProduct.id = parseInt(result.id);
    newProduct._id = String(result.id);
    res.json({ code: 0, data: { _id: result.id, id: parseInt(result.id), ...newProduct } });
  } catch (err) {
    console.error('创建图书失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const product = await queryOne(COLLECTIONS.BOOKS, { _id: id });
    if (!product) {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }
    const allowedFields = ['name', 'description', 'price', 'image', 'category_id', 'category_name', 'on_sale', 'rating', 'sort', 'author', 'code', 'year', 'stock'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = field === 'category_id' ? parseInt(req.body[field]) : req.body[field];
      }
    }
    if (Object.keys(updateData).length > 0) {
      await update(COLLECTIONS.BOOKS, id, updateData);
    }
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    console.error('更新图书失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await remove(COLLECTIONS.BOOKS, id);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除图书失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/categories/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '缺少ID列表' });
    }
    for (const id of ids) {
      await remove(COLLECTIONS.CATEGORIES, id);
    }
    res.json({ code: 0, message: `成功删除 ${ids.length} 条记录` });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/products/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '缺少ID列表' });
    }
    for (const id of ids) {
      await remove(COLLECTIONS.BOOKS, id);
    }
    res.json({ code: 0, message: `成功删除 ${ids.length} 条记录` });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/users/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '缺少ID列表' });
    }
    for (const id of ids) {
      await remove(COLLECTIONS.USERS, id);
    }
    res.json({ code: 0, message: `成功删除 ${ids.length} 条记录` });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/borrow-records/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '缺少ID列表' });
    }
    for (const id of ids) {
      await remove(COLLECTIONS.BORROW_RECORDS, id);
    }
    res.json({ code: 0, message: `成功删除 ${ids.length} 条记录` });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/borrow', async (req, res) => {
  try {
    const { product_id, user_id, user_name, days = 30 } = req.body;
    if (!product_id || !user_id) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' });
    }
    const product = await queryOne(COLLECTIONS.BOOKS, { _id: product_id });
    if (!product) {
      return res.status(404).json({ code: 404, message: '图书不存在' });
    }
    if (product.stock !== undefined && product.stock <= 0) {
      return res.status(409).json({ code: 409, message: '库存不足，无法借阅' });
    }
    const activeBorrow = await queryOne(COLLECTIONS.BORROW_RECORDS, {
      product_id: product_id,
      user_id: user_id,
      status: 'borrowed'
    });
    if (activeBorrow) {
      return res.status(409).json({ code: 409, message: '您已借阅该书，请先归还' });
    }
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + days * 24 * 60 * 60 * 1000);
    const newRecord = {
      user_id: user_id,
      user_name: user_name || '',
      product_id: product_id,
      product_name: product.name,
      product_image: product.image || '',
      product_code: product.code || '',
      status: 'borrowed',
      borrow_date: borrowDate.toISOString(),
      due_date: dueDate.toISOString(),
      return_date: null,
      created_at: borrowDate.toISOString()
    };
    const result = await create(COLLECTIONS.BORROW_RECORDS, newRecord);
    if (product.stock !== undefined) {
      await update(COLLECTIONS.BOOKS, product_id, { stock: product.stock - 1 });
    }
    newRecord._id = result.id;
    res.json({ code: 0, data: newRecord });
  } catch (err) {
    console.error('借阅失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/return', async (req, res) => {
  try {
    const { record_id } = req.body;
    if (!record_id) {
      return res.status(400).json({ code: 400, message: '缺少记录ID' });
    }
    const record = await queryOne(COLLECTIONS.BORROW_RECORDS, { _id: record_id });
    if (!record) {
      return res.status(404).json({ code: 404, message: '借阅记录不存在' });
    }
    if (record.status !== 'borrowed' && record.status !== 'overdue') {
      return res.status(400).json({ code: 400, message: '该记录已归还' });
    }
    await update(COLLECTIONS.BORROW_RECORDS, record_id, {
      status: 'returned',
      return_date: new Date().toISOString()
    });
    const product = await queryOne(COLLECTIONS.BOOKS, { _id: record.product_id });
    if (product && product.stock !== undefined) {
      await update(COLLECTIONS.BOOKS, record.product_id, { stock: product.stock + 1 });
    }
    record.status = 'returned';
    record.return_date = new Date().toISOString();
    res.json({ code: 0, data: record });
  } catch (err) {
    console.error('归还失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/borrow-records', async (req, res) => {
  try {
    const { user_id, status } = req.query;
    let condition = {};
    if (user_id) {
      condition.user_id = user_id;
    }
    if (status) {
      condition.status = status;
    }
    const records = await query(COLLECTIONS.BORROW_RECORDS, condition);
    records.sort((a, b) => new Date(b.borrow_date) - new Date(a.borrow_date));
    res.json({ code: 0, data: records });
  } catch (err) {
    console.error('获取借阅记录失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/login-records', async (req, res) => {
  try {
    const { user_id, login_type } = req.query;
    let condition = {};
    if (user_id) {
      condition.user_id = user_id;
    }
    if (login_type) {
      condition.login_type = login_type;
    }
    const records = await query(COLLECTIONS.LOGIN_RECORDS, condition);
    records.sort((a, b) => new Date(b.login_time) - new Date(a.login_time));
    res.json({ code: 0, data: records });
  } catch (err) {
    console.error('获取登录记录失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/menus', (req, res) => {
  res.json({
    code: 0,
    data: [
      {
        menu_id: 'dashboard',
        text: '仪表盘',
        value: '/pages/index/index'
      },
      {
        menu_id: 'book',
        text: '图书管理',
        value: '',
        children: [
          { menu_id: 'book-categories', text: '分类管理', value: '/pages/book-categories/list' },
          { menu_id: 'book-products', text: '图书列表', value: '/pages/book-products/list' }
        ]
      },
      {
        menu_id: 'user-mgmt',
        text: '用户管理',
        value: '',
        children: [
          { menu_id: 'users', text: '用户列表', value: '/pages/users/list' },
          { menu_id: 'borrow-records', text: '借阅记录', value: '/pages/borrow-records/list' },
          { menu_id: 'login-records', text: '登录记录', value: '/pages/login-records/list' }
        ]
      }
    ]
  });
});

app.post('/api/upload', (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ code: 400, message: '缺少图片数据' });
    }
    const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ code: 400, message: '图片格式错误' });
    }
    const ext = matches[1].split('/')[1] || 'jpg';
    const base64Data = matches[2];
    const fileName = `cover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const coversDir = path.join(__dirname, 'static', 'covers');
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true });
    }
    const filePath = path.join(coversDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    const relativePath = `/static/covers/${fileName}`;
    res.json({ code: 0, data: { path: relativePath } });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/api/import', async (req, res) => {
  try {
    const { data, replace = true } = req.body;
    if (!data) {
      return res.status(400).json({ code: 400, message: '缺少数据' });
    }
    const importResults = {};
    if (data.categories && Array.isArray(data.categories)) {
      if (replace) {
        const existing = await query(COLLECTIONS.CATEGORIES);
        for (const item of existing) {
          await remove(COLLECTIONS.CATEGORIES, item._id);
        }
      }
      for (const item of data.categories) {
        const itemData = { name: item.name, sort: item.sort || 0, enabled: item.enabled !== false };
        const result = await create(COLLECTIONS.CATEGORIES, itemData);
        importResults.categories = importResults.categories || [];
        importResults.categories.push({ ...itemData, _id: result.id, id: parseInt(result.id) });
      }
    }
    if (data.products && Array.isArray(data.products)) {
      if (replace) {
        const existing = await query(COLLECTIONS.BOOKS);
        for (const item of existing) {
          await remove(COLLECTIONS.BOOKS, item._id);
        }
      }
      for (const item of data.products) {
        const itemData = {
          name: item.name,
          description: item.description || '',
          price: item.price,
          image: item.image || '',
          category_id: item.category_id || null,
          category_name: item.category_name || '',
          on_sale: item.on_sale,
          rating: item.rating || 0,
          sort: item.sort || 0,
          author: item.author || '',
          code: item.code || '',
          year: item.year || null,
          stock: item.stock !== undefined ? item.stock : 1
        };
        const result = await create(COLLECTIONS.BOOKS, itemData);
        importResults.products = importResults.products || [];
        importResults.products.push({ ...itemData, _id: result.id, id: parseInt(result.id) });
      }
    }
    if (data.users && Array.isArray(data.users)) {
      for (const item of data.users) {
        const itemData = {
          _id: item.id,
          username: item.username,
          password: item.password,
          nickname: item.nickname || item.username,
          avatar: item.avatar || '',
          email: item.email || '',
          phone: item.phone || '',
          member_level: item.member_level || 'normal',
          status: item.status || 'active',
          created_at: item.created_at
        };
        const result = await create(COLLECTIONS.USERS, itemData);
        importResults.users = importResults.users || [];
        importResults.users.push({ ...itemData, _id: result.id });
      }
    }
    res.json({ code: 0, data: importResults });
  } catch (err) {
    console.error('导入失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/reset-seed', async (req, res) => {
  try {
    await waitForDb(2000);
    if (!cloudAvailable()) {
      return res.status(503).json({ code: 503, message: '云数据库未连接,请检查环境变量配置' });
    }
    const results = {};
    const targetCollections = ['categories', 'products'];
    for (const key of targetCollections) {
      const items = seedData[key] || [];
      try {
        const existing = await query(key);
        for (const item of existing) {
          if (item._id) await remove(key, item._id);
        }
        let imported = 0;
        for (const item of items) {
          await create(key, item);
          imported++;
        }
        results[key] = { imported };
      } catch (err) {
        results[key] = { error: err.message };
      }
    }
    res.json({ code: 0, data: results, message: '数据已重置' });
  } catch (err) {
    console.error('重置数据失败:', err);
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.post('/api/import-from-json', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ code: 400, message: '缺少数据' });
    }
    const results = await importDataFromJson(data);
    res.json({ code: 0, data: results, message: '导入完成' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`图书管理系统API服务已启动: http://localhost:${PORT}`);
  const checkAfterBoot = async () => {
    try { await initCloud(); } catch (e) {}
    const isCloud = cloudAvailable();
    console.log(`数据库模式: ${isCloud ? '云数据库' : '未连接'}`);

    if (!isCloud) {
      console.warn('[系统] 云数据库未连接,请检查环境变量 TENCENTCLOUD_SECRETID / TENCENTCLOUD_SECRETKEY');
      console.warn('[系统] 可在 CloudBase 控制台 → 服务设置 → 环境变量 中配置');
      return;
    }

    try {
      const adminExists = await queryOne(COLLECTIONS.USERS, { role: 'admin' });
      if (!adminExists) {
        const adminId = generateUserId();
        const adminUser = {
          _id: adminId,
          username: 'admin',
          password: hashPassword('admin123'),
          nickname: '系统管理员',
          avatar: '',
          email: '',
          phone: '',
          member_level: 'vip',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString()
        };
        await create(COLLECTIONS.USERS, adminUser);
        console.log('[系统] 已创建默认管理员账号: admin / admin123');
      }
    } catch (err) {
      console.warn('[系统] 检查/创建管理员失败:', err.message);
    }

    try {
      await seedDataFromLocal();
      console.log('[数据库] 数据初始化检查完成');
    } catch (err) {
      console.warn('[数据库] 数据初始化失败:', err.message);
    }
  };
  checkAfterBoot().catch(() => {});
});
