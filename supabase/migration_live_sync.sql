-- ============================================================
-- MIGRACIÓN: Sincronización automática de resultados en vivo (ESPN)
-- Ejecuta en: Supabase → SQL Editor → New query
-- ============================================================
--
-- Antes de ejecutar: sustituye REPLACE_WITH_YOUR_CRON_SECRET por el mismo
-- valor que pusiste en CRON_SECRET en Vercel (Settings → Environment
-- Variables) y en tu .env.local.
--
-- ROLLBACK (si quieres desactivar la sincronización automática):
--   select cron.unschedule('sync_live_scores');
-- El código (src/app/api/cron/sync-scores) puede quedarse sin usarse, o
-- revertir el commit correspondiente. Los controles manuales del admin
-- siguen funcionando igual, se use o no este cron.

create extension if not exists pg_net;

select cron.schedule(
  'sync_live_scores',
  '* * * * *',
  $$
  select net.http_get(
    'https://mundial2026porra.vercel.app/api/cron/sync-scores?secret=REPLACE_WITH_YOUR_CRON_SECRET'
  );
  $$
);
