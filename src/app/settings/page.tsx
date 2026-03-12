'use client';
import React, { useState } from 'react';
import Link from 'next/link';

import CategoriesSettings from '@/components/settings/CategoriesSettings';
import GeneralSettings from '@/components/settings/GeneralSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="pageTitle">Nastavení</h1>
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="list-group">
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
          </div>
        </div>

        <div className="col-md-9">
          <div className="card shadow-sm border-0"></div>
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'categories' && <CategoriesSettings />}
          </div>
      </div>
    

    </div>
  );
}