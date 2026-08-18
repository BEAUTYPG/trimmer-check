/* =====================================================================
   TRIMMER CHECK — motore del questionario
   Portato dal prototipo, con la stessa logica di punteggio.

   Regola di fondo: il risultato non e' un verdetto, e' un orientamento.
   I "PRIOR" servono esattamente a questo — nessun profilo esce mai
   100 / 0 / 0 / 0.
   ===================================================================== */

export const QUESTIONS_VER = "1.0";

export type Opt = {
  l: string;
  T?: number; TM?: number; AL?: number; NO?: number;
  dT?: number; dTM?: number; dAL?: number;
  tag?: string;
  alert?: string;
  none?: boolean;
  /* Immagine dell'opzione (facoltativa).
     img    = nome file in public/q-imgs (senza estensione: prova .jpg poi .png)
     imgCdn = URL remoto di riserva finche' il file locale non c'e' */
  img?: string;
  imgCdn?: string;
};

const CDN = "https://media.horacle.ai/product-images/nano-banana/274dbab4-aaf4-45af-9eb5-fd47fe1bf075";

export type Question = {
  code: string;
  text: string;
  sub?: string;
  multi?: boolean;
  objection?: boolean;
  opts: Opt[];
};

export const Q: Question[] = [
  { code: "Q1", text: "Quando pensi ai tuoi capelli, cosa vorresti migliorare prima di tutto?", opts: [
    { l: "Più volume",                                       T:4, TM:2, AL:1, NO:0, img: "q1-volume" },
    { l: "Più lunghezza",                                    T:1, TM:3, AL:4, NO:0, img: "q1-lunghezza" },
    { l: "Più densità in una zona",                          T:4, TM:2, AL:0, NO:0, img: "q1-densita" },
    { l: "Correggere un taglio o una forma",                 T:3, TM:2, AL:2, NO:0, img: "q1-taglio" },
    { l: "Cambiare immagine senza aspettare la ricrescita",  T:2, TM:3, AL:3, NO:0, img: "q1-cambio" },
  ]},
  { code: "Q2", text: "Qual è il momento in cui senti maggiormente il disagio?", opts: [
    { l: "Quando mi guardo allo specchio",                   T:2, TM:2, AL:2, NO:0 },
    { l: "Quando li pettino o li metto in piega",            T:2, TM:1, AL:1, NO:1 },
    { l: "Quando li raccolgo",                               T:4, TM:2, AL:0, NO:0 },
    { l: "Quando vedo foto o video di me",                   T:2, TM:2, AL:2, NO:0 },
    { l: "Quando li confronto con come vorrei averli",       T:1, TM:2, AL:2, NO:1 },
  ]},
  { code: "Q3", text: "Hai una zona che senti poco piena o difficile da valorizzare?", opts: [
    { l: "Sì, davanti o ai lati",                            T:4, TM:2, AL:0, NO:0 },
    { l: "Sì, sulla lunghezza",                              T:1, TM:3, AL:4, NO:0 },
    { l: "Sì, nella parte alta o posteriore",                T:3, TM:2, AL:0, NO:1 },
    { l: "No, desidero più lunghezza o volume generale",     T:2, TM:3, AL:3, NO:0 },
  ]},
  { code: "Q4", text: "Come definiresti oggi i tuoi capelli?", opts: [
    { l: "Fini o poco densi",                                T:5, TM:2, AL:0, NO:0, dAL:0.5, tag:"Capello che non regge peso",
      img: "q4-fini",    imgCdn: `${CDN}/fcc10192b435b8ad974976e256e46d65-1787055456314.png` },
    { l: "Fragili o sensibilizzati",                         T:5, TM:1, AL:0, NO:1, dAL:0.2, tag:"Capello delicato — priorità leggerezza",
      img: "q4-fragili", imgCdn: `${CDN}/f1e854844ca89003a1cdb88e19cd83cb-1787055458824.png` },
    { l: "Corti e difficili da far crescere",                T:2, TM:3, AL:2, NO:0,
      img: "q4-corti",   imgCdn: `${CDN}/af915225363eeed5e5974603ee63e9e8-1787055470457.png` },
    { l: "Sani, ma poco voluminosi",                         T:4, TM:2, AL:1, NO:0,
      img: "q4-piatti",  imgCdn: `${CDN}/1c9a62372ce6b0049f8b6acac4a99217-1787055472469.png` },
    { l: "Sani e pieni: desidero una trasformazione estetica", T:2, TM:3, AL:4, NO:0,
      img: "q4-pieni",   imgCdn: `${CDN}/dffe6221fbbffdaef5c8b34a68a40a5c-1787055477914.png` },
  ]},
  { code: "Q5", text: "Come ami portarli nella vita di tutti i giorni?", opts: [
    { l: "Sciolti e naturali",                               T:2, TM:2, AL:2, NO:0 },
    { l: "Lisci e ordinati",                                 T:2, TM:2, AL:2, NO:0 },
    { l: "Mossi o con piega",                                T:2, TM:2, AL:2, NO:0 },
    { l: "Spesso raccolti",                                  T:4, TM:2, AL:0, NO:0 },
    { l: "Cambio stile frequentemente",                      T:3, TM:2, AL:1, NO:0 },
  ]},
  // Q6 — impegno sostenibile: tempo in salone + cura nel tempo, senza parlare di prezzo
  { code: "Q6", text: "Pensando all'impegno complessivo — tempo in salone e cura nel tempo — cosa ti rispecchia di più?", opts: [
    { l: "Posso seguire un progetto completo, con controlli regolari", T:2, TM:3, AL:4, NO:0 },
    { l: "Preferisco iniziare in modo graduale e crescere nel tempo",  T:4, TM:2, AL:0, NO:0, tag:"Preferisce partire in piccolo" },
    { l: "Ho poco tempo: cerco qualcosa di pratico e leggero",         T:4, TM:1, AL:0, NO:1, dAL:0.4, tag:"Tempo limitato" },
    { l: "Vorrei prima capire bene tempi e impegno",                   T:2, TM:2, AL:1, NO:1, tag:"Impegno da chiarire" },
  ]},
  { code: "Q7", text: "Qual è la tua preoccupazione principale?", objection: true, opts: [
    { l: "Che i capelli naturali si rovinino",               T:5, TM:1, AL:0, NO:0, dAL:0.4, tag:"Timore per la salute del capello" },
    { l: "Che le extension si vedano",                       T:3, TM:2, AL:1, NO:0 },
    { l: "Che l'effetto non sia naturale",                   T:3, TM:2, AL:1, NO:0 },
    { l: "Il costo complessivo nel tempo",                   T:4, TM:1, AL:0, NO:1, dAL:0.5, tag:"Sensibilità al costo" },
    { l: "Il tempo necessario per applicazione e manutenzione", T:4, TM:1, AL:0, NO:1, dAL:0.5, tag:"Tempo limitato" },
    { l: "Non sapere se sono adatte ai miei capelli",        T:2, TM:2, AL:1, NO:1 },
  ]},
  { code: "Q8", text: "Quanto è importante per te fare una scelta progettata su misura?", opts: [
    { l: "Essenziale: voglio capire qual è la soluzione più corretta per me", T:3, TM:3, AL:1, NO:0 },
    { l: "Importante, ma desidero qualcosa di semplice",     T:3, TM:2, AL:1, NO:0 },
    { l: "Vorrei prima una consulenza senza impegno",        T:2, TM:2, AL:1, NO:1 },
    { l: "Preferisco rimandare: oggi non sono pronta",       T:0, TM:0, AL:0, NO:5, dT:0.3, dTM:0.3, dAL:0.3, tag:"Non pronta" },
  ]},
  /* Q9 — check finale. Due nature diverse, da non confondere:
     ALERT (dominio sanitario: diradamento, cute) -> sospende l'orientamento.
     CAUTELA TECNICA (capello che si spezza, chimica recente) -> non blocca:
     e' proprio l'indicazione per un'applicazione senza peso. */
  { code: "Q9", text: "Un ultimo passaggio, per la tua sicurezza.",
    sub: "Segnala se riconosci una di queste situazioni. Puoi indicarne più di una.", multi: true, opts: [
    { l: "Ho notato una perdita di capelli aumentata negli ultimi mesi", alert: "Diradamento recente o rapido" },
    { l: "Ho prurito, rossore o fastidio al cuoio capelluto",            alert: "Sintomi del cuoio capelluto" },
    { l: "Ho fatto trattamenti chimici molto recenti o aggressivi",      T:4, TM:1, AL:0, NO:1, dAL:0.3, tag:"Chimica recente" },
    { l: "I miei capelli si spezzano con facilità",                      T:5, TM:1, AL:0, NO:1, dAL:0.25, tag:"Capello che si spezza" },
    { l: "Nessuna di queste", none: true },
  ]},
];

