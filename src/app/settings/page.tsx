'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Fa from 'react-icons/fa6';

import CategoriesSettings from '@/components/settings/CategoriesSettings';
import OrgSettings from '@/components/settings/OrgSettings';
import ReceiptSettings from '@/components/settings/ReceiptSettings';
import PaymentSettings from '@/components/settings/PaymentSettings';
import EetSettings from '@/components/settings/EetSettings';
import IconsSettings from '@/components/settings/IconsSettings';
import TablesSettings from '@/components/settings/TablesSettings';
import DBSettings from '@/components/settings/DBSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('org_info');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Kontrola, zda je uživatel již přihlášen v rámci session
    if (sessionStorage.getItem('pos_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('pos_admin_auth', 'true');
      } else {
        setError(data.error || 'Přihlášení selhalo.');
      }
    } catch (err) {
      setError('Chyba při komunikaci se serverem.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pos_admin_auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="card shadow-sm p-4" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="text-center mb-4">
            <Fa.FaLock size={40} className="text-primary mb-3" />           
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <input 
                type="password" 
                className={`form-control ${error ? 'is-invalid' : ''}`}
                placeholder="Zadejte heslo..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <div className="invalid-feedback">{error}</div>}
            </div>
            <button 
              type="submit" 
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? 'Ověřování...' : <><Fa.FaUnlock /> Vstoupit</>}
            </button>
          </form>
          
          <div className="text-center mt-4">

            <Link href="/" className="text-decoration-none d-flex align-items-center justify-content-center small gap-2 text-secondary">
              <Fa.FaArrowLeft /> Zpět na hlavní obrazovku 
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center my-3">
        <h1 className="pageTitle my-0">Nastavení</h1>
        <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2" style={{ height: 36}} onClick={handleLogout}>
          <Fa.FaPowerOff /> Odhlásit se
        </button>
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="shadow-sm border-0 list-group mb-4">
            <div className="list-group-item small fw-bold text-uppercase text-mute py-2">Správa obchodu</div>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              📂 Kategorie
            </button>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'tables' ? 'active' : ''}`}
              onClick={() => setActiveTab('tables')}
            >
              🪑 Stoly a Účty
            </button>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'icons' ? 'active' : ''}`}
              onClick={() => setActiveTab('icons')}
            >
              ⭐ Ikony
            </button>

            <div className="list-group-item small fw-bold text-uppercase text-mute py-2 mt-3">Organizace a Provoz</div>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'org_info' ? 'active' : ''}`}
              onClick={() => setActiveTab('org_info')}
            >
              🏢 Základní údaje
            </button>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'receipt_info' ? 'active' : ''}`}
              onClick={() => setActiveTab('receipt_info')}
            >
              📑 Vzhled účtenky
            </button>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'payment_info' ? 'active' : ''}`}
              onClick={() => setActiveTab('payment_info')}
            >
              💳 Platební QR kódy
            </button>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'eet_info' ? 'active' : ''}`}
              onClick={() => setActiveTab('eet_info')}
            >
              📡 Evidence tržeb (EET)
            </button>

            <div className="list-group-item small fw-bold text-uppercase text-mute py-2 mt-3">Aplikace</div>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'db_settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('db_settings')}
            >
              🗄️ Databáze
            </button>

          </div>
        </div>

        <div className="col-md-9">
          <div className="card shadow-sm border-0">
            {activeTab === 'categories' && <CategoriesSettings />}
            {activeTab === 'icons' && <IconsSettings />}
            {activeTab === 'tables' && <TablesSettings />}
            {activeTab === 'org_info' && <OrgSettings />}
            {activeTab === 'receipt_info' && <ReceiptSettings />}
            {activeTab === 'payment_info' && <PaymentSettings />}
            {activeTab === 'eet_info' && <EetSettings />}
            {activeTab === 'db_settings' && <DBSettings />}
          </div>
        </div>
      </div>
    

    </div>
  );
}
