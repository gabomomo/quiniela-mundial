-- ============================================================
-- ADMIN SETUP
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Permitir que la app actualice partidos (score + status)
CREATE POLICY "Matches updatable by all" ON matches
  FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Marcar a gmonestel@gmail.com como admin
UPDATE players
SET is_admin = true
WHERE email = 'gmonestel@gmail.com';
