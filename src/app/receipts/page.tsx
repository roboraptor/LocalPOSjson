// c:\projects\LocalPOSjson\src\app\receipts\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import * as Fa from "react-icons/fa6";
import { Item } from "@/types/db";

const czk = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" });

interface ParsedReceipt {
  id: number;
  created_at: string;
  issued_to: string | null;
  items: Item[];
}

interface ParsedTab {
  id: number;
  name: string;
  is_permanent: number;
  is_table: number;
  is_staff: number;
  created_at: string;
  updated_at: string;
  items: Item[];
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ParsedReceipt[]>([]);
  const [tabs, setTabs] = useState<ParsedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // viewMode: 'receipts' (closed receipts) or 'tabs' (open tables/tabs)
  const [viewMode, setViewMode] = useState<"receipts" | "tabs">("receipts");

  // ---- FILTRY ----
  const [q, setQ] = useState(""); // fulltext
  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState(""); // YYYY-MM-DD
  const [issuedTo, setIssuedTo] = useState(""); // přesný match

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [receiptsRes, tabsRes] = await Promise.all([
        fetch("/api/receipts", { cache: "no-store" }),
        fetch("/api/tabs", { cache: "no-store" }),
      ]);
      if (!receiptsRes.ok) throw new Error("Nepodařilo se načíst účtenky");
      if (!tabsRes.ok) throw new Error("Nepodařilo se načíst otevřené účty");

      const receiptsData = await receiptsRes.json();
      const tabsData = await tabsRes.json();

