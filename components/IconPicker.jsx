// components/IconPicker.jsx
import { useMemo, useState } from "react";
import * as Fa from "react-icons/fa";

const ALL_FA = Object.entries(Fa)
  .filter(([name]) => name.startsWith("Fa"))
  .map(([name, Comp]) => ({ name, Comp }));

export default function IconPicker({ value, onChange, placeholder = "Hledat ikonu…" }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 48;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ALL_FA;
    return ALL_FA.filter(x => x.name.toLowerCase().includes(s));
  }, [q]);

  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const pageItems = list.slice(page * pageSize, page * pageSize + pageSize);

  const Selected = value && Fa[value] ? Fa[value] : null;

  return (
    <div className="ip">
      <div className="ip-head">
        <input
          className="input"
          placeholder={placeholder}
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
        />
        <div className="ip-current">
          <span className="muted">Vybráno:</span>
          {Selected ? <Selected size={20} /> : <span className="muted">—</span>}
          <code>{value || "—"}</code>
        </div>
      </div>

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

      <div className="ip-nav">
        <button type="button" className="btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>◀</button>
        <span className="muted">{page + 1}/{pages}</span>
        <button type="button" className="btn" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>▶</button>
      </div>

      <style jsx>{`
        .ip { display: grid; gap: .5rem; }
        .ip-head { display:flex; gap:.5rem; align-items:center; }
        .ip-current { display:flex; align-items:center; gap:.4rem; }
        .ip-grid {
          display:grid; gap:.4rem;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          max-height: 320px; overflow:auto; border:1px solid #eee; border-radius:.5rem; padding:.5rem;
          background:#fafafa;
        }
        .ip-btn {
          display:flex; align-items:center; gap:.5rem;
          padding:.35rem .5rem; border:1px solid #e5e7eb; background:white; border-radius:.5rem; cursor:pointer;
        }
        .ip-btn.is-active { border-color:#22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,.15) inset; }
        .ip-btn span { font-size:.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ip-nav { display:flex; gap:.5rem; align-items:center; justify-content:center; }
      `}</style>
    </div>
  );
}
