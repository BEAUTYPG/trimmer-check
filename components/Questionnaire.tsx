"use client";

import { useMemo, useState } from "react";
import { Q, AXES, INFORMATIVA, compute, topAxis, type Answers, type Result } from "@/lib/engine";
import CaseImage from "@/components/CaseImage";

/* =====================================================================
   TRIMMER CHECK v2 — struttura a schermate:
   0 copertina · 1-4 gruppi tematici · 5 dati e consensi · 6 risultato

   Il MOTORE (lib/engine.ts) e' invariato: stesse 9 domande, stessi
   punteggi. Cambia solo come vengono presentate.
   ===================================================================== */

const GROUPS: { kicker: string; title: string; qIdx: number[] }[] = [
  { kicker: "Il tuo desiderio",     title: "Partiamo da cosa vorresti",   qIdx: [0, 1, 2] },
  { kicker: "I tuoi capelli oggi",  title: "Come sono, come li vivi",     qIdx: [3, 4] },
  { kicker: "Su misura per te",     title: "Impegno e priorità",          qIdx: [5, 6, 7] },
  { kicker: "Per la tua sicurezza", title: "Un ultimo passaggio",         qIdx: [8] },
];

/* Sceglie il caso reale da mostrare accanto al risultato. */
function pickCase(r: Result, answers: Answers): { id: number; title: string; text: string } | null {
  if (r.hasAlert) {
    return {
      id: 3,
      title: "Una cliente partita proprio da qui",
      text: "Anche per lei il primo passo è stata la valutazione in salone. Oggi ha densità piena e la lunghezza che desiderava — dopo aver provato ogni tipo di estensione, ha scelto questa strada.",
    };
  }
  const top = topAxis(r).k;
  if (top === "NO") return null;
  if (r.tags.includes("Capello che si spezza") || r.tags.includes("Chimica recente")) {
    return {
      id: 4,
      title: "Una cliente come te",
      text: "Capelli segnati dai trattamenti chimici. Le abbiamo restituito il suo sogno — biondo, lungo e pieno — senza chiedere nulla ai suoi capelli naturali.",
    };
  }
  if (answers[2] === 0) {
    return {
      id: 2,
      title: "Una cliente come te",
      text: "Sentiva vuota la zona davanti. Abbiamo ricostruito il ciuffo e rinnovato il colore, partendo da una zona sola: gradualità, non stravolgimento.",
    };
  }
  return {
    id: 1,
    title: "Una cliente come te",
    text: "Capello fine e svuotato sulle lunghezze. Oggi: densità, movimento e luce — un progetto completo, costruito nel rispetto dei suoi capelli.",
  };
}

