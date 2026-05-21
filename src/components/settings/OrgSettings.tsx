'use client';

import React, { useEffect, useState } from 'react';
import * as Fa from 'react-icons/fa6';

export default function OrgSettings() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_address: '',
    organization_owner: '',
    organization_id: '',
    organization_vat_id: ''
  });

  useEffect(() => {
    fetch('/api/general')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && Object.keys(data).length > 0) {
           setFormData({
             organization_name: data.organization_name || '',
             organization_address: data.organization_address || '',
             organization_owner: data.organization_owner || '',
             organization_id: data.organization_id || '',
             organization_vat_id: data.organization_vat_id || ''
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
      <div className="card-header"><h5 className="mb-0">Základní údaje organizace</h5></div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <h6 className="mb-3 text-mute">Organizace</h6>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Název organizace</label>
              <input type="text" className="form-control" name="organization_name" value={formData.organization_name || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">Majitel / Provozovatel</label>
              <input type="text" className="form-control" name="organization_owner" value={formData.organization_owner || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
                <label className="form-label">IČO</label>
                <input type="text" className="form-control" name="organization_id" value={formData.organization_id || ''} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
                <label className="form-label">DIČ</label>
                <input type="text" className="form-control" name="organization_vat_id" value={formData.organization_vat_id || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Adresa provozovny</label>
            <textarea className="form-control" rows={3} name="organization_address" value={formData.organization_address || ''} onChange={handleChange}></textarea>
          </div>
          <div className="mt-4">
            <button type="submit" className="btn btn-primary"><Fa.FaFloppyDisk /> Uložit nastavení</button>
          </div>
        </form>
      </div>
    </div>
  );
}
