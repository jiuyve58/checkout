/**
 * Excel数据导入脚本
 * 
 * 使用方法：
 * 1. 先安装 xlsx 库：npm install xlsx
 * 2. 运行脚本：node import-excel.js
 * 
 * 该脚本会读取 数据库/data.xlsx 文件，并将数据导入到 db.json 中
 */

const fs = require('fs');
const path = require('path');

// 检查 xlsx 是否安装
let XLSX;
try {
    XLSX = require('xlsx');
} catch (e) {
    console.error('错误：未安装 xlsx 库');
    console.error('请先运行：npm install xlsx');
    console.error('然后再运行：node import-excel.js');
    process.exit(1);
}

const DATA_FILE = path.join(__dirname, 'db.json');
const EXCEL_FILE = path.join(__dirname, '..', '数据库', 'data.xlsx');

function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
    } catch (err) {
        console.error('读取数据失败:', err);
    }
    return { categories: [], products: [], users: [], borrowRecords: [] };
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('写入数据失败:', err);
        return false;
    }
}

function importExcel() {
    if (!fs.existsSync(EXCEL_FILE)) {
        console.error('错误：找不到Excel文件', EXCEL_FILE);
        console.error('请确保文件路径正确');
        process.exit(1);
    }

    console.log('正在读取Excel文件...', EXCEL_FILE);

    const workbook = XLSX.readFile(EXCEL_FILE);
    console.log('工作表列表:', workbook.SheetNames);

    let data = readData();

    // 读取书籍数据
    const bookSheet = workbook.Sheets[workbook.SheetNames[0]];
    const books = XLSX.utils.sheet_to_json(bookSheet);
    
    console.log('\n=== 书籍数据 ===');
    console.log('共', books.length, '条记录');
    if (books.length > 0) {
        console.log('字段:', Object.keys(books[0]));
        console.log('第一条:', books[0]);
    }

    // 读取分类数据（如果有第二个工作表）
    if (workbook.SheetNames.length > 1) {
        const catSheet = workbook.Sheets[workbook.SheetNames[1]];
        const categories = XLSX.utils.sheet_to_json(catSheet);
        console.log('\n=== 分类数据 ===');
        console.log('共', categories.length, '条记录');
    }

    // 转换数据格式并导入
    if (books.length > 0) {
        // 尝试自动映射字段
        const idField = books.find(b => b.id !== undefined) ? 'id' : 
                        books.find(b => b._id !== undefined) ? '_id' : 
                        Object.keys(books[0])[0];
                        
        const nameField = books.find(b => b.name !== undefined) ? 'name' :
                          books.find(b => b['书名'] !== undefined) ? '书名' :
                          books.find(b => b['Title'] !== undefined) ? 'Title' :
                          Object.keys(books[0]).find(k => k.includes('名') || k.toLowerCase().includes('name'));
        
        const authorField = books.find(b => b.author !== undefined) ? 'author' :
                           books.find(b => b['作者'] !== undefined) ? '作者' :
                           Object.keys(books[0]).find(k => k.includes('作者') || k.toLowerCase().includes('author'));

        console.log('\n检测到的字段映射:');
        console.log('- ID字段:', idField);
        console.log('- 名称字段:', nameField);
        console.log('- 作者字段:', authorField || '未找到');

        // 转换产品数据
        const products = books.map((book, index) => ({
            id: parseInt(book[idField]) || (index + 1),
            name: book[nameField] || book['书名'] || '未知书籍',
            description: book['description'] || book['简介'] || book['Description'] || '',
            price: book['price'] || book['价格'] || 25000,
            image: book['image'] || book['封面'] || '',
            category_id: book['category_id'] || book['分类'] || book['Category'] || null,
            on_sale: book['on_sale'] !== false,
            rating: book['rating'] || book['评分'] || 4.5,
            author: book[authorField] || book['作者'] || '未知作者',
            code: book['code'] || book['编号'] || 'B-' + String(index + 1).padStart(4, '0'),
            year: book['year'] || book['年份'] || new Date().getFullYear(),
            sort: index
        }));

        data.products = products;
        
        // 如果没有分类数据，从产品中提取
        if (data.categories.length === 0) {
            const categoryMap = {};
            let catId = 1;
            products.forEach(p => {
                if (p.category_id && !categoryMap[p.category_id]) {
                    categoryMap[p.category_id] = { id: catId++, name: String(p.category_id), sort: catId - 1, enabled: true };
                }
            });
            data.categories = Object.values(categoryMap);
            
            // 添加"全部"分类
            data.categories.unshift({ id: 0, name: '全部', sort: 0, enabled: true });
        }

        if (writeData(data)) {
            console.log('\n✅ 数据导入成功！');
            console.log('- 产品数量:', data.products.length);
            console.log('- 分类数量:', data.categories.length);
            console.log('\n请重启服务器以加载新数据');
        } else {
            console.log('\n❌ 数据写入失败');
        }
    } else {
        console.log('\n❌ 没有找到书籍数据');
        console.log('请检查Excel文件格式');
    }
}

// 执行导入
importExcel();