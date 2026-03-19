// c:\projects\LocalPOSjson\src\app\receipts\page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Fa from 'react-icons/fa6';
import Link from 'next/link';
import { Item } from '@/types/db';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });

interface ParsedReceipt {
  id: number;
  created_at: string;
  issued_to: string | null;
  items: Item[]; // API už vrací parsovaný JSON
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ParsedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- FILTRY ----
  const [q, setQ] = useState('');                 // fulltext
  const [from, setFrom] = useState('');           // YYYY-MM-DD
  const [to, setTo] = useState('');               // YYYY-MM-DD
  const [issuedTo, setIssuedTo] = useState('');   // přesný match

  useEffect(() => {
    async function fetchReceipts() {
      try {
        setLoading(true);
        setError(null);
        // Nový endpoint
        const res = await fetch('/api/receipts', { cache: 'no-store' });
        if (!res.ok) throw new Error('Nepodařilo se načíst účtenky');
        const data = await res.json();
        setReceipts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  const deleteReceipt = async (id: number) => {
    if (!confirm('Opravdu chcete tuto účtenku smazat?')) return;
    try {
      const res = await fetch('/api/receipts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Nepodařilo se smazat účtenku');
      setReceipts((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteAllReceipts = async () => {
    if (!confirm('Opravdu chcete smazat všechny účtenky?')) return;
    try {
      const res = await fetch('/api/receipts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error('Mazání selhalo');
      setReceipts([]); // vyčistí frontend
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Unikátní seznam "issued_to" pro rychlý filtr
  const issuedToOptions = useMemo(() => {
    const set = new Set(
      receipts
        .map((r) => (r.issued_to ?? '').trim())
        .filter(Boolean)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'cs'));
  }, [receipts]);

  // --- seřazení & filtrování (nejnovější nahoře) ---
  const filtered = useMemo(() => {
    const toTs = (d: string) => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const fromBound = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toBound   = to   ? new Date(`T23:59:59`).getTime()   : null;

    return [...receipts]
      // sort desc by created_at (nejnovější první)
      .sort((a, b) => toTs(b?.created_at) - toTs(a?.created_at))
      // apply filters
      .filter((r) => {
        const created = toTs(r?.created_at);

        if (fromBound && Number.isFinite(fromBound) && created < fromBound) return false;
        if (toBound   && Number.isFinite(toBound)   && created > toBound)   return false;

        // Ensure strict string comparison for filtering
        if (issuedTo && String(r?.issued_to ?? '').trim() !== String(issuedTo).trim()) return false;

        if (q) {
          const id = String(r?.id ?? '');
          const person = String(r?.issued_to ?? '');
          const itemsText = (r?.items || [])
            .map((it) => String(it?.name ?? ''))
            .join(' ');
          const hay = `${id} ${person} ${itemsText}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }

        return true;
      });
  }, [receipts, q, from, to, issuedTo]);

  if (loading) {
    return (
      <div className="container">
        <h1 className="pageTitle">Uložené účtenky</h1>
        <div className="card skeleton" />
        <div className="card skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1 className="pageTitle">Uložené účtenky</h1>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center'}}>
        <h1 className="pageTitle">Uložené účtenky</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

        </div>
      </div>

      {/* FILTRY */}
      <section className="card" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
          <div className="grid2" >
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end' }}>
              <div>
                <label htmlFor="q" className="form-label">Hledat</label>
                <input
                id="q"
                type="text"
                className="input"
                placeholder="ID, jméno, položky…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="from" className="form-label">Od</label>
                <input
                id="from"
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="to" className="form-label">Do</label>
                <input
                id="to"
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                />
              </div>

            </div>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end' }}>

              <div>
                <label htmlFor="issued" className="form-label">Issued to</label>
                <select
                id="issued"
                className="select input"
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
                >
                <option value="">Všichni</option>
                {issuedToOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                ))}
                </select>
              </div>

              <div >
                <label htmlFor="reset" className="form-label">
                    Zobrazeno: <strong>{filtered.length}</strong> / {receipts.length}
                </label>
                <button
                    className="btn input"
                    onClick={() => { setQ(''); setFrom(''); setTo(''); setIssuedTo(''); }}
                >
                    Reset filtrů
                </button>
              </div>

            </div>
          </div>
      </section>

      {filtered.length === 0 ? (
        <p className="muted">Žádné uložené účtenky.</p>
      ) : (
        <div className="grid" >
          {filtered.map((r) => {
            // Používáme r.items místo starého r.receipt
            const total = (r.items || []).reduce((sum, i) => sum + (i.price || 0), 0);
            return (
              <section key={r.id} className="card receiptCard">
                <header className="receiptHeader">
                  <div>
                    <div className="receiptTitle">Účtenka #{r.id}</div>
                    <div className="receiptSub">
                      {new Date(r.created_at).toLocaleString('cs-CZ')}
                      {r.issued_to ? ` • Pro: ${r.issued_to}` : ''}
                    </div>
                  </div>
                  <button className="btn btn-danger" onClick={() => deleteReceipt(r.id)}><Fa.FaTrashCan /></button>
                </header>

                <div className="receiptBody">
                  {(r.items || []).map((item, i) => (
                    <div key={i} className="receiptRow">
                      <span className="itemName">{item.name}</span>
                      <span className="itemPrice">{czk.format(item.price || 0)}</span>
                    </div>
                  ))}
                </div>

                <footer className="receiptTotal">
                  <span>Celkem</span>
                  <span className="totalPrice">{czk.format(total)}</span>
                </footer>
              </section>
            );
          })}
        </div>
      )}

      <div className="card cardPad" style={{ marginBottom: 16, marginTop: 16, display: 'flex', gap: 12, alignItems: 'end', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-danger" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={deleteAllReceipts} >
            <Fa.FaTrashCan /> Smazat Vše
          </button>
        </div>
      </div>

    </div>
  );
}