export default function Questionnaire({
  salonSlug,
  salonName,
  salonPhone,
}: {
  salonSlug: string;
  salonName: string;
  salonPhone?: string | null;
}) {
  const [screen, setScreen] = useState(0); // 0..6
  const [answers, setAnswers] = useState<Answers>(() => Q.map((q) => (q.multi ? [] : null)));
  const [anonymous, setAnonymous] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cPrivacy, setCPrivacy] = useState(false);
  const [cEmail, setCEmail] = useState(false);
  const [cMkt, setCMkt] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const result: Result | null = useMemo(
    () => (screen === 6 ? compute(answers) : null),
    [screen, answers]
  );

  function goTo(n: number) {
    setScreen(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  /* ---------- risposte ---------- */
  function pickSingle(qi: number, oi: number) {
    const next = [...answers];
    next[qi] = oi;
    setAnswers(next);
  }

  function toggleMulti(qi: number, oi: number) {
    const q = Q[qi];
    const current = Array.isArray(answers[qi]) ? [...(answers[qi] as number[])] : [];
    const noneIdx = q.opts.findIndex((o) => o.none);
    let next: number[];
    if (oi === noneIdx) {
      next = current.includes(noneIdx) ? [] : [noneIdx];
    } else {
      next = current.filter((i) => i !== noneIdx);
      next = next.includes(oi) ? next.filter((i) => i !== oi) : [...next, oi];
    }
    const copy = [...answers];
    copy[qi] = next;
    setAnswers(copy);
  }

  function groupComplete(g: number): boolean {
    return GROUPS[g].qIdx.every((qi) => {
      if (Q[qi].multi) return true; // la multipla puo' restare vuota
      return answers[qi] !== null && answers[qi] !== undefined;
    });
  }

  /* ---------- salvataggio ---------- */
  async function save(finalAnswers: Answers, anon: boolean) {
    if (anon) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonSlug,
          answers: finalAnswers,
          source: "public",
          client: { anonymous: false, firstName, lastName, phone, email },
          consents: { privacy: cPrivacy, email: cEmail, marketing: cMkt },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSaveError(j.error || "Non sono riuscito a salvare la scheda.");
      } else {
        setSaved(true);
      }
    } catch {
      setSaveError("Connessione assente: la scheda non è stata salvata.");
    } finally {
      setSaving(false);
    }
  }

  function finish(anon: boolean) {
    setAnonymous(anon);
    goTo(6);
    void save(answers, anon);
  }

  const canFinish = cPrivacy && firstName.trim() && lastName.trim();

  /* ---------- elementi comuni ---------- */
  const Steps = ({ n }: { n: number }) => (
    <div className="steps" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={n >= i ? "on" : ""} />
      ))}
    </div>
  );

  /* Bottone prenotazione: apre WhatsApp verso il numero del salone.
     Nel campo phone va il numero registrato su WhatsApp (Business),
     fisso o cellulare che sia. */
  const booking = (() => {
    if (!salonPhone) return null;
    let digits = salonPhone.replace(/\D/g, "");
    if (!digits) return null;
    if (!digits.startsWith("39")) digits = "39" + digits;
    const msg = encodeURIComponent(
      "Ciao! Ho appena fatto il Trimmer Check e vorrei prenotare la consulenza in salone."
    );
    return { href: `https://wa.me/${digits}?text=${msg}`, label: "Prenota la consulenza in salone" };
  })();

  /* ================= 0. COPERTINA ================= */
  if (screen === 0) {
    return (
      <>
        <div className="top"><span className="brand">{salonName}</span></div>
        <div className="hero">
          <CaseImage caseId={1} height={220} />
          <div className="hero-badge">⏱ 2 minuti</div>
        </div>
        <h1>Scopri la strada giusta per i tuoi capelli</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Nove domande, nessun impegno. Alla fine ti proponiamo l&apos;orientamento
          più adatto a te — da valutare insieme in salone.
        </p>
        <div className="row">
          <button className="btn accent" onClick={() => goTo(1)}>Inizia</button>
        </div>
        <p className="tiny" style={{ textAlign: "center", marginTop: 10 }}>
          I tuoi dati te li chiediamo solo alla fine, se vorrai il risultato.
        </p>
      </>
    );
  }

  /* ================= 1-4. GRUPPI ================= */
  if (screen >= 1 && screen <= 4) {
    const g = screen - 1;
    const group = GROUPS[g];
    return (
      <>
        <div className="top"><span className="brand">{salonName}</span></div>
        <Steps n={screen} />
        <div className="kicker">{group.kicker}</div>
        <h2>{group.title}</h2>

        {group.qIdx.map((qi) => {
          const q = Q[qi];
          const a = answers[qi];
          return (
            <div className="qgroup" key={q.code}>
              <div className="qt">{q.text}</div>
              {q.sub && <div className="tiny" style={{ marginBottom: 8 }}>{q.sub}</div>}
              <div className="chips">
                {q.opts.map((o, oi) => {
                  const sel = q.multi
                    ? Array.isArray(a) && a.includes(oi)
                    : a === oi;
                  return (
                    <button
                      key={oi}
                      className={`chip${sel ? " sel" : ""}${q.multi ? " wide" : ""}`}
                      onClick={() => (q.multi ? toggleMulti(qi, oi) : pickSingle(qi, oi))}
                    >
                      {o.l}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="row">
          <button
            className="btn accent"
            disabled={!groupComplete(g)}
            onClick={() => goTo(screen + 1)}
          >
            {screen === 4 ? "Quasi fatto" : "Continua"}
          </button>
        </div>
        <div className="row" style={{ marginTop: 6 }}>
          <button className="back" onClick={() => goTo(screen - 1)}>← Indietro</button>
        </div>
      </>
    );
  }

  /* ================= 5. DATI E CONSENSI ================= */
  if (screen === 5) {
    return (
      <>
        <div className="top"><span className="brand">{salonName}</span></div>
        <Steps n={5} />
        <div className="kicker">Ultimo passo</div>
        <h2>A chi intestiamo il risultato?</h2>

        <div className="card" style={{ marginTop: 16 }}>
          <label className="fld" style={{ marginTop: 0 }}>
            Nome
            <input type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="fld">
            Cognome
            <input type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <label className="fld">
            Cellulare <span className="tiny">(facoltativo)</span>
            <input type="text" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="fld">
            Email <span className="tiny">(facoltativa — per ricevere il risultato)</span>
            <input type="text" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>

        <div className="opts" style={{ marginTop: 16 }}>
          <button className={`opt check${cPrivacy ? " sel" : ""}`} onClick={() => setCPrivacy(!cPrivacy)}>
            <span className="dot" /><span>
              Ho letto l&apos;informativa e acconsento al trattamento dei miei dati,
              comprese le informazioni sui capelli e sul cuoio capelluto, per la
              consulenza in salone. <b>(obbligatorio)</b>
            </span>
          </button>
          <button className={`opt check${cEmail ? " sel" : ""}`} onClick={() => setCEmail(!cEmail)}>
            <span className="dot" /><span>
              Inviami il risultato via email. <span className="tiny">(facoltativo)</span>
            </span>
          </button>
          <button className={`opt check${cMkt ? " sel" : ""}`} onClick={() => setCMkt(!cMkt)}>
            <span className="dot" /><span>
              Comunicazioni e novità dal salone. <span className="tiny">(facoltativo)</span>
            </span>
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="back" onClick={() => setShowInfo(!showInfo)}>
            Leggi l&apos;informativa {showInfo ? "▴" : "▾"}
          </button>
          {showInfo && (
            <div
              style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 1.6, color: "var(--ink-soft)" }}
              dangerouslySetInnerHTML={{ __html: INFORMATIVA }}
            />
          )}
        </div>

        <div className="row">
          <button className="btn accent" disabled={!canFinish} onClick={() => finish(false)}>
            Scopri il tuo orientamento
          </button>
        </div>
        <div className="row" style={{ marginTop: 6 }}>
          <button className="back" onClick={() => finish(true)}>
            Salta — vedi il risultato senza lasciare dati
          </button>
        </div>
        <div className="row" style={{ marginTop: 2 }}>
          <button className="back" onClick={() => goTo(4)}>← Indietro</button>
        </div>
      </>
    );
  }

  /* ================= 6. RISULTATO ================= */
  const r = result!;
  const top = topAxis(r);
  const cs = pickCase(r, answers);

  return (
    <>
      <div className="top"><span className="brand">{salonName}</span></div>

      {r.hasAlert ? (
        <>
          <div className="kicker">Prima di procedere</div>
          <h1 style={{ fontSize: 26 }}>Partiamo con calma</h1>
          <div className="note" style={{ marginTop: 14 }}>
            Da quello che hai indicato emerge una situazione che merita di essere
            guardata da vicino, prima di parlare di estensioni:
            <ul style={{ margin: "10px 0 0 18px" }}>
              {r.alerts.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
          <p className="muted" style={{ marginTop: 14 }}>
            Non è un problema e non esclude nulla: significa solo che il primo
            passo è una valutazione in salone, non una scelta tecnica.
          </p>
        </>
      ) : (
        <>
          <div className="kicker">Il tuo orientamento</div>
          <h1 style={{ fontSize: 27 }}>{top.label}</h1>
          <div className="resmain">
            <p className="muted" style={{ margin: 0, color: "#7A5232" }}>{top.desc}</p>
          </div>

          <div style={{ marginTop: 18 }}>
            {AXES.map((a) => (
              <div key={a.k} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14.5 }}>
                  <span>{a.label}</span>
                  <b>{r.pct[a.k]}%</b>
                </div>
                <div className="track t1"><i style={{ width: `${r.pct[a.k]}%` }} /></div>
              </div>
            ))}
          </div>

          {r.tags.length > 0 && (
            <div className="note" style={{ marginTop: 16 }}>
              <b>Da tenere presente in consulenza</b>
              <ul style={{ margin: "8px 0 0 18px" }}>
                {r.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      {cs && (
        <div className="casecard">
          <CaseImage caseId={cs.id} height={180} />
          <div style={{ padding: "14px 16px" }}>
            <h3>{cs.title}</h3>
            <p className="muted" style={{ margin: "6px 0 0" }}>{cs.text}</p>
            <p className="tiny" style={{ margin: "8px 0 0" }}>Risultato reale di questo salone.</p>
          </div>
        </div>
      )}

      {booking && (
        <div className="row">
          <a className="btn accent" style={{ textDecoration: "none", textAlign: "center" }} href={booking.href} target="_blank" rel="noreferrer">
            {booking.label}
          </a>
        </div>
      )}

      <p className="tiny" style={{ marginTop: 18, textAlign: "center" }}>
        {saving && "Salvataggio in corso…"}
        {!saving && saved && !anonymous && (cEmail && email
          ? "Scheda salvata — il risultato è in viaggio verso la tua email ✉️"
          : "Scheda salvata: la ritrovi in salone al tuo appuntamento.")}
        {!saving && anonymous && "Prova anonima: nessun dato è stato salvato."}
        {saveError && <span style={{ color: "var(--red)" }}>{saveError}</span>}
      </p>
    </>
  );
}
