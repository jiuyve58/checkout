const fs = require('fs');
const path = require('path');
const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({
  env: process.env.TCB_ENV || 'checkout-d1gm4la5ne5471bff'
});

const db = app.database();

async function migrate() {
  try {
    const dbFile = path.join(__dirname, 'db.json');
    if (!fs.existsSync(dbFile)) {
      console.log('db.json 不存在，跳过迁移');
      return;
    }

    console.log('读取 db.json...');
    const raw = fs.readFileSync(dbFile, 'utf-8');
    const data = JSON.parse(raw);

    console.log('开始迁移数据到云数据库...');

    if (data.users && data.users.length > 0) {
      console.log(`迁移 ${data.users.length} 个用户...`);
      for (const user of data.users) {
        try {
          await db.collection('users').add({
            _id: user.id,
            username: user.username,
            password: user.password,
            nickname: user.nickname || user.username,
            avatar: user.avatar || '',
            email: user.email || '',
            phone: user.phone || '',
            member_level: user.member_level || 'normal',
            status: user.status || 'active',
            created_at: user.created_at
          });
          console.log(`  用户 ${user.username} 迁移成功`);
        } catch (e) {
          if (e.message && e.message.includes('already exists')) {
            console.log(`  用户 ${user.username} 已存在，跳过`);
          } else {
            console.error(`  用户 ${user.username} 迁移失败:`, e.message);
          }
        }
      }
    }

    if (data.products && data.products.length > 0) {
      console.log(`迁移 ${data.products.length} 本图书...`);
      for (const product of data.products) {
        try {
          await db.collection('books').add({
            _id: String(product.id),
            name: product.name,
            description: product.description || '',
            price: product.price,
            image: product.image || '',
            category_id: product.category_id || null,
            category_name: product.category_name || '',
            on_sale: product.on_sale || true,
            rating: product.rating || 0,
            sort: product.sort || 0,
            author: product.author || '',
            code: product.code || '',
            year: product.year || null,
            stock: product.stock !== undefined ? product.stock : 1
          });
          console.log(`  图书 ${product.name} 迁移成功`);
        } catch (e) {
          if (e.message && e.message.includes('already exists')) {
            console.log(`  图书 ${product.name} 已存在，跳过`);
          } else {
            console.error(`  图书 ${product.name} 迁移失败:`, e.message);
          }
        }
      }
    }

    if (data.borrowRecords && data.borrowRecords.length > 0) {
      console.log(`迁移 ${data.borrowRecords.length} 条借阅记录...`);
      for (const record of data.borrowRecords) {
        try {
          await db.collection('borrow_records').add({
            _id: String(record.id),
            user_id: record.user_id,
            user_name: record.user_name || '',
            product_id: String(record.product_id),
            product_name: record.product_name,
            product_image: record.product_image || '',
            product_code: record.product_code || '',
            status: record.status || 'borrowed',
            borrow_date: record.borrow_date,
            due_date: record.due_date,
            return_date: record.return_date,
            created_at: record.created_at || record.borrow_date
          });
          console.log(`  借阅记录 ${record.id} 迁移成功`);
        } catch (e) {
          if (e.message && e.message.includes('already exists')) {
            console.log(`  借阅记录 ${record.id} 已存在，跳过`);
          } else {
            console.error(`  借阅记录 ${record.id} 迁移失败:`, e.message);
          }
        }
      }
    }

    if (data.loginRecords && data.loginRecords.length > 0) {
      console.log(`迁移 ${data.loginRecords.length} 条登录记录...`);
      for (const record of data.loginRecords) {
        try {
          await db.collection('login_records').add({
            user_id: record.user_id,
            username: record.username,
            nickname: record.nickname || record.username,
            ip: record.ip || '',
            user_agent: record.user_agent || '',
            login_type: record.login_type,
            login_time: record.login_time,
            status: record.status || 'success'
          });
          console.log(`  登录记录 ${record.id} 迁移成功`);
        } catch (e) {
          console.error(`  登录记录 ${record.id} 迁移失败:`, e.message);
        }
      }
    }

    console.log('数据迁移完成！');
  } catch (err) {
    console.error('迁移失败:', err);
  }
}

migrate();
