// pages/items.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import * as Fa from 'react-icons/fa';
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
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState(''); // filtr dle kategorie

  const emptyForm = { id: null, name: '', price: '', category: 'Ostatní', icon: 'FaRegSquare', position: '' };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const url = filter ? `/api/items?category=${encodeURIComponent(filter)}` : '/api/items';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Nepodařilo se načíst položky.');
      setItems(await res.json());
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

  return (
    <div className="container">
      <h1 className="pageTitle">Položky menu</h1>
      <p className="muted">Spravuj produkty dostupné v pokladně – včetně kategorie, pozice a ikony.</p>

      {err && <div className="alert alert-error">{err}</div>}

      {/* Filtr kategorií */}
      <div className="card cardPad" style={{ marginBottom: 16 }}>
        <div className="formRow">
          <label className="label" htmlFor="filter">Filtrovat dle kategorie</label>
          <select id="filter" className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Vše</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

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
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              </div>
               {/* Icon Picker */}
              <div className="formRow">
                <label className="label">Ikona (FontAwesome)</label>
                <div className="grid" style={{ alignItems: 'start' }}>
                  <div className="grid" style={{ gap: 8 }}>
                    <div className="muted">Náhled</div>
                    <div className="card" style={{ padding: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <IconByName name={form.icon} size={22} />
                      <code>{form.icon || '—'}</code>
                    </div>
                  </div>
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
                <Link href="/" className="btn">Zpět na pokladnu</Link>
              </div>
            </form>
          </div>


          {/* Seznam položek */}
          <div className="grid">
            {items.map(item => (
              <section key={item.id} className="card cardPad">
                <header className="receiptHeader" style={{ padding: 0, borderBottom: 'none', alignItems: 'center' }}>
                  <div className="receiptTitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconByName name={item.icon} />
                    <span>#{item.position}</span>
                    <span>{item.name}</span>
                  </div>
                  <div className="totalPrice">{czk.format(item.price || 0)}</div>
                </header>
                <div className="muted">Kategorie: <strong>{item.category || 'Ostatní'}</strong></div>
                <div className="grid" style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => edit(item)}>Upravit</button>
                  <button className="btn btn-danger" onClick={() => del(item.id)}>Smazat</button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
