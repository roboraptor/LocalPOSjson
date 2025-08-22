// components/Header.js
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();

  const navLinks = [
    { href: '/', label: 'Pokladna' },
    { href: '/receipts', label: 'Účtenky' },
    { href: '/items', label: 'Editor položek' },
  ];

  return (
    <header className="siteHeader">
      <div className="siteHeader__inner">
        <h1 className="siteHeader__logo">🧾 Lokální Pokladna</h1>
        <nav className="siteHeader__nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`siteHeader__link ${
                router.pathname === link.href ? 'active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
