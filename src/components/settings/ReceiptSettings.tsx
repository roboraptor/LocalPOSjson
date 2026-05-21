'use client';

import React, { useEffect, useState } from 'react';
import * as Fa from 'react-icons/fa6';

export default function ReceiptSettings() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    currency: 'CZK',
    tax_rate: 21,
    tax_enabled: false,
    receipt_title: '',
    receipt_header: '',
    receipt_header_enabled: false,
    receipt_footer: '',
    receipt_footer_enabled: false
  });

  useEffect(() => {
    fetch('/api/general')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && Object.keys(data).length > 0) {
           setFormData({
               currency: data.currency || 'CZK',
               tax_rate: data.tax_rate || 21,
               tax_enabled: Boolean(data.tax_enabled),
               receipt_title: data.receipt_title || '',
               receipt_header: data.receipt_header || '',
               receipt_header_enabled: Boolean(data.receipt_header_enabled),
               receipt_footer: data.receipt_footer || '',
               receipt_footer_enabled: Boolean(data.receipt_footer_enabled)
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
      <div className="card-header"><h5 className="mb-0">Nastavení vzhledu účtenky</h5></div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <h6 className="mb-3 text-mute">Vzhled účtenky</h6>
          <div className="row mb-3">
            <div className="col-md-6">
                <label className="form-label fw-bold">Nadpis účtenky</label>
                <input type="text" className="form-control" name="receipt_title" value={formData.receipt_title || ''} onChange={handleChange} placeholder="např. 'Daňový doklad'" />
            </div>
            <div className="col-auto mb-3">
                <label className="form-label">Měna</label>
                <input type="text" className="form-control" name="currency" style={{ maxWidth: 80 }} value={formData.currency || 'CZK'} onChange={handleChange} />
            </div>
            <div className="col-auto mb-3">
              <label className="form-check-label" htmlFor="taxEnabled">Plátce DPH</label>
              <div className="form-check form-switch mt-3">
                <input className="form-check-input" type="checkbox" id="taxEnabled" name="tax_enabled" checked={formData.tax_enabled} onChange={handleChange} />
              </div>
            </div>
            <div className="col-auto mb-3">
              <label className="form-label">Sazba DPH</label>
              <input type="number" className="form-control" name="tax_rate" style={{ maxWidth: 80 }} value={formData.tax_rate} onChange={handleChange} disabled={!formData.tax_enabled} />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
                <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="headerEnabled" name="receipt_header_enabled" checked={formData.receipt_header_enabled} onChange={handleChange} />
                    <label className="form-check-label fw-bold" htmlFor="headerEnabled">Hlavička</label>
                </div>
                <textarea className="form-control" rows={2} name="receipt_header" value={formData.receipt_header || ''} onChange={handleChange} placeholder="Text v hlavičce..." disabled={!formData.receipt_header_enabled}></textarea>
            </div>
            <div className="col-md-6">
                <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="footerEnabled" name="receipt_footer_enabled" checked={formData.receipt_footer_enabled} onChange={handleChange} />
                    <label className="form-check-label fw-bold" htmlFor="footerEnabled">Patička</label>
                </div>
                <textarea className="form-control" rows={2} name="receipt_footer" value={formData.receipt_footer || ''} onChange={handleChange} placeholder="Text v patičce..." disabled={!formData.receipt_footer_enabled}></textarea>
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" className="btn btn-primary"><Fa.FaFloppyDisk /> Uložit nastavení</button>
          </div>
        </form>
      </div>
    </div>
  );
}
