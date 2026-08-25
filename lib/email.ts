import nodemailer from "nodemailer";
import { AXES, type Result, type AxisKey } from "@/lib/engine";

/* =====================================================================
   Invio email via SMTP (IONOS).
   Configurazione: variabili d'ambiente su Vercel —
     SMTP_HOST  es. smtp.ionos.it
     SMTP_PORT  465
     SMTP_USER  casella completa, es. info@tuodominio.it
     SMTP_PASS  password della casella
     SMTP_FROM  facoltativa: mittente visualizzato, default = SMTP_USER
   Se le variabili mancano, l'invio viene semplicemente saltato:
   la scheda si salva comunque, nessun errore per la cliente.
   ===================================================================== */

export function emailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const BG = "#F6F2ED", CARD = "#FFFFFF", INK = "#211C19", SOFT = "#6B615A",
      ACCENT = "#A8734A", LINE = "#E3DAD0", ACCENT_SOFT = "#F0E4D8";

function bar(label: string, pct: number, highlight: boolean) {
  return `
  <tr>
    <td style="padding:6px 0 2px;font-size:14px;color:${INK}">
      ${label}
      <span style="float:right;font-weight:bold">${pct}%</span>
    </td>
  </tr>
  <tr>
    <td style="padding-bottom:8px">
      <div style="background:${LINE};border-radius:6px;height:10px;overflow:hidden">
        <div style="width:${Math.max(2, pct)}%;height:10px;border-radius:6px;background:${highlight ? ACCENT : "#C7B7A8"}"></div>
      </div>
    </td>
  </tr>`;
}