export const AXES = [
  { k: "T",  label: "Trimmer",         desc: "Estensioni senza peso e curative: rispettano il capello, si parte da una zona e si cresce nel tempo." },
  { k: "TM", label: "Trimmer + altro", desc: "Progetto misto: metodo Trimmer combinato con extension tradizionali dove servono." },
  { k: "AL", label: "Altro",           desc: "Extension tradizionali: progetto completo, più tempo in salone e investimento pieno." },
  { k: "NO", label: "No estensioni",   desc: "Oggi non è la strada: meglio valorizzare taglio, colore o un percorso di cura." },
] as const;

export type AxisKey = (typeof AXES)[number]["k"];

/* PRIOR di prudenza: nessun profilo esce mai 100/0/0/0.
   E' un orientamento, non un verdetto. */
export const PRIOR: Record<AxisKey, number> = { T: 0.4, TM: 0.8, AL: 0.6, NO: 0.6 };

export const INFORMATIVA_VER = "bozza-0.1";

export type Answers = (number | number[] | null)[];

export type Result = {
  pct: Record<AxisKey, number>;
  raw: Record<AxisKey, number>;
  dT: number; dTM: number; dAL: number;
  hasAlert: boolean;
  alerts: string[];
  tags: string[];
  objection: string;
};

export function compute(ans: Answers): Result {
  const s: Record<AxisKey, number> = { T: 0, TM: 0, AL: 0, NO: 0 };
  let dT = 1, dTM = 1, dAL = 1;
  const alerts: string[] = [];
  const tags: string[] = [];
  let objection = "—";

  const applyOpt = (o: Opt) => {
    s.T += o.T || 0; s.TM += o.TM || 0; s.AL += o.AL || 0; s.NO += o.NO || 0;
    if (o.dT) dT *= o.dT;
    if (o.dTM) dTM *= o.dTM;
    if (o.dAL) dAL *= o.dAL;
    if (o.tag) tags.push(o.tag);
  };

  Q.forEach((q, i) => {
    const a = ans[i];
    if (a === undefined || a === null) return;

    if (q.multi) {
      (Array.isArray(a) ? a : []).forEach((k) => {
        const o = q.opts[k];
        if (!o) return;
        if (o.alert) { alerts.push(o.alert); return; }
        applyOpt(o);
      });
      return;
    }

    const o = q.opts[a as number];
    if (!o) return;
    applyOpt(o);
    if (q.objection) objection = o.l;
  });

  const raw = { ...s };

  s.T = Math.max(0, s.T * dT);
  s.TM = Math.max(0, s.TM * dTM);
  s.AL = Math.max(0, s.AL * dAL);
  s.NO = Math.max(0, s.NO);

  s.T += PRIOR.T; s.TM += PRIOR.TM; s.AL += PRIOR.AL; s.NO += PRIOR.NO;

  const tot = s.T + s.TM + s.AL + s.NO;
  let pct: Record<AxisKey, number> = { T: 0, TM: 0, AL: 0, NO: 0 };

  if (tot > 0) {
    const r: Record<string, number> = {};
    const fl: Record<string, number> = {};
    AXES.forEach((a) => { r[a.k] = (s[a.k] / tot) * 100; fl[a.k] = Math.floor(r[a.k]); });
    let rest = 100 - AXES.reduce((x, a) => x + fl[a.k], 0);
    AXES.map((a) => a.k)
      .sort((x, y) => (r[y] - fl[y]) - (r[x] - fl[x]))
      .forEach((k) => { if (rest > 0) { fl[k]++; rest--; } });
    pct = fl as Record<AxisKey, number>;
  }

  return {
    pct, raw,
    dT: Math.round(dT * 100) / 100,
    dTM: Math.round(dTM * 100) / 100,
    dAL: Math.round(dAL * 100) / 100,
    hasAlert: alerts.length > 0,
    alerts: [...new Set(alerts)],
    tags: [...new Set(tags)],
    objection,
  };
}

