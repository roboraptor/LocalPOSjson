import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Tab } from './types/db'; // Import typů, které jsme vytvořili výše
import dbConfig from './data/dbposition.json';

// Ensure the database file is stored in the configured directory
const dbPath = path.resolve(process.cwd(), dbConfig.dbPath);

let db: any;

export function getDb() {
  if (!db) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    db = new Database(dbPath);
    // Enable Write-Ahead Logging for better concurrency/performance
    db.pragma('journal_mode = DELETE');
  }
  return db;
}

export function initDb() {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS general (
      id INTEGER PRIMARY KEY CHECK (id = 1), -- singleton row
      organization_name TEXT,
      organization_address TEXT,
      organization_owner TEXT,
      currency TEXT DEFAULT 'CZK',
      organization_id TEXT,
      bank_iban TEXT,
      trx_msg TEXT,
      trx_vs_enabled INTEGER DEFAULT 0,
      trx_ks INTEGER,
      tax_rate REAL DEFAULT 21.0,
      organization_vat_id TEXT,
      tax_enabled INTEGER DEFAULT 0,
      receipt_title TEXT,
      receipt_header TEXT,
      receipt_header_enabled INTEGER DEFAULT 0,
      receipt_footer TEXT,
      receipt_footer_enabled INTEGER DEFAULT 0,
      eet_enable INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      icon TEXT,
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
      id INTEGER PRIMARY KEY, -- We use timestamp as ID
      created_at TEXT NOT NULL,
      issued_to TEXT,
      items TEXT NOT NULL, -- JSON blob of the receipt items at time of purchase
      payment_method TEXT,
      eet_fik TEXT,
      eet_bkp TEXT,
      eet_pkp TEXT
    );

    -- Index for faster sorting of receipts by date
    CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);

    -- Open tabs (accounts) by name
    CREATE TABLE IF NOT EXISTS tabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_permanent INTEGER DEFAULT 0, -- 0 = smaže se po čase, 1 = zůstává navždy
      is_table INTEGER DEFAULT 0, -- 1 = je to fyzický stůl
      is_staff INTEGER DEFAULT 0, -- Boolean stored as 0/1
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, -- Pro sledování aktivity
      items TEXT DEFAULT '[]'
    );

    -- Trigger: Automatically set position to MAX + 1 if inserted as 0 or NULL
    CREATE TRIGGER IF NOT EXISTS trg_items_next_pos
    AFTER INSERT ON items
    WHEN NEW.position IS NULL OR NEW.position = 0
    BEGIN
      UPDATE items 
      SET position = (SELECT IFNULL(MAX(position), 0) + 1 FROM items WHERE id != NEW.id) 
      WHERE id = NEW.id;
    END;

    -- Trigger: Aktualizace updated_at při změně tabu
    CREATE TRIGGER IF NOT EXISTS trg_tabs_timestamp
    AFTER UPDATE ON tabs
    BEGIN
      UPDATE tabs SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

    -- Trigger: Auto-úklid (Garbage Collection)
    -- Při vytvoření nového tabu smaže dočasné (is_permanent=0), které nebyly aktivní 7 dní
    CREATE TRIGGER IF NOT EXISTS trg_tabs_cleanup
    AFTER INSERT ON tabs
    BEGIN
      DELETE FROM tabs 
      WHERE is_permanent = 0 
      AND is_table = 0
      AND updated_at < datetime('now', '-7 days');
    END;

    -- Ensure singleton row in general table exists
    INSERT OR IGNORE INTO general (id) VALUES (1);
  `);
  return database;
}

// Initial call - wrap in try-catch to prevent app crash if DB fails to init
let databaseInstance: any;
try {
  databaseInstance = getDb();
  initDb();
} catch (error) {
  console.error('Failed to initialize database:', error);
}

export default databaseInstance;

// Metoda pro "defragmentaci" ID tabů (srovná je 1, 2, 3... po smazání starých)
// POZOR: Nepoužívat, pokud je zrovna někdo připojený a markuje, změní mu to ID pod rukama!
export const reindexTabs = databaseInstance?.transaction((tabsList?: Tab[]) => {
  // 1. Načíst existující taby (seřadíme: Stoly -> Permanentní -> Ostatní dle času) pokud nejsou předány
  const currentTabs = tabsList || databaseInstance.prepare(`
    SELECT * FROM tabs 
    ORDER BY is_table DESC, is_permanent DESC, created_at ASC
  `).all() as Tab[];

  // 2. Smazat tabulku a resetovat autoincrement počítadlo
  databaseInstance.prepare('DELETE FROM tabs').run();
  databaseInstance.prepare("DELETE FROM sqlite_sequence WHERE name = 'tabs'").run();

  // 3. Vložit zpátky s novými ID
  const insert = databaseInstance.prepare(`
    INSERT INTO tabs (id, name, is_permanent, is_table, created_at, updated_at, items) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let nextId = 1;
  for (const t of currentTabs) {
    insert.run(nextId++, t.name, t.is_permanent, t.is_table, t.created_at, t.updated_at, t.items);
  }
});
