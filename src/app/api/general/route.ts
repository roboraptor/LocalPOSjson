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
      bank_account_number,
      currency,
      tax_rate,
      tax_enabled,
      receipt_title,
      receipt_header,
      receipt_header_enabled,
      receipt_footer,
      receipt_footer_enabled
    } = body;

    const stmt = db.prepare(`
      UPDATE general 
      SET organization_name = ?, organization_address = ?, organization_owner = ?,
          organization_id = ?, organization_vat_id = ?, bank_account_number = ?, 
          currency = ?, tax_rate = ?, tax_enabled = ?,
          receipt_title = ?, receipt_header = ?, receipt_header_enabled = ?,
          receipt_footer = ?, receipt_footer_enabled = ?
      WHERE id = 1
    `);

    stmt.run(
      organization_name || '', organization_address || '', organization_owner || '',
      organization_id || '', organization_vat_id || '', bank_account_number || '',
      currency || 'CZK', Number(tax_rate) || 0, tax_enabled ? 1 : 0,
      receipt_title || '', receipt_header || '', receipt_header_enabled ? 1 : 0,
      receipt_footer || '', receipt_footer_enabled ? 1 : 0
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
