'use client';

import React, { useEffect, useState } from 'react';
import * as Fa from 'react-icons/fa6';

export default function EetSettings() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    eet_enable: false
  });

  useEffect(() => {
    fetch('/api/general')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && Object.keys(data).length > 0) {
           setFormData({
               eet_enable: Boolean(data.eet_enable)
           });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) alert('Nastavení uloženo');
      else alert('Chyba při ukládání');
    } catch (error) {
      console.error(error);
      alert('Chyba při ukládání');
    }
  };

  if (loading) return <div className="card skeleton"></div>;

  return (
    <div className="card h-100">
      <div className="card-header"><h5 className="mb-0">Elektronická evidence tržeb</h5></div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <h6 className="mb-3 text-mute">Evidence tržeb (EET)</h6>
          <div className="col-auto mb-3">
            <label className="form-check-label" htmlFor="eetEnabled">Zapnout evidenci tržeb (simulace)</label>
            <div className="form-check form-switch mt-3">
              <input className="form-check-input" type="checkbox" id="eetEnabled" name="eet_enable" checked={formData.eet_enable} onChange={handleChange} />
            </div>
          </div>
          <p className="text-mute small">Poznámka: Tato funkce je v současné době pouze pro testovací účely a negeneruje reálné kódy FIK přes servery finanční správy.</p>
          <div className="mt-4">
            <button type="submit" className="btn btn-primary"><Fa.FaFloppyDisk /> Uložit nastavení</button>
          </div>
        </form>
      </div>
    </div>
  );
}
