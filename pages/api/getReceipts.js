import fs from 'fs';
import path from 'path';

const receiptsFilePath = path.join(process.cwd(), 'data', 'receipts.json');

export default function handler(req, res) {
  try {
    const data = fs.existsSync(receiptsFilePath)
      ? JSON.parse(fs.readFileSync(receiptsFilePath, 'utf-8'))
      : [];

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Chyba při načítání účtenek.' });
  }
}
