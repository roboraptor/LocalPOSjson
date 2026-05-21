'use client';
import React, { useState } from 'react';
import Link from 'next/link';

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
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="pageTitle">Nastavení</h1>
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="shadow-sm border-0 list-group mb-4">
            <div className="list-group-item bg-light small fw-bold text-uppercase text-muted py-2">Správa obchodu</div>
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

            <div className="list-group-item bg-light small fw-bold text-uppercase text-muted py-2 mt-3">Organizace a Provoz</div>
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

            <div className="list-group-item bg-light small fw-bold text-uppercase text-muted py-2 mt-3">Aplikace</div>
            <button 
              className={`list-group-item list-group-item-action border-start-0 border-end-0 ${activeTab === 'db_settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('db_settings')}
            >
              🗄️ Databáze
            </button>

          </div>
        </div>

        <div className="col-md-9">
          <div className="card shadow-sm border-0"></div>
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
  );
}