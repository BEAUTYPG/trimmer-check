-- =====================================================================
-- TRIMMER CHECK — migrazione: tag funnel sulle schede
-- Da eseguire una volta nel SQL Editor di Supabase (progetto trimmer-check).
-- =====================================================================

-- Il tag con cui il salone classifica la cliente nel percorso commerciale
-- (Da contattare, Consulenza fissata, Cliente extension, ...).
alter table public.checks add column if not exists funnel_tag text;

-- Permesso di aggiornamento: i membri del salone possono aggiornare
-- le schede del PROPRIO salone (serve per impostare il tag).
drop policy if exists "aggiorno le schede del mio salone" on public.checks;
create policy "aggiorno le schede del mio salone"
  on public.checks for update
  to authenticated
  using (public.is_member(salon_id))
  with check (public.is_member(salon_id));
