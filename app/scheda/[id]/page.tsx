import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Q, AXES } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default async function Scheda({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // RLS: se la scheda non e' del salone dell'utente, qui non torna nulla.
  const { data: check } = await supabase
    .from("checks")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!check) notFound();

  const r = check.result as any;
  const answers = check.answers as (number | number[] | null)[];
  const nome = check.is_anonymous
    ? "Prova anonima"
    : [check.client_first_name, check.client_last_name].filter(Boolean).join(" ") || "Senza nome";

  const data = new Date(check.created_at).toLocaleDateString("it-IT", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <>
      <div className="top">
        <Link href="/dashboard" className="back" style={{ textDecoration: "none" }}>← Schede</Link>
      </div>

      <h1>{nome}</h1>
      <p className="muted" style={{ marginTop: 8 }}>{data}</p>

      {check.has_alert && (
        <div className="note" style={{ marginTop: 18 }}>
          <b>Da valutare prima di procedere</b>
          <ul style={{ margin: "8px 0 0 18px" }}>
            {(r?.alerts || []).map((a: string) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        {AXES.map((a) => (
          <div key={a.k} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span>{a.label}</span>
              <b>{r?.pct?.[a.k] ?? 0}%</b>
            </div>
            <div className="track t1"><i style={{ width: `${r?.pct?.[a.k] ?? 0}%` }} /></div>
          </div>
        ))}
      </div>

      {r?.objection && r.objection !== "—" && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3>Preoccupazione principale</h3>
          <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>{r.objection}</p>
        </div>
      )}

      {(r?.tags || []).length > 0 && (
        <div className="note" style={{ marginTop: 18 }}>
          <b>Da tenere presente</b>
          <ul style={{ margin: "8px 0 0 18px" }}>
            {r.tags.map((t: string) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      <h2 style={{ marginTop: 30 }}>Risposte</h2>
      <div style={{ marginTop: 14 }}>
        {Q.map((q, i) => {
          const a = answers?.[i];
          let testo = "—";
          if (Array.isArray(a)) testo = a.map((k) => q.opts[k]?.l).filter(Boolean).join(" · ") || "—";
          else if (typeof a === "number") testo = q.opts[a]?.l ?? "—";

          return (
            <div key={q.code} style={{ marginBottom: 16 }}>
              <div className="tiny">{q.text}</div>
              <div style={{ fontSize: 16, marginTop: 2 }}>{testo}</div>
            </div>
          );
        })}
      </div>

      {!check.is_anonymous && (check.client_phone || check.client_email) && (
        <div className="card" style={{ marginTop: 10 }}>
          <h3>Contatti</h3>
          {check.client_phone && <p style={{ marginTop: 8, marginBottom: 0 }}>{check.client_phone}</p>}
          {check.client_email && <p style={{ marginTop: 4, marginBottom: 0 }}>{check.client_email}</p>}
        </div>
      )}

      <p className="tiny" style={{ marginTop: 24 }}>
        Questionario v{check.questions_ver}
        {check.informativa_ver ? ` · informativa ${check.informativa_ver}` : ""}
      </p>
    </>
  );
}
