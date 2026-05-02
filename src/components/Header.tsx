'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Pokladna' },
    { href: '/items', label: 'Položky' },
    { href: '/receipts', label: 'Účtenky' },
    { href: '/tables', label: 'Stoly a Účty' },
    { href: '/export', label: 'Export' },
    { href: '/settings', label: 'Nastavení' },
  ];

  return (
    <nav className="navbar navbar-expand-sm navbar-dark shadow-sm">
      <div className="container">
        <Link href="/" className="navbar-brand fw-bold">
          LocalPOSsqlite
        </Link>

        <button 
          className="navbar-toggler super-center btn btn-warning" 
          style={{  height: 34}}
          type="button" 
          onClick={() => setExpanded(!expanded)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`}>
          <div className="navbar-nav ms-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`btn btn-warning nav-link super-center ${pathname === link.href ? 'active' : ''}`}
                style={{ marginLeft: 5, marginBottom:3, height: 34}}
                onClick={() => setExpanded(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}