"use client";

import { useState, useEffect } from "react";
import * as Fa from "react-icons/fa6";
import { Tab, Item } from "@/types/db";

const czk = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" });

export default function TablesSettings() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [isTable, setIsTable] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/tabs", { cache: "no-store" });
      if (!res.ok) throw new Error("Nepodařilo se načíst stoly a účty.");
      setTabs(await res.json());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) return alert("Název nesmí být prázdný.");

    try {
      const res = await fetch("/api/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          is_permanent: isTable ? 1 : 0,
          is_table: isTable,
          is_staff: false,
          items: [],
        }),
      });
      if (!res.ok) throw new Error("Vytvoření selhalo.");
      setFormName("");
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu chcete tento záznam smazat?")) return;
    try {
      const res = await fetch("/api/tabs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Smazání selhalo.");
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const tables = tabs.filter((t) => t.is_table);
  const accounts = tabs.filter((t) => !t.is_table);

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="mb-0">Správa stolů a účtů</h5>
      </div>
      <div className="card-body">
        <p style={{ marginBottom: "1rem" }}>
          Zde můžete spravovat permanentní stoly pro restauraci nebo promazávat zaseknuté dočasné
          účty.
        </p>
        {err && <div className="alert alert-error">{err}</div>}

        <section className="" style={{ marginBottom: "2rem" }}>
          <form
            onSubmit={handleCreate}
            style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}
          >
            <div>
              <label className="form-label">Název (např. Stůl 5, Zahrádka)</label>
              <input
                className="input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Název..."
              />
            </div>
            <div>
              <label className="form-label">Typ</label>
              <select
                className="input select"
                value={isTable ? "table" : "account"}
                onChange={(e) => setIsTable(e.target.value === "table")}
              >
                <option value="table">Permanentní stůl (Zůstává i po zaplacení)</option>
                <option value="account">Dočasný účet (Smaže se po zaplacení)</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" style={{ height: "42px" }}>
              <Fa.FaRegSquarePlus /> Přidat
            </button>
          </form>
        </section>

        {loading ? (
          <div className="grid-tiny">
            <div className="card skeleton" style={{ height: 100 }} />
            <div className="card skeleton" style={{ height: 100 }} />
          </div>
        ) : (
          <>
            <h6 className="mb-3 text-mute">Permanentní stoly</h6>
            {tables.length === 0 && <p className="muted">Žádné stoly.</p>}
            <div className="grid-tiny" style={{ marginBottom: "2rem" }}>
              {tables.map((tab) => {
                const total = tab.items.reduce((acc: number, i: Item) => acc + (i.price || 0), 0);
                return (
                  <section
                    key={tab.id}
                    className="card cardPad"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <header
                      className="receiptHeader"
                      style={{ padding: 0, borderBottom: "none", alignItems: "center" }}
                    >
                      <div
                        className="receiptTitle"
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <Fa.FaChair />
                        <span>{tab.name}</span>
                      </div>
                      <div
                        className="totalPrice"
                        style={{ color: total > 0 ? "var(--danger)" : "var(--success)" }}
                      >
                        {total > 0 ? `Obsazeno (${czk.format(total)})` : "Volný"}
                      </div>
                    </header>
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-danger"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                        onClick={() => handleDelete(tab.id)}
                      >
                        <Fa.FaTrashCan /> Smazat
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>

            <h6 className="mb-3 text-mute">Otevřené dočasné účty ("Na účet")</h6>
            {accounts.length === 0 && <p className="muted">Žádné otevřené účty.</p>}
            <div className="grid-tiny">
              {accounts.map((tab) => {
                const total = tab.items.reduce((acc: number, i: Item) => acc + (i.price || 0), 0);
                return (
                  <section
                    key={tab.id}
                    className="card cardPad"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <header
                      className="receiptHeader"
                      style={{ padding: 0, borderBottom: "none", alignItems: "center" }}
                    >
                      <div
                        className="receiptTitle"
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <Fa.FaUser />
                        <span>{tab.name}</span>
                      </div>
                      <div className="totalPrice">{czk.format(total)}</div>
                    </header>
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="btn btn-danger"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                        onClick={() => handleDelete(tab.id)}
                      >
                        <Fa.FaTrashCan /> Smazat
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
