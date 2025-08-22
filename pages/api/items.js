// pages/api/items.js
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const itemsPath = path.join(dataDir, 'items.json');

const CATEGORIES = ['Nápoje', 'Jídlo', 'Ostatní'];

function readItems() {
  if (!fs.existsSync(itemsPath)) return [];
  const txt = fs.readFileSync(itemsPath, 'utf-8');
  try { return txt ? JSON.parse(txt) : []; } catch { return []; }
}

function writeItems(items) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2));
}

function normalizeCategory(cat) {
  const c = String(cat || '').trim();
  return CATEGORIES.includes(c) ? c : 'Ostatní';
}

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const items = readItems();
      const qCat = req.query.category ? String(req.query.category) : '';
      const filtered = qCat ? items.filter(i => i.category === qCat) : items;
      return res.status(200).json(filtered);
    }

    if (req.method === 'POST') {
      const { name, price, category } = req.body || {};
      const n = String(name || '').trim();
      const p = Number(price);
      if (!n) return res.status(400).json({ error: 'Název nesmí být prázdný.' });
      if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'Cena musí být nezáporné číslo.' });

      const items = readItems();
      const nextId = items.length ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
      const newItem = { id: nextId, name: n, price: p, category: normalizeCategory(category) };
      items.push(newItem);
      writeItems(items);
      return res.status(201).json(newItem);
    }

    if (req.method === 'PUT') {
      const { id, name, price, category } = req.body || {};
      const i = Number(id);
      const n = String(name || '').trim();
      const p = Number(price);
      if (!Number.isFinite(i)) return res.status(400).json({ error: 'Neplatné id.' });
      if (!n) return res.status(400).json({ error: 'Název nesmí být prázdný.' });
      if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'Cena musí být nezáporné číslo.' });

      const items = readItems();
      const idx = items.findIndex(x => x.id === i);
      if (idx === -1) return res.status(404).json({ error: 'Položka nenalezena.' });
      items[idx] = { id: i, name: n, price: p, category: normalizeCategory(category ?? items[idx].category) };
      writeItems(items);
      return res.status(200).json(items[idx]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      const i = Number(id);
      if (!Number.isFinite(i)) return res.status(400).json({ error: 'Neplatné id.' });

      const items = readItems();
      const next = items.filter(x => x.id !== i);
      if (next.length === items.length) return res.status(404).json({ error: 'Položka nenalezena.' });
      writeItems(next);
      return res.status(200).json({ message: 'Položka smazána.' });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Metoda není povolena' });
  } catch (e) {
    console.error('API /api/items error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };
