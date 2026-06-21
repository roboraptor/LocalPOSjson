// c:\projects\LocalPOSjson\src\app\api\categories\route.ts
import { NextResponse } from "next/server";
import db from "@/db";

export async function GET() {
  try {
    const categories = db.prepare("SELECT * FROM categories ORDER BY position ASC").all();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Vytvořit novou kategorii
export async function POST(req: Request) {
  try {
    const { name, color, icon, position } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Název je povinný" }, { status: 400 });
    }
    const stmt = db.prepare(
      "INSERT INTO categories (name, color, icon, position) VALUES (?, ?, ?, ?)",
    );
    const info = stmt.run(name, color, icon, position || 0);
    return NextResponse.json(
      { id: info.lastInsertRowid, name, color, icon, position },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { error: "Kategorie s tímto názvem již existuje." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Upravit kategorii
export async function PUT(req: Request) {
  try {
    const { id, name, color, icon, position } = await req.json();
    if (!id || !name) {
      return NextResponse.json({ error: "ID a název jsou povinné" }, { status: 400 });
    }
    const stmt = db.prepare(
      "UPDATE categories SET name = ?, color = ?, icon = ?, position = ? WHERE id = ?",
    );
    const info = stmt.run(name, color, icon, position || 0, id);
    if (info.changes === 0) {
      return NextResponse.json({ error: "Kategorie nenalezena" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { error: "Kategorie s tímto názvem již existuje." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Smazat kategorii
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID je povinné" }, { status: 400 });
    }
    const info = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    return NextResponse.json({ success: info.changes > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
