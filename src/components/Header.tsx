'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Pokladna' },
    { href: '/receipts', label: 'Účtenky' },
    { href: '/items', label: 'Editor položek' },
    { href: '/settings', label: 'Nastavení' },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-sm">
      <div className="container">
        <Link href="/" className="navbar-brand fw-bold">
          LocalPOSsqlite
        </Link>

        <button 
          className="navbar-toggler" 
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
                className={`nav-link ${pathname === link.href ? 'active' : ''}`}
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