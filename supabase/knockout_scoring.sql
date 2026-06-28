-- ============================================================
-- MIGRACIÓN: Sistema de puntos para fases de eliminación
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Agregar columna advancing_team_id a matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS advancing_team_id TEXT REFERENCES teams(id);

-- 2. Agregar columna predicted_winner_id a predictions
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS predicted_winner_id TEXT REFERENCES teams(id);

-- 3. Actualizar función de cálculo de puntos
CREATE OR REPLACE FUNCTION calculate_prediction_points()
RETURNS TRIGGER AS $$
DECLARE
  is_knockout BOOLEAN;
  match_is_draw BOOLEAN;
BEGIN
  IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    is_knockout := NEW.stage IN ('round_of_32','round_of_16','quarterfinal','semifinal','third_place','final');
    match_is_draw := NEW.home_score = NEW.away_score;

    IF is_knockout AND match_is_draw THEN
      -- Eliminatoria que terminó empatada en 90 min (se resuelve en ET o penales)
      UPDATE predictions
      SET points = CASE
        -- Marcador exacto empatado: 3 pts + 1 bonus si acertó quién avanza
        WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN
          3 + CASE
            WHEN predicted_winner_id IS NOT NULL
              AND NEW.advancing_team_id IS NOT NULL
              AND predicted_winner_id = NEW.advancing_team_id
            THEN 1 ELSE 0
          END
        -- Predijo empate pero no el marcador exacto: 1 pt + 1 bonus si acertó quién avanza
        WHEN home_score = away_score THEN
          1 + CASE
            WHEN predicted_winner_id IS NOT NULL
              AND NEW.advancing_team_id IS NOT NULL
              AND predicted_winner_id = NEW.advancing_team_id
            THEN 1 ELSE 0
          END
        -- No predijo empate: 0 pts
        ELSE 0
      END
      WHERE match_id = NEW.id;

    ELSE
      -- Fase de grupos O eliminatoria sin empate en 90 min: scoring estándar
      UPDATE predictions
      SET points = CASE
        WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN 3
        WHEN SIGN(home_score - away_score) = SIGN(NEW.home_score - NEW.away_score) THEN 1
        ELSE 0
      END
      WHERE match_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Actualizar vista leaderboard para soportar puntos 1-4
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.avatar_emoji,
  COALESCE(SUM(pr.points), 0)::INTEGER AS total_points,
  COUNT(CASE WHEN pr.points >= 3 THEN 1 END)::INTEGER AS exact_scores,
  COUNT(CASE WHEN pr.points IN (1, 2) THEN 1 END)::INTEGER AS correct_results,
  COUNT(pr.id)::INTEGER AS predictions_count
FROM players p
LEFT JOIN predictions pr ON pr.player_id = p.id
GROUP BY p.id, p.name, p.avatar_emoji;
