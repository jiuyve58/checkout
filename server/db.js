const seedData = require('./seed-data');

const COLLECTIONS = {
  CATEGORIES: 'categories',
  BOOKS: 'books',
  USERS: 'users',
  BORROW_RECORDS: 'borrow_records',
  LOGIN_RECORDS: 'login_records'
};

let cloudDb = null;
let cloudReady = false;

const collectionMap = {
  categories: COLLECTIONS.CATEGORIES,
  products: COLLECTIONS.BOOKS,
  users: COLLECTIONS.USERS,
  borrowRecords: COLLECTIONS.BORROW_RECORDS,
  loginRecords: COLLECTIONS.LOGIN_RECORDS
};

function initCloud() {
  if (cloudReady) return Promise.resolve(true);
  const timeoutMs = Number(process.env.TCB_INIT_TIMEOUT) || 2500;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!cloudReady) {
        console.error(`[数据库] 云数据库初始化超时(${timeoutMs}ms)`);
        resolve(false);
      }
    }, timeoutMs);
    (async () => {
      try {
        console.log('[数据库] 正在初始化云数据库...');
        console.log('[数据库] TCB_ENV:', process.env.TCB_ENV || '(未设置,使用默认)');
        console.log('[数据库] SECRETID:', process.env.TENCENTCLOUD_SECRETID ? '已设置' : '未设置');
        console.log('[数据库] SECRETKEY:', process.env.TENCENTCLOUD_SECRETKEY ? '已设置' : '未设置');

        const cloudbase = require('@cloudbase/node-sdk');
        const envId = process.env.TCB_ENV || 'checkout-d1gm4la5ne5471bff';

        const initOptions = { envId };
        if (process.env.TENCENTCLOUD_SECRETID && process.env.TENCENTCLOUD_SECRETKEY) {
          initOptions.credentials = {
            secretId: process.env.TENCENTCLOUD_SECRETID,
            secretKey: process.env.TENCENTCLOUD_SECRETKEY
          };
        }

        console.log('[数据库] 正在调用 cloudbase.init...');
        const app = cloudbase.init(initOptions);
        console.log('[数据库] init 成功,正在获取 database...');
        cloudDb = app.database();
        if (typeof cloudDb.collection === 'function') {
          try {
            const testCol = getCloudCollection('users');
            await Promise.race([
              testCol.limit(1).get().then(() => true).catch(() => false),
              new Promise((_, rej) => setTimeout(() => rej(new Error('ping-timeout')), Math.max(800, timeoutMs - 500)))
            ]);
          } catch (_) {}
        }
        clearTimeout(timer);
        cloudReady = true;
        console.log('[数据库] 云数据库连接成功');
        resolve(true);
      } catch (err) {
        clearTimeout(timer);
        console.error('[数据库] 云数据库初始化失败:', err.message);
        cloudReady = false;
        resolve(false);
      }
    })();
  });
}

function cloudAvailable() {
  return cloudReady && cloudDb !== null;
}

function getCloudCollection(name) {
  const collectionName = collectionMap[name] || name;
  return cloudDb.collection(collectionName);
}

const CLOUD_OP_TIMEOUT = Number(process.env.TCB_OP_TIMEOUT) || 3500;
function wrapCloud(promise, opName) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout:${opName}`)), CLOUD_OP_TIMEOUT))
  ]);
}

function normalizeItem(item) {
  const result = { ...item };
  if (result.id !== undefined && result._id === undefined) {
    result._id = String(result.id);
  }
  if (result._id !== undefined) {
    result._id = String(result._id);
  }
  return result;
}

async function query(name, condition = {}) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  let col = getCloudCollection(name);
  let res;
  if (Object.keys(condition).length > 0) {
    res = await wrapCloud(col.where(condition).get(), `query(${name} where)`);
  } else {
    res = await wrapCloud(col.get(), `query(${name} all)`);
  }
  return res.data.map(normalizeItem);
}

async function queryOne(name, condition = {}) {
  const data = await query(name, condition);
  return data.length > 0 ? data[0] : null;
}

async function create(name, data) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const col = getCloudCollection(name);
  const doc = { ...data };
  delete doc._id;
  const res = await wrapCloud(col.add(doc), `create(${name})`);
  return { _id: res.id, ...data };
}

async function update(name, docId, data) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const col = getCloudCollection(name);
  const updateData = { ...data };
  delete updateData._id;
  await wrapCloud(col.doc(String(docId)).update(updateData), `update(${name})`);
  return { _id: docId, ...data };
}

async function remove(name, docId) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const col = getCloudCollection(name);
  await wrapCloud(col.doc(String(docId)).remove(), `remove(${name})`);
  return { success: true };
}

async function aggregate(name) {
  return null;
}

async function seedDataFromLocal() {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  console.log('[数据库] 检查云数据库集合状态...');
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
        console.log(`[数据库] 已导入 ${items.length} 条${name}数据到云数据库`);
      } else {
        console.log(`[数据库] ${name} 已有 ${existing.length} 条数据,跳过导入`);
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

const dbInitPromise = Promise.resolve().then(() => initCloud());
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
  initCloud
};
