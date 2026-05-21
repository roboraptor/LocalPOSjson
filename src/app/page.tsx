// c:\projects\LocalPOSjson\src\app\page.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import * as Fa from 'react-icons/fa6';
import Modal from '@/components/Modal'; 
import { Item, Category, Tab } from '@/types/db';
import { QRCodeSVG } from 'qrcode.react';
import { generateSpaydString } from '@/lib/spayd';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });

export default function PosPage() {
  // --- Data ---
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tabsList, setTabsList] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Košík ---
  const [receipt, setReceipt] = useState<Item[]>([]);
  const [selectedReceiptItemIdx, setSelectedReceiptItemIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  
  // --- Modals State ---
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const [showNameModal, setShowNameModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tabInputName, setTabInputName] = useState('');
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [generalSettings, setGeneralSettings] = useState<any>({});
  
  // --- Načtení dat při startu ---
  const fetchAllData = async () => {
    try {
      const [itemsRes, catsRes, tabsRes, generalRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/categories'),
        fetch('/api/tabs'),
        fetch('/api/general')
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (tabsRes.ok) setTabsList(await tabsRes.json());
      if (generalRes.ok) setGeneralSettings(await generalRes.json());
    } catch (error) {
      console.error('Chyba načítání dat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- Logika košíku ---
  const addItem = (item: Item) => setReceipt((r) => [...r, item]);
  const clearReceipt = () => {
    setReceipt([]);
    setSelectedReceiptItemIdx(null);
    setActiveTab(null);
  };
  const removeItem = (indexToRemove: number) => setReceipt((r) => r.filter((_, idx) => idx !== indexToRemove));
  
  const total = receipt.reduce((sum, item) => sum + (item.price || 0), 0);

  const spaydString = useMemo(() => {
    if (!generalSettings?.bank_iban || receipt.length === 0) return '';
    return generateSpaydString({
      iban: generalSettings.bank_iban,
      amount: total,
      currency: 'CZK',
      msg: generalSettings.trx_msg || 'Platba',
      ks: generalSettings.trx_ks || '0308',
    });
  }, [generalSettings, total, receipt]);

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

  // --- Tab / Table Logic ---
  const handleSelectTab = async (tab: Tab) => {
    // Pokud máme něco v košíku, tak to přidáme k tabu a uložíme (Odložíme)
    if (receipt.length > 0) {
      const mergedItems = [...tab.items, ...receipt];
      await handleSaveTab(tab.id, mergedItems);
    } else {
      // Jinak tab načteme k úpravě
      setActiveTab(tab);
      setReceipt(tab.items);
    }
    setShowNameModal(false);
    setShowTableModal(false);
  };

  const handleCreateNewTab = async (isTable: boolean, forcedName?: string) => {
    const name = (forcedName || tabInputName).trim();
    if (!name) return alert('Zadej název.');
    
    try {
      const res = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          is_permanent: isTable ? 1 : 0,
          is_table: isTable,
          is_staff: false,
          items: receipt // uloží se rovnou i s aktuálním košíkem, ať je prázdný nebo ne
        })
      });
      if (!res.ok) throw new Error('Chyba při ukládání tabu.');
      
      await fetchAllData();
      clearReceipt();
      setShowNameModal(false);
      setShowTableModal(false);
      setTabInputName('');
    } catch (e: any) {
      alert(e.message || 'Chyba');
    }
  };

  const handleSaveTab = async (id?: number, itemsToSave?: Item[]) => {
    const tabId = id || activeTab?.id;
    if (!tabId) return;

    try {
      const res = await fetch('/api/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tabId,
          items: itemsToSave || receipt
        })
      });
      if (!res.ok) throw new Error('Chyba při aktualizaci tabu.');
      
      await fetchAllData();
      clearReceipt();
    } catch (e: any) {
      alert(e.message || 'Chyba');
    }
  };

  // --- Uložení účtenky (Checkout) ---
  const saveReceipt = async () => {
    if (receipt.length === 0) return alert('Účtenka je prázdná.');

    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt,
          issued_to: activeTab ? activeTab.name : null
        })
      });

      if (!res.ok) throw new Error('Chyba při ukládání.');

      // Pokud platíme tab, vymažeme ho (nebo vyprázdníme stůl)
      if (activeTab) {
        if (activeTab.is_table) {
          // Stůl se nemaže, jen vyprázdní
          await fetch('/api/tabs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeTab.id, items: [] })
          });
        } else {
          // Obyčejný účet se smaže
          await fetch('/api/tabs', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeTab.id })
          });
        }
      }

      await fetchAllData();
      clearReceipt();
      
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
              <div className="btn-items__icon"><Fa.FaUser /></div>
            </button>
            <button className="btn btn-warning btn-items--tri" onClick={() => setShowTableModal(true)}>
              <div className="btn-items__title">Na stůl</div>
              <div className="btn-items__icon"><Fa.FaChair /></div>
            </button>
            {activeTab && (
              <button className="btn btn-warning btn-items--tri" onClick={() => handleSaveTab()}>
                <div className="btn-items__title">Odložit</div>
                <div className="btn-items__icon"><Fa.FaFloppyDisk /></div>        
              </button>
            )}
            <button className="btn btn-primary btn-items--tri" onClick={saveReceipt} disabled={receipt.length === 0}>
              <div className="btn-items__title">{activeTab ? 'Zaplatit účtenku' : 'Zaplatit'}</div>
              <div className="btn-items__icon"><Fa.FaMoneyBill /></div>
            </button>
            <button className="btn btn-primary btn-items--tri" onClick={() => setShowQRModal(true)} disabled={receipt.length === 0}>
              <div className="btn-items__title">{activeTab ? 'Zaplatit QR' : 'Zaplatit QR'}</div>
              <div className="btn-items__icon"><Fa.FaQrcode /></div>
            </button>
            <button className="btn btn-danger btn-items--tri" onClick={clearReceipt} disabled={receipt.length === 0 && !activeTab}>
              <div className="btn-items__title">{activeTab ? 'Zrušit' : 'Vyprázdnit'}</div>
              <div className="btn-items__icon"><Fa.FaTrashCan /></div>
            </button>
          </div>


        </div>
      </div>

      {/* Pravý sloupec - Účtenka */}
      <aside className="receiptColumn">
        <div className="receipt">
          <h3 className="receipt__title">Účtenka {activeTab && `(${activeTab.is_table ? 'Stůl' : 'Účet'}: ${activeTab.name})`}</h3>
          
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

      <Modal open={showNameModal} onClose={() => setShowNameModal(false)} title="Na Účet">
        <div className="formRow">
          <label className="label">Nový účet (Jméno)</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input className="input" autoFocus value={tabInputName} onChange={e => setTabInputName(e.target.value)} placeholder="např. Karel..." />
            <button className="btn btn-success" onClick={() => handleCreateNewTab(false)}>Vytvořit</button>
          </div>
        </div>
        
        {tabsList.filter(t => !t.is_table).length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>Otevřené účty:</h4>
            <div className="grid-tiny" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {tabsList.filter(t => !t.is_table).map(tab => (
                <button key={tab.id} className="btn btn-warning" onClick={() => handleSelectTab(tab)} style={{ height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <strong>{tab.name}</strong>
                  <small>{czk.format(tab.items.reduce((acc: number, i: Item) => acc + (i.price || 0), 0))}</small>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="modalActions" style={{ marginTop: '20px' }}>
          <button className="btn btn-ghost" onClick={() => { setTabInputName(''); setShowNameModal(false); }}>Zavřít</button>
        </div>
      </Modal>

      <Modal open={showTableModal} onClose={() => setShowTableModal(false)} title="Na Stůl">
        {tabsList.filter(t => t.is_table).length > 0 ? (
          <div>
            <h4 style={{ marginBottom: '10px' }}>Výběr stolu:</h4>
            <div className="grid-tiny" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {tabsList.filter(t => t.is_table).map(tab => {
                const total = tab.items.reduce((acc: number, i: Item) => acc + (i.price || 0), 0);
                return (
                  <button key={tab.id} className={`btn ${total > 0 ? 'btn-danger' : 'btn-success'}`} onClick={() => handleSelectTab(tab)} style={{ height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <strong>{tab.name}</strong>
                    {total > 0 ? <small>{czk.format(total)}</small> : <small>Volný</small>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="muted">Zatím nejsou vytvořeny žádné stoly. Lze je přidat v administraci stolů.</p>
        )}
        <div className="modalActions" style={{ marginTop: '20px' }}>
          <button className="btn btn-ghost" onClick={() => { setTabInputName(''); setShowTableModal(false); }}>Zavřít</button>
        </div>
      </Modal>

      <Modal open={savedModalOpen} onClose={() => setSavedModalOpen(false)} title="Hotovo">
        <div style={{ textAlign: 'center', fontSize: '3rem' }}>✅</div>
        <p style={{ textAlign: 'center' }}>Účtenka uložena.</p>
        <div className="modalActions ">
          <button className="btn btn-success btn-items--tri" onClick={() => setSavedModalOpen(false)}>
            <div className="btn-items__title">Zaplaceno</div>
            <div className="btn-items__icon"><Fa.FaMoneyBill /></div>
          </button>
        </div>
      </Modal>

      <Modal open={showQRModal} onClose={() => setShowQRModal(false)} title="QR Platba">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
          {spaydString ? (
            <>
              <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
                <QRCodeSVG value={spaydString} size={256} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>K úhradě: {czk.format(total)}</h3>
                <p style={{ margin: 0, color: '#666' }}>Oskenujte QR kód v bankovní aplikaci.</p>
              </div>
            </>
          ) : (
            <p className="muted">Není nastaven IBAN pro platby, nebo je účtenka prázdná.</p>
          )}
        </div>
        <div className=" modalActions">
          <button className="btn btn-success btn-items--tri " onClick={() => {
            saveReceipt();
            setShowQRModal(false);
          }}>
            <div className="btn-items__title">Zaplaceno</div>
            <div className="btn-items__icon"><Fa.FaQrcode /></div>
          </button>
          <button className="btn btn-ghost btn-items--tri" onClick={() => setShowQRModal(false)}>
            <div className="btn-items__title">Zrušit</div>
            <div className="btn-items__icon"><Fa.FaTrashCan /></div>
          </button>
        </div>
      </Modal>

    </div>
  );
}
