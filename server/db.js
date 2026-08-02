const fs = require('fs');
const path = require('path');

const COLLECTIONS = {
  CATEGORIES: 'categories',
  BOOKS: 'books',
  USERS: 'users',
  BORROW_RECORDS: 'borrow_records',
  LOGIN_RECORDS: 'login_records'
};

const DATA_FILE = path.join(__dirname, 'db.json');

let cloudDb = null;
let cloudReady = false;

const collectionMap = {
  categories: COLLECTIONS.CATEGORIES,
  products: COLLECTIONS.BOOKS,
  users: COLLECTIONS.USERS,
  borrowRecords: COLLECTIONS.BORROW_RECORDS,
  loginRecords: COLLECTIONS.LOGIN_RECORDS
};

const reverseMap = {};
for (const [k, v] of Object.entries(collectionMap)) {
  reverseMap[v] = k;
}

function initCloud() {
  if (cloudReady) return true;
  try {
    const cloudbase = require('@cloudbase/node-sdk');
    const envId = process.env.TCB_ENV || 'checkout-d1gm4la5ne5471bff';
    
    const initOptions = { envId };
    if (process.env.TENCENTCLOUD_SECRETID && process.env.TENCENTCLOUD_SECRETKEY) {
      initOptions.credentials = {
        secretId: process.env.TENCENTCLOUD_SECRETID,
        secretKey: process.env.TENCENTCLOUD_SECRETKEY
      };
    }
    
    const app = cloudbase.init(initOptions);
    cloudDb = app.database();
    cloudReady = true;
    console.log('[数据库] 云数据库连接成功');
    return true;
  } catch (err) {
    console.warn('[数据库] 云数据库初始化失败，使用文件存储:', err.message);
    cloudReady = false;
    return false;
  }
}

function cloudAvailable() {
  return cloudReady && cloudDb !== null;
}

function getCloudCollection(name) {
  const collectionName = collectionMap[name] || name;
  return cloudDb.collection(collectionName);
}

function readLocalData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('读取本地数据失败:', err.message);
  }
  return { categories: [], products: [], users: [], borrowRecords: [], loginRecords: [] };
}

function writeLocalData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('写入本地数据失败:', err.message);
  }
}

function getLocalItems(name) {
  const localData = readLocalData();
  const key = collectionMap[name] || name;
  return localData[key] || [];
}

function getLocalKey(name) {
  return collectionMap[name] || name;
}

function getNextLocalId(items) {
  let maxId = 0;
  items.forEach(item => {
    const id = parseInt(item._id || item.id);
    if (!isNaN(id) && id > maxId) maxId = id;
  });
  return maxId + 1;
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
  if (cloudAvailable()) {
    try {
      let col = getCloudCollection(name);
      if (Object.keys(condition).length > 0) {
        const res = await col.where(condition).get();
        return res.data.map(normalizeItem);
      } else {
        const res = await col.get();
        return res.data.map(normalizeItem);
      }
    } catch (err) {
      console.warn('[云数据库] query失败，降级为文件存储:', err.message);
    }
  }
  
  let items = getLocalItems(name);
  items = items.map(normalizeItem);
  if (Object.keys(condition).length === 0) return items;
  return items.filter(item => {
    return Object.keys(condition).every(key => {
      const itemVal = item[key] !== undefined ? item[key] : item[key.replace('_', '')];
      return String(itemVal) === String(condition[key]);
    });
  });
}

async function queryOne(name, condition = {}) {
  const data = await query(name, condition);
  return data.length > 0 ? data[0] : null;
}

async function create(name, data) {
  if (cloudAvailable()) {
    try {
      const col = getCloudCollection(name);
      const doc = { ...data };
      delete doc._id;
      const res = await col.add(doc);
      return { _id: res.id, ...data };
    } catch (err) {
      console.warn('[云数据库] create失败，降级为文件存储:', err.message);
    }
  }
  
  const localData = readLocalData();
  const localKey = getLocalKey(name);
  if (!localData[localKey]) localData[localKey] = [];
  if (!data._id) {
    data._id = String(getNextLocalId(localData[localKey]));
  }
  localData[localKey].push(data);
  writeLocalData(localData);
  return { _id: data._id, ...data };
}

async function update(name, docId, data) {
  if (cloudAvailable()) {
    try {
      const col = getCloudCollection(name);
      const updateData = { ...data };
      delete updateData._id;
      await col.doc(String(docId)).update(updateData);
      return { _id: docId, ...data };
    } catch (err) {
      console.warn('[云数据库] update失败，降级为文件存储:', err.message);
    }
  }
  
  const localData = readLocalData();
  const localKey = getLocalKey(name);
  if (localData[localKey]) {
    const item = localData[localKey].find(i => String(i._id || i.id) === String(docId));
    if (item) {
      Object.assign(item, data);
      writeLocalData(localData);
      return { _id: docId, ...item };
    }
  }
  return null;
}

async function remove(name, docId) {
  if (cloudAvailable()) {
    try {
      const col = getCloudCollection(name);
      await col.doc(String(docId)).remove();
      return { success: true };
    } catch (err) {
      console.warn('[云数据库] remove失败，降级为文件存储:', err.message);
    }
  }
  
  const localData = readLocalData();
  const localKey = getLocalKey(name);
  if (localData[localKey]) {
    const index = localData[localKey].findIndex(i => String(i._id || i.id) === String(docId));
    if (index !== -1) {
      localData[localKey].splice(index, 1);
      writeLocalData(localData);
      return { success: true };
    }
  }
  return null;
}

async function aggregate(name) {
  return null;
}

async function seedDataFromLocal() {
  if (cloudAvailable()) {
    console.log('[数据库] 检查云数据库集合状态...');
    const localData = readLocalData();
    const importMap = [
      { name: 'categories', items: localData.categories || [] },
      { name: 'products', items: localData.products || [] },
      { name: 'users', items: localData.users || [] },
      { name: 'borrowRecords', items: localData.borrowRecords || [] },
      { name: 'loginRecords', items: localData.loginRecords || [] }
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
        }
      } catch (err) {
        console.warn(`[数据库] 导入${name}失败:`, err.message);
      }
    }
  } else {
    console.log('[数据库] 使用文件存储模式');
  }
}

async function importDataFromLocal() {
  const localData = readLocalData();
  return importDataFromJson(localData);
}

async function importDataFromJson(data) {
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
    if (cloudAvailable()) {
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
    } else {
      const localKey = getLocalKey(name);
      const localData = readLocalData();
      localData[localKey] = items;
      writeLocalData(localData);
      results[key] = { imported: items.length, failed: 0 };
    }
  }
  return results;
}

initCloud();

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
  importDataFromLocal,
  importDataFromJson
};
