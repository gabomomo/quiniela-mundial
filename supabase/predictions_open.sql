-- Agregar campo para que admin pueda abrir predicciones manualmente
ALTER TABLE matches ADD COLUMN IF NOT EXISTS predictions_open BOOLEAN DEFAULT FALSE;