export async function sendResultEmail(opts: {
  to: string;
  firstName: string | null;
  salonName: string;
  result: Result;
}): Promise<void> {
  if (!emailConfigured()) return;

  const { to, firstName, salonName, result } = opts;
  const nome = firstName?.trim() || "";
  const saluto = nome ? `Ciao ${nome},` : "Ciao,";

  let corpo: string;
  let subject: string;

  if (result.hasAlert) {
    subject = `Il tuo Trimmer Check — ${salonName}`;
    corpo = `
      <p style="margin:0 0 14px">${saluto}</p>
      <p style="margin:0 0 14px">grazie per aver completato il questionario.
      Da quello che hai indicato è emersa una situazione che merita di essere
      guardata da vicino insieme, prima di parlare di estensioni:</p>
      <ul style="margin:0 0 14px 18px;color:${SOFT}">
        ${result.alerts.map((a) => `<li>${a}</li>`).join("")}
      </ul>
      <p style="margin:0 0 14px">Non è un problema e non esclude nulla:
      significa solo che il primo passo giusto è una valutazione in salone.
      Ti aspettiamo per parlarne con calma.</p>`;
  } else {
    let best: AxisKey = "T";
    (Object.keys(result.pct) as AxisKey[]).forEach((k) => {
      if (result.pct[k] > result.pct[best]) best = k;
    });
    const top = AXES.find((a) => a.k === best)!;

    subject = `Il tuo orientamento Trimmer Check — ${salonName}`;
    corpo = `
      <p style="margin:0 0 14px">${saluto}</p>
      <p style="margin:0 0 14px">grazie per aver completato il questionario.
      Ecco il tuo orientamento — un punto di partenza per la consulenza,
      non una decisione già presa.</p>

      <div style="background:${ACCENT_SOFT};border-radius:12px;padding:16px 18px;margin:0 0 18px">
        <div style="font-size:18px;font-weight:bold;color:${INK}">${top.label}</div>
        <div style="font-size:14px;color:#7A5232;margin-top:6px">${top.desc}</div>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">
        ${AXES.map((a) => bar(a.label, result.pct[a.k], a.k === best)).join("")}
      </table>

      ${result.tags.length > 0 ? `
      <p style="margin:14px 0 6px;font-weight:bold">Da tenere presente in consulenza</p>
      <ul style="margin:0 0 14px 18px;color:${SOFT}">
        ${result.tags.map((t) => `<li>${t}</li>`).join("")}
      </ul>` : ""}

      <p style="margin:14px 0 0">Porta pure questa email al tuo appuntamento:
      partiremo da qui.</p>`;
  }

  const html = `
  <div style="background:${BG};padding:28px 14px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK}">
    <div style="max-width:560px;margin:0 auto">
      <div style="text-align:center;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:14px">
        ${salonName}
      </div>
      <div style="background:${CARD};border:1px solid ${LINE};border-radius:16px;padding:26px 24px;font-size:16px;line-height:1.55">
        ${corpo}
      </div>
      <div style="text-align:center;font-size:12px;color:${SOFT};margin-top:14px">
        Hai ricevuto questa email perché hai richiesto il risultato del tuo
        Trimmer Check presso ${salonName}.
      </div>
    </div>
  </div>`;

  await transporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

/* =====================================================================
   AVVISO AL SALONE — parte a ogni questionario completato.
   Va all'indirizzo in salons.notify_email. Se il campo è vuoto,
   l'avviso viene semplicemente saltato. L'invio non blocca MAI il
   salvataggio della scheda: se fallisce, la scheda resta al suo posto.
   ===================================================================== */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://trimmer-check.vercel.app";

const RED = "#B4322E", RED_SOFT = "#F7E3E2";

export async function sendSalonNotifyEmail(opts: {
  to: string;
  salonName: string;
  result: Result;
  /** null = prova anonima: niente scheda salvata, niente link */
  checkId: string | null;
  isAnonymous: boolean;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
}): Promise<void> {
  if (!emailConfigured()) return;

  const { to, salonName, result, checkId, isAnonymous } = opts;

  const nome = isAnonymous
    ? "Prova anonima"
    : [opts.firstName, opts.lastName].filter((v) => v && v.trim()).join(" ").trim() || "Senza nome";

  let best: AxisKey = "T";
  (Object.keys(result.pct) as AxisKey[]).forEach((k) => {
    if (result.pct[k] > result.pct[best]) best = k;
  });
  const top = AXES.find((a) => a.k === best)!;

  const subject = result.hasAlert
    ? `⚠ Nuova scheda con segnalazione — ${nome}`
    : `Nuova scheda Trimmer Check — ${nome}`;

  /* badge rosso: alert sanitario da valutare in salone */
  const badge = result.hasAlert
    ? `
      <div style="background:${RED_SOFT};border:1px solid ${RED};border-radius:12px;padding:12px 16px;margin:0 0 16px">
        <div style="font-size:14px;font-weight:bold;color:${RED};letter-spacing:.06em;text-transform:uppercase">
          Segnalazione da valutare
        </div>
        <ul style="margin:8px 0 0 18px;color:${INK};font-size:14px">
          ${result.alerts.map((a) => `<li>${a}</li>`).join("")}
        </ul>
        <div style="font-size:13px;color:${SOFT};margin-top:8px">
          L&rsquo;orientamento è sospeso: serve la valutazione in salone.
        </div>
      </div>`
    : "";

  const contatti = isAnonymous
    ? `<p style="margin:0 0 14px;color:${SOFT}">Prova anonima: la cliente non ha
       lasciato dati e nessuna scheda è stata salvata. Questo è solo un avviso
       che il questionario è stato usato.</p>`
    : `
      <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:15px;color:${INK}">
        <tr><td style="color:${SOFT};padding-right:14px">Nome</td><td><b>${nome}</b></td></tr>
        ${opts.phone ? `<tr><td style="color:${SOFT};padding-right:14px">Telefono</td><td>${opts.phone}</td></tr>` : ""}
        ${opts.email ? `<tr><td style="color:${SOFT};padding-right:14px">Email</td><td>${opts.email}</td></tr>` : ""}
        ${opts.source === "salon" ? `<tr><td style="color:${SOFT};padding-right:14px">Origine</td><td>compilata in salone</td></tr>` : ""}
      </table>`;

  const orientamento = result.hasAlert
    ? ""
    : `
      <div style="background:${ACCENT_SOFT};border-radius:12px;padding:14px 16px;margin:0 0 14px">
        <div style="font-size:16px;font-weight:bold;color:${INK}">${top.label} · ${result.pct[best]}%</div>
        <div style="font-size:13px;color:#7A5232;margin-top:4px">${top.desc}</div>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">
        ${AXES.map((a) => bar(a.label, result.pct[a.k], a.k === best)).join("")}
      </table>`;

  const cautele =
    result.tags.length > 0
      ? `
      <p style="margin:14px 0 6px;font-weight:bold">Cautele tecniche</p>
      <ul style="margin:0 0 14px 18px;color:${SOFT}">
        ${result.tags.map((t) => `<li>${t}</li>`).join("")}
      </ul>`
      : "";

  const linkScheda = checkId
    ? `
      <div style="text-align:center;margin:20px 0 4px">
        <a href="${SITE_URL}/scheda/${checkId}"
           style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;border-radius:10px;padding:12px 22px;font-size:15px;font-weight:bold">
          Apri la scheda
        </a>
      </div>`
    : "";

  const html = `
  <div style="background:${BG};padding:28px 14px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK}">
    <div style="max-width:560px;margin:0 auto">
      <div style="text-align:center;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};margin-bottom:14px">
        ${salonName} · Trimmer Check
      </div>
      <div style="background:${CARD};border:1px solid ${LINE};border-radius:16px;padding:26px 24px;font-size:16px;line-height:1.55">
        <p style="margin:0 0 14px">È appena stato completato un questionario.</p>
        ${badge}
        ${contatti}
        ${orientamento}
        ${cautele}
        ${linkScheda}
      </div>
      <div style="text-align:center;font-size:12px;color:${SOFT};margin-top:14px">
        Avviso automatico per il salone. Le schede complete sono nell&rsquo;area riservata.
      </div>
    </div>
  </div>`;

  await transporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}
