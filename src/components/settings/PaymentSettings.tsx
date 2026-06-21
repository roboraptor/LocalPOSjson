"use client";

import React, { useEffect, useState } from "react";
import * as Fa from "react-icons/fa6";
import { QRCodeSVG } from "qrcode.react";
import { generateSpaydString } from "@/lib/spayd";

/**
 * Validuje IBAN pomocí algoritmu Modulo 97 (ISO 7064).
 */
function isValidIBAN(iban: string): boolean {
  // Odstranit mezery a převést na velká písmena
  const cleanIban = iban.replace(/\s+/g, "").toUpperCase();

  // Základní kontrola délky a formátu (min 15, max 34 znaků)
  if (cleanIban.length < 15 || cleanIban.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIban)) return false;

  // Přesunout první 4 znaky na konec
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);

  // Převést písmena na čísla (A=10, B=11, ..., Z=35)
  const numeric = rearranged
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : char;
    })
    .join("");

  // Modulo 97 (pomocí BigInt pro velké řetězce čísel)
  try {
    return BigInt(numeric) % BigInt(97) === BigInt(1);
  } catch {
    return false;
  }
}

/**
 * Rozebere český IBAN na formát prefix-číslo/kód.
 */
function decodeCzechIBAN(iban: string): string {
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  if (clean.length !== 24 || !clean.startsWith("CZ")) return "";

  const bankCode = clean.slice(4, 8);
  const prefix = clean.slice(8, 14).replace(/^0+/, ""); // Odstranit vodící nuly u prefixu
  const account = clean.slice(14, 24).replace(/^0+/, ""); // Odstranit vodící nuly u čísla

  return `${prefix ? prefix + "-" : ""}${account}/${bankCode}`;
}

