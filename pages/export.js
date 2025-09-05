// pages/export.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });

function whenOf(r) {
  const raw = r?.createdAt ?? r?.timestamp ?? r?.date ?? r?.time;
  const d = raw ? new Date(raw) : null;
  return d && !isNaN(d) ? d : null;
}

export default function ExportReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr(null);
        const res = await fetch('/api/getReceipts', { cache: 'no-store' });
        if (!res.ok) throw new Error('Nepodařilo se načíst účtenky');
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => (whenOf(b)?.getTime?.() ?? 0) - (whenOf(a)?.getTime?.() ?? 0));
        setReceipts(list);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const df = from ? new Date(from) : null;
    const dt = to ? new Date(to) : null;
    return receipts.filter(r => {
      const d = whenOf(r);
      if (!d) return true;
      if (df && d < new Date(df.getFullYear(), df.getMonth(), df.getDate(), 0,0,0,0)) return false;
      if (dt && d > new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23,59,59,999)) return false;
      return true;
    });
  }, [receipts, from, to]);

  const exportHref = useMemo(() => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const qs = q.toString();
    return `/api/export/pdf${qs ? `?${qs}` : ''}`;
  }, [from, to]);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="pageTitle">Export účtenek</h1>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <a href={exportHref} className="btn btn-primary">📄 Stáhnout PDF</a>
          <Link className="btn btn-ghost" href="/">← Zpět na POS</Link>
        </div>
      </div>

      <div className="card cardPad" style={{ marginBottom: '1rem' }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
          <div className="formRow">
            <label className="label" htmlFor="from">Od</label>
            <input id="from" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="formRow">
            <label className="label" htmlFor="to">Do</label>
            <input id="to" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="formRow">
            <label className="label">&nbsp;</label>
            <a href={exportHref} className="btn">Export podle filtru</a>
          </div>
        </div>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      {loading ? (
        <>
          <div className="card skeleton"></div>
          <div className="card skeleton"></div>
        </>
      ) : (
        <div className="grid-tiny">
          {filtered.length === 0 && <div className="muted">Žádné účtenky k zobrazení.</div>}
          {filtered.map((r, idx) => {
            const when = whenOf(r);
            const items = Array.isArray(r.items) ? r.items : [];
            const sumItems = items.reduce((acc, it) => acc + (Number(it.price ?? it.unitPrice ?? 0) * Number(it.qty ?? it.quantity ?? 1)), 0);
            const total = Number(r.total ?? r.sum ?? sumItems);
            return (
              <section key={r.id ?? idx} className="card cardPad">
                <header className="receiptHeader" style={{ padding: 0, borderBottom: 'none' }}>
                  <div className="receiptTitle">
                    <strong>Účtenka #{r.id ?? idx + 1}</strong>
                    <div className="muted">{when ? when.toLocaleString('cs-CZ') : '—'}</div>
                  </div>
                  <div className="totalPrice">{czk.format(total)}</div>
                </header>
                <div className="grid" style={{ gridTemplateColumns: '1fr auto auto auto', gap: '.5rem .75rem', alignItems: 'center' }}>
                  <div className="muted" style={{ fontWeight: 600 }}>Položka</div>
                  <div className="muted" style={{ textAlign: 'right', fontWeight: 600 }}>Množ.</div>
                  <div className="muted" style={{ textAlign: 'right', fontWeight: 600 }}>Cena</div>
                  <div className="muted" style={{ textAlign: 'right', fontWeight: 600 }}>Mezisoučet</div>
                  {items.map((it, i) => {
                    const qty = Number(it.qty ?? it.quantity ?? 1);
                    const price = Number(it.price ?? it.unitPrice ?? 0);
                    const line = qty * price;
                    return (
                      <React.Fragment key={i}>
                        <div>{String(it.name ?? it.title ?? '—')}</div>
                        <div style={{ textAlign: 'right' }}>{qty}</div>
                        <div style={{ textAlign: 'right' }}>{czk.format(price)}</div>
                        <div style={{ textAlign: 'right' }}>{czk.format(line)}</div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
