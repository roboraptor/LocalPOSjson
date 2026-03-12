import { NextResponse } from 'next/server';
import db from '@/db';

// GET /api/general - Načíst nastavení
export async function GET() {
  try {
    // Vždy vracíme řádek s ID 1
    const settings = db.prepare('SELECT * FROM general WHERE id = 1').get();
    return NextResponse.json(settings || {});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/general - Uložit nastavení (UPDATE)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Vybereme jen pole, která existují v DB schématu
    const {
      organization_name,
      organization_address,
      organization_owner,
      organization_id, // IČO
      organization_vat_id, // DIČ
      tax_rate,
      tax_enabled,
      receipt_header,
      receipt_footer
    } = body;

    const stmt = db.prepare(`
      UPDATE general 
      SET organization_name = ?, organization_address = ?, organization_owner = ?,
          organization_id = ?, organization_vat_id = ?, tax_rate = ?, tax_enabled = ?,
          receipt_header = ?, receipt_footer = ?
      WHERE id = 1
    `);

    stmt.run(
      organization_name || '', organization_address || '', organization_owner || '',
      organization_id || '', organization_vat_id || '', 
      Number(tax_rate) || 0, tax_enabled ? 1 : 0,
      receipt_header || '', receipt_footer || ''
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
