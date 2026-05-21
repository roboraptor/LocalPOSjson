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
    const current = db.prepare('SELECT * FROM general WHERE id = 1').get();

    // Vybereme pole z body, pokud chybí, použijeme aktuální hodnotu z DB
    const organization_name = body.organization_name !== undefined ? body.organization_name : current.organization_name;
    const organization_address = body.organization_address !== undefined ? body.organization_address : current.organization_address;
    const organization_owner = body.organization_owner !== undefined ? body.organization_owner : current.organization_owner;
    const organization_id = body.organization_id !== undefined ? body.organization_id : current.organization_id;
    const organization_vat_id = body.organization_vat_id !== undefined ? body.organization_vat_id : current.organization_vat_id;
    const bank_iban = body.bank_iban !== undefined ? body.bank_iban : current.bank_iban;
    const trx_msg = body.trx_msg !== undefined ? body.trx_msg : current.trx_msg;
    const trx_vs_enabled = body.trx_vs_enabled !== undefined ? (body.trx_vs_enabled ? 1 : 0) : current.trx_vs_enabled;
    const trx_ks = body.trx_ks !== undefined ? (body.trx_ks ? Number(body.trx_ks) : null) : current.trx_ks;
    const eet_enable = body.eet_enable !== undefined ? (body.eet_enable ? 1 : 0) : current.eet_enable;
    const currency = body.currency !== undefined ? body.currency : current.currency;
    const tax_rate = body.tax_rate !== undefined ? Number(body.tax_rate) : current.tax_rate;
    const tax_enabled = body.tax_enabled !== undefined ? (body.tax_enabled ? 1 : 0) : current.tax_enabled;
    const receipt_title = body.receipt_title !== undefined ? body.receipt_title : current.receipt_title;
    const receipt_header = body.receipt_header !== undefined ? body.receipt_header : current.receipt_header;
    const receipt_header_enabled = body.receipt_header_enabled !== undefined ? (body.receipt_header_enabled ? 1 : 0) : current.receipt_header_enabled;
    const receipt_footer = body.receipt_footer !== undefined ? body.receipt_footer : current.receipt_footer;
    const receipt_footer_enabled = body.receipt_footer_enabled !== undefined ? (body.receipt_footer_enabled ? 1 : 0) : current.receipt_footer_enabled;

    const stmt = db.prepare(`
      UPDATE general 
      SET organization_name = ?, organization_address = ?, organization_owner = ?,
          organization_id = ?, organization_vat_id = ?, 
          bank_iban = ?, trx_msg = ?, trx_vs_enabled = ?, trx_ks = ?,
          eet_enable = ?,
          currency = ?, tax_rate = ?, tax_enabled = ?,
          receipt_title = ?, receipt_header = ?, receipt_header_enabled = ?,
          receipt_footer = ?, receipt_footer_enabled = ?
      WHERE id = 1
    `);

    stmt.run(
      organization_name || '', organization_address || '', organization_owner || '',
      organization_id || '', organization_vat_id || '', 
      bank_iban || null,
      trx_msg || null,
      trx_vs_enabled,
      trx_ks,
      eet_enable,
      currency || 'CZK', Number(tax_rate) || 0, tax_enabled,
      receipt_title || '', receipt_header || '', receipt_header_enabled,
      receipt_footer || '', receipt_footer_enabled
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
