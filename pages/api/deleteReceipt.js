// pages/api/deleteReceipt.js
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const receiptsFilePath = path.join(dataDir, 'receipts.json');

export default function handler(req, res) {
  // Povolené metody: POST (single delete kvůli kompatibilitě) + DELETE (single/bulk)
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Metoda není povolena' });
  }

  try {
    // --- BULK DELETE: DELETE /api/deleteReceipt?all=1  NEBO body: { all: true } ---
    const isBulk =
      req.method === 'DELETE' &&
      (req.query?.all === '1' || req.body?.all === true);

    if (isBulk) {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(receiptsFilePath, JSON.stringify([], null, 2));
      return res.status(200).json({ message: 'Všechny účtenky byly smazány.' });
    }

    // --- SINGLE DELETE (stávající chování) ---
    const { id } = req.body || {};
    if (typeof id === 'undefined' || id === null) {
      return res.status(400).json({ error: 'Chybí id účtenky pro smazání.' });
    }

    const targetId = typeof id === 'number' ? id : Number(id);
    if (!Number.isFinite(targetId)) {
      return res.status(400).json({ error: 'Neplatné id účtenky.' });
    }

    if (!fs.existsSync(receiptsFilePath)) {
      return res.status(404).json({ error: 'Soubor s účtenkami neexistuje.' });
    }

    const fileContent = fs.readFileSync(receiptsFilePath, 'utf-8');
    const data = fileContent ? JSON.parse(fileContent) : [];

    const idx = data.findIndex((r) => r?.id === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: `Účtenka s id ${targetId} nebyla nalezena.` });
    }

    const removed = data.splice(idx, 1)[0];
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(receiptsFilePath, JSON.stringify(data, null, 2));

    return res.status(200).json({ message: 'Účtenka byla smazána.', removed });
  } catch (error) {
    console.error('Chyba v API /api/deleteReceipt:', error);
    return res.status(500).json({ error: 'Chyba při mazání účtenky.', details: error.message });
  }
}
