// pages/api/deleteReceipt.js
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const receiptsFilePath = path.join(dataDir, 'receipts.json');

export default function handler(req, res) {
  // Povolené metody: POST (kompatibilita s frontendem) + DELETE (RESTful navíc)
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Metoda není povolena' });
  }

  try {
    // Kontrola vstupu
    const { id } = req.body || {};
    if (typeof id === 'undefined' || id === null) {
      return res.status(400).json({ error: 'Chybí id účtenky pro smazání.' });
    }

    // Převeď id na číslo, pokud to jde (frontend posílá Date.now())
    const targetId = typeof id === 'number' ? id : Number(id);
    if (!Number.isFinite(targetId)) {
      return res.status(400).json({ error: 'Neplatné id účtenky.' });
    }

    // Pokud neexistuje složka/soubor, není co mazat
    if (!fs.existsSync(receiptsFilePath)) {
      return res.status(404).json({ error: 'Soubor s účtenkami neexistuje.' });
    }

    // Načti data
    const fileContent = fs.readFileSync(receiptsFilePath, 'utf-8');
    const data = fileContent ? JSON.parse(fileContent) : [];

    // Najdi účtenku
    const idx = data.findIndex((r) => r?.id === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: `Účtenka s id ${targetId} nebyla nalezena.` });
    }

    // Odstraň ji a zapiš zpět
    const removed = data.splice(idx, 1)[0];
    // Zajisti existenci složky data (pro případ, že by chyběla)
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(receiptsFilePath, JSON.stringify(data, null, 2));

    return res.status(200).json({ message: 'Účtenka byla smazána.', removed });
  } catch (error) {
    console.error('Chyba v API /api/deleteReceipt:', error);
    return res.status(500).json({ error: 'Chyba při mazání účtenky.', details: error.message });
  }
}
