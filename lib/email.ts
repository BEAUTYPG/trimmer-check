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
