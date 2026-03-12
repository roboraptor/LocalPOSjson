import { NextRequest, NextResponse } from 'next/server';
import db from '@/db'; // Alias @ by měl směřovat do src, nebo použijte relativní cestu '../../../../src/db'
import { Item } from '@/types/db';

// GET /api/items - Získat všechny položky
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = 'SELECT * FROM items';
    const params: (string | number)[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY position ASC';

    const items = db.prepare(query).all(...params) as Item[];
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/items - Vytvořit novou položku
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, category, icon, position } = body;

    if (!name) return NextResponse.json({ error: 'Název je povinný' }, { status: 400 });

    // SQLite Trigger 'trg_items_next_pos' se postará o pozici, pokud je 0/null.
    // Pokud ale frontend pošle specifickou pozici, musíme ostatní posunout (reorder).
    // Pro jednoduchost v MVP necháme DB trigger řešit řazení na konec.
    
    const stmt = db.prepare(`
      INSERT INTO items (name, price, category, icon, position)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      price || 0,
      category || 'Ostatní',
      icon || null,
      position || 0 // 0 spustí trigger pro auto-increment pozice
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/items - Upravit existující položku
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, price, category, icon, position } = body;

    if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Název je povinný' }, { status: 400 });

    const stmt = db.prepare(`
      UPDATE items 
      SET name = ?, price = ?, category = ?, icon = ?, position = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      name,
      price || 0,
      category || 'Ostatní',
      icon || null,
      position ?? 0,
      id
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Položka nenalezena' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/items - Smazat položku
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });

    const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Položka nenalezena' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/items - Přeuspořádání (Drag & Drop na frontendu)
export async function PATCH(request: NextRequest) {
   try {
    const body = await request.json();
    const { order } = body; // Očekáváme pole [{ id: 1, position: 1 }, { id: 2, position: 2 }]

    if (!Array.isArray(order)) {
        return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
    }

    const updateStmt = db.prepare('UPDATE items SET position = ? WHERE id = ?');
    
    // Použijeme transakci pro atomickou aktualizaci všech pozic
    const updateMany = db.transaction((items) => {
      for (const item of items) {
        updateStmt.run(item.position, item.id);
      }
    });

    updateMany(order);

    return NextResponse.json({ success: true });
   } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
   }
}
