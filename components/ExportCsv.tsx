"use client";

import { useState } from "react";

export type ExportRow = {
  data: string;
  nome: string;
  cognome: string;
  telefono: string;
  email: string;
  orientamento: string;
  T: number; TM: number; AL: number; NO: number;
  cautele: string;
  alert: string;
  consenso_email: string;
  consenso_marketing: string;
  tag_funnel: string;
};

function toCsv(rows: ExportRow[]): string {
  const header = [
    "Data", "Nome", "Cognome", "Telefono", "Email", "Orientamento",
    "Trimmer %", "Trimmer+altro %", "Altro %", "No estensioni %",
    "Cautele", "Alert", "Consenso email", "Consenso marketing", "Tag funnel",
  ];
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [r.data, r.nome, r.cognome, r.telefono, r.email, r.orientamento,
     r.T, r.TM, r.AL, r.NO, r.cautele, r.alert,
     r.consenso_email, r.consenso_marketing, r.tag_funnel].map(esc).join(";")
  );
  // BOM per Excel + separatore ; (standard italiano)
  return "﻿" + [header.join(";"), ...lines].join("\r\n");
}

export default function ExportCsv({ rows }: { rows: ExportRow[] }) {
  const [soloMarketing, setSoloMarketing] = useState(true);

  function download() {
    const selected = soloMarketing
      ? rows.filter((r) => r.consenso_marketing === "sì")
      : rows;
    const blob = new Blob([toCsv(selected)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trimmer-check-clienti-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const nMkt = rows.filter((r) => r.consenso_marketing === "sì").length;

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <h3>Esporta per il funnel</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        File CSV con dati, orientamento, consensi e tag — pronto per liste
        email e WhatsApp.
      </p>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, cursor: "pointer", marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={soloMarketing}
          onChange={(e) => setSoloMarketing(e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span>
          Solo clienti con <b>consenso marketing</b> ({nMkt} su {rows.length}).
          <br />
          <span className="tiny">
            Nel funnel promozionale possono entrare solo loro: le altre hanno
            dato i dati per la sola consulenza.
          </span>
        </span>
      </label>
      <button className="btn accent" onClick={download}>
        Scarica CSV ({soloMarketing ? nMkt : rows.length} clienti)
      </button>
    </div>
  );
}
