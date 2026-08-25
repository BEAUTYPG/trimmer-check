-- =====================================================================
-- MIGRAZIONE: avviso email al salone a ogni questionario compilato
-- Da eseguire UNA volta nel SQL Editor di Supabase.
-- Non tocca nessuna scheda esistente e non tocca salons.slug.
-- =====================================================================

-- 1) Nuovo campo: l'indirizzo a cui il salone riceve l'avviso.
--    Se resta vuoto (NULL), semplicemente nessun avviso: tutto il resto
--    continua a funzionare come prima.
alter table public.salons
  add column if not exists notify_email text;

-- 2) Per il salone pilota Beauty (Perugia): gli avvisi vanno a Claudio.
--    Quando altri saloni della community entreranno, ognuno avra' qui
--    il proprio indirizzo.
update public.salons
   set notify_email = 'barcacciac@gmail.com'
 where slug = 'beauty-5hul';

-- 3) Controllo finale: deve mostrare il salone con l'indirizzo impostato.
select slug, name, notify_email from public.salons;
