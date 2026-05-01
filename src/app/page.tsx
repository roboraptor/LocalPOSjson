// c:\projects\LocalPOSjson\src\app\page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import * as Fa from 'react-icons/fa6';
import Modal from '@/components/Modal'; 
import { Item, Category } from '@/types/db';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });

export default function PosPage() {
  // --- Data ---
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Košík ---
  const [receipt, setReceipt] = useState<Item[]>([]);
  const [selectedReceiptItemIdx, setSelectedReceiptItemIdx] = useState<number | null>(null);
  
  // --- Modals State ---
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const [showNameModal, setShowNameModal] = useState(false);
  const [issuedTo, setIssuedTo] = useState('');

  // --- Načtení dat při startu ---
  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, catsRes] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/categories')
        ]);

        if (itemsRes.ok) setItems(await itemsRes.json());
        if (catsRes.ok) setCategories(await catsRes.json());
      } catch (error) {
        console.error('Chyba načítání dat:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- Logika košíku ---
  const addItem = (item: Item) => setReceipt((r) => [...r, item]);
  const clearReceipt = () => {
    setReceipt([]);
    setSelectedReceiptItemIdx(null);
  };
  const removeItem = (indexToRemove: number) => setReceipt((r) => r.filter((_, idx) => idx !== indexToRemove));
  
  const total = receipt.reduce((sum, item) => sum + (item.price || 0), 0);

  // --- Custom Item Logic ---
  const addCustomItem = () => {
    const name = customName.trim();
    const normalized = String(customPrice).replace(',', '.').trim();
    const priceNum = normalized === '' ? NaN : Number(normalized);

    if (!name) return alert('Zadej název položky.');
    if (!Number.isFinite(priceNum)) return alert('Cena musí být číslo.');

    // Vytvoříme dočasný objekt Item (id nastavíme záporné nebo náhodné, aby se nepletlo s DB)
    const customItem: Item = {
      id: -Date.now(), 
      name,
      price: priceNum,
      category: 'Ostatní',
      position: 999,
      icon: 'FaRegSquarePlus'
    };

    addItem(customItem);
    setCustomName('');
    setCustomPrice('');
    setShowCustomModal(false);
  };

  // --- Uložení účtenky ---
  const saveReceipt = async () => {
    if (receipt.length === 0) return alert('Účtenka je prázdná.');

    try {
      // Používáme nový endpoint pro účtenky
      const res = await fetch('/api/receipts', { // Dříve /api/save
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt,
          issued_to: issuedTo.trim() || null
        })
      });

      if (!res.ok) throw new Error('Chyba při ukládání.');

      // Úspěch -> vyčistit a ukázat potvrzení
      clearReceipt();
      setIssuedTo('');
      
      setSavedModalOpen(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setSavedModalOpen(false), 5000);

    } catch (e: any) {
      alert(e.message || 'Chyba při ukládání.');
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="mainLayout">
        <div className="leftColumn">
          <div className="container" style={{ textAlign: 'center', marginTop: 50 }}>
            <div className="card skeleton"></div>
            <div className="card skeleton"></div>
          </div>
        </div>
        <aside className="receiptColumn">
          <div className=" skeleton">
          </div>
        </aside>
      </div>
    );
  }

  // Seskupení položek podle kategorií (načtených z DB)
  const groupedItems = categories.map(cat => ({
    ...cat,
    items: items.filter(i => (i.category || 'Ostatní') === cat.name)
  }));

  // Přidáme skupinu pro položky, které nemají kategorii z DB (fallback)
  const knownCategories = new Set(categories.map(c => c.name));
  const orphans = items.filter(i => !knownCategories.has(i.category));
  if (orphans.length > 0) {
    groupedItems.push({ id: 999, name: 'Nezařazené', color: '', icon: '', position: 999, items: orphans });
  }

  return (
    <div className="mainLayout">
      {/* Levý sloupec - Položky */}
      <div className="leftColumn">
        <div className="container" style={{ margin: 0, padding: 0 }}>
          
          {groupedItems.map(group => group.items.length > 0 && (
            <section key={group.id} style={{ marginBottom: 10 }}>
              <h2 className="sectionTitle">{group.name}</h2>
              <div className="buttons">
                {group.items.map(item => {
                  // Dynamická ikona
                  const IconComp = item.icon && (Fa as any)[item.icon] ? (Fa as any)[item.icon] : Fa.FaUtensils;
                  return (
                    <button key={item.id} className="btn-items btn-success btn-items--tri" onClick={() => addItem(item)}>
                      <div className="btn-items__title">{item.name}</div>
                      <div className="btn-items__icon"><IconComp /></div>
                      <div className="btn-items__price">{czk.format(item.price)}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <h2 className="sectionTitle">Možnosti</h2>
          <div className="buttons">
            <button className="btn btn-warning btn-items--tri" onClick={() => setShowCustomModal(true)}>
              <div className="btn-items__title">Vlastní<br/>položka</div>
              <div className="btn-items__icon"><Fa.FaRegSquarePlus /></div>
            </button>
            <button className="btn btn-warning btn-items--tri" onClick={() => setShowNameModal(true)}>
              <div className="btn-items__title">Na účet</div>
              {issuedTo && <p className="muted" style={{ marginTop: 20, fontSize: '0.8em' }}>{issuedTo}</p>}
              <div className="btn-items__icon"><Fa.FaUser /></div>
            </button>
          </div>

          <h2 className="sectionTitle">Akce</h2>
          <div className="grid" style={{ marginTop: 10 }}>
            <button className="btn btn-primary" onClick={saveReceipt} disabled={receipt.length === 0}>
              Uložit účtenku
            </button>
            <button className="btn btn-danger" onClick={clearReceipt} disabled={receipt.length === 0}>
              Vyprázdnit
            </button>
          </div>
        </div>
      </div>

      {/* Pravý sloupec - Účtenka */}
      <aside className="receiptColumn">
        <div className="receipt">
          <h3 className="receipt__title">Účtenka</h3>
          {issuedTo && (
            <div className="receipt__meta">
              Pro: {issuedTo}
            </div>
          )}
          
          {receipt.length === 0 ? (
            <p className="muted">Zatím prázdná.</p>
          ) : (
            <>
              {receipt.map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`} 
                  className="receipt__row"
                  onClick={() => setSelectedReceiptItemIdx(idx === selectedReceiptItemIdx ? null : idx)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="receipt__name">{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="receipt__price">{czk.format(item.price || 0)}</span>
                    {selectedReceiptItemIdx === idx && (
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 10px', height: 'auto', display: 'flex', alignItems: 'center' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(idx);
                          setSelectedReceiptItemIdx(null);
                        }}
                      >
                        <Fa.FaTrashCan size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="receipt__total">
                <span>Celkem</span>
                <span>{czk.format(total)}</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Modals */}
      <Modal open={showCustomModal} onClose={() => setShowCustomModal(false)} title="Vlastní položka">
        <div className="formRow">
          <label className="label">Název</label>
          <input className="input" autoFocus value={customName} onChange={e => setCustomName(e.target.value)} />
        </div>
        <div className="formRow">
          <label className="label">Cena</label>
          <input className="input" inputMode="numeric" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
        </div>
        <div className="modalActions">
          <button className="btn btn-success" onClick={addCustomItem}>Přidat</button>
          <button className="btn btn-ghost" onClick={() => setShowCustomModal(false)}>Zrušit</button>
        </div>
      </Modal>

      <Modal open={showNameModal} onClose={() => setShowNameModal(false)} title="Jméno zákazníka">
        <div className="formRow">
          <label className="label">Jméno / ID</label>
          <input className="input" autoFocus value={issuedTo} onChange={e => setIssuedTo(e.target.value)} />
        </div>
        <div className="modalActions">
          <button className="btn btn-success" onClick={() => setShowNameModal(false)}>Nastavit</button>
          <button className="btn btn-ghost" onClick={() => { setIssuedTo(''); setShowNameModal(false); }}>Zrušit</button>
        </div>
      </Modal>

      <Modal open={savedModalOpen} onClose={() => setSavedModalOpen(false)} title="Hotovo">
        <div style={{ textAlign: 'center', fontSize: '3rem' }}>✅</div>
        <p style={{ textAlign: 'center' }}>Účtenka uložena.</p>
        <div className="modalActions">
          <button className="btn btn-primary" onClick={() => setSavedModalOpen(false)}>OK</button>
        </div>
      </Modal>

    </div>
  );
}
