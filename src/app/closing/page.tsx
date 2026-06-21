// c:\projects\LocalPOSjson\src\app\closing\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import * as Fa from "react-icons/fa6";
import { Item } from "@/types/db";

const czk = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" });

interface ParsedReceipt {
  id: number;
  created_at: string;
  issued_to: string | null;
  payment_method: string | null;
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

export default function ClosingPage() {
  const [receipts, setReceipts] = useState<ParsedReceipt[]>([]);
  const [tabs, setTabs] = useState<ParsedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState(""); // YYYY-MM-DD
  const [activePreset, setActivePreset] = useState<"dnes" | "vcera" | "tyden" | "mesic" | "vse" | "custom">("dnes");

  // View mode filter: 'sold' (completed), 'all' (completed + open), 'open' (open tabs/tables only)
  const [viewMode, setViewMode] = useState<"sold" | "all" | "open">("sold");

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();

    // Default to 'today' preset
    setPreset("dnes");
  }, []);

  const setPreset = (preset: "dnes" | "vcera" | "tyden" | "mesic" | "vse") => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    if (preset === "dnes") {
      setFrom(formatDate(today));
      setTo(formatDate(today));
    } else if (preset === "vcera") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      setFrom(formatDate(yesterday));
      setTo(formatDate(yesterday));
    } else if (preset === "tyden") {
      const currentDay = today.getDay();
      const distance = currentDay === 0 ? 6 : currentDay - 1; // adjust for Sunday being 0
      const monday = new Date(today);
      monday.setDate(today.getDate() - distance);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      setFrom(formatDate(monday));
      setTo(formatDate(sunday));
    } else if (preset === "mesic") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFrom(formatDate(firstDay));
      setTo(formatDate(lastDay));
    } else if (preset === "vse") {
      setFrom("");
      setTo("");
    }
    setActivePreset(preset);
  };

  const handleCustomDateChange = (type: "from" | "to", val: string) => {
    if (type === "from") {
      setFrom(val);
    } else {
      setTo(val);
    }
    setActivePreset("custom");
  };

  // Filter receipts in-memory
  const filteredReceipts = useMemo(() => {
    const toTs = (d: string) => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const fromBound = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toBound = to ? new Date(`${to}T23:59:59`).getTime() : null;

    return receipts.filter((r) => {
      const created = toTs(r.created_at);
      if (fromBound && created < fromBound) return false;
      if (toBound && created > toBound) return false;
      return true;
    });
  }, [receipts, from, to]);

  // Filter tabs in-memory
  const filteredTabs = useMemo(() => {
    const toTs = (d: string) => {
      if (!d) return 0;
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const fromBound = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toBound = to ? new Date(`${to}T23:59:59`).getTime() : null;

    return tabs.filter((t) => {
      // Filter tabs based on their creation date
      const created = toTs(t.created_at);
      if (fromBound && created < fromBound) return false;
      if (toBound && created > toBound) return false;
      return true;
    });
  }, [tabs, from, to]);

  // Aggregate stats based on active view mode
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let cashRevenue = 0;
    let cardRevenue = 0;
    let qrRevenue = 0;
    let otherRevenue = 0;
    let openRevenue = 0;

    let cashCount = 0;
    let cardCount = 0;
    let qrCount = 0;
    let otherCount = 0;
    let openCount = 0;

    const productSales: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {};
    const categorySales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    // Separate lists for split printing when viewMode === "all"
    const soldProductSales: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {};
    const openProductSales: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {};

    const addItems = (items: Item[], isTab: boolean) => {
      items.forEach((item) => {
        const price = item.price || 0;
        const prodKey = item.name;
        if (!productSales[prodKey]) {
          productSales[prodKey] = {
            name: item.name,
            category: item.category || "Ostatní",
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[prodKey].quantity += 1;
        productSales[prodKey].revenue += price;

        const targetSpec = isTab ? openProductSales : soldProductSales;
        if (!targetSpec[prodKey]) {
          targetSpec[prodKey] = {
            name: item.name,
            category: item.category || "Ostatní",
            quantity: 0,
            revenue: 0,
          };
        }
        targetSpec[prodKey].quantity += 1;
        targetSpec[prodKey].revenue += price;

        const catKey = item.category || "Ostatní";
        if (!categorySales[catKey]) {
          categorySales[catKey] = {
            name: catKey,
            quantity: 0,
            revenue: 0,
          };
        }
        categorySales[catKey].quantity += 1;
        categorySales[catKey].revenue += price;
      });
    };

    // 1. Process sold receipts (if view mode is 'sold' or 'all')
    if (viewMode === "sold" || viewMode === "all") {
      filteredReceipts.forEach((r) => {
        const receiptTotal = (r.items || []).reduce((sum, item) => sum + (item.price || 0), 0);
        addItems(r.items || [], false);
        totalRevenue += receiptTotal;

        const rawMethod = (r.payment_method || "").toLowerCase().trim();
        if (rawMethod === "cash" || rawMethod === "hotovost" || rawMethod === "hotově") {
          cashRevenue += receiptTotal;
          cashCount += 1;
        } else if (rawMethod === "card" || rawMethod === "karta" || rawMethod === "kartou") {
          cardRevenue += receiptTotal;
          cardCount += 1;
        } else if (rawMethod === "qr" || rawMethod === "qr platba" || rawMethod === "qr_platba") {
          qrRevenue += receiptTotal;
          qrCount += 1;
        } else {
          otherRevenue += receiptTotal;
          otherCount += 1;
        }
      });
    }

    // 2. Process open tabs (if view mode is 'open' or 'all')
    if (viewMode === "open" || viewMode === "all") {
      filteredTabs.forEach((t) => {
        const tabTotal = (t.items || []).reduce((sum, item) => sum + (item.price || 0), 0);
        addItems(t.items || [], true);
        totalRevenue += tabTotal;

        openRevenue += tabTotal;
        openCount += 1;
      });
    }

    let datasetCount = 0;
    if (viewMode === "sold" || viewMode === "all") datasetCount += filteredReceipts.length;
    if (viewMode === "open" || viewMode === "all") datasetCount += filteredTabs.length;

    const avgTicket = datasetCount > 0 ? totalRevenue / datasetCount : 0;

    const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    const sortedCategories = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);
    const sortedSoldProducts = Object.values(soldProductSales).sort((a, b) => b.quantity - a.quantity);
    const sortedOpenProducts = Object.values(openProductSales).sort((a, b) => b.quantity - a.quantity);

    return {
      totalRevenue,
      datasetCount,
      avgTicket,
      payments: {
        cash: { amount: cashRevenue, count: cashCount },
        card: { amount: cardRevenue, count: cardCount },
        qr: { amount: qrRevenue, count: qrCount },
        other: { amount: otherRevenue, count: otherCount },
        open: { amount: openRevenue, count: openCount },
      },
      products: sortedProducts,
      categories: sortedCategories,
      soldProducts: sortedSoldProducts,
      openProducts: sortedOpenProducts,
      soldRevenue: cashRevenue + cardRevenue + qrRevenue + otherRevenue,
      openRevenue: openRevenue,
      soldCount: filteredReceipts.length,
      openCount: filteredTabs.length,
    };
  }, [filteredReceipts, filteredTabs, viewMode]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="pageTitle">Uzávěrka prodejů</h1>
        <div className="card skeleton" style={{ height: 100 }} />
        <div className="grid">
          <div className="card skeleton" />
          <div className="card skeleton" />
          <div className="card skeleton" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1 className="pageTitle">Uzávěrka prodejů</h1>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const getPercent = (amount: number) => {
    if (stats.totalRevenue === 0) return 0;
    return Math.round((amount / stats.totalRevenue) * 100);
  };

  const dateRangeLabel = () => {
    if (!from && !to) return "Všechna data";
    if (from === to) return new Date(from).toLocaleDateString("cs-CZ");
    const fromStr = from ? new Date(from).toLocaleDateString("cs-CZ") : "...";
    const toStr = to ? new Date(to).toLocaleDateString("cs-CZ") : "...";
    return `${fromStr} – ${toStr}`;
  };

  const datasetCountLabel = () => {
    if (viewMode === "sold") return "POČET ÚČTENEK";
    if (viewMode === "open") return "POČET OTEVŘENÝCH ÚČTŮ";
    return "ÚČTENKY + OTEVŘENÉ ÚČTY";
  };

  return (
    <div className="container">
      {/* Screen view layout */}
      <div className="no-print">
        <div className="d-flex justify-content-between align-items-center my-3">
          <h1 className="pageTitle my-0">Uzávěrka prodejů</h1>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handlePrint}>
            <Fa.FaPrint /> Tisk uzávěrky
          </button>
        </div>

        {/* Filters Card */}
        <section className="card cardPad mb-4">
          {/* Row 1: Období selector & Date inputs */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <h5 className="form-label mb-2">
                <Fa.FaCalendarDays className="me-2" /> Výběr období
              </h5>
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn ${activePreset === "dnes" ? "btn-primary" : ""}`}
                  onClick={() => setPreset("dnes")}
                >
                  Dnes
                </button>
                <button
                  className={`btn ${activePreset === "vcera" ? "btn-primary" : ""}`}
                  onClick={() => setPreset("vcera")}
                >
                  Včera
                </button>
                <button
                  className={`btn ${activePreset === "tyden" ? "btn-primary" : ""}`}
                  onClick={() => setPreset("tyden")}
                >
                  Tento týden
                </button>
                <button
                  className={`btn ${activePreset === "mesic" ? "btn-primary" : ""}`}
                  onClick={() => setPreset("mesic")}
                >
                  Tento měsíc
                </button>
                <button
                  className={`btn ${activePreset === "vse" ? "btn-primary" : ""}`}
                  onClick={() => setPreset("vse")}
                >
                  Celá historie
                </button>
              </div>
            </div>

            {/* Date pickers on the right */}
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="from" className="form-label mb-0 text-nowrap">Od:</label>
                <input
                  id="from"
                  type="date"
                  className="input"
                  style={{ width: "auto", minHeight: "38px" }}
                  value={from}
                  onChange={(e) => handleCustomDateChange("from", e.target.value)}
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="to" className="form-label mb-0 text-nowrap">Do:</label>
                <input
                  id="to"
                  type="date"
                  className="input"
                  style={{ width: "auto", minHeight: "38px" }}
                  value={to}
                  onChange={(e) => handleCustomDateChange("to", e.target.value)}
                />
              </div>
            </div>
          </div>

          <hr style={{ borderColor: "var(--border)", margin: "0 0 1.25rem 0" }} />

          {/* Row 2: Typ dat v uzávěrce */}
          <div>
            <h5 className="form-label mb-2">
              <Fa.FaSliders className="me-2" /> Typ dat v uzávěrce
            </h5>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn d-flex align-items-center gap-2 ${viewMode === "sold" ? "btn-primary" : ""}`}
                  onClick={() => setViewMode("sold")}
                >
                  <Fa.FaReceipt /> Pouze prodané (Uzavřené)
                </button>
                <button
                  className={`btn d-flex align-items-center gap-2 ${viewMode === "all" ? "btn-primary" : ""}`}
                  onClick={() => setViewMode("all")}
                >
                  <Fa.FaScaleBalanced /> Prodané + Otevřené účty
                </button>
                <button
                  className={`btn d-flex align-items-center gap-2 ${viewMode === "open" ? "btn-primary" : ""}`}
                  onClick={() => setViewMode("open")}
                >
                  <Fa.FaFolderOpen /> Pouze otevřené účty
                </button>
              </div>
              <span className="text-mute">
                Zvolené období: <strong>{dateRangeLabel()}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Big numbers summary */}
        <div className="grid mb-4">
          <div className="card cardPad d-flex flex-row align-items-center justify-content-between">
            <div>
              <div className="text-mute fw-bold mb-1">
                {viewMode === "open" ? "OČEKÁVANÁ TRŽBA" : "CELKOVÁ TRŽBA"}
              </div>
              <h2 className="mb-0 fw-extrabold text-success" style={{ fontFeatureSettings: "'tnum'" }}>
                {czk.format(stats.totalRevenue)}
              </h2>
            </div>
            <Fa.FaCoins size={36} className="text-success opacity-75" />
          </div>

          <div className="card cardPad d-flex flex-row align-items-center justify-content-between">
            <div>
              <div className="text-mute fw-bold mb-1">{datasetCountLabel()}</div>
              <h2 className="mb-0 fw-extrabold text-primary">
                {stats.datasetCount}
              </h2>
            </div>
            <Fa.FaReceipt size={36} className="text-primary opacity-75" />
          </div>

          <div className="card cardPad d-flex flex-row align-items-center justify-content-between">
            <div>
              <div className="text-mute fw-bold mb-1">PRŮMĚRNÁ ÚTRATA</div>
              <h2 className="mb-0 fw-extrabold text-warning">
                {czk.format(stats.avgTicket)}
              </h2>
            </div>
            <Fa.FaScaleBalanced size={36} className="text-warning opacity-75" />
          </div>
        </div>

        {/* Detailed stats grids */}
        <div className="grid mb-4">
          {/* Column 1: Payment Methods & Category Share */}
          <div className="d-flex flex-column gap-3">
            {/* Card: Payment methods */}
            <div className="card cardPad">
              <h5 className="card-header px-0 pt-0 pb-3 border-bottom mb-3 text-white">
                <Fa.FaCreditCard className="me-2" /> Platební metody
              </h5>

              {/* Cash */}
              {(viewMode === "sold" || viewMode === "all") && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="d-flex align-items-center gap-2">
                      <Fa.FaMoneyBill1Wave className="text-success" /> Hotovost ({stats.payments.cash.count}x)
                    </span>
                    <span className="fw-bold text-success">{czk.format(stats.payments.cash.amount)} ({getPercent(stats.payments.cash.amount)}%)</span>
                  </div>
                  <div className="progress" style={{ height: 8, backgroundColor: "var(--surface-2)" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${getPercent(stats.payments.cash.amount)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Card */}
              {(viewMode === "sold" || viewMode === "all") && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="d-flex align-items-center gap-2">
                      <Fa.FaCreditCard className="text-primary" /> Karta ({stats.payments.card.count}x)
                    </span>
                    <span className="fw-bold text-primary">{czk.format(stats.payments.card.amount)} ({getPercent(stats.payments.card.amount)}%)</span>
                  </div>
                  <div className="progress" style={{ height: 8, backgroundColor: "var(--surface-2)" }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${getPercent(stats.payments.card.amount)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* QR Code */}
              {(viewMode === "sold" || viewMode === "all") && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="d-flex align-items-center gap-2">
                      <Fa.FaQrcode className="text-warning" /> QR Platba ({stats.payments.qr.count}x)
                    </span>
                    <span className="fw-bold text-warning">{czk.format(stats.payments.qr.amount)} ({getPercent(stats.payments.qr.amount)}%)</span>
                  </div>
                  <div className="progress" style={{ height: 8, backgroundColor: "var(--surface-2)" }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{ width: `${getPercent(stats.payments.qr.amount)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Other */}
              {(viewMode === "sold" || viewMode === "all") && stats.payments.other.amount > 0 && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="d-flex align-items-center gap-2">
                      <Fa.FaEllipsis className="text-white" /> Ostatní / Neuvedeno ({stats.payments.other.count}x)
                    </span>
                    <span className="fw-bold text-secondary">{czk.format(stats.payments.other.amount)} ({getPercent(stats.payments.other.amount)}%)</span>
                  </div>
                  <div className="progress" style={{ height: 8, backgroundColor: "var(--surface-2)" }}>
                    <div
                      className="progress-bar bg-secondary"
                      style={{ width: `${getPercent(stats.payments.other.amount)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Open accounts pending payment */}
              {(viewMode === "open" || viewMode === "all") && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="d-flex align-items-center gap-2">
                      <Fa.FaFolderOpen className="text-info" /> Otevřené účty ({stats.payments.open.count}x)
                    </span>
                    <span className="fw-bold text-info">{czk.format(stats.payments.open.amount)} ({getPercent(stats.payments.open.amount)}%)</span>
                  </div>
                  <div className="progress" style={{ height: 8, backgroundColor: "var(--surface-2)" }}>
                    <div
                      className="progress-bar bg-info"
                      style={{ width: `${getPercent(stats.payments.open.amount)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card: Categories */}
            <div className="card cardPad">
              <h5 className="card-header px-0 pt-0 pb-3 border-bottom mb-3 text-white">
                <Fa.FaTags className="me-2" /> Tržby podle kategorií
              </h5>
              {stats.categories.length === 0 ? (
                <p className="text-mute my-0">Žádná data pro vybrané období.</p>
              ) : (
                stats.categories.map((cat) => (
                  <div key={cat.name} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span>{cat.name} ({cat.quantity} ks)</span>
                      <span className="fw-bold">{czk.format(cat.revenue)} ({getPercent(cat.revenue)}%)</span>
                    </div>
                    <div className="progress" style={{ height: 8, backgroundColor: "var(--surface-2)" }}>
                      <div
                        className="progress-bar bg-info"
                        style={{ width: `${getPercent(cat.revenue)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Product Mix */}
          <div className="card cardPad" style={{ gridColumn: "span 2" }}>
            <h5 className="card-header px-0 pt-0 pb-3 border-bottom mb-3 text-white">
              <Fa.FaBurger className="me-2" /> Prodané položky (Product Mix)
            </h5>
            {stats.products.length === 0 ? (
              <p className="text-mute my-0">Žádný prodej za vybrané období.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <thead>
                    <tr>
                      <th style={{ color: "var(--muted)" }}>Položka</th>
                      <th style={{ color: "var(--muted)" }}>Kategorie</th>
                      <th className="text-end" style={{ color: "var(--muted)" }}>Množství</th>
                      <th className="text-end" style={{ color: "var(--muted)" }}>Tržba</th>
                      <th className="text-end" style={{ color: "var(--muted)" }}>Podíl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.products.map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td>
                          <span className="badge bg-secondary" style={{ marginLeft: 0 }}>
                            {p.category}
                          </span>
                        </td>
                        <td className="text-end fw-bold">{p.quantity} ks</td>
                        <td className="text-end">{czk.format(p.revenue)}</td>
                        <td className="text-end text-mute" style={{ fontSize: "0.9em" }}>
                          {getPercent(p.revenue)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print-only layout (Thermal POS style) */}
      <div className="print-only">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 5px 0", fontWeight: "bold" }}>LocalPOSqlite</h2>
          <div style={{ fontSize: 14, fontWeight: "bold" }}>UZÁVĚRKA PRODEJŮ</div>
          <div style={{ fontSize: 11, color: "#555" }}>
            Vytvořeno: {new Date().toLocaleString("cs-CZ")}
          </div>
        </div>

        <div style={{ borderBottom: "1px dashed black", paddingBottom: 5, marginBottom: 5 }}>
          <strong>Typ uzávěrky:</strong> {
            viewMode === "sold" ? "Pouze prodané" :
              viewMode === "all" ? "Prodané + Otevřené účty" : "Pouze otevřené účty"
          } <br />
          <strong>Období:</strong> {dateRangeLabel()} <br />
          <strong>Počet dokladů:</strong> {stats.datasetCount}
        </div>

        <div style={{ fontSize: 14, fontWeight: "bold", display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span>
            {viewMode === "open" ? "OČEKÁVANÝ OBRAT:" : "CELKOVÝ OBRAT:"}
          </span>
          <span>{czk.format(stats.totalRevenue)}</span>
        </div>

        {viewMode === "all" && (
          <>
            <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", marginBottom: 3, paddingLeft: 10 }}>
              <span>- Zaplaceno (Paid):</span>
              <span>{czk.format(stats.soldRevenue)}</span>
            </div>
            <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", marginBottom: 5, paddingLeft: 10 }}>
              <span>- Otevřeno (Unpaid):</span>
              <span>{czk.format(stats.openRevenue)}</span>
            </div>
          </>
        )}

        <div style={{ borderBottom: "1px dashed black", paddingBottom: 5, marginBottom: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Průměrný doklad:</span>
            <span>{czk.format(stats.avgTicket)}</span>
          </div>
        </div>

        {/* Layout for 'sold' or 'open' modes */}
        {viewMode !== "all" && (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: 3 }}>PLATEBNÍ METODY</div>
              {viewMode === "sold" ? (
                <>
                  {stats.payments.cash.amount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Hotovost ({stats.payments.cash.count}x):</span>
                      <span>{czk.format(stats.payments.cash.amount)}</span>
                    </div>
                  )}
                  {stats.payments.card.amount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Karta ({stats.payments.card.count}x):</span>
                      <span>{czk.format(stats.payments.card.amount)}</span>
                    </div>
                  )}
                  {stats.payments.qr.amount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>QR platba ({stats.payments.qr.count}x):</span>
                      <span>{czk.format(stats.payments.qr.amount)}</span>
                    </div>
                  )}
                  {stats.payments.other.amount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Ostatní ({stats.payments.other.count}x):</span>
                      <span>{czk.format(stats.payments.other.amount)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Otevřené účty ({stats.payments.open.count}x):</span>
                  <span>{czk.format(stats.payments.open.amount)}</span>
                </div>
              )}
            </div>

            <div style={{ borderBottom: "1px dashed black", marginBottom: 5 }} />

            <div>
              <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: 3 }}>PRODANÉ POLOŽKY (Product Mix)</div>
              {stats.products.length === 0 ? (
                <div style={{ fontSize: 11, color: "#555" }}>Žádné položky</div>
              ) : (
                stats.products.map((p) => (
                  <div key={p.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                    <span>
                      {p.name} ({p.category})
                    </span>
                    <span>
                      {p.quantity} ks / {czk.format(p.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Layout for combined 'all' mode */}
        {viewMode === "all" && (
          <>
            {/* Zaplaceno Section */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: 3 }}>ZAPLACENÉ (PAID)</div>
              {stats.payments.cash.amount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>  Hotovost ({stats.payments.cash.count}x):</span>
                  <span>{czk.format(stats.payments.cash.amount)}</span>
                </div>
              )}
              {stats.payments.card.amount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>  Karta ({stats.payments.card.count}x):</span>
                  <span>{czk.format(stats.payments.card.amount)}</span>
                </div>
              )}
              {stats.payments.qr.amount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>  QR platba ({stats.payments.qr.count}x):</span>
                  <span>{czk.format(stats.payments.qr.amount)}</span>
                </div>
              )}
              {stats.payments.other.amount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>  Ostatní ({stats.payments.other.count}x):</span>
                  <span>{czk.format(stats.payments.other.amount)}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 3 }}>Zaplacené položky (Product Mix):</div>
              {stats.soldProducts.length === 0 ? (
                <div style={{ fontSize: 11, color: "#555", paddingLeft: 10 }}>Žádné položky</div>
              ) : (
                stats.soldProducts.map((p) => (
                  <div key={p.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2, paddingLeft: 10 }}>
                    <span>
                      {p.name} ({p.category})
                    </span>
                    <span>
                      {p.quantity} ks / {czk.format(p.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderBottom: "1px dashed black", marginBottom: 5 }} />

            {/* Otevreno Section */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: 3 }}>NEZAPLACENO / OTEVŘENO</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>  Otevřené účty ({stats.payments.open.count}x):</span>
                <span>{czk.format(stats.payments.open.amount)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: "bold", marginBottom: 3 }}>Otevřené položky (Product Mix):</div>
              {stats.openProducts.length === 0 ? (
                <div style={{ fontSize: 11, color: "#555", paddingLeft: 10 }}>Žádné položky</div>
              ) : (
                stats.openProducts.map((p) => (
                  <div key={p.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2, paddingLeft: 10 }}>
                    <span>
                      {p.name} ({p.category})
                    </span>
                    <span>
                      {p.quantity} ks / {czk.format(p.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div style={{ borderBottom: "1px dashed black", marginTop: 5, marginBottom: 5 }} />

        <div style={{ textAlign: "center", fontSize: 10, marginTop: 15 }}>
          * Konec uzávěrky *
        </div>
      </div>

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
            width: 76mm; /* Standard receipt paper width */
            margin: 0 auto;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.4;
            color: black !important;
            background: white !important;
            padding: 10px;
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
