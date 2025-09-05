// pages/items.js
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import * as Fa from 'react-icons/fa6';
import Modal from '../components/Modal'; 
import IconPicker from '../components/IconPicker';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });
const CATEGORIES = ['Nápoje', 'Jídlo', 'Ostatní'];

// bezpečné získání komponenty ikony
function IconByName({ name, size = 18 }) {
  const Comp = (name && Fa[name]) ? Fa[name] : Fa.FaRegSquare;
  return <Comp size={size} />;
}

export default function ItemsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false); // NEW
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState(''); // filtr dle kategorie
  const [dirty, setDirty] = useState(false); // NEW – změněné pořadí
  const dragIdRef = useRef(null); // NEW – id přetahované položky
  
  const [modalOpen, setModalOpen] = useState(false);       // modal on/off
  const [modalMode, setModalMode] = useState('create');    // 'create' | 'edit'

  const emptyForm = { id: null, name: '', price: '', category: 'Ostatní', icon: 'FaCubes', position: '' };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const url = filter ? `/api/items?category=${encodeURIComponent(filter)}` : '/api/items';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Nepodařilo se načíst položky.');
      const data = await res.json();

      // NEW: doplnění/normalizace position + seřazení
      const withPos = (Array.isArray(data) ? data : []).map((it, idx) => ({
        ...it,
        position: typeof it.position === 'number' ? it.position : idx + 1,
      })).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      setItems(withPos);
      setDirty(false);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const resetForm = () => setForm(emptyForm);

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const category = form.category;
    const icon = form.icon?.trim() || 'FaRegSquare';
    const position = form.position === '' ? undefined : Number(form.position);

    if (!name) { alert('Název nesmí být prázdný.'); return; }
    if (!Number.isFinite(price) || price < 0) { alert('Cena musí být nezáporné číslo.'); return; }
    if (position !== undefined && (!Number.isFinite(position) || position < 1)) {
      alert('Pozice musí být kladné číslo.'); return;
    }

    try {
      const method = form.id ? 'PUT' : 'POST';
      const body = form.id
        ? { id: form.id, name, price, category, icon, position }
        : { name, price, category, icon, position };
      const res = await fetch('/api/items', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || 'Uložení selhalo.');
      }
      await load();
      resetForm();
    } catch (e) { alert(e.message); }
  };

  const edit = (item) => setForm({
    id: item.id,
    name: item.name,
    price: String(item.price),
    category: item.category || 'Ostatní',
    icon: item.icon || 'FaRegSquare',
    position: item.position ?? ''
  });

  const del = async (id) => {
    if (!confirm('Smazat tuto položku?')) return;
    try {
      const res = await fetch('/api/items', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Smazání selhalo.');
      await load();
      if (form.id === id) resetForm();
    } catch (e) { alert(e.message); }
  };

  // =========================
  // NEW: Drag & Drop handlers
  // =========================
  const onDragStart = (e, id) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id)); // kvůli FF
  };

  const onDragOver = (e) => {
    e.preventDefault(); // umožní drop
  };

  const onDrop = (e, overId) => {
    e.preventDefault();
    const dragId = dragIdRef.current;
    if (!dragId || dragId === overId) return;

    // přeuspořádání v rámci aktuálního seznamu items
    const next = [...items];
    const from = next.findIndex(i => i.id === dragId);
    const to = next.findIndex(i => i.id === overId);
    if (from === -1 || to === -1) return;

    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    // přepočet position 1..N (v rámci zobrazeného setu)
    const renumbered = next.map((it, idx) => ({ ...it, position: idx + 1 }));
    setItems(renumbered);
    setDirty(true);
  };

  // =========================
  // NEW: Uložení pořadí přes existující PUT /api/items (batch)
  // =========================
  async function saveOrder() {
    try {
        const payload = items.map(({ id, position }) => ({ id, position }));
        const res = await fetch('/api/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: payload }),
        cache: 'no-store',
        });
        if (!res.ok) throw new Error('Uložení pořadí selhalo.');

        await load(); // ať si hned natáhneš normalizované pořadí ze serveru
        alert('Pořadí uloženo.');
    } catch (e) {
        alert(e.message);
    }
  } 


  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center'}}>
        <h1 className="pageTitle">Položky menu</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/" className="btn btn-warning">POS</Link>
          <Link href="/export" className="btn btn-warning">Export</Link>
        </div>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      {loading ? (
        <>
          <div className="card skeleton"></div>
          <div className="card skeleton"></div>
        </>
      ) : (
        <>

          {/* Formulář */}
          <div className="card cardPad" style={{ marginBottom: 16 }}>
            <form onSubmit={submit}>
              <div className="grid-tiny">
                <div className="formRow">
                  <label className="label" htmlFor="name">Název</label>
                  <input id="name" className="input"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="formRow">
                  <label className="label" htmlFor="price">Cena (Kč)</label>
                  <input id="price" className="input" type="number" inputMode="decimal"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>

                <div className="formRow">
                  <label className="label" htmlFor="category">Kategorie</label>
                  <select id="category" className="input"
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="formRow">
                  <label className="label" htmlFor="position">Pozice</label>
                  <input id="position" className="input" type="number" min="0"
                    value={form.position || ''}
                    onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))} />
                </div>
                <div className="formRow">
                  <label className="label">Ikona (FontAwesome)</label>
                  <div style={{ gap: 8 }}>
                    <div className="card" style={{ padding: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <IconByName name={form.icon} size={24} />
                      <code>{form.icon || '—'}</code>
                    </div>
                  </div>
                </div>
              </div>

               {/* Icon Picker */}
              <div className="formRow">
                <label className="label">Ikona (FontAwesome)</label>
                <div className="grid" style={{ alignItems: 'start' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <IconPicker
                      value={form.icon}
                      onChange={(name) => setForm(f => ({ ...f, icon: name }))}
                      placeholder="Hledat (např. coffee, user)…"
                    />
                  </div>
                </div>
              </div>

              {/* Tlačítka */}
              <div className="grid" style={{ marginTop: 16 }}>
                <button className="btn btn-primary" type="submit">
                  {form.id ? 'Uložit změny' : 'Přidat položku'}
                </button>
                {form.id && (
                  <button className="btn btn-ghost" type="button" onClick={resetForm}>
                    Zrušit úpravu
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Toolbar – NEW: filtr + uložit pořadí */}
          <div className="card cardPad" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'end', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <div className="formRow">
                    <label className="label" htmlFor="filter">Filtr kategorie</label>
                    <select id="filter" className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="">— vše —</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" disabled={!dirty || savingOrder} onClick={saveOrder} title={dirty ? 'Uložit nové pořadí' : 'Žádná změna'}>
                    {savingOrder ? 'Ukládám…' : '💾 Uložit pořadí'}
                </button>
              </div>
            
          </div>

          {/* Seznam položek (DRAG & DROP) */}
          <div className="grid-tiny" onDragOver={onDragOver}>
            {items.map(item => (
              <section
                key={item.id}
                className="card cardPad drag-card"
                draggable // NEW
                onDragStart={(e) => onDragStart(e, item.id)} // NEW
                onDrop={(e) => onDrop(e, item.id)} // NEW
              >
                <header className="receiptHeader" style={{ padding: 0, borderBottom: 'none', alignItems: 'center' }}>
                  <div className="receiptTitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* NEW: handle */}
                    <span className="drag-handle" title="Táhni pro změnu pořadí" style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }}>
                      <Fa.FaGripLines />
                    </span>
                    <IconByName name={item.icon} />
                    <span>#{item.position}</span>
                    <span>{item.name}</span>
                  </div>
                  <div className="totalPrice">{czk.format(item.price || 0)}</div>
                </header>
                <div className="muted">Kategorie: <strong>{item.category || 'Ostatní'}</strong></div>
                <div style={{ marginTop: 12, display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => edit(item)}><Fa.FaWrench /> Upravit</button>
                  <button className="btn btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => del(item.id)}><Fa.FaTrashCan /> Smazat</button>
                </div>
              </section>
            ))}
          </div>

          <div className="card cardPad" style={{ marginBottom: 16, marginTop: 16, display: 'flex', gap: 12, alignItems: 'end', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
            </div>
             <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" disabled={!dirty || savingOrder} onClick={saveOrder} title={dirty ? 'Uložit nové pořadí' : 'Žádná změna'}>
                {savingOrder ? 'Ukládám…' : '💾 Uložit pořadí'}
              </button>
            </div>
          </div>

          <style jsx>{`
            .drag-card { transition: background-color .12s ease; }
            .drag-card:active { background: rgba(0, 0, 0, 0.03); }
            .drag-handle :global(svg) { pointer-events: none; }
          `}</style>
        </>
      )}
    </div>
  );
}