export default function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [ibanStatus, setIbanStatus] = useState<"valid" | "invalid" | null>(null);
  const [testAmount, setTestAmount] = useState<string>("250.00");
  const [formData, setFormData] = useState({
    bank_iban: "",
    trx_msg: "",
    trx_vs_enabled: false,
    trx_ks: "",
    use_external_qr_api: false,
  });

  useEffect(() => {
    fetch("/api/general")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error && Object.keys(data).length > 0) {
          const iban = data.bank_iban || "";
          setFormData({
            bank_iban: iban,
            trx_msg: data.trx_msg || "",
            trx_vs_enabled:
              data.trx_vs_enabled === 1 ||
              data.trx_vs_enabled === "1" ||
              data.trx_vs_enabled === true ||
              data.trx_vs_enabled === "true",
            trx_ks: data.trx_ks || "",
            use_external_qr_api:
              data.use_external_qr_api === 1 ||
              data.use_external_qr_api === "1" ||
              data.use_external_qr_api === true ||
              data.use_external_qr_api === "true",
          });
          if (iban) setIbanStatus(isValidIBAN(iban) ? "valid" : "invalid");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "bank_iban") {
      const val = value as string;
      if (!val) setIbanStatus(null);
      else setIbanStatus(isValidIBAN(val) ? "valid" : "invalid");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.bank_iban && ibanStatus === "invalid") {
      if (!confirm("IBAN se zdá být neplatný. Chcete přesto pokračovat v ukládání?")) return;
    }

    try {
      const res = await fetch("/api/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) alert("Nastavení uloženo");
      else alert("Chyba při ukládání");
    } catch (error) {
      console.error(error);
      alert("Chyba při ukládání");
    }
  };

  if (loading) return <div className="card skeleton"></div>;

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="mb-0">Platební QR kódy</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <h6 className="mb-3 text-mute">Platební údaje (volitelné pro QR)</h6>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold">IBAN (pro QR platby)</label>
              <div className="input-group has-validation">
                <input
                  type="text"
                  className={`form-control ${ibanStatus === "valid" ? "is-valid" : ibanStatus === "invalid" ? "is-invalid" : ""}`}
                  name="bank_iban"
                  placeholder="CZ00 0000 0000 0000 0000 0000"
                  value={formData.bank_iban || ""}
                  onChange={handleChange}
                />
                {ibanStatus === "valid" && (
                  <div className="valid-feedback">
                    IBAN je v pořádku. - Váš účet:{" "}
                    <strong>{decodeCzechIBAN(formData.bank_iban)}</strong>
                  </div>
                )}
                {ibanStatus === "invalid" && (
                  <div className="invalid-feedback">Tento IBAN není platný.</div>
                )}
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label fw-bold">Konst. symbol (KS)</label>
              <input
                type="text"
                className="form-control"
                name="trx_ks"
                value={formData.trx_ks || ""}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label fw-bold">Variabilní symbol (VS)</label>
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="vsEnabled"
                  name="trx_vs_enabled"
                  checked={formData.trx_vs_enabled}
                  onChange={handleChange}
                />
                <label className="form-check-label small" htmlFor="vsEnabled">
                  Použít číslo účtenky
                </label>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Zpráva pro příjemce</label>
            <input
              type="text"
              className="form-control"
              name="trx_msg"
              value={formData.trx_msg || ""}
              onChange={handleChange}
              placeholder="Zpráva, která se objeví v transakci..."
            />
          </div>
          <hr />
          <h6 className="mb-3 text-mute">QR Logika</h6>

          <div className="">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="externalApi"
                name="use_external_qr_api"
                checked={formData.use_external_qr_api}
                onChange={handleChange}
              />
              <label className="form-check-label fw-bold" htmlFor="externalApi">
                Použít externí API (QR Platba)
              </label>
            </div>
            <small className="text-mute d-block mt-1">
              Generuje hezčí QR kód s rámečkem pomocí API paylibo.com (vyžaduje připojení k
              internetu).
            </small>
          </div>

          <hr />
          <h6 className="mb-3 text-mute">Náhled QR Řešení</h6>

          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Testovací částka</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              name="test_amount"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
            />
          </div>

          {ibanStatus === "valid" ? (
            <>
              {/* Lokální generování (vždy zobrazeno) */}
              <div className="row align-items-center bg-dark p-3 rounded mx-0 mb-3">
                <div className="col-auto">
                  <QRCodeSVG
                    value={generateSpaydString({
                      iban: formData.bank_iban,
                      amount: Number(testAmount) || 0,
                      currency: "CZK",
                      vs: formData.trx_vs_enabled ? "1234567890" : "", // Sample VS for preview
                      ks: formData.trx_ks,
                      msg: formData.trx_msg,
                    })}
                    size={128}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <div className="col">
                  <div className="mb-2">
                    <label className="small fw-bold text-mute d-block">
                      SPAYD Řetězec (Lokální):
                    </label>
                    <code className="text-break small">
                      {generateSpaydString({
                        iban: formData.bank_iban,
                        amount: Number(testAmount) || 0,
                        currency: "CZK",
                        vs: formData.trx_vs_enabled ? "1234567890" : "",
                        ks: formData.trx_ks,
                        msg: formData.trx_msg,
                      })}
                    </code>
                  </div>
                  <div className="text-mute small">
                    <Fa.FaCircleInfo className="me-1" />
                    Toto je lokálně generovaný QR kód. Rychlé, bez internetu, ale bez grafického
                    brandingu.
                  </div>
                </div>
              </div>

              {/* Externí API (Paylibo) */}
              {formData.use_external_qr_api ? (
                <div className="row align-items-center bg-dark p-3 rounded mx-0">
                  <div className="col-auto">
                    <img
                      src={`http://api.paylibo.com/paylibo/generator/image?iban=${formData.bank_iban.replace(/\s+/g, "")}&amount=${testAmount || "0.00"}&currency=CZK&vs=${formData.trx_vs_enabled ? "1234567890" : ""}&message=${encodeURIComponent(formData.trx_msg)}&size=128&branding=true`}
                      alt="QR Platba"
                      width={128}
                      height={128}
                      style={{ background: "white", borderRadius: 8 }}
                    />
                  </div>
                  <div className="col">
                    <div className="mb-2">
                      <label className="small fw-bold text-mute d-block">
                        SPAYD Řetězec (Paylibo API):
                      </label>
                      <iframe
                        src={`http://api.paylibo.com/paylibo/generator/string?iban=${formData.bank_iban.replace(/\s+/g, "")}&amount=${testAmount || "0.00"}&currency=CZK&vs=${formData.trx_vs_enabled ? "1234567890" : ""}&message=${encodeURIComponent(formData.trx_msg)}`}
                        style={{
                          width: "100%",
                          height: "50px",
                          border: "none",
                          overflow: "hidden",
                          background: "transparent",
                        }}
                        title="Paylibo SPAYD String"
                      />
                    </div>
                    <div className="text-mute small">
                      <Fa.FaCircleInfo className="me-1" />
                      Toto je náhled z externího API (Paylibo). Vyžaduje připojení k internetu, ale
                      obsahuje hezčí grafiku. Bude použit pouze, pokud je API nahoře zapnuto.
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="alert alert-warning py-2 small">
              Zadejte platný IBAN pro zobrazení náhledu QR kódu.
            </div>
          )}
          <div className="mt-4">
            <button type="submit" className="btn btn-primary">
              <Fa.FaFloppyDisk /> Uložit nastavení
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
