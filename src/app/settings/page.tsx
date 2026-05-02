'use client';
import React, { useState } from 'react';
import Link from 'next/link';

import CategoriesSettings from '@/components/settings/CategoriesSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';
import IconsSettings from '@/components/settings/IconsSettings';
import TablesSettings from '@/components/settings/TablesSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="pageTitle">Nastavení</h1>
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="shadow-sm border-0 list-group">
            <button 
              className={`list-group-item list-group-item-action ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              🏢 Obecné
            </button>
            <button 
              className={`list-group-item list-group-item-action ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              🏢 Kategorie
            </button>
            <button 
              className={`list-group-item list-group-item-action ${activeTab === 'icons' ? 'active' : ''}`}
              onClick={() => setActiveTab('icons')}
            >
              ⭐ Ikony
            </button>
            <button 
              className={`list-group-item list-group-item-action ${activeTab === 'tables' ? 'active' : ''}`}
              onClick={() => setActiveTab('tables')}
            >
              🪑 Stoly a Účty
            </button>
          </div>
        </div>

        <div className="col-md-9">
          <div className="card shadow-sm border-0"></div>
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'categories' && <CategoriesSettings />}
            {activeTab === 'icons' && <IconsSettings />}
            {activeTab === 'tables' && <TablesSettings />}
          </div>
      </div>
    

    </div>
  );
}