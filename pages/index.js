import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import * as Fa from 'react-icons/fa6';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });

export default function Home() {
  const [receipt, setReceipt] = useState([]);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const hideTimerRef = useRef(null);

  // položky z API
  const [menuItems, setMenuItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/items', { cache: 'no-store' });
        if (res.ok) setMenuItems(await res.json());
      } catch (e) {
        console.error('Načítání položek selhalo:', e);
      } finally {
        setItemsLoading(false);
      }
    })();

    // cleanup auto-hide timeru modalu při unmountu
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const CATEGORIES = ['Nápoje', 'Jídlo', 'Ostatní'];
  const grouped = CATEGORIES.map(cat => ({
    cat,
    items: menuItems.filter(i => (i.category || 'Ostatní') === cat)
  }));

  // --- vlastní položka ---
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // --- jméno na účtenku (staff / zákazník) ---
  const [showNameForm, setShowNameForm] = useState(false);
  const [issuedTo, setIssuedTo] = useState(''); // uložíme do /api/save
  const [isStaff, setIsStaff] = useState(false);

  // ref na input
  const issuedToRef = useRef(null);

  const addItem = (item) => setReceipt((r) => [...r, item]);
  const clearReceipt = () => setReceipt([]);

  const addCustomItem = () => {
    const name = customName.trim();
    const priceNum = customPrice === '' ? 0 : Number(customPrice);
    if (!name) { alert('Zadej název položky.'); return; }
    if (!Number.isFinite(priceNum) || priceNum < 0) { alert('Cena musí být nezáporné číslo.'); return; }
    addItem({ name, price: priceNum });
    setCustomName('');
    setCustomPrice('');
    setShowCustom(false);
  };

  // --- modal helpery ---
  const openSavedModal = () => {
    setSavedModalOpen(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setSavedModalOpen(false), 5000);
  };
  const closeSavedModal = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setSavedModalOpen(false);
  };

  const saveReceipt = async () => {
    if (receipt.length === 0) { alert('Účtenka je prázdná.'); return; }
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt,
          issued_to: issuedTo.trim() || null,
          is_staff: !!isStaff,
        }),
      });
      if (!res.ok) throw new Error('Chyba při ukládání.');

      // ✅ vyčisti hned a ukaž modal (bez blokujícího alertu)
      clearReceipt();
      setIssuedTo('');
      setIsStaff(false);
      openSavedModal();
    } catch (e) {
      alert(e.message || 'Chyba při ukládání.');
    }
  };

  const total = receipt.reduce((sum, item) => sum + (item.price || 0), 0);
  

  return (
    <div className="mainLayout">
      {/* Levý sloupec – nabídka + vlastní položka + na jméno + akce */}
      <div className="leftColumn">
        <div className="container" style={{ margin: 0, padding: 0 }}>

          {/* 1) katalog položek (podle kategorií) */}
          {itemsLoading ? (
            <>
              <div className="card skeleton" />
              <div className="card skeleton" />
            </>
          ) : (
            grouped.map(({ cat, items }) => (
              items.length > 0 && (
                <section key={cat} style={{ marginBottom: 16 }}>
                  <h2 className="sectionTitle">{cat}</h2>
                  <div className="buttons">
                    {items.map(item => (
                      <button
                        className="btn-items btn-success btn-items--tri"
                        key={item.id ?? `${item.name}-${item.price}-${item.icon}`}
                        onClick={() => addItem(item)}
                      >
                        {(() => {
                        const Icon = (item.icon && Fa[item.icon]) ? Fa[item.icon] : Fa.FaUtensils;
                          return (
                            <>
                             
                              <div class="btn-items__title">
                                {item.name}
                              </div>
                              
                              <div class="btn-items__icon">
                                <Icon />
                              </div>
                              
                                
                              <div class="btn-items__price">
                                {czk.format(item.price)}
                              </div>
                              
                            </>
                          );
                        })()}
                      </button>
                    ))}
                  </div>
                </section>
              )
            ))
          )}

          {/* 2) karta: vlastní položka + na jméno */}
          <h2 className="sectionTitle">Možnosti</h2>
          <div className="card cardPad" style={{ marginTop: 16 }}>
            {/* a) Přidat vlastní položku */}
            {!showCustom ? (
              <button className="btn btn-warning" onClick={() => setShowCustom(true)}>
                + Přidat vlastní položku
              </button>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <div className="formRow">
                  <label className="label" htmlFor="customName">Název</label>
                  <input
                    id="customName"
                    className="input"
                    type="text"
                    placeholder="Např. Sleva / Zboží mimo nabídku"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                <div className="formRow">
                  <label className="label" htmlFor="customPrice">Cena (Kč)</label>
                  <input
                    id="customPrice"
                    className="input"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                  />
                </div>
                <div className="grid">
                  <button className="btn btn-primary" onClick={addCustomItem}>
                    Přidat do účtenky
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setShowCustom(false); setCustomName(''); setCustomPrice(''); }}
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            )}

            {/* b) Na jméno (staff / zákazník) */}
            {!showNameForm ? (
              <button
                className="btn btn-warning"
                onClick={() => {
                  setShowNameForm(true);
                  setIsStaff(true); // automaticky nastaví Staff = true
                  setTimeout(() => { issuedToRef.current?.focus(); }, 0);
                }}
              >
                + Na jméno
              </button>
            ) : (
              <div>
                <div className="formRow">
                  <label className="label" htmlFor="issuedTo">Jméno / identifikátor</label>
                  <input
                    ref={issuedToRef}
                    id="issuedTo"
                    className="input"
                    type="text"
                    placeholder="Např. Jana Nováková / ID: 123"
                    value={issuedTo}
                    onChange={(e) => setIssuedTo(e.target.value)}
                  />
                </div>
                <div className="formRow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    id="isStaff"
                    type="checkbox"
                    checked={isStaff}
                    onChange={(e) => setIsStaff(e.target.checked)}
                  />
                  <label htmlFor="isStaff" className="label">Staff účet</label>
                </div>
                <div className="grid">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowNameForm(false)}
                    disabled={!issuedTo.trim()}
                  >
                    Nastavit jméno
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setIssuedTo('');
                      setShowNameForm(false);
                      setIsStaff(false);
                    }}
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            )}

            {/* aktuálně nastavené jméno */}
            {issuedTo?.trim() ? (
              <p className="muted" style={{ marginTop: 8 }}>
                Aktuálně nastaveno: <strong>{issuedTo}</strong>
                {' '}• Staff: <strong>{isStaff ? 'Ano' : 'Ne'}</strong>
              </p>
            ) : null}
          </div>

          {/* 3) akční tlačítka */}
          <h2 className="sectionTitle">Akce</h2>
          <div className="grid" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={saveReceipt} disabled={receipt.length === 0}>
              Uložit účtenku
            </button>
            <button
              className="btn btn-danger"
              onClick={clearReceipt}
              disabled={receipt.length === 0}
            >
              Vyprázdnit účtenku
            </button>
          </div>
        </div>
      </div>

      {/* Pravý sloupec – sticky účtenka */}
      <aside className="receiptColumn">
        <div className="receipt">
          <h3 className="receipt__title">Účtenka</h3>

          {/* Meta info o příjemci */}
          {issuedTo?.trim() ? (
            <div className="receipt__meta">
              Pro: {issuedTo} {isStaff ? '• Staff' : ''}
            </div>
          ) : null}

          {receipt.length === 0 ? (
            <p className="muted">Zatím prázdná. Přidej položky vlevo.</p>
          ) : (
            <>
              {receipt.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="receipt__row">
                  <span className="receipt__name">{item.name}</span>
                  <span className="receipt__price">{czk.format(item.price || 0)}</span>
                </div>
              ))}
              <div className="receipt__total">
                <span>Celkem</span>
                <span>{czk.format(total)}</span>
              </div>
            </>
          )}
        </div>

        {receipt.length > 0 && (
          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            <button className="btn btn-primary" onClick={saveReceipt}>Uložit</button>
            <button className="btn btn-ghost" onClick={clearReceipt}>Vyčistit</button>
          </div>
        )}
      </aside>

      {/* ✅ neblokující potvrzovací modal */}
      {savedModalOpen && (
        <div className="modalOverlay" role="status" aria-live="polite">
          <div className="modalCard">
            <div className="modalIcon">✅</div>
            <div className="modalTitle">Účtenka uložena</div>
            <p className="modalText muted">Můžeš pokračovat další účtenkou.</p>
            <div className="modalActions">
              <button className="btn btn-primary" onClick={closeSavedModal}>Pokračovat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
