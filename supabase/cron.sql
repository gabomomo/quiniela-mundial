-- ============================================================
-- CRON JOB: Sincronizar marcadores cada 5 minutos
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- IMPORTANTE: Requiere que la Edge Function "sync-scores" esté desplegada
-- ============================================================

-- Habilitar extensión pg_cron (ya viene en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Eliminar cron anterior si existe
SELECT cron.unschedule('sync-scores-job') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-scores-job'
);

-- Crear cron que llama a la Edge Function cada 5 minutos
SELECT cron.schedule(
  'sync-scores-job',
  '*/5 * * * *',  -- cada 5 minutos
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-scores',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verificar que quedó creado
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'sync-scores-job';
