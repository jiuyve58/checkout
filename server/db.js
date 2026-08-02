const seedData = require('./seed-data');

const COLLECTIONS = {
  CATEGORIES: 'categories',
  BOOKS: 'books',
  USERS: 'users',
  BORROW_RECORDS: 'borrow_records',
  LOGIN_RECORDS: 'login_records'
};

const TCB_ENV = process.env.TCB_ENV || 'checkout-d1gm4la5ne5471bff';
const TCB_SECRETID = process.env.TENCENTCLOUD_SECRETID || '';
const TCB_SECRETKEY = process.env.TENCENTCLOUD_SECRETKEY || '';

let cloudReady = false;
let cloudDb = null;
let lastInitError = '';

const collectionMap = {
  categories: COLLECTIONS.CATEGORIES,
  products: COLLECTIONS.BOOKS,
  users: COLLECTIONS.USERS,
  borrowRecords: COLLECTIONS.BORROW_RECORDS,
  loginRecords: COLLECTIONS.LOGIN_RECORDS
};

function cloudAvailable() {
  return cloudReady && cloudDb !== null;
}

function getCloudCollection(name) {
  return cloudDb.collection(collectionMap[name] || name);
}

function normalizeItem(item) {
  const result = { ...item };
  if (result._id !== undefined) {
    result._id = String(result._id);
  }
  return result;
}

async function initCloud() {
  if (cloudReady) return true;
  if (!TCB_SECRETID || !TCB_SECRETKEY) {
    lastInitError = '缺少 TENCENTCLOUD_SECRETID / TENCENTCLOUD_SECRETKEY';
    console.error('[数据库]', lastInitError);
    return false;
  }
  try {
    console.log('[数据库] 初始化 CloudBase SDK,env=', TCB_ENV);
    const cloudbase = require('@cloudbase/node-sdk');
    const app = cloudbase.init({
      envId: TCB_ENV,
      secretId: TCB_SECRETID,
      secretKey: TCB_SECRETKEY
    });
    cloudDb = app.database();
    cloudReady = true;
    lastInitError = '';
    console.log('[数据库] CloudBase SDK 初始化成功');
    return true;
  } catch (err) {
    lastInitError = err.message;
    console.error('[数据库] CloudBase SDK 初始化失败:', err.message);
    return false;
  }
}

const DB_OP_TIMEOUT = 8000;

async function query(name, condition = {}) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  let q = getCloudCollection(name).limit(1000);
  if (Object.keys(condition).length > 0) {
    q = q.where(condition);
  }
  const snapshot = await Promise.race([
    q.get(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('query timeout:' + name)), DB_OP_TIMEOUT))
  ]);
  return snapshot.data.map(normalizeItem);
}

async function queryOne(name, condition = {}) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  let q = getCloudCollection(name).limit(1);
  if (Object.keys(condition).length > 0) {
    q = q.where(condition);
  }
  const snapshot = await Promise.race([
    q.get(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('queryOne timeout:' + name)), DB_OP_TIMEOUT))
  ]);
  const items = snapshot.data.map(normalizeItem);
  return items.length > 0 ? items[0] : null;
}

async function create(name, data) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const doc = { ...data };
  delete doc._id;
  const res = await Promise.race([
    getCloudCollection(name).add(doc),
    new Promise((_, rej) => setTimeout(() => rej(new Error('create timeout:' + name)), DB_OP_TIMEOUT))
  ]);
  const id = res._id || (res.id ? String(res.id) : null);
  return { _id: id, ...data };
}

async function update(name, docId, data) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const updateData = { ...data };
  delete updateData._id;
  await Promise.race([
    getCloudCollection(name).doc(String(docId)).update(updateData),
    new Promise((_, rej) => setTimeout(() => rej(new Error('update timeout:' + name)), DB_OP_TIMEOUT))
  ]);
  return { _id: docId, ...data };
}

async function remove(name, docId) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  await Promise.race([
    getCloudCollection(name).doc(String(docId)).remove(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('remove timeout:' + name)), DB_OP_TIMEOUT))
  ]);
  return { success: true };
}

async function aggregate(name) {
  return null;
}

async function seedDataFromLocal() {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const importMap = [
    { name: 'categories', items: seedData.categories || [] },
    { name: 'products', items: seedData.products || [] }
  ];
  for (const { name, items } of importMap) {
    if (!items || items.length === 0) continue;
    try {
      const existing = await query(name);
      if (existing.length === 0) {
        for (const item of items) {
          await create(name, item);
        }
        console.log(`[数据库] 已导入 ${items.length} 条${name}数据`);
      } else {
        console.log(`[数据库] ${name} 已有 ${existing.length} 条数据,跳过`);
      }
    } catch (err) {
      console.warn(`[数据库] 导入${name}失败:`, err.message);
    }
  }
}

async function importDataFromJson(data) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const results = {};
  const importMap = [
    { name: 'categories', items: data.categories || [], key: 'categories' },
    { name: 'products', items: data.products || [], key: 'products' },
    { name: 'users', items: data.users || [], key: 'users' },
    { name: 'borrowRecords', items: data.borrowRecords || [], key: 'borrowRecords' },
    { name: 'loginRecords', items: data.loginRecords || [], key: 'loginRecords' }
  ];
  for (const { name, items, key } of importMap) {
    if (!items || items.length === 0) continue;
    let imported = 0;
    for (const item of items) {
      try {
        await create(name, item);
        imported++;
      } catch (err) {
        console.warn(`[数据库] 导入${name}项失败:`, err.message);
      }
    }
    results[key] = { imported, failed: items.length - imported };
  }
  return results;
}

const dbInitPromise = initCloud();
function waitForDb(timeoutMs = 2000) {
  if (cloudReady) return Promise.resolve(true);
  return Promise.race([
    dbInitPromise,
    new Promise((res) => setTimeout(() => res(false), timeoutMs))
  ]);
}

module.exports = {
  COLLECTIONS,
  query,
  queryOne,
  create,
  update,
  remove,
  aggregate,
  cloudAvailable,
  seedDataFromLocal,
  importDataFromJson,
  waitForDb,
  initCloud,
  getLastInitError: () => lastInitError
};
