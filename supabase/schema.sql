-- =====================================================================
-- TRIMMER CHECK — schema database (Supabase / PostgreSQL)
-- Esegui questo file una sola volta, nel SQL Editor di Supabase.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- SALONI
-- Ogni salone della community VIDA ha una riga qui e un proprio link
-- pubblico: /q/<slug>
-- ---------------------------------------------------------------------
create table if not exists public.salons (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  city        text,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MEMBRI DEL SALONE
-- Il titolare piu' eventuali collaboratori che accedono alle schede.
-- ---------------------------------------------------------------------
create table if not exists public.memberships (
  user_id   uuid not null references auth.users(id) on delete cascade,
  salon_id  uuid not null references public.salons(id) on delete cascade,
  role      text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (user_id, salon_id)
);

-- ---------------------------------------------------------------------
-- SCHEDE COMPILATE
--
-- NOTA IMPORTANTE (e' la scelta che ti evita di rifare il database):
-- le risposte stanno in "answers" come JSON, non in colonne fisse.
-- Quando cambierai una domanda, le schede vecchie restano leggibili e
-- non serve nessuna migrazione. Stessa cosa per "result".
-- "questions_ver" registra con quale versione del questionario e' stata
-- compilata la scheda: senza questo, fra sei mesi non sapresti piu' se
-- due schede sono confrontabili.
-- ---------------------------------------------------------------------
create table if not exists public.checks (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid not null references public.salons(id) on delete cascade,
  created_by        uuid references auth.users(id) on delete set null,
  source            text not null default 'public',   -- 'public' = link cliente, 'salon' = compilata in salone

  -- dati cliente (facoltativi: in modalita' anonima restano vuoti)
  client_first_name text,
  client_last_name  text,
  client_phone      text,
  client_email      text,
  is_anonymous      boolean not null default false,

  -- consensi: registrati singolarmente, con la versione dell'informativa
  consent_privacy   boolean not null default false,
  consent_email     boolean not null default false,
  consent_marketing boolean not null default false,
  informativa_ver   text,

  -- contenuto
  questions_ver     text not null default '1.0',
  answers           jsonb not null,
  result            jsonb not null,

  -- campi estratti dal risultato, per poter filtrare e fare statistiche
  top_axis          text,
  has_alert         boolean not null default false,

  created_at        timestamptz not null default now()
);

create index if not exists checks_salon_created_idx on public.checks (salon_id, created_at desc);
create index if not exists checks_top_axis_idx      on public.checks (top_axis);

-- ---------------------------------------------------------------------
-- SICUREZZA (Row Level Security)
-- Senza queste regole, chiunque conosca la chiave pubblica potrebbe
-- leggere le schede di tutti i saloni. Con queste, ogni salone vede
-- soltanto le proprie.
-- ---------------------------------------------------------------------
alter table public.salons      enable row level security;
alter table public.memberships enable row level security;
alter table public.checks      enable row level security;

-- funzione di appoggio: l'utente collegato appartiene a questo salone?
create or replace function public.is_member(target_salon uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.salon_id = target_salon and m.user_id = auth.uid()
  );
$$;

-- SALONI ------------------------------------------------------------
drop policy if exists "salone visibile pubblicamente" on public.salons;
create policy "salone visibile pubblicamente"
  on public.salons for select
  using (is_active = true);
-- serve perche' la pagina pubblica /q/<slug> deve poter leggere nome e id
-- del salone. Sono dati non sensibili (insegna e citta').

drop policy if exists "creo il mio salone" on public.salons;
create policy "creo il mio salone"
  on public.salons for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "modifico il mio salone" on public.salons;
create policy "modifico il mio salone"
  on public.salons for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- MEMBRI -------------------------------------------------------------
drop policy if exists "vedo le mie appartenenze" on public.memberships;
create policy "vedo le mie appartenenze"
  on public.memberships for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "mi iscrivo al salone che ho creato" on public.memberships;
create policy "mi iscrivo al salone che ho creato"
  on public.memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid())
  );

-- SCHEDE -------------------------------------------------------------
-- Lettura: solo chi appartiene al salone.
drop policy if exists "leggo le schede del mio salone" on public.checks;
create policy "leggo le schede del mio salone"
  on public.checks for select
  to authenticated
  using (public.is_member(salon_id));

-- Cancellazione: solo il proprio salone (serve per le richieste di
-- cancellazione dati da parte della cliente — diritto GDPR).
drop policy if exists "cancello le schede del mio salone" on public.checks;
create policy "cancello le schede del mio salone"
  on public.checks for delete
  to authenticated
  using (public.is_member(salon_id));

-- Scrittura: NESSUNA policy di insert, volutamente.
-- Le schede entrano solo passando dal server dell'applicazione, che
-- ricalcola il punteggio prima di salvare. Se lasciassimo scrivere il
-- browser, chiunque potrebbe inviare un risultato inventato.

-- ---------------------------------------------------------------------
-- STATISTICHE DI COMMUNITY (aggregate e anonime)
-- Ritorna solo conteggi: nessun dato personale esce da qui.
-- ---------------------------------------------------------------------
create or replace function public.community_stats()
returns table (top_axis text, schede bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.top_axis, count(*)::bigint
  from public.checks c
  group by c.top_axis
  order by 2 desc;
$$;

grant execute on function public.community_stats() to authenticated;
