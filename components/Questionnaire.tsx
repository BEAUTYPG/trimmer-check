"use client";

import { useMemo, useState } from "react";
import { Q, AXES, INFORMATIVA, compute, topAxis, type Answers, type Result } from "@/lib/engine";

type Phase = "consent" | "questions" | "result";

export default function Questionnaire({
  salonSlug,
  salonName,
}: {
  salonSlug: string;
  salonName: string;
}) {
  const [phase, setPhase] = useState<Phase>("consent");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => Q.map(() => null));
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

  const result: Result | null = useMemo(
    () => (phase === "result" ? compute(answers) : null),
    [phase, answers]
  );

  const canStart = anonymous || (cPrivacy && firstName.trim() && lastName.trim());

  /* ---------- salvataggio ---------- */
  async function save(finalAnswers: Answers) {
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
          client: anonymous
            ? { anonymous: true }
            : { anonymous: false, firstName, lastName, phone, email },
          consents: anonymous
            ? {}
            : { privacy: cPrivacy, email: cEmail, marketing: cMkt },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSaveError(j.error || "Non sono riuscito a salvare la scheda.");
      }
    } catch {
      setSaveError("Connessione assente: la scheda non è stata salvata.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- risposta ---------- */
  function answerSingle(optIndex: number) {
    const next = [...answers];
    next[step] = optIndex;
    setAnswers(next);

    if (step + 1 < Q.length) {
      setStep(step + 1);
    } else {
      setPhase("result");
      if (!anonymous) void save(next);
    }
  }

  function toggleMulti(optIndex: number) {
    const q = Q[step];
    const current = Array.isArray(answers[step]) ? ([...(answers[step] as number[])]) : [];
    const noneIdx = q.opts.findIndex((o) => o.none);

    let next: number[];
    if (optIndex === noneIdx) {
      next = current.includes(noneIdx) ? [] : [noneIdx];
    } else {
      next = current.filter((i) => i !== noneIdx);
      next = next.includes(optIndex) ? next.filter((i) => i !== optIndex) : [...next, optIndex];
    }

    const copy = [...answers];
    copy[step] = next;
    setAnswers(copy);
  }

  function confirmMulti() {
    const next = [...answers];
    if (!Array.isArray(next[step])) next[step] = [];
    setAnswers(next);
    setPhase("result");
    if (!anonymous) void save(next);
  }

  /* ================= CONSENSO ================= */
  if (phase === "consent") {
    return (
      <>
        <div className="top"><span className="brand">{salonName}</span></div>

        <h1>Trimmer Check</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Nove domande per capire insieme qual è la strada giusta per i tuoi
          capelli. Non è un acquisto e non è un impegno: è un orientamento che
          poi valutiamo insieme in salone.
        </p>

        {!anonymous && (
          <>
            <div className="card" style={{ marginTop: 22 }}>
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
                Email <span className="tiny">(facoltativa)</span>
                <input type="text" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>

            <div className="opts" style={{ marginTop: 18 }}>
              <button className={`opt check${cPrivacy ? " sel" : ""}`} onClick={() => setCPrivacy(!cPrivacy)}>
                <span className="dot" /><span>
                  Ho letto l&apos;informativa e acconsento al trattamento dei miei dati,
                  comprese le informazioni sui capelli e sul cuoio capelluto, per la
                  consulenza in salone. <b>(obbligatorio)</b>
                </span>
              </button>
              <button className={`opt check${cEmail ? " sel" : ""}`} onClick={() => setCEmail(!cEmail)}>
                <span className="dot" /><span>
                  Acconsento a ricevere il risultato del questionario via email.{" "}
                  <span className="tiny">(facoltativo)</span>
                </span>
              </button>
              <button className={`opt check${cMkt ? " sel" : ""}`} onClick={() => setCMkt(!cMkt)}>
                <span className="dot" /><span>
                  Acconsento a ricevere comunicazioni e novità dal salone.{" "}
                  <span className="tiny">(facoltativo)</span>
                </span>
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
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
          </>
        )}

        {anonymous && (
          <div className="note" style={{ marginTop: 22 }}>
            Prova anonima: non viene registrato nessun dato personale.
            Il risultato resta su questo schermo.
          </div>
        )}

        <div className="row">
          <button className="btn accent" disabled={!canStart} onClick={() => setPhase("questions")}>
            Inizia il questionario
          </button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="back" onClick={() => setAnonymous(!anonymous)}>
            {anonymous ? "Torna indietro e inserisci i dati" : "Salta — prova anonima senza dati"}
          </button>
        </div>
      </>
    );
  }

  /* ================= DOMANDE ================= */
  if (phase === "questions") {
    const q = Q[step];
    const selected = answers[step];
    const multiSel = Array.isArray(selected) ? selected : [];

    return (
      <>
        <div className="top">
          <span className="brand">{salonName}</span>
          <span className="counter">{step + 1} / {Q.length}</span>
        </div>

        <div className="prog"><i style={{ width: `${(step / Q.length) * 100}%` }} /></div>

        <h2 style={{ marginTop: 22 }}>{q.text}</h2>
        {q.sub && <p className="muted" style={{ marginTop: 8 }}>{q.sub}</p>}

        <div className="opts" style={{ marginTop: 18 }}>
          {q.opts.map((o, i) => {
            const isSel = q.multi ? multiSel.includes(i) : selected === i;
            return (
              <button
                key={i}
                className={`opt${q.multi ? " check" : ""}${isSel ? " sel" : ""}`}
                onClick={() => (q.multi ? toggleMulti(i) : answerSingle(i))}
              >
                {q.multi && <span className="dot" />}
                <span>{o.l}</span>
              </button>
            );
          })}
        </div>

        {q.multi && (
          <div className="row">
            <button className="btn accent" onClick={confirmMulti}>Vedi il risultato</button>
          </div>
        )}

        {step > 0 && (
          <div className="row" style={{ marginTop: 8 }}>
            <button className="back" onClick={() => setStep(step - 1)}>Indietro</button>
          </div>
        )}
      </>
    );
  }

  /* ================= RISULTATO ================= */
  const r = result!;
  const top = topAxis(r);

  return (
    <>
      <div className="top"><span className="brand">{salonName}</span></div>

      {r.hasAlert ? (
        <>
          <h1>Prima di procedere</h1>
          <div className="note" style={{ marginTop: 16 }}>
            Da quello che hai indicato emerge una situazione che merita di essere
            guardata da vicino, prima di parlare di estensioni:
            <ul style={{ margin: "10px 0 0 18px" }}>
              {r.alerts.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
          <p className="muted" style={{ marginTop: 16 }}>
            Non è un problema e non esclude nulla: significa solo che il primo
            passo è una valutazione in salone, non una scelta tecnica. Il
            risultato del questionario resta a disposizione per la consulenza.
          </p>
        </>
      ) : (
        <>
          <h1>Il tuo orientamento</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            È un punto di partenza per la consulenza, non una decisione presa.
          </p>

          <div className="card" style={{ marginTop: 22 }}>
            <h3>{top.label}</h3>
            <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>{top.desc}</p>
          </div>

          <div style={{ marginTop: 20 }}>
            {AXES.map((a) => (
              <div key={a.k} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                  <span>{a.label}</span>
                  <b>{r.pct[a.k]}%</b>
                </div>
                <div className="bar"><i style={{ width: `${r.pct[a.k]}%` }} /></div>
              </div>
            ))}
          </div>

          {r.tags.length > 0 && (
            <div className="note" style={{ marginTop: 20 }}>
              <b>Da tenere presente in consulenza</b>
              <ul style={{ margin: "8px 0 0 18px" }}>
                {r.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="tiny" style={{ marginTop: 24 }}>
        {saving && "Salvataggio in corso…"}
        {!saving && !saveError && !anonymous && "Scheda salvata: la ritrovi in salone al tuo appuntamento."}
        {!saving && !saveError && anonymous && "Prova anonima: niente è stato salvato."}
        {saveError && <span style={{ color: "var(--red)" }}>{saveError}</span>}
      </p>
    </>
  );
}
