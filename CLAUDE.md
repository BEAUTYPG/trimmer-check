# Trimmer Check (VIDA HAIR) — brief per Claude Code

Questionario di orientamento alle estensioni per i saloni della community VIDA HAIR / Trimmer Technology; salone pilota Beauty Perugia (`/q/beauty-5hul`). Produzione: https://trimmer-check.vercel.app. Lingua di codice, commenti, UI e commit: **italiano**.

Stack: Next.js 14 (App Router, TypeScript), Supabase (account barcacciac@gmail.com, auth email+password con link di riserva), email via SMTP Resend (`trimmer@crinis.it`, variabili su Vercel). `main` va in produzione da solo su Vercel.

**Il repo e' PUBBLICO**: niente chiavi, niente dati di clienti, niente nomi di saloni non ancora annunciati nei file versionati.

Prima di lavorare: leggi lo stato nel vault HBD-Voult (nota Trimmer Check) e `LEGGIMI.txt`; dopo un lavoro rilevante aggiornali.

## Dove stanno le cose
- Motore e domande: `lib/engine.ts`. Email: `lib/email.ts`. Client Supabase: `lib/supabase/`.
- Questionario pubblico: `app/q/[slug]`. Area salone: `app/dashboard`, `app/scheda/[id]`, `app/analisi`, `app/password`, `app/onboarding`.
- SQL: `supabase/schema.sql` e `supabase/migration-*.sql` (eseguiti a mano nel SQL Editor).

## Regole non negoziabili
1. **Motore invariato** senza decisione di Claudio: stesse domande e stessi punteggi, cosi' le schede vecchie e nuove restano confrontabili.
2. **ALERT sanitario** (diradamento, cute): sospende l'orientamento e compare nel riquadro rosso dell'email al salone. Non va mai indebolito ne' nascosto.
3. **Prova anonima**: nel database non si salva NULLA (promessa alla cliente); l'avviso al salone e' ridotto, senza nome, contatti ne' link.
4. Se l'email fallisce la scheda si salva lo stesso: l'email non blocca mai.
5. Ogni salone vede solo le proprie schede (RLS); chiavi service role solo lato server.
6. Mai leggere `.env*`; nessun dato reale di clienti in chat o nei test.

## Comandi
```
npm install && npm run dev      # http://localhost:3000
npm run build                   # stessa build di Vercel (include il controllo dei tipi)
```
Fine lavoro: `/consegna <descrizione>` (branch `claude/...` e PR; merge e produzione li decide Claudio).
