// components/IconPicker.jsx
import { useMemo, useState } from "react";
import * as Fa from "react-icons/fa6";

const ALL_FA = Object.entries(Fa)
  .filter(([name]) => name.startsWith("Fa"))
  .map(([name, Comp]) => ({ name, Comp }));

// Jednoduchá mapa aliasů pro lepší vyhledávání (včetně českých výrazů)
const ICON_ALIASES = {
  FaCubes: ["produkt", "položka", "box", "item"],
  FaMugSaucer: ["káva", "čaj", "coffee", "tea", "hrnek", "horký", "nápoj"],
  FaBeerMugEmpty: ["pivo", "alkohol", "beer"],
  FaWineGlass: ["víno", "wine", "alkohol"],
  FaGlassWater: ["voda", "nealko", "water", "drink"],
  FaUtensils: ["jídlo", "příbor", "food", "restaurant"],
  FaBurger: ["burger", "jídlo", "fastfood"],
  FaPizzaSlice: ["pizza", "jídlo"],
  FaIceCream: ["zmrzlina", "dezert", "ice cream"],
  FaCakeCandles: ["dort", "narozeniny", "dezert", "cake"],
  FaMoneyBillWave: ["peníze", "hotovost", "cash", "platba"],
  FaCreditCard: ["karta", "platba", "card"],
  FaReceipt: ["účtenka", "doklad", "receipt"],
  FaUser: ["uživatel", "person", "osoba"],
  FaPen: ["tužka", "edit", "upravit", "psát"],
  FaTrashCan: ["koš", "smazat", "delete", "trash"],
};

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  favorites?: string[];
}

export default function IconPicker({
  value,
  onChange,
  placeholder = "Hledat ikonu…",
  favorites = [],
}: IconPickerProps) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [isBrowsingAll, setIsBrowsingAll] = useState(false);
  const pageSize = 20;

  // Memoized list of icons based on search query
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ALL_FA;
    return ALL_FA.filter(({ name }) => {
      const lowerName = name.toLowerCase();
      // Hledání v názvu ikony (např. "FaCoffee" obsahuje "coffee")
      if (lowerName.includes(s)) return true;

      // Hledání v aliasech
      const aliases = ICON_ALIASES[name] || [];
      return aliases.some((alias) => alias.toLowerCase().includes(s));
    });
  }, [q]);

  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const pageItems = list.slice(page * pageSize, page * pageSize + pageSize);

  const Selected = value && Fa[value] ? Fa[value] : null;

  // Vytvoří seznam komponent pro oblíbené ikony
  const favoriteItems = useMemo(
    () =>
      favorites
        .map((favName) => ALL_FA.find((icon) => icon.name === favName))
        .filter((icon: any) => icon !== undefined) as { name: string; Comp: any }[],
    [favorites],
  );

  // When the user starts typing, we should exit the "browse all" mode.
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQ(newQuery);
    setPage(0);
    if (newQuery) {
      setIsBrowsingAll(false);
    }
  };

  const toggleBrowseAll = () => {
    setIsBrowsingAll((prev) => {
      const next = !prev;
      // If we start browsing, clear the query
      if (next) {
        setQ("");
      }
      return next;
    });
    setPage(0);
  };

  return (
    <div className="ip">
      {/* <div className="ip-current">
        <span className="form-label">Vybráno:</span>
        <div style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}> 
          {Selected ? <Selected size={24} /> : <span className="muted">—</span>}
        </div>
        <code>{value || "—"}</code>
      </div> */}

      {/* Sekce Oblíbené - zobrazí se jen když se nehledá */}
      {q === "" && !isBrowsingAll && favoriteItems.length > 0 && (
        <div className="ip-favorites">
          <h4 className="ip-section-title">Oblíbené ikony</h4>
          <div className="ip-grid">
            {favoriteItems.map(({ name, Comp }) => (
              <button
                key={name}
                type="button"
                className={`ip-btn${value === name ? " is-active" : ""}`}
                title={name}
                onClick={() => onChange?.(name)}
              >
                <Comp size={20} />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ip-head">
        <input className="input" placeholder={placeholder} value={q} onChange={handleQueryChange} />
        <button
          type="button"
          className="btn"
          onClick={toggleBrowseAll}
          style={{ whiteSpace: "nowrap" }}
        >
          {isBrowsingAll ? "Skrýt ikony" : "Procházet všechny"}
        </button>
      </div>

      {/* Hlavní mřížka s ikonami (zobrazí se při hledání nebo procházení) */}
      {(q !== "" || isBrowsingAll) && (
        <div>
          {isBrowsingAll && <h4 className="ip-section-title">Všechny ikony ({list.length})</h4>}
          <div className="ip-grid">
            {pageItems.map(({ name, Comp }) => (
              <button
                key={name}
                type="button"
                className={`ip-btn${value === name ? " is-active" : ""}`}
                title={name}
                onClick={() => onChange?.(name)}
              >
                <Comp size={20} />
                <span>{name}</span>
              </button>
            ))}
          </div>
          {/* Paginace - zobrazí se jen pokud je více stránek */}
          {list.length > pageSize && (
            <div className="ip-nav">
              <button
                type="button"
                className="btn"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ◀
              </button>
              <span className="muted">
                {page + 1} / {pages}
              </span>
              <button
                type="button"
                className="btn"
                disabled={page >= pages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .ip {
          display: grid;
          gap: 0.75rem;
        }
        .ip-head {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .ip-current {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem;
          background: var(--surface-2);
          border-radius: var(--radius-sm);
        }
        .ip-section-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--muted);
          margin: 0.5rem 0 0.25rem;
          padding-bottom: 0.25rem;
        }
        .ip-grid {
          display: grid;
          gap: 0.4rem;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          max-height: 320px;
          overflow: auto;
          border: 1px solid var(--border, #eee);
          border-radius: 0.5rem;
          padding: 0.5rem;
          background: var(--surface-2, #fafafa);
        }
        .ip-favorites .ip-grid {
          /* Favorites are not scrollable */
          max-height: none; /* Oblíbené nejsou stránkované, zobrazit všechny */
          overflow: visible;
        }
        .ip-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.5rem;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--surface, white);
          border-radius: 0.5rem;
          cursor: pointer;
          color: var(--fg);
        }
        .ip-btn:hover {
          background: var(--surface);
          filter: brightness(1.1);
        }
        .ip-btn.is-active {
          border-color: var(--success, #22c55e);
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25) inset;
          background: var(--success-bg-subtle, #d1e7dd);
          color: var(--success-text-emphasis, #0a3622);
        }
        .ip-btn span {
          font-size: 0.8rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ip-nav {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          justify-content: center;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
