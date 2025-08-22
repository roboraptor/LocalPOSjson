// pages/api/save.js
import fs from 'fs';
import path from 'path';

const receiptsFilePath = path.join(process.cwd(), 'data', 'receipts.json');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { receipt, issued_to = null, is_staff = false } = req.body;

      if (!receipt || !Array.isArray(receipt)) {
        return res.status(400).json({ error: 'Receipt data missing or invalid' });
      }

      let data = [];
      if (fs.existsSync(receiptsFilePath)) {
        const fileContent = fs.readFileSync(receiptsFilePath, 'utf-8');
        data = fileContent ? JSON.parse(fileContent) : [];
      }

      data.push({
        id: Date.now(),
        created_at: new Date().toISOString(),
        issued_to: issued_to?.trim() || null,
        is_staff: !!is_staff, // 🔹 uložit jako boolean
        receipt,
      });

      fs.writeFileSync(receiptsFilePath, JSON.stringify(data, null, 2));
      res.status(200).json({ message: 'Účtenka byla uložena.' });
    } catch (error) {
      console.error('Chyba v API /api/save:', error);
      res.status(500).json({ error: 'Chyba při ukládání účtenky.', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Metoda není povolena' });
  }
}
