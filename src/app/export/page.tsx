'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Fa from 'react-icons/fa6';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [dbPath, setDbPath] = useState('Načítám...');

  useEffect(() => {
    fetch('/api/settings/db')
      .then(res => res.json())
      .then(data => setDbPath(data.dbPath || 'data/pos.db'))
      .catch(() => setDbPath('data/pos.db (chyba načítání)'));
  }, []);

  // --- Funkce pro stažení souboru ---
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // --- Export Účtenek (CSV) ---
  const exportReceiptsCsv = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/receipts');
      if (!res.ok) throw new Error('Chyba při stahování dat');
      const data = await res.json();

      // Hlavička CSV
      const header = ['ID', 'Datum', 'Čas', 'Vystaveno pro', 'Staff', 'Celkem', 'Položky'];
      const rows = data.map((r: any) => {
        const dateObj = new Date(r.created_at);
        const date = dateObj.toLocaleDateString('cs-CZ');
        const time = dateObj.toLocaleTimeString('cs-CZ');
        
        // Výpočet celkové ceny
        const total = (r.items || []).reduce((sum: number, it: any) => sum + (it.price || 0), 0);
        
        // Seznam položek jako string "Káva (50), Voda (20)"
        const itemsStr = (r.items || [])
          .map((it: any) => `${it.name} (${it.price})`)
          .join(', ');

        return [
          r.id,
          date,
          time,
          r.issued_to || '',
          r.is_staff ? 'ANO' : 'NE',
          total,
          `"${itemsStr.replace(/"/g, '""')}"` // Ošetření uvozovek pro CSV
        ].join(';');
      });

      const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\n'); // \uFEFF je BOM pro Excel
      downloadFile(csvContent, `uctenky_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    } catch (e: any) {
      alert('Export selhal: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Export Položek (JSON záloha) ---
  const exportItemsJson = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Chyba při stahování dat');
      const data = await res.json();

      const jsonContent = JSON.stringify(data, null, 2);
      downloadFile(jsonContent, `items_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    } catch (e: any) {
      alert('Export selhal: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

    // --- Export Položek (CSV) ---
    const exportItemsCsv = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/items');
          if (!res.ok) throw new Error('Chyba při stahování dat');
          const data = await res.json();
    
          const header = ['ID', 'Název', 'Cena', 'Kategorie', 'Pozice'];
          const rows = data.map((item: any) => [
              item.id,
              `"${item.name.replace(/"/g, '""')}"`,
              item.price,
              item.category,
              item.position
          ].join(';'));
    
          const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\n');
          downloadFile(csvContent, `items_export_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
        } catch (e: any) {
          alert('Export selhal: ' + e.message);
        } finally {
          setLoading(false);
        }
      };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center my-3">
        <h1 className="pageTitle my-0">Export dat</h1>

      </div>

      <div className="grid">
        {/* Karta: Účtenky */}
        <div className="card cardPad">
          <h2 className="card-header d-flex gap-2"><Fa.FaReceipt /> Účtenky</h2>
          <p className="text-mute">Stáhnout přehled všech uložených účtenek do CSV souboru (pro Excel).</p>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={exportReceiptsCsv} disabled={loading}>
              {loading ? 'Pracuji...' : 'Stáhnout .CSV'}
            </button>
          </div>
        </div>

        {/* Karta: Položky */}
        <div className="card cardPad">
          <h2 className="card-header d-flex gap-2"><Fa.FaBurger /> Položky</h2>
          <p className="text-mute">Exportovat definice položek (ceny, kategorie).</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={exportItemsJson} disabled={loading}>
              Záloha .JSON
            </button>
            <button className="btn btn-secondary" onClick={exportItemsCsv} disabled={loading}>
              Export .CSV
            </button>
          </div>
        </div>

        {/* Karta: Databáze (Info) */}
        <div className="card cardPad">
          <h2 className="card-header d-flex gap-2"><Fa.FaDatabase /> Databáze</h2>
          <p className="text-mute mb-2"> Všechna data jsou uložena lokálně v souboru: </p>
          <input type="text" readOnly value={dbPath} className="form-control mb-2" />
          <p className="text-mute mb-2" style={{ fontSize: '0.85em' }}>Pro kompletní zálohu stačí tento soubor zkopírovat.</p>
        </div>
      </div>
    </div>
  );
}