import { NextRequest, NextResponse } from "next/server";
import db from "@/db";

export async function GET() {
  try {
    const tabs = db.prepare("SELECT * FROM tabs ORDER BY is_table DESC, name ASC").all();
    const parsed = tabs.map((t: any) => ({
      ...t,
      items: JSON.parse(t.items || "[]"),
    }));
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, is_permanent, is_table, is_staff, items } = body;

    const itemsStr = JSON.stringify(items || []);
    const now = new Date().toISOString();

    if (id) {
      // Update existing tab
      const stmt = db.prepare(`
        UPDATE tabs 
        SET items = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(itemsStr, now, id);
      return NextResponse.json({ success: true, id });
    } else {
      // Create new tab
      const stmt = db.prepare(`
        INSERT INTO tabs (name, is_permanent, is_table, is_staff, created_at, updated_at, items)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        name,
        is_permanent ? 1 : 0,
        is_table ? 1 : 0,
        is_staff ? 1 : 0,
        now,
        now,
        itemsStr,
      );
      return NextResponse.json({ success: true, id: info.lastInsertRowid });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Chybí ID tabu" }, { status: 400 });
    }

    const info = db.prepare("DELETE FROM tabs WHERE id = ?").run(id);
    if (info.changes === 0) {
      return NextResponse.json({ error: "Tab nenalezen" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
