"use client";

import React, { useEffect, useState } from "react";
import * as Fa from "react-icons/fa6";

export default function DBSettings() {
  const [loading, setLoading] = useState(true);
  const [dbPath, setDbPath] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/settings/db");
      const data = await res.json();
      setDbPath(data.dbPath);
    } catch (err) {
      console.error("Failed to fetch DB config", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePath = async () => {
    try {
      const res = await fetch("/api/settings/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbPath }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
      } else {
        setMessage({ text: data.error, type: "danger" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "danger" });
    }
  };

  const handleAction = async (action: "create" | "verify" | "wipe" | "seed") => {
    if (
      action === "wipe" &&
      !confirm("Opravdu chcete smazat všechna data z databáze? Tato akce je nevratná.")
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
      } else {
        setMessage({ text: data.error, type: "danger" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dbPath) return <div>Načítání...</div>;

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="mb-0">Správa Databáze</h5>
      </div>
      <div className="card-body">
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        <div className="mb-4">
          <label className="form-label fw-bold">Cesta k databázi (SQLite file)</label>
          <div className="input-group">
            <span className="input-group-text">
              <Fa.FaFolderOpen />
            </span>
            <input
              type="text"
              className="form-control"
              value={dbPath}
              onChange={(e) => setDbPath(e.target.value)}
              placeholder="data/pos.db"
            />
            <button className="btn btn-primary" onClick={handleSavePath}>
              Uložit cestu
            </button>
          </div>
          <div className="form-text">
            Relativní cesta od kořene projektu nebo absolutní cesta. <br />
            <strong>Poznámka:</strong> Po změně cesty může být vyžadován restart aplikace.
          </div>
        </div>

        <hr />

        <div className="mt-4">
          <label className="form-label fw-bold d-block mb-3">Akce s databází</label>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-info d-flex align-items-center gap-2"
              onClick={() => handleAction("verify")}
              disabled={loading}
            >
              <Fa.FaMagnifyingGlass /> Ověřit existenci
            </button>

            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={() => handleAction("create")}
              disabled={loading}
            >
              <Fa.FaRegSquarePlus /> Vytvořit soubor
            </button>

            <button
              className="btn btn-outline-warning d-flex align-items-center gap-2"
              onClick={() => handleAction("seed")}
              disabled={loading}
            >
              <Fa.FaSeedling /> Naplnit (Seed)
            </button>

            <button
              className="btn btn-outline-danger d-flex align-items-center gap-2"
              onClick={() => handleAction("wipe")}
              disabled={loading}
            >
              <Fa.FaTrashCan /> Vymazat (Wipe)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
