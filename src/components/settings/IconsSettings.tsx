'use client';

import React, { useState, useEffect } from 'react';
import * as Fa from 'react-icons/fa6';
import IconPicker from '@/components/IconPicker';

function IconByName({ name, size = 18 }: { name: string | null | undefined; size?: number }) {
  const iconName = name as keyof typeof Fa;
  const Comp = (name && Fa[iconName]) ? Fa[iconName] : Fa.FaRegSquare;
  return <Comp size={size} />;
}

export default function IconsSettings() {
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zvláštní state pro picker, protože do něj vybíráme dočasně
  const [newIcon, setNewIcon] = useState<string>('');

  useEffect(() => {
    async function loadIcons() {
      try {
        const res = await fetch('/api/icons', { cache: 'no-store' });
        if (!res.ok) throw new Error('Chyba načítání');
        const data = await res.json();
        setIcons(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadIcons();
  }, []);

  const saveIcons = async (newIconsList: string[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icons: newIconsList })
      });
      if (!res.ok) throw new Error('Chyba ukládání');
      setIcons(newIconsList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddIcon = () => {
    if (!newIcon) return;
    if (icons.includes(newIcon)) {
      alert('Tato ikona už v oblíbených je.');
      return;
    }
    
    const updated = [...icons, newIcon];
    saveIcons(updated);
    setNewIcon(''); // Reset pickeru
  };

  const handleRemoveIcon = (iconToRemove: string) => {
    const updated = icons.filter(i => i !== iconToRemove);
    saveIcons(updated);
  };

  if (loading) return <div className="card cardPad">Načítám...</div>;

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="mb-0">Správa oblíbených ikon</h5>
      </div>
      <div className="card-body">
        <p style={{ marginBottom: '1rem' }}>
        Tyto ikony se budou zobrazovat v horní nabídce při vybírání ikon pro položky a kategorie, abyste k nim měli rychlý přístup.
        </p>
      
        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ marginBottom: '2rem' }}>
            <h6 className="mb-3 text-mute">Aktuální oblíbené:</h6>
            {icons.length === 0 ? (
            <p className="muted">Zatím nemáte žádné oblíbené ikony.</p>
            ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {icons.map(iconName => (
                <div 
                    key={iconName} 
                    className="card" 
                    style={{ 
                    color: 'var(--fg)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '10px 15px',
                    background: 'var(--surface-2)'
                    }}
                >
                    <IconByName name={iconName} size={24} />
                    <code>{iconName}</code>
                    <button 
                    className="btn btn-danger" 
                    style={{ padding: '4px 8px', marginLeft: '10px' }}
                    onClick={() => handleRemoveIcon(iconName)}
                    disabled={saving}
                    >
                    <Fa.FaTrashCan />
                    </button>
                </div>
                ))}
            </div>
            )}
        </div>

        <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

        <div>
            <h6 className="mb-3 text-mute">Přidat novou ikonu:</h6>
            <div style={{ maxWidth: '900px' }}>
            <IconPicker 
                value={newIcon} 
                onChange={(name) => setNewIcon(name)} 
                placeholder="Hledat ikonu (např. coffee)..." 
            />
            <button 
                className="btn btn-success" 
                style={{ marginTop: '1rem' }} 
                onClick={handleAddIcon}
                disabled={!newIcon || saving}
            >
                <Fa.FaPlus /> Přidat do oblíbených
            </button>
            </div>
        </div>
      </div>
    </div>
  );
}