// c:\projects\LocalPOSjson\src\app\api\receipts\route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';

// GET - Načíst všechny účtenky
export async function GET() {
  try {
    const receipts = db.prepare('SELECT * FROM receipts ORDER BY created_at DESC').all();
    
    // SQLite vrací JSON jako string, musíme ho parsovat pro frontend
    // Také převedeme is_staff (0/1) na boolean, aby se s tím v Reactu lépe pracovalo
    const parsed = receipts.map((r: any) => ({
      ...r,
      items: JSON.parse(r.items || '[]')
    }));
    
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Uložit novou účtenku (volá POS stránka)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receipt, issued_to } = body;

    const stmt = db.prepare(`
        INSERT INTO receipts (created_at, issued_to, items)
        VALUES (?, ?, ?)
    `);

    // Ukládáme items jako JSON string
    const info = stmt.run(
        new Date().toISOString(),
        issued_to || null,
        JSON.stringify(receipt || [])
    );

    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Smazat účtenku (nebo všechny)
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, all } = body;

    if (all) {
      db.prepare('DELETE FROM receipts').run();
      return NextResponse.json({ success: true });
    }

    if (id) {
      const info = db.prepare('DELETE FROM receipts WHERE id = ?').run(id);
      if (info.changes === 0) {
         return NextResponse.json({ error: 'Účtenka nenalezena' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Chybí parametry (id nebo all)' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
