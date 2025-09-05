import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Fa from 'react-icons/fa6';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const res = await fetch('/api/getReceipts', { cache: 'no-store' });
        if (!res.ok) throw new Error('Nepodařilo se načíst účtenky');
        const data = await res.json();

        setReceipts(Array.isArray(data) ? data.slice().reverse() : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  const deleteReceipt = async (id) => {
    if (!confirm('Opravdu chcete tuto účtenku smazat?')) return;
    try {
      const res = await fetch('/api/deleteReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Nepodařilo se smazat účtenku');
      setReceipts((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteAllReceipts = async () => {
    if (!confirm('Opravdu chcete smazat všechny účtenky?')) return;
    try {
      const res = await fetch('/api/deleteReceipt', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error('Mazání selhalo');
      setReceipts([]); // vyčistí frontend
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container"><h1 className="pageTitle">Uložené účtenky</h1><div className="card skeleton" /><div className="card skeleton" /></div>;
  if (error) return <div className="container"><h1 className="pageTitle">Uložené účtenky</h1><div className="alert alert-error">{error}</div></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="pageTitle">Uložené účtenky</h1>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr', alignItems: 'end' }}>
          <Link href="/receipts2" className="btn btn-warning">Filtr-V2</Link>
          <Link href="/export" className="btn btn-warning">Export</Link>
        </div>
      </div>
      
      {receipts.length === 0 ? (
        <p className="muted">Žádné uložené účtenky.</p>
      ) : (
        <div className="grid">
          {receipts.map((r) => {
            const total = (r.receipt || []).reduce((sum, i) => sum + (i.price || 0), 0);
            return (
              <section key={r.id} className="card receiptCard">
                <header className="receiptHeader">
                  <div>
                    <div className="receiptTitle">Účtenka #{r.id}</div>
                    <div className="receiptSub">
                      {new Date(r.created_at).toLocaleString('cs-CZ')}
                      {r.issued_to ? ` • Pro: ${r.issued_to}` : ''}
                      {r.is_staff ? ' • 👤 Staff' : ''}
                    </div>
                  </div>
                  <button className="btn btn-danger" onClick={() => deleteReceipt(r.id)}>Smazat</button>
                </header>

                <div className="receiptBody">
                  {(r.receipt || []).map((item, i) => (
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div></div>
        
        <div >
          <button className="btn btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onClick={deleteAllReceipts} >
            <Fa.FaTrashCan /> Wipe
          </button>
        </div>
      </div>

    </div>
  );
}