export function topAxis(r: Result) {
  let best: AxisKey = AXES[0].k;
  AXES.forEach((a) => { if (r.pct[a.k] > r.pct[best]) best = a.k; });
  return AXES.find((a) => a.k === best)!;
}

export const INFORMATIVA = `
<b>Titolare del trattamento:</b> [ragione sociale del salone] — [indirizzo] — [email].<br><br>
<b>Quali dati raccogliamo:</b> nome e cognome, recapito telefonico ed email; le risposte al questionario, che comprendono informazioni sullo stato dei tuoi capelli e del cuoio capelluto.<br><br>
<b>Perché:</b> per preparare la consulenza tecnica in salone e, se lo autorizzi, per inviarti il risultato via email.<br><br>
<b>Base giuridica:</b> il tuo consenso, che puoi revocare in qualsiasi momento senza conseguenze sul servizio già ricevuto.<br><br>
<b>Per quanto tempo:</b> i dati sono conservati per [24] mesi dall'ultimo contatto, poi cancellati.<br><br>
<b>A chi vengono comunicati:</b> al personale del salone incaricato della consulenza. Non vengono ceduti a terzi per finalità commerciali.<br><br>
<b>I tuoi diritti:</b> puoi chiedere in ogni momento accesso, rettifica, cancellazione, limitazione e portabilità dei dati, scrivendo a [email]. Puoi inoltre proporre reclamo al Garante per la protezione dei dati personali.
`;
