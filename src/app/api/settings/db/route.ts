import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { initDb } from '@/db';
import { seedDb } from '@/dbSeed';

const configPath = path.join(process.cwd(), 'src', 'data', 'dbposition.json');

export async function GET() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ dbPath: 'data/pos.db' });
  }
}

export async function POST(request: Request) {
  try {
    const { dbPath } = await request.json();
    fs.writeFileSync(configPath, JSON.stringify({ dbPath }, null, 2));
    return NextResponse.json({ message: 'Path updated. You may need to restart the application for changes to take effect.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { action } = await request.json();
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const dbFullPath = path.resolve(process.cwd(), config.dbPath);

    const dbDir = path.dirname(dbFullPath);
    if (!fs.existsSync(dbDir) && action !== 'verify') {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (action === 'verify') {
      if (fs.existsSync(dbFullPath)) {
        try {
          const db = new Database(dbFullPath, { readonly: true });
          db.prepare("SELECT name FROM sqlite_master").get();
          db.close();
          return NextResponse.json({ message: 'Databáze existuje a je v pořádku.' });
        } catch (err: any) {
          return NextResponse.json({ error: `Soubor existuje, ale není to platná databáze: ${err.message}` }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Soubor databáze na uvedené cestě neexistuje.' }, { status: 404 });
      }
    }

    const db = new Database(dbFullPath);

    if (action === 'create') {
      initDb();
      return NextResponse.json({ message: 'Struktura databáze byla úspěšně vytvořena.' });
    }

    if (action === 'wipe') {
      const db = new Database(dbFullPath);
      // Drop all tables
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
      db.transaction(() => {
        for (const table of tables) {
          db.prepare(`DROP TABLE IF EXISTS ${table.name}`).run();
        }
      })();
      db.close();
      return NextResponse.json({ message: 'Databáze byla kompletně vymazána.' });
    }

    if (action === 'seed') {
      seedDb();
      return NextResponse.json({ message: 'Databáze byla naplněna výchozími daty.' });
    }

    db.close();
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
