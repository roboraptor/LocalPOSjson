import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Modal from '../components/Modal';
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

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const CATEGORIES = ['Nápoje', 'Jídlo', 'Ostatní'];
  const grouped = CATEGORIES.map(cat => ({
    cat,
    items: menuItems.filter(i => (i.category || 'Ostatní') === cat)
  }));

  // --- MODAL: vlastní položka ---
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(''); // string -> převedeme až při uložení

  // --- MODAL: jméno na účtenku (staff / zákazník) ---
  const [showNameModal, setShowNameModal] = useState(false);
  const [issuedTo, setIssuedTo] = useState(''); // uložíme do /api/save
  const [isStaff, setIsStaff] = useState(false);

  const addItem = (item) => setReceipt((r) => [...r, item]);
  const clearReceipt = () => setReceipt([]);

  const addCustomItem = () => {
    const name = customName.trim();
    // povolíme čísla + mínus; tečky/čárky převedeme na tečku a pak na číslo
    const normalized = String(customPrice).replace(',', '.').trim();
    const priceNum = normalized === '' ? NaN : Number(normalized);

    if (!name) { alert('Zadej název položky.'); return; }
    if (!Number.isFinite(priceNum)) { alert('Cena musí být číslo (povoleno i záporné).'); return; }

    addItem({ name, price: priceNum });
    setCustomName('');
    setCustomPrice('');
    setShowCustomModal(false);
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

      // ✅ vyčisti hned a ukaž modal
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
      {/* Levý sloupec – nabídka + akce */}
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
                <section key={cat} style={{ marginBottom: 10 }}>
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
                              <div className="btn-items__title">
                                {item.name}
                              </div>

                              <div className="btn-items__icon">
                                <Icon />
                              </div>

                              <div className="btn-items__price">
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

          {/* 2) karta: Možnosti (už jen tlačítka, formuláře jsou v modalech) */}
          <h2 className="sectionTitle">Možnosti</h2>
          <div className="buttons " >
            <button
              className="btn btn-warning btn-items--tri"
              onClick={() => setShowCustomModal(true)}
            >
              <div className="btn-items__title">
                Vlastní <br /> položka
              </div>
              <div className="btn-items__icon">
                <Fa.FaRegSquarePlus />
              </div>
            </button>

            <button
              className="btn btn-warning btn-items--tri"
              onClick={() => {
                setIsStaff(true); // výchozí „Staff účet“ = zapnuto (můžeš vypnout v modalu)
                setShowNameModal(true);
              }}
            >
              <div className="btn-items__title">
                Na účet
              </div>
              {issuedTo?.trim() ? (
                <p className="muted" style={{ marginTop: 30 }}>
                {issuedTo}
                
                <br /> Staff: <strong>{isStaff ? 'Ano' : 'Ne'}</strong></p>
              ) : null}

              {isStaff ? (
                <div className="btn-items__icon">
                  <Fa.FaUserTie />
               </div>
              ) : (
                <div className="btn-items__icon">
                  <Fa.FaUser />
               </div>
              )}

              
              
            </button>

            {/* aktuálně nastavené jméno 
            {issuedTo?.trim() ? (
              <button
              className="btn btn-warning btn-items--tri">

              <p className="muted" style={{ marginTop: 8 }}>
                Aktuálně nastaveno: <strong>{issuedTo}</strong>
                <br /> Staff: <strong>{isStaff ? 'Ano' : 'Ne'}</strong>
              </p>
              </button>
            ) : null}
            */}


            <button
              className="btn btn-warning btn-items--tri"
              onClick={() => {
                setIsStaff(true); // výchozí „Staff účet“ = zapnuto (můžeš vypnout v modalu)
                setShowNameModal(true);
              }}
            >
              <div className="btn-items__title">
                Na stůl
              </div>
              <div className="btn-items__icon">
                <Fa.FaMapPin />
              </div>
            </button>

            
          </div>

          {/* 3) akční tlačítka */}
          <h2 className="sectionTitle">Akce</h2>
          <div className="grid" style={{ marginTop: 10 }}>
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

      {/* ✅ potvrzovací modal po uložení */}
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

      {/* 🔶 Modal: Vlastní položka */}
      <Modal open={showCustomModal} onClose={() => setShowCustomModal(false)} title="Přidat vlastní položku">
        <div className="formRow">
          <label className="label" htmlFor="customName">Název</label>
          <input
            id="customName"
            className="input"
            type="text"
            placeholder="Např. Sleva / Zboží mimo nabídku"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="formRow">
          <label className="label" htmlFor="customPrice">Cena (Kč)</label>
          <input
            id="customPrice"
            className="input"
            type="text"
            inputMode="numeric"
            pattern="-?[0-9]*([.,][0-9]+)?"
            placeholder="např. 0 nebo -20"
            title="Povoleno je číslo, případně se znakem mínus pro slevu"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
          />
        </div>
        <div className="modalActions" style={{ gap: 8 }}>
          <button className="btn btn-success" onClick={addCustomItem}>Přidat</button>
          <button className="btn btn-ghost" onClick={() => { setShowCustomModal(false); setCustomName(''); setCustomPrice(''); }}>Zrušit</button>
        </div>
      </Modal>

      {/* 🔷 Modal: Na jméno */}
      <Modal open={showNameModal} onClose={() => setShowNameModal(false)} title="Zadat jméno zákazníka">
        <div className="formRow">
          <label className="label" htmlFor="issuedTo">Jméno / identifikátor</label>
          <input
            id="issuedTo"
            className="input"
            type="text"
            placeholder="Např. Jana Nováková / ID: 123"
            value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)}
            autoFocus
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
        <div className="modalActions" style={{ gap: 8 }}>
          <button
            className="btn btn-success"
            onClick={() => setShowNameModal(false)}
            disabled={!issuedTo.trim()}
          >
            Nastavit
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setIssuedTo('');
              setIsStaff(false);
              setShowNameModal(false);
            }}
          >
            Zrušit
          </button>
        </div>
      </Modal>
    </div>
  );
}
