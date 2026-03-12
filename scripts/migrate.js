const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'pos.db');
const itemsPath = path.join(dataDir, 'items.json');
const receiptsPath = path.join(dataDir, 'receipts.json');

// 1. Setup DB
console.log(`Connecting to database at ${dbPath}...`);
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT DEFAULT 'Ostatní',
    position INTEGER DEFAULT 0,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY,
    created_at TEXT NOT NULL,
    issued_to TEXT,
    items TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);

  CREATE TABLE IF NOT EXISTS tabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_staff INTEGER DEFAULT 0,
    items TEXT DEFAULT '[]'
  );
`);

// 2. Migrate Items
if (fs.existsSync(itemsPath)) {
  const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
  const insertItem = db.prepare('INSERT OR IGNORE INTO items (id, name, price, category, position, icon) VALUES (?, ?, ?, ?, ?, ?)');
  
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertItem.run(
        item.id,
        item.name,
        item.price,
        item.category || 'Ostatní',
        item.position || 0,
        item.icon || null
      );
    }
  });
  
  insertMany(items);
  console.log(`Migrated ${items.length} items.`);
}

// 3. Migrate Receipts
if (fs.existsSync(receiptsPath)) {
  const receipts = JSON.parse(fs.readFileSync(receiptsPath, 'utf8'));
  const insertReceipt = db.prepare('INSERT OR IGNORE INTO receipts (id, created_at, issued_to, items) VALUES (?, ?, ?, ?)');

  const insertManyReceipts = db.transaction((receipts) => {
    for (const r of receipts) {
      insertReceipt.run(
        r.id,
        r.created_at,
        r.issued_to || null,
        JSON.stringify(r.receipt || [])
      );
    }
  });

  insertManyReceipts(receipts);
  console.log(`Migrated ${receipts.length} receipts.`);
}