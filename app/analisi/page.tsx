import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Q, AXES } from "@/lib/engine";
import FunnelTag from "@/components/FunnelTag";
import ExportCsv, { type ExportRow } from "@/components/ExportCsv";

export const dynamic = "force-dynamic";

type CheckRow = {
  id: string;
  created_at: string;
  client_first_name: string | null;
  client_last_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  is_anonymous: boolean;
  consent_email: boolean;
  consent_marketing: boolean;
  top_axis: string | null;
  has_alert: boolean;
  funnel_tag: string | null;
  answers: (number | number[] | null)[];
  result: {
    pct?: Record<string, number>;
    tags?: string[];
    alerts?: string[];
    objection?: string;
  } | null;
};

function waLink(phone: string | null, firstName: string | null, salonName: string, axisLabel: string) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10 && digits.startsWith("3")) digits = "39" + digits;
  const msg = encodeURIComponent(
    `Ciao${firstName ? " " + firstName : ""}! Sono ${salonName}. Ho visto il tuo Trimmer Check — il tuo orientamento è "${axisLabel}". Quando vuoi fissiamo la consulenza per parlarne con calma ✨`
  );
  return `https://wa.me/${digits}?text=${msg}`;
}

export default async function Analisi() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: memberships } = await supabase
    .from("memberships")
    .select("salon_id, salons(id, name, slug)")
    .eq("user_id", user.id)
    .limit(1);

  if (!memberships || memberships.length === 0) redirect("/onboarding");
  const salon = (memberships[0] as any).salons as { id: string; name: string; slug: string };

  const { data: checks } = await supabase
    .from("checks")
    .select("id, created_at, client_first_name, client_last_name, client_phone, client_email, is_anonymous, consent_email, consent_marketing, top_axis, has_alert, funnel_tag, answers, result")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (checks || []) as CheckRow[];
  const reali = rows.filter((r) => !r.is_anonymous);

  /* ---------- aggregati ---------- */
  const perAsse: Record<string, number> = { T: 0, TM: 0, AL: 0, NO: 0 };
  const cautele: Record<string, number> = {};
  let conAlert = 0;
  rows.forEach((r) => {
    if (r.top_axis && perAsse[r.top_axis] !== undefined && !r.has_alert) perAsse[r.top_axis]++;
    if (r.has_alert) conAlert++;
    (r.result?.tags || []).forEach((t) => { cautele[t] = (cautele[t] || 0) + 1; });
  });
  const totOrientate = rows.length - conAlert;

  /* distribuzione risposte per domanda */
  const perDomanda = Q.map((q, qi) => {
    const counts = q.opts.map(() => 0);
    let n = 0;
    rows.forEach((r) => {
      const a = r.answers?.[qi];
      if (a === null || a === undefined) return;
      if (q.multi && Array.isArray(a)) {
        a.forEach((k) => { if (counts[k] !== undefined) counts[k]++; });
        n++;
      } else if (typeof a === "number" && counts[a] !== undefined) {
        counts[a]++;
        n++;
      }
    });
    return { q, counts, n };
  });

  /* riepilogo tag funnel */
  const perTag: Record<string, number> = {};
  reali.forEach((r) => {
    const t = r.funnel_tag || "Senza tag";
    perTag[t] = (perTag[t] || 0) + 1;
  });

  /* righe export */
  const exportRows: ExportRow[] = reali.map((r) => ({
    data: new Date(r.created_at).toLocaleDateString("it-IT"),
    nome: r.client_first_name || "",
    cognome: r.client_last_name || "",
    telefono: r.client_phone || "",
    email: r.client_email || "",
    orientamento: r.has_alert
      ? "Da valutare (alert)"
      : AXES.find((a) => a.k === r.top_axis)?.label || "",
    T: r.result?.pct?.T ?? 0,
    TM: r.result?.pct?.TM ?? 0,
    AL: r.result?.pct?.AL ?? 0,
    NO: r.result?.pct?.NO ?? 0,
    cautele: (r.result?.tags || []).join(" | "),
    alert: r.has_alert ? (r.result?.alerts || []).join(" | ") : "",
    consenso_email: r.consent_email ? "sì" : "no",
    consenso_marketing: r.consent_marketing ? "sì" : "no",
    tag_funnel: r.funnel_tag || "",
  }));

  const label = (k: string | null) => AXES.find((a) => a.k === k)?.label ?? "—";
  const maxAsse = Math.max(1, ...Object.values(perAsse));

  return (
    <>
      <div className="top">
        <Link href="/dashboard" className="back" style={{ textDecoration: "none" }}>← Schede</Link>
        <span className="counter">{salon.name}</span>
      </div>

      <h1>Analisi</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        {rows.length} schede totali · {reali.length} con dati cliente
        {conAlert > 0 ? ` · ${conAlert} con segnalazione` : ""}
      </p>

      {/* ---------- ORIENTAMENTI ---------- */}
      <h2 style={{ marginTop: 26 }}>Orientamenti</h2>
      <div style={{ marginTop: 12 }}>
        {AXES.map((a) => {
          const v = perAsse[a.k];
          const pct = totOrientate > 0 ? Math.round((v / totOrientate) * 100) : 0;
          return (
            <div key={a.k} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                <span>{a.label}</span>
                <b>{v} · {pct}%</b>
              </div>
              <div className="track t1"><i style={{ width: `${(v / maxAsse) * 100}%` }} /></div>
            </div>
          );
        })}
        {conAlert > 0 && (
          <p className="tiny" style={{ marginTop: 6 }}>
            Escluse dal conteggio le {conAlert} schede con segnalazione: per loro
            l&apos;orientamento è sospeso fino alla valutazione in salone.
          </p>
        )}
      </div>

      {/* ---------- CAUTELE RICORRENTI ---------- */}
      {Object.keys(cautele).length > 0 && (
        <>
          <h2 style={{ marginTop: 26 }}>Cautele più frequenti</h2>
          <div className="card" style={{ marginTop: 12 }}>
            {Object.entries(cautele)
              .sort((a, b) => b[1] - a[1])
              .map(([t, n]) => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 15 }}>
                  <span>{t}</span><b>{n}</b>
                </div>
              ))}
          </div>
        </>
      )}

      {/* ---------- CLIENTI E FUNNEL ---------- */}
      <h2 style={{ marginTop: 30 }}>Clienti e funnel</h2>
      <div className="card" style={{ marginTop: 12, padding: "8px 18px" }}>
        {Object.entries(perTag).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
          <span key={t} className="tiny" style={{ display: "inline-block", background: "var(--accent-soft)", borderRadius: 8, padding: "4px 10px", margin: "6px 8px 6px 0" }}>
            {t}: <b>{n}</b>
          </span>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {reali.map((r) => {
          const nome = [r.client_first_name, r.client_last_name].filter(Boolean).join(" ") || "Senza nome";
          const axis = r.has_alert ? "Da valutare" : label(r.top_axis);
          const wa = r.consent_marketing
            ? waLink(r.client_phone, r.client_first_name, salon.name, axis)
            : null;
          return (
            <div key={r.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <Link href={`/scheda/${r.id}`} style={{ color: "inherit", fontWeight: 600, textDecoration: "none" }}>
                  {nome}
                </Link>
                <span className="tiny">{new Date(r.created_at).toLocaleDateString("it-IT")}</span>
              </div>
              <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                {axis}
                {r.has_alert ? " ⚠︎" : ""}
                {!r.consent_marketing && <span className="tiny"> · no consenso marketing</span>}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                <FunnelTag checkId={r.id} initial={r.funnel_tag} />
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="tiny"
                    style={{ background: "#E7F6E9", color: "#1F7A33", borderRadius: 10, padding: "7px 12px", textDecoration: "none", fontWeight: 600 }}
                  >
                    WhatsApp ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {reali.length === 0 && (
          <p className="muted">Ancora nessuna scheda con dati cliente.</p>
        )}
      </div>

      <ExportCsv rows={exportRows} />

      {/* ---------- RISPOSTE PER DOMANDA ---------- */}
      <h2 style={{ marginTop: 30 }}>Come rispondono</h2>
      <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
        Utile per capire quali opzioni lavorano e quali domande ritoccare.
      </p>
      {perDomanda.map(({ q, counts, n }) => {
        const max = Math.max(1, ...counts);
        return (
          <div key={q.code} className="card" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{q.text}</div>
            <div className="tiny" style={{ marginBottom: 8 }}>{n} risposte{q.multi ? " (scelta multipla)" : ""}</div>
            {q.opts.map((o, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                  <span style={{ color: "var(--ink-soft)" }}>{o.l}</span>
                  <b>{counts[i]}</b>
                </div>
                <div className="track t1" style={{ height: 6 }}>
                  <i style={{ width: `${(counts[i] / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