      setReceipts(Array.isArray(receiptsData) ? receiptsData : []);
      setTabs(Array.isArray(tabsData) ? tabsData : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteItem = async (id: number, isTab: boolean) => {
    if (isTab) {
      if (!confirm("Opravdu chcete tento otevřený účet smazat?")) return;
      try {
        const res = await fetch("/api/tabs", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Nepodařilo se smazat otevřený účet");
        setTabs((prev) => prev.filter((t) => t.id !== id));
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      if (!confirm("Opravdu chcete tuto účtenku smazat?")) return;
      try {
        const res = await fetch("/api/receipts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Nepodařilo se smazat účtenku");
        setReceipts((prev) => prev.filter((r) => r.id !== id));
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const deleteAllReceipts = async () => {
    if (!confirm("Opravdu chcete smazat všechny účtenky?")) return;
    try {
      const res = await fetch("/api/receipts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error("Mazání selhalo");
      setReceipts([]); // vyčistí frontend
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Unikátní seznam pro rychlý filtr podle jména (issued_to u účtenek, name u tabů)
  const issuedToOptions = useMemo(() => {
    const dataset = viewMode === "receipts" ? receipts : tabs;
    const names = dataset.map((d: any) => (viewMode === "receipts" ? d.issued_to : d.name));
    const set = new Set(names.map((n) => (n ?? "").trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "cs"));
  }, [receipts, tabs, viewMode]);

  // --- seřazení & filtrování ---
  const filtered = useMemo(() => {
    const toTs = (d: string) => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const fromBound = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toBound = to ? new Date(`${to}T23:59:59`).getTime() : null;

    const dataset =
      viewMode === "receipts"
        ? receipts.map((r) => ({
            id: r.id,
            created_at: r.created_at,
            issued_to: r.issued_to,
            items: r.items,
            isTab: false,
            is_table: false,
          }))
        : tabs.map((t) => ({
            id: t.id,
            created_at: t.created_at,
            issued_to: t.name,
            items: t.items,
            isTab: true,
            is_table: t.is_table === 1 || (t.is_table as any) === true,
          }));

    return [...dataset]
      .sort((a, b) => toTs(b?.created_at) - toTs(a?.created_at))
      .filter((r) => {
        const created = toTs(r?.created_at);

        if (fromBound && Number.isFinite(fromBound) && created < fromBound) return false;
        if (toBound && Number.isFinite(toBound) && created > toBound) return false;

        if (issuedTo && String(r?.issued_to ?? "").trim() !== String(issuedTo).trim()) return false;

        if (q) {
          const id = String(r?.id ?? "");
          const person = String(r?.issued_to ?? "");
          const itemsText = (r?.items || []).map((it) => String(it?.name ?? "")).join(" ");
          const hay = `${id} ${person} ${itemsText}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }

        return true;
      });
  }, [receipts, tabs, viewMode, q, from, to, issuedTo]);

  if (loading) {
    return (
      <div className="container">
        <div className="d-flex justify-content-between align-items-center my-3">
          <h1 className="pageTitle my-0">
            {viewMode === "receipts" ? "Uložené účtenky" : "Aktivní otevřené účty"}
          </h1>
        </div>
        <div className="card skeleton" />
        <div className="card skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1 className="pageTitle">Účtenky a účty</h1>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Print-only header */}
      <div className="print-only" style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: 16, margin: "0 0 5px 0", fontWeight: "bold" }}>LocalPOSqlite</h2>
        <div style={{ fontSize: 13, fontWeight: "bold" }}>
          {viewMode === "receipts" ? "SEZNAM UZAVŘENÝCH ÚČTENEK" : "SEZNAM OTEVŘENÝCH ÚČTŮ"}
        </div>
        <div style={{ fontSize: 10, color: "#555" }}>
          Tisk: {new Date().toLocaleString("cs-CZ")} • Dokladů: {filtered.length}
        </div>
        <div style={{ borderBottom: "2px solid black", marginTop: 10 }} />
      </div>

      <div className="d-flex justify-content-between align-items-center my-3 no-print">
        <h1 className="pageTitle my-0">
          {viewMode === "receipts" ? "Uložené účtenky" : "Aktivní otevřené účty"}
        </h1>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => window.print()}>
          <Fa.FaPrint /> Tisk seznamu
        </button>
      </div>

      {/* FILTRY */}
      <section className="card mb-4 no-print" style={{ padding: "0.75rem" }}>
        <div className="grid2">
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "1fr 1fr 1fr",
              alignItems: "end",
            }}
          >
            <div>
              <label htmlFor="q" className="form-label">
                Hledat
              </label>
              <input
                id="q"
                type="text"
                className="input"
                placeholder="Název, položky…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="from" className="form-label">
                Od
              </label>
              <input
                id="from"
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="to" className="form-label">
                Do
              </label>
              <input
                id="to"
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "1fr 2fr",
              alignItems: "end",
            }}
          >
            <div>
              <label htmlFor="issued" className="form-label">
                {viewMode === "receipts" ? "Vystaveno pro" : "Název účtu / Stolu"}
              </label>
              <select
                id="issued"
                className="select input"
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
              >
                <option value="">Všichni</option>
                {issuedToOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reset" className="form-label">
                Zobrazeno: <strong>{filtered.length}</strong> / {viewMode === "receipts" ? receipts.length : tabs.length}
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn"
                  onClick={() => {
                    setQ("");
                    setFrom("");
                    setTo("");
                    setIssuedTo("");
                  }}
                >
                  Reset filtrů
                </button>
                <button
                  className={`btn d-flex align-items-center gap-2 ${viewMode === "tabs" ? "btn-primary" : ""}`}
                  onClick={() => {
                    setViewMode(viewMode === "receipts" ? "tabs" : "receipts");
                    // Reset filter states that may be invalid for the other dataset
                    setIssuedTo("");
                  }}
                >
                  {viewMode === "receipts" ? (
                    <>
                      <Fa.FaFolderOpen /> Zobrazit otevřené
                    </>
                  ) : (
                    <>
                      <Fa.FaReceipt /> Zobrazit uzavřené
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="muted">{viewMode === "receipts" ? "Žádné uložené účtenky." : "Žádné aktivní otevřené účty."}</p>
      ) : (
        <div className="grid">
          {filtered.map((r) => {
            const total = (r.items || []).reduce((sum, i) => sum + (i.price || 0), 0);
            return (
              <section key={r.isTab ? `tab-${r.id}` : `receipt-${r.id}`} className="card receiptCard" style={{ borderColor: r.isTab ? "var(--info)" : "var(--border)" }}>
                <header className="receiptHeader">
                  <div>
                    <div className="receiptTitle" style={{ color: r.isTab ? "var(--info)" : "inherit" }}>
                      {r.isTab ? (
                        <span className="d-flex align-items-center gap-2">
                          <Fa.FaFolderOpen />
                          {r.is_table ? `Stůl: ${r.issued_to}` : `Účet: ${r.issued_to}`}
                        </span>
                      ) : (
                        `Účtenka #${r.id}`
                      )}
                    </div>
                    <div className="receiptSub">
                      {new Date(r.created_at).toLocaleString("cs-CZ")}
                      {!r.isTab && r.issued_to ? ` • Pro: ${r.issued_to}` : ""}
                    </div>
                  </div>
                  <button className="btn btn-danger" onClick={() => deleteItem(r.id, r.isTab)}>
                    <Fa.FaTrashCan />
                  </button>
                </header>

                <div className="receiptBody">
                  {(r.items || []).map((item, i) => (
                    <div key={i} className="receiptRow">
                      <span className="itemName">{item.name}</span>
                      <span className="itemPrice">{czk.format(item.price || 0)}</span>
                    </div>
                  ))}
                </div>

                <footer className="receiptTotal">
                  <span>{r.isTab ? "Celkem k zaplacení" : "Celkem"}</span>
                  <span className="totalPrice" style={{ color: r.isTab ? "var(--info)" : "inherit" }}>
                    {czk.format(total)}
                  </span>
                </footer>
              </section>
            );
          })}
        </div>
      )}

      {viewMode === "receipts" && receipts.length > 0 && (
        <div
          className="card cardPad no-print"
          style={{
            marginBottom: 16,
            marginTop: 16,
            display: "flex",
            gap: 12,
            alignItems: "end",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-danger"
              style={{ display: "inline-flex", alignItems: "center" }}
              onClick={deleteAllReceipts}
            >
              <Fa.FaTrashCan /> Smazat Vše
            </button>
          </div>
        </div>
      )}

      {/* Embedded print styles */}
      <style jsx global>{`
        @media print {
          /* Hide standard elements */
          body, html {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .navbar {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .container {
            width: 76mm !important;
            max-width: 76mm !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }
          .grid {
            display: block !important;
          }
          .card.receiptCard {
            border: none !important;
            border-bottom: 1px dashed black !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
            color: black !important;
            padding: 8px 0 !important;
            margin-bottom: 0 !important;
            page-break-inside: avoid;
          }
          .receiptHeader {
            border-bottom: none !important;
            padding: 0 !important;
            margin-bottom: 5px !important;
            color: black !important;
          }
          .receiptTitle {
            font-family: monospace;
            font-size: 14px;
            font-weight: bold;
            color: black !important;
          }
          .receiptSub {
            font-family: monospace;
            font-size: 11px;
            color: #333 !important;
          }
          .receiptBody {
            font-family: monospace;
            font-size: 12px;
            gap: 2px !important;
            margin-bottom: 5px !important;
          }
          .receiptRow {
            display: flex;
            justify-content: space-between;
            border-bottom: none !important;
            padding: 0 !important;
          }
          .receiptTotal {
            font-family: monospace;
            font-size: 13px;
            font-weight: bold;
            border-top: 1px dashed black !important;
            padding-top: 3px !important;
            display: flex;
            justify-content: space-between;
            color: black !important;
          }
          .totalPrice {
            color: black !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
