# Trimmer Check — messa online

Guida in cinque passaggi. Serve circa mezz'ora la prima volta.
I punti dove servono le **tue** credenziali sono segnati: quelli devi farli tu,
non posso farli io.

---

## 1. Supabase (il database)

1. Vai su **supabase.com** e crea un account.
2. Crea un nuovo progetto.
   - **Region: `Central EU (Frankfurt)`.** Non saltare questo punto: i dati
     delle clienti restano così dentro l'Unione Europea, che è quello che ti
     serve per stare tranquillo lato GDPR.
   - Salva da qualche parte la password del database che ti fa scegliere.
3. Apri **SQL Editor** → *New query* → incolla tutto il contenuto del file
   `supabase/schema.sql` → **Run**.
   Deve rispondere *Success*. Questo crea le tabelle e — cosa più importante —
   le regole che impediscono a un salone di vedere le schede di un altro.
4. Vai in **Project Settings → API** e tieni aperta questa pagina: ti servono
   tre valori al passaggio 3.

---

## 2. GitHub (dove vive il codice)

1. Crea un account su **github.com** se non ce l'hai.
2. Crea un repository nuovo, privato, chiamalo `trimmer-check`.
3. Carica dentro tutti i file di questa cartella.
   Dalla pagina del repository: *Add file → Upload files*, poi trascina il
   contenuto della cartella (non la cartella stessa).
   La cartella `node_modules` non c'è e non serve caricarla.

---

## 3. Vercel (dove gira il sito)

1. Vai su **vercel.com**, accedi **con GitHub**.
2. *Add New → Project* → scegli il repository `trimmer-check` → **Import**.
3. Prima di premere Deploy, apri **Environment Variables** e inserisci queste
   tre righe, copiando i valori dalla pagina Supabase del passaggio 1.4:

   | Nome | Dove lo trovi in Supabase |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |

   > La terza è una chiave con pieni poteri sul database. Sta solo qui dentro:
   > non va nel codice, non va in una email, non va in chat. Se ti capita di
   > incollarla da qualche parte per sbaglio, rigenerala da Supabase.

4. **Deploy**. Dopo un paio di minuti hai un indirizzo tipo
   `trimmer-check-xxxx.vercel.app`.

---

## 4. Chiudere il cerchio sull'accesso

L'accesso al salone funziona con un link via email, senza password. Perché il
link funzioni, Supabase deve sapere qual è l'indirizzo del sito:

1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: l'indirizzo Vercel del passaggio 3.4
3. **Redirect URLs**: aggiungi `https://<il-tuo-indirizzo>.vercel.app/auth/callback`

⚠️ **Limite da conoscere subito:** l'invio email incluso in Supabase è limitato
a poche email all'ora. Va benissimo per te e i primi saloni pilota. Quando i
saloni della community diventano parecchi, in *Authentication → Emails* si
collega un servizio SMTP tuo (Brevo, Resend e simili hanno piani gratuiti
sufficienti). Se un giorno qualcuno ti scrive "non mi arriva il link", quasi
sempre è questo.

---

## 5. Primo giro

1. Apri il sito → inserisci la tua email → ti arriva il link → entri.
2. Ti chiede il nome del salone. Quello che scrivi è ciò che la cliente legge
   in cima al questionario.
3. Nella tua area trovi **il link pubblico del salone**: è quello che apri sul
   tablet o mandi alla cliente prima dell'appuntamento.
4. Fai una prova tu, poi guarda la scheda che compare nell'elenco.

Ogni salone della community ripete i passaggi 5.1 e 5.2 con la propria email:
si crea da solo il suo salone e il suo link. Non devi fare niente per loro.

---

## Cosa c'è dentro

| Cartella | Cosa contiene |
|---|---|
| `lib/engine.ts` | Le domande e il calcolo. **È qui che modifichi i testi.** |
| `supabase/schema.sql` | Le tabelle e le regole di sicurezza |
| `components/Questionnaire.tsx` | Il questionario che vede la cliente |
| `app/dashboard` | L'elenco schede del salone |
| `app/scheda/[id]` | La singola scheda |
| `app/api/checks` | Il salvataggio |

### Se cambi le domande

Modifica `lib/engine.ts` e alza `QUESTIONS_VER` (es. da `"1.0"` a `"1.1"`).
Ogni scheda registra con quale versione è stata compilata: senza quel numero,
fra sei mesi non sapresti più se due schede sono confrontabili fra loro.
Le schede vecchie restano leggibili — le risposte sono salvate come JSON,
non in colonne fisse, ed è esattamente per questo motivo.

---

## Note privacy da girare al consulente

Il testo dell'informativa (in fondo a `lib/engine.ts`) è una **bozza**, non un
documento legale pronto. Va rivisto prima di raccogliere dati di clienti reali.
Punti da fargli guardare:

- Il questionario raccoglie informazioni su **capelli e cuoio capelluto**:
  vanno inquadrate correttamente, perché sfiorano il dominio sanitario.
- Il **titolare del trattamento** è ogni singolo salone, non VIDA: se i dati
  della community vengono aggregati, serve definire i ruoli tra saloni e VIDA.
- Va firmato il **DPA con Supabase** (Data Processing Agreement) e verificata
  la regione UE — vedi passaggio 1.2.
- Vanno definiti i **tempi di conservazione** reali (nella bozza: 24 mesi).
- Ogni modifica al testo dell'informativa richiede di alzare
  `INFORMATIVA_VER`: la versione viene salvata insieme al consenso, ed è
  quello che ti permette di dimostrare *cosa* aveva accettato quella cliente
  in quel giorno.
