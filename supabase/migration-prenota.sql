-- =====================================================================
-- TRIMMER CHECK — migrazione: telefono del salone
-- Da eseguire nel SQL Editor di Supabase PRIMA di caricare la v2.
--
-- Serve al bottone "Prenota la consulenza" sulla pagina del risultato:
-- se il salone ha un numero, il bottone apre WhatsApp verso il salone.
-- Dopo la migrazione, inserisci il tuo numero da Table Editor → salons →
-- colonna phone (formato: 39XXXXXXXXXX oppure +39 XXX XXXXXXX).
-- =====================================================================

alter table public.salons add column if not exists phone text;
