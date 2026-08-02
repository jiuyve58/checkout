const crypto = require('crypto');
const https = require('https');
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
const TCB_API_HOST = 'tcb.tencentcloudapi.com';

let cloudReady = false;
let lastInitError = '';

const collectionMap = {
  categories: COLLECTIONS.CATEGORIES,
  products: COLLECTIONS.BOOKS,
  users: COLLECTIONS.USERS,
  borrowRecords: COLLECTIONS.BORROW_RECORDS,
  loginRecords: COLLECTIONS.LOGIN_RECORDS
};

function cloudAvailable() {
  return cloudReady;
}

function getCloudCollection(name) {
  return collectionMap[name] || name;
}

function signRequest(action, params, secretId, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date().toISOString().substr(0, 10);
  const service = 'tcb';
  const algorithm = 'TC3-HMAC-SHA256';
  const httpMethod = 'POST';
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const payload = JSON.stringify(params);
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

  const canonicalHeaders = `content-type:application/json\nhost:${TCB_API_HOST}\nx-tc-action:${action.toLowerCase()}\n`;
  const signedHeaders = 'content-type;host;x-tc-action';
  const canonicalRequest = `${httpMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

  const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
  const secretService = crypto.createHmac('sha256', secretDate).update(service).digest();
  const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest();
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');

  return {
    'Authorization': `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    'Content-Type': 'application/json',
    'Host': TCB_API_HOST,
    'X-TC-Action': action,
    'X-TC-Version': '2018-06-08',
    'X-TC-Timestamp': timestamp
  };
}

function tcbApiCall(action, params) {
  return new Promise((resolve, reject) => {
    const headers = signRequest(action, params, TCB_SECRETID, TCB_SECRETKEY);
    const postData = JSON.stringify(params);
    const req = https.request({
      hostname: TCB_API_HOST,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(postData) },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.Response && json.Response.Error) {
            reject(new Error(`${json.Response.Error.Code}: ${json.Response.Error.Message}`));
          } else {
            resolve(json.Response);
          }
        } catch (e) {
          console.error('[API] 原始响应:', data.slice(0, 500));
          reject(new Error(`Invalid JSON: ${data.slice(0, 100)}`));
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('HTTP timeout')); });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function initCloud() {
  if (cloudReady) return true;
  if (!TCB_SECRETID || !TCB_SECRETKEY) {
    lastInitError = '缺少 TENCENTCLOUD_SECRETID / TENCENTCLOUD_SECRETKEY 环境变量';
    console.error('[数据库]', lastInitError);
    return false;
  }
  try {
    console.log('[数据库] 测试 CloudBase API 连接...');
    const resp = await tcbApiCall('DescribeEnvs', {});
    console.log('[数据库] CloudBase API 连接成功,返回 envs:', resp.EnvList ? resp.EnvList.length : 0);
    cloudReady = true;
    lastInitError = '';
    return true;
  } catch (err) {
    lastInitError = err.message;
    console.warn('[数据库] DescribeEnvs 失败,仍启用(直接操作数据库):', err.message);
    cloudReady = true;
    return true;
  }
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
  const colName = getCloudCollection(name);
  const params = {
    EnvId: TCB_ENV,
    CollectionName: colName,
    Limit: 1000,
    Offset: 0
  };
  if (Object.keys(condition).length > 0) {
    params.Query = JSON.stringify(condition);
  }
  const resp = await tcbApiCall('DatabaseQuery', params);
  const items = (resp.Items || resp.Data || []).map(normalizeItem);
  return items;
}

async function queryOne(name, condition = {}) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const colName = getCloudCollection(name);
  const params = {
    EnvId: TCB_ENV,
    CollectionName: colName,
    Limit: 1,
    Offset: 0
  };
  if (Object.keys(condition).length > 0) {
    params.Query = JSON.stringify(condition);
  }
  const resp = await tcbApiCall('DatabaseQuery', params);
  const items = (resp.Items || resp.Data || []).map(normalizeItem);
  return items.length > 0 ? items[0] : null;
}

async function create(name, data) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const colName = getCloudCollection(name);
  const doc = { ...data };
  delete doc._id;
  const params = {
    EnvId: TCB_ENV,
    CollectionName: colName,
    Data: JSON.stringify(doc)
  };
  const resp = await tcbApiCall('DatabaseInsert', params);
  const id = resp.Id || (resp.Inserted ? String(resp.Inserted) : null);
  return { _id: id, ...data };
}

async function update(name, docId, data) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const colName = getCloudCollection(name);
  const updateData = { ...data };
  delete updateData._id;
  const params = {
    EnvId: TCB_ENV,
    CollectionName: colName,
    DocId: String(docId),
    Data: JSON.stringify(updateData)
  };
  await tcbApiCall('DatabaseUpdate', params);
  return { _id: docId, ...data };
}

async function remove(name, docId) {
  if (!cloudAvailable()) throw new Error('云数据库未连接');
  const colName = getCloudCollection(name);
  const params = {
    EnvId: TCB_ENV,
    CollectionName: colName,
    DocId: String(docId)
  };
  await tcbApiCall('DatabaseDelete', params);
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
