"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export const FUNNEL_TAGS = [
  "Da contattare",
  "Consulenza fissata",
  "Cliente extension",
  "Percorso cura",
  "Non interessata",
] as const;

export default function FunnelTag({
  checkId,
  initial,
}: {
  checkId: string;
  initial: string | null;
}) {
  const [value, setValue] = useState(initial || "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(next: string) {
    setValue(next);
    setState("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("checks")
      .update({ funnel_tag: next || null })
      .eq("id", checkId);
    if (error) {
      setState("error");
      return;
    }
    setState("saved");
    setTimeout(() => setState("idle"), 1500);
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <select
        value={value}
        onChange={(e) => save(e.target.value)}
        style={{
          font: "inherit",
          fontSize: 14,
          padding: "6px 8px",
          borderRadius: 10,
          border: "1px solid var(--line)",
          background: value ? "var(--accent-soft)" : "#fff",
          color: "var(--ink)",
        }}
      >
        <option value="">— nessun tag —</option>
        {FUNNEL_TAGS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <span className="tiny">
        {state === "saving" && "…"}
        {state === "saved" && "✓"}
        {state === "error" && <span style={{ color: "var(--red)" }}>errore</span>}
      </span>
    </span>
  );
}
