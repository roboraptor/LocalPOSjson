// ===============================
// File: pages/api/export/pdf.js
// Purpose: Generate a receipts PDF and stream it as a download
// Requires: npm i pdfkit
// ===============================
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const receiptsPath = path.join(dataDir, 'receipts.json');

function readReceipts() {
  if (!fs.existsSync(receiptsPath)) return [];
  try { return JSON.parse(fs.readFileSync(receiptsPath, 'utf8') || '[]'); } catch { return []; }
}

function formatCZK(n) { return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(Number(n) || 0); }
function whenStr(v) {
  const d = v ? new Date(v) : null;
  return (d && !isNaN(d)) ? d.toLocaleString('cs-CZ') : '—';
}

export default async function handler(req, res) {
  try {
    const { default: PDFDocument } = await import('pdfkit');

    let list = readReceipts();
    const { from, to } = req.query || {};

    if (from) {
      const df = new Date(from);
      list = list.filter(r => new Date(r.createdAt ?? r.timestamp ?? r.date ?? r.time) >= df);
    }
    if (to) {
      const dt = new Date(to);
      list = list.filter(r => new Date(r.createdAt ?? r.timestamp ?? r.date ?? r.time) <= new Date(dt.setHours(23,59,59,999)));
    }

    // newest first (optional)
    list.sort((a, b) => (new Date(b.createdAt ?? b.timestamp ?? b.date ?? b.time) - new Date(a.createdAt ?? a.timestamp ?? a.date ?? a.time)));

    // Prepare response headers
    res.setHeader('Content-Type', 'application/pdf');
    const filename = `receipts-${new Date().toISOString().slice(0,10)}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    // Title
    doc.fontSize(18).text('Export účtenek', { align: 'left' });
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor('#666').text(`Vygenerováno: ${new Date().toLocaleString('cs-CZ')}`);
    doc.fillColor('#000');

    if (!list.length) {
      doc.moveDown(1);
      doc.fontSize(12).text('Žádné účtenky k exportu.', { align: 'center' });
      doc.end();
      return;
    }

    const drawReceipt = (r, idx) => {
      const when = r.createdAt ?? r.timestamp ?? r.date ?? r.time;

      doc.moveDown(0.6);
      doc.fontSize(12).text(`Účtenka #${r.id ?? idx + 1} — ${whenStr(when)}`);
      if (r.note) doc.fontSize(10).fillColor('#444').text(String(r.note));
      doc.fillColor('#000');

      // columns
      const x1 = 40, x2 = 300, x3 = 380, x4 = 460, xR = 555;
      let y = doc.y + 4;

      // header row
      doc.fontSize(10).text('Položka', x1, y);
      doc.text('Množ.', x2, y);
      doc.text('Cena', x3, y, { width: x4 - x3 - 10, align: 'right' });
      doc.text('Mezisoučet', x4, y, { width: xR - x4, align: 'right' });
      y = doc.y + 2;
      doc.moveTo(x1, y).lineTo(xR, y).strokeColor('#ddd').stroke();

      const items = Array.isArray(r.items) ? r.items : [];
      let sum = 0;
      doc.moveDown(0.2);
      items.forEach((it) => {
        const qty = Number(it.qty ?? it.quantity ?? 1);
        const price = Number(it.price ?? it.unitPrice ?? 0);
        const name = String(it.name ?? it.title ?? '—');
        const line = qty * price;
        sum += line;
        const rowY = doc.y + 2;
        doc.fillColor('#000').fontSize(10).text(name, x1, rowY, { width: x2 - x1 - 10 });
        doc.text(String(qty), x2, rowY, { width: x3 - x2 - 10 });
        doc.text(formatCZK(price), x3, rowY, { width: x4 - x3 - 10, align: 'right' });
        doc.text(formatCZK(line), x4, rowY, { width: xR - x4, align: 'right' });
      });

      // totals
      const total = Number(r.total ?? r.sum ?? sum);
      doc.moveDown(0.2);
      const lineY = doc.y + 2;
      doc.moveTo(x1, lineY).lineTo(xR, lineY).strokeColor('#eee').stroke();
      doc.moveDown(0.2);
      doc.fontSize(11).text('Celkem', x3, doc.y, { width: x4 - x3 - 10, align: 'right' });
      doc.fontSize(11).text(formatCZK(total), x4, doc.y, { width: xR - x4, align: 'right' });
    };

    list.forEach((r, idx) => {
      if (idx > 0) doc.addPage();
      drawReceipt(r, idx);
    });

    doc.end();
  } catch (e) {
    console.error('Export PDF error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Export selhal', details: e.message });
    } else {
      // stream might have started; try to end gracefully
      try { res.end(); } catch {}
    }
  }
}

export const config = { api: { bodyParser: false } }; // streamujeme PDF
