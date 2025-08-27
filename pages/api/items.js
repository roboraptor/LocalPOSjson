// pages/api/items.js
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const itemsPath = path.join(dataDir, 'items.json');

const CATEGORIES = ['Nápoje', 'Jídlo', 'Ostatní'];

// --- Helpers ------------------------------------------------------

function readItems() {
  if (!fs.existsSync(itemsPath)) return [];
  const txt = fs.readFileSync(itemsPath, 'utf-8');
  try { return txt ? JSON.parse(txt) : []; } catch { return []; }
}

function writeItems(items) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  // atomický zápis: nejdřív .tmp → rename
  const tmp = itemsPath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2));
  fs.renameSync(tmp, itemsPath);
}

function normalizeCategory(cat) {
  const c = String(cat || '').trim();
  return CATEGORIES.includes(c) ? c : 'Ostatní';
}

// FA ikony z react-icons/fa mají prefix "Fa". Na backendu jen skladujeme string.
function normalizeIcon(icon) {
  const s = String(icon || '').trim();
  // jednoduchá validace: musí začínat "Fa" a obsahovat jen alnum
  if (/^Fa[A-Za-z0-9]+$/.test(s)) return s;
  return 'FaRegSquare'; // neutrální default
}

// Přečíslování: zajistí, že všechny položky mají unikátní position >= 1 bez děr.
function normalizePositions(items) {
  // seřadíme podle position (pokud chybí, na konec)
  const sorted = [...items].sort((a, b) => {
    const pa = Number.isFinite(a.position) ? a.position : Number.POSITIVE_INFINITY;
    const pb = Number.isFinite(b.position) ? b.position : Number.POSITIVE_INFINITY;
    return pa - pb;
  });
  // přečíslovat od 1
  sorted.forEach((it, idx) => { it.position = idx + 1; });
  return sorted;
}

function nextPosition(items) {
  if (!items.length) return 1;
  const max = items.reduce((m, it) => Math.max(m, Number.isFinite(it.position) ? it.position : 0), 0);
  return Math.max(1, max + 1);
}

// Vloží nový item na požadovanou pozici (1-n), ostatní posune dolů.
function insertAtPosition(items, newItem, desiredPos) {
  const arr = normalizePositions(items);
  const pos = Math.max(1, Math.min(desiredPos, arr.length + 1));
  // posunout všechny s position >= pos
  for (const it of arr) {
    if (it.position >= pos) it.position += 1;
  }
  newItem.position = pos;
  arr.push(newItem);
  // finální normalizace, aby bylo pořadí 1..n
  return normalizePositions(arr);
}

// Přesune existující item na novou pozici (1-n), ostatní přeuspořádá.
function moveToPosition(items, id, desiredPos) {
  const arr = normalizePositions(items);
  const idx = arr.findIndex(x => x.id === id);
  if (idx === -1) return arr;

  const item = arr[idx];
  arr.splice(idx, 1); // dočasně vyjmout
  const pos = Math.max(1, Math.min(desiredPos, arr.length + 1));

  // znovu vložit na správné místo
  arr.splice(pos - 1, 0, item);
  return normalizePositions(arr);
}

// --- API handler --------------------------------------------------

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const items = normalizePositions(readItems());
      const qCat = req.query.category ? String(req.query.category) : '';
      const filtered = qCat ? items.filter(i => i.category === qCat) : items;
      // vždy vrať seřazené podle position
      filtered.sort((a, b) => a.position - b.position);
      return res.status(200).json(filtered);
    }

    if (req.method === 'POST') {
      const { name, price, category, icon, position } = req.body || {};
      const n = String(name || '').trim();
      const p = Number(price);
      if (!n) return res.status(400).json({ error: 'Název nesmí být prázdný.' });
      if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'Cena musí být nezáporné číslo.' });

      const items = readItems();

      // ID: držíme stejnou strategii jako původně (inkrementální int)
      const nextId = items.length ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;

      const newItem = {
        id: nextId,
        name: n,
        price: p,
        category: normalizeCategory(category),
        icon: normalizeIcon(icon),
        // position doplníme níže dle vstupu
      };

      let updated;
      if (position !== undefined && position !== null && position !== '') {
        const posNum = Number(position);
        if (!Number.isFinite(posNum) || posNum < 1) {
          return res.status(400).json({ error: 'Pozice musí být kladné číslo.' });
        }
        updated = insertAtPosition(items, newItem, posNum);
      } else {
        // bez explicitní pozice → uložit na konec
        newItem.position = nextPosition(items);
        updated = normalizePositions([...items, newItem]);
      }

      writeItems(updated);
      // vrátíme nově vytvořený item (s už dopočtenou pozicí)
      const saved = updated.find(x => x.id === newItem.id);
      return res.status(201).json(saved);
    }

    if (req.method === 'PUT') {
      const { id, name, price, category, icon, position } = req.body || {};
      const i = Number(id);
      const n = String(name || '').trim();
      const p = Number(price);
      if (!Number.isFinite(i)) return res.status(400).json({ error: 'Neplatné id.' });
      if (!n) return res.status(400).json({ error: 'Název nesmí být prázdný.' });
      if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: 'Cena musí být nezáporné číslo.' });

      let items = readItems();
      const idx = items.findIndex(x => x.id === i);
      if (idx === -1) return res.status(404).json({ error: 'Položka nenalezena.' });

      // aktualizace běžných polí
      items[idx] = {
        ...items[idx],
        id: i,
        name: n,
        price: p,
        category: normalizeCategory(category ?? items[idx].category),
        icon: icon !== undefined ? normalizeIcon(icon) : normalizeIcon(items[idx].icon),
      };

      // řešení pozice
      if (position !== undefined && position !== null && position !== '') {
        const posNum = Number(position);
        if (!Number.isFinite(posNum) || posNum < 1) {
          return res.status(400).json({ error: 'Pozice musí být kladné číslo.' });
        }
        // přesuň položku na novou pozici
        items = moveToPosition(items, i, posNum);
      } else {
        // jen projistotu normalizace pozic (zachová současné pořadí)
        items = normalizePositions(items);
      }

      writeItems(items);
      const saved = items.find(x => x.id === i);
      return res.status(200).json(saved);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      const i = Number(id);
      if (!Number.isFinite(i)) return res.status(400).json({ error: 'Neplatné id.' });

      let items = readItems();
      const before = items.length;
      items = items.filter(x => x.id !== i);
      if (before === items.length) return res.status(404).json({ error: 'Položka nenalezena.' });

      // po smazání přečíslovat pozice, aby nebyly díry
      items = normalizePositions(items);
      writeItems(items);
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
