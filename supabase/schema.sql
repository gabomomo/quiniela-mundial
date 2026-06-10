-- ============================================================
-- QUINIELA MUNDIAL 2026 - Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Jugadores (custom auth con PIN)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '⚽',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grupos del mundial (A-L)
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,  -- 'A', 'B', ... 'L'
  name TEXT NOT NULL
);

-- Equipos
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag TEXT NOT NULL DEFAULT '🏴',
  group_id TEXT REFERENCES groups(id),
  group_name TEXT
);

-- Partidos
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_number INTEGER NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('group','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final')),
  group_id TEXT REFERENCES groups(id),
  group_name TEXT,
  home_team_id TEXT REFERENCES teams(id),
  away_team_id TEXT REFERENCES teams(id),
  home_team_placeholder TEXT,
  away_team_placeholder TEXT,
  match_date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'USA',
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predicciones
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL CHECK (home_score >= 0),
  away_score INTEGER NOT NULL CHECK (away_score >= 0),
  points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

-- Vista de tabla de posiciones
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.avatar_emoji,
  COALESCE(SUM(pr.points), 0)::INTEGER AS total_points,
  COUNT(CASE WHEN pr.points = 3 THEN 1 END)::INTEGER AS exact_scores,
  COUNT(CASE WHEN pr.points = 1 THEN 1 END)::INTEGER AS correct_results,
  COUNT(pr.id)::INTEGER AS predictions_count
FROM players p
LEFT JOIN predictions pr ON pr.player_id = p.id
GROUP BY p.id, p.name, p.avatar_emoji;

-- ============================================================
-- FUNCIÓN: Calcular y actualizar puntos automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_prediction_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo recalcular cuando el partido termina (status -> finished) y tiene resultado
  IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    UPDATE predictions
    SET points = CASE
      -- Marcador exacto: 3 pts
      WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN 3
      -- Resultado correcto (victoria local, empate, victoria visitante): 1 pt
      WHEN SIGN(home_score - away_score) = SIGN(NEW.home_score - NEW.away_score) THEN 1
      -- Incorrecto: 0 pts
      ELSE 0
    END
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_match_finished
  AFTER UPDATE ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'finished')
  EXECUTE FUNCTION calculate_prediction_points();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Players: cualquiera puede leer, solo insertar su propio registro
CREATE POLICY "Players are readable by all" ON players FOR SELECT USING (true);
CREATE POLICY "Players can insert themselves" ON players FOR INSERT WITH CHECK (true);

-- Groups y teams: solo lectura pública
CREATE POLICY "Groups readable by all" ON groups FOR SELECT USING (true);
CREATE POLICY "Teams readable by all" ON teams FOR SELECT USING (true);

-- Matches: lectura pública
CREATE POLICY "Matches readable by all" ON matches FOR SELECT USING (true);

-- Predictions: lectura pública, escritura solo del propio jugador
-- (identificado por player_id ya que usamos PIN auth custom)
CREATE POLICY "Predictions readable by all" ON predictions FOR SELECT USING (true);
CREATE POLICY "Players can manage own predictions" ON predictions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DATOS INICIALES: Grupos
-- ============================================================
INSERT INTO groups (id, name) VALUES
  ('A','A'),('B','B'),('C','C'),('D','D'),
  ('E','E'),('F','F'),('G','G'),('H','H'),
  ('I','I'),('J','J'),('K','K'),('L','L')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DATOS INICIALES: Equipos (Mundial 2026)
-- Ajustar cuando se confirmen los equipos del playoff
-- ============================================================
INSERT INTO teams (id, name, flag, group_id, group_name) VALUES
  ('usa','Estados Unidos','🇺🇸','A','A'),
  ('pan','Panamá','🇵🇦','A','A'),
  ('bol','Bolivia','🇧🇴','A','A'),
  ('ofc1','OFC 1 (TBD)','🏴','A','A'),
  ('mex','México','🇲🇽','B','B'),
  ('arg','Argentina','🇦🇷','B','B'),
  ('mar','Marruecos','🇲🇦','B','B'),
  ('ukr','Ucrania','🇺🇦','B','B'),
  ('can','Canadá','🇨🇦','C','C'),
  ('bra','Brasil','🇧🇷','C','C'),
  ('bel','Bélgica','🇧🇪','C','C'),
  ('afc1','AFC 1 (TBD)','🏴','C','C'),
  ('ger','Alemania','🇩🇪','D','D'),
  ('jpn','Japón','🇯🇵','D','D'),
  ('par','Paraguay','🇵🇾','D','D'),
  ('civ','Costa de Marfil','🇨🇮','D','D'),
  ('esp','España','🇪🇸','E','E'),
  ('ned','Países Bajos','🇳🇱','E','E'),
  ('gha','Ghana','🇬🇭','E','E'),
  ('afcpl','AFC Playoff (TBD)','🏴','E','E'),
  ('fra','Francia','🇫🇷','F','F'),
  ('col','Colombia','🇨🇴','F','F'),
  ('alg','Argelia','🇩🇿','F','F'),
  ('crc','Costa Rica','🇨🇷','F','F'),
  ('eng','Inglaterra','🏴󠁧󠁢󠁥󠁮󠁧󠁿','G','G'),
  ('por','Portugal','🇵🇹','G','G'),
  ('uru','Uruguay','🇺🇾','G','G'),
  ('caf1','CAF 1 (TBD)','🏴','G','G'),
  ('ita','Italia','🇮🇹','H','H'),
  ('ecu','Ecuador','🇪🇨','H','H'),
  ('aus','Australia','🇦🇺','H','H'),
  ('conc1','CONCACAF 4 (TBD)','🏴','H','H'),
  ('cro','Croacia','🇭🇷','I','I'),
  ('kor','Corea del Sur','🇰🇷','I','I'),
  ('caf2','CAF 2 (TBD)','🏴','I','I'),
  ('intpl','Inter Playoff (TBD)','🏴','I','I'),
  ('sen','Senegal','🇸🇳','J','J'),
  ('ven','Venezuela','🇻🇪','J','J'),
  ('tun','Túnez','🇹🇳','J','J'),
  ('conc2','CONCACAF 5 (TBD)','🏴','J','J'),
  ('den','Dinamarca','🇩🇰','K','K'),
  ('srb','Serbia','🇷🇸','K','K'),
  ('nig','Nigeria','🇳🇬','K','K'),
  ('conm1','CONMEBOL 7 (TBD)','🏴','K','K'),
  ('tbd1','TBD L1','🏴','L','L'),
  ('tbd2','TBD L2','🏴','L','L'),
  ('tbd3','TBD L3','🏴','L','L'),
  ('tbd4','TBD L4','🏴','L','L')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DATOS INICIALES: Partidos de Fase de Grupos
-- Fechas en hora local del partido (ajustar zonas horarias según FIFA)
-- El Mundial 2026 empieza el 11 de junio de 2026
-- ============================================================
INSERT INTO matches (match_number, stage, group_id, group_name, home_team_id, away_team_id, match_date, venue, city, country) VALUES
  -- Grupo A
  (1,'group','A','A','usa','pan','2026-06-11 20:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  (2,'group','A','A','bol','ofc1','2026-06-12 14:00:00-05','AT&T Stadium','Dallas','USA'),
  (3,'group','A','A','usa','bol','2026-06-15 17:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  (4,'group','A','A','pan','ofc1','2026-06-15 20:00:00-05','Levi''s Stadium','San Francisco','USA'),
  (5,'group','A','A','pan','bol','2026-06-19 14:00:00-05','MetLife Stadium','Nueva York','USA'),
  (6,'group','A','A','usa','ofc1','2026-06-19 14:00:00-05','AT&T Stadium','Dallas','USA'),
  -- Grupo B
  (7,'group','B','B','mex','arg','2026-06-12 20:00:00-05','MetLife Stadium','Nueva York','USA'),
  (8,'group','B','B','mar','ukr','2026-06-13 14:00:00-05','Estadio Azteca','Ciudad de México','MEX'),
  (9,'group','B','B','mex','mar','2026-06-16 17:00:00-05','Estadio Azteca','Ciudad de México','MEX'),
  (10,'group','B','B','arg','ukr','2026-06-16 20:00:00-05','MetLife Stadium','Nueva York','USA'),
  (11,'group','B','B','arg','mar','2026-06-20 14:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  (12,'group','B','B','mex','ukr','2026-06-20 14:00:00-05','Estadio Azteca','Ciudad de México','MEX'),
  -- Grupo C
  (13,'group','C','C','can','bra','2026-06-13 17:00:00-05','BC Place','Vancouver','CAN'),
  (14,'group','C','C','bel','afc1','2026-06-13 20:00:00-05','Gillette Stadium','Boston','USA'),
  (15,'group','C','C','can','bel','2026-06-17 17:00:00-05','BC Place','Vancouver','CAN'),
  (16,'group','C','C','bra','afc1','2026-06-17 20:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  (17,'group','C','C','bra','bel','2026-06-21 14:00:00-05','MetLife Stadium','Nueva York','USA'),
  (18,'group','C','C','can','afc1','2026-06-21 14:00:00-05','BC Place','Vancouver','CAN'),
  -- Grupo D
  (19,'group','D','D','ger','jpn','2026-06-14 14:00:00-05','Levi''s Stadium','San Francisco','USA'),
  (20,'group','D','D','par','civ','2026-06-14 17:00:00-05','Hard Rock Stadium','Miami','USA'),
  (21,'group','D','D','ger','par','2026-06-18 14:00:00-05','AT&T Stadium','Dallas','USA'),
  (22,'group','D','D','jpn','civ','2026-06-18 17:00:00-05','Levi''s Stadium','San Francisco','USA'),
  (23,'group','D','D','jpn','par','2026-06-22 14:00:00-05','Arrowhead Stadium','Kansas City','USA'),
  (24,'group','D','D','ger','civ','2026-06-22 14:00:00-05','Hard Rock Stadium','Miami','USA'),
  -- Grupo E
  (25,'group','E','E','esp','ned','2026-06-14 20:00:00-05','MetLife Stadium','Nueva York','USA'),
  (26,'group','E','E','gha','afcpl','2026-06-15 14:00:00-05','Hard Rock Stadium','Miami','USA'),
  (27,'group','E','E','esp','gha','2026-06-19 17:00:00-05','AT&T Stadium','Dallas','USA'),
  (28,'group','E','E','ned','afcpl','2026-06-19 20:00:00-05','MetLife Stadium','Nueva York','USA'),
  (29,'group','E','E','ned','gha','2026-06-23 14:00:00-05','Levi''s Stadium','San Francisco','USA'),
  (30,'group','E','E','esp','afcpl','2026-06-23 14:00:00-05','Hard Rock Stadium','Miami','USA'),
  -- Grupo F
  (31,'group','F','F','fra','col','2026-06-15 14:00:00-05','Gillette Stadium','Boston','USA'),
  (32,'group','F','F','alg','crc','2026-06-15 17:00:00-05','Estadio Akron','Guadalajara','MEX'),
  (33,'group','F','F','fra','alg','2026-06-19 14:00:00-05','Gillette Stadium','Boston','USA'),
  (34,'group','F','F','col','crc','2026-06-19 17:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  (35,'group','F','F','col','alg','2026-06-23 14:00:00-05','MetLife Stadium','Nueva York','USA'),
  (36,'group','F','F','fra','crc','2026-06-23 14:00:00-05','Gillette Stadium','Boston','USA'),
  -- Grupo G
  (37,'group','G','G','eng','por','2026-06-16 14:00:00-05','MetLife Stadium','Nueva York','USA'),
  (38,'group','G','G','uru','caf1','2026-06-16 17:00:00-05','AT&T Stadium','Dallas','USA'),
  (39,'group','G','G','eng','uru','2026-06-20 17:00:00-05','Gillette Stadium','Boston','USA'),
  (40,'group','G','G','por','caf1','2026-06-20 20:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  (41,'group','G','G','por','uru','2026-06-24 14:00:00-05','Hard Rock Stadium','Miami','USA'),
  (42,'group','G','G','eng','caf1','2026-06-24 14:00:00-05','MetLife Stadium','Nueva York','USA'),
  -- Grupo H
  (43,'group','H','H','ita','ecu','2026-06-17 14:00:00-05','Estadio BBVA','Monterrey','MEX'),
  (44,'group','H','H','aus','conc1','2026-06-17 17:00:00-05','Arrowhead Stadium','Kansas City','USA'),
  (45,'group','H','H','ita','aus','2026-06-21 17:00:00-05','Estadio BBVA','Monterrey','MEX'),
  (46,'group','H','H','ecu','conc1','2026-06-21 20:00:00-05','AT&T Stadium','Dallas','USA'),
  (47,'group','H','H','ecu','aus','2026-06-25 14:00:00-05','Hard Rock Stadium','Miami','USA'),
  (48,'group','H','H','ita','conc1','2026-06-25 14:00:00-05','Estadio BBVA','Monterrey','MEX'),
  -- Grupo I
  (49,'group','I','I','cro','kor','2026-06-18 14:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  (50,'group','I','I','caf2','intpl','2026-06-18 20:00:00-05','BC Place','Vancouver','CAN'),
  (51,'group','I','I','cro','caf2','2026-06-22 17:00:00-05','AT&T Stadium','Dallas','USA'),
  (52,'group','I','I','kor','intpl','2026-06-22 20:00:00-05','MetLife Stadium','Nueva York','USA'),
  (53,'group','I','I','kor','caf2','2026-06-26 14:00:00-05','Levi''s Stadium','San Francisco','USA'),
  (54,'group','I','I','cro','intpl','2026-06-26 14:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  -- Grupo J
  (55,'group','J','J','sen','ven','2026-06-19 14:00:00-05','Hard Rock Stadium','Miami','USA'),
  (56,'group','J','J','tun','conc2','2026-06-19 17:00:00-05','Estadio Akron','Guadalajara','MEX'),
  (57,'group','J','J','sen','tun','2026-06-23 17:00:00-05','Arrowhead Stadium','Kansas City','USA'),
  (58,'group','J','J','ven','conc2','2026-06-23 20:00:00-05','Gillette Stadium','Boston','USA'),
  (59,'group','J','J','ven','tun','2026-06-27 14:00:00-05','MetLife Stadium','Nueva York','USA'),
  (60,'group','J','J','sen','conc2','2026-06-27 14:00:00-05','Hard Rock Stadium','Miami','USA'),
  -- Grupo K
  (61,'group','K','K','den','srb','2026-06-20 14:00:00-05','Estadio Universitario','Monterrey','MEX'),
  (62,'group','K','K','nig','conm1','2026-06-20 20:00:00-05','BC Place','Vancouver','CAN'),
  (63,'group','K','K','den','nig','2026-06-24 17:00:00-05','AT&T Stadium','Dallas','USA'),
  (64,'group','K','K','srb','conm1','2026-06-24 20:00:00-05','Gillette Stadium','Boston','USA'),
  (65,'group','K','K','srb','nig','2026-06-28 14:00:00-05','MetLife Stadium','Nueva York','USA'),
  (66,'group','K','K','den','conm1','2026-06-28 14:00:00-05','Estadio Universitario','Monterrey','MEX'),
  -- Grupo L
  (67,'group','L','L','tbd1','tbd2','2026-06-21 14:00:00-05','Estadio Azteca','Ciudad de México','MEX'),
  (68,'group','L','L','tbd3','tbd4','2026-06-21 17:00:00-05','SoFi Stadium','Los Ángeles','USA'),
  (69,'group','L','L','tbd1','tbd3','2026-06-25 17:00:00-05','Estadio Azteca','Ciudad de México','MEX'),
  (70,'group','L','L','tbd2','tbd4','2026-06-25 20:00:00-05','Levi''s Stadium','San Francisco','USA'),
  (71,'group','L','L','tbd2','tbd3','2026-06-29 14:00:00-05','MetLife Stadium','Nueva York','USA'),
  (72,'group','L','L','tbd1','tbd4','2026-06-29 14:00:00-05','Estadio Azteca','Ciudad de México','MEX'),
  -- RONDA DE 32 (placeholders)
  (73,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-01 15:00:00-05','TBD','TBD','USA'),
  (74,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-01 19:00:00-05','TBD','TBD','USA'),
  (75,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-02 15:00:00-05','TBD','TBD','USA'),
  (76,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-02 19:00:00-05','TBD','TBD','USA'),
  (77,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-03 15:00:00-05','TBD','TBD','USA'),
  (78,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-03 19:00:00-05','TBD','TBD','USA'),
  (79,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-04 15:00:00-05','TBD','TBD','USA'),
  (80,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-04 19:00:00-05','TBD','TBD','USA'),
  (81,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-05 15:00:00-05','TBD','TBD','USA'),
  (82,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-05 19:00:00-05','TBD','TBD','USA'),
  (83,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-06 15:00:00-05','TBD','TBD','USA'),
  (84,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-06 19:00:00-05','TBD','TBD','USA'),
  (85,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-07 15:00:00-05','TBD','TBD','USA'),
  (86,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-07 19:00:00-05','TBD','TBD','USA'),
  (87,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-08 15:00:00-05','TBD','TBD','USA'),
  (88,'round_of_32',NULL,NULL,NULL,NULL,'2026-07-08 19:00:00-05','TBD','TBD','USA'),
  -- OCTAVOS DE FINAL
  (89,'round_of_16',NULL,NULL,NULL,NULL,'2026-07-10 15:00:00-05','TBD','TBD','USA'),
  (90,'round_of_16',NULL,NULL,NULL,NULL,'2026-07-10 19:00:00-05','TBD','TBD','USA'),
  (91,'round_of_16',NULL,NULL,NULL,NULL,'2026-07-11 15:00:00-05','TBD','TBD','USA'),
  (92,'round_of_16',NULL,NULL,NULL,NULL,'2026-07-11 19:00:00-05','TBD','TBD','USA'),
  (93,'round_of_16',NULL,NULL,NULL,NULL,'2026-07-12 15:00:00-05','TBD','TBD','USA'),
  (94,'round_of_16',NULL,NULL,NULL,NULL,'2026-07-12 19:00:00-05','TBD','TBD','USA'),
  (95,'round_of_16',NULL,NULL,NULL,NULL,'2026-07-13 15:00:00-05','TBD','TBD','USA'),
  (96,'round_of_16',NULL,NULL,NULL,NULL,'2026-07-13 19:00:00-05','TBD','TBD','USA'),
  -- CUARTOS DE FINAL
  (97,'quarterfinal',NULL,NULL,NULL,NULL,'2026-07-17 15:00:00-05','TBD','TBD','USA'),
  (98,'quarterfinal',NULL,NULL,NULL,NULL,'2026-07-17 19:00:00-05','TBD','TBD','USA'),
  (99,'quarterfinal',NULL,NULL,NULL,NULL,'2026-07-18 15:00:00-05','TBD','TBD','USA'),
  (100,'quarterfinal',NULL,NULL,NULL,NULL,'2026-07-18 19:00:00-05','TBD','TBD','USA'),
  -- SEMIFINALES
  (101,'semifinal',NULL,NULL,NULL,NULL,'2026-07-21 19:00:00-05','MetLife Stadium','Nueva York','USA'),
  (102,'semifinal',NULL,NULL,NULL,NULL,'2026-07-22 19:00:00-05','AT&T Stadium','Dallas','USA'),
  -- TERCER LUGAR
  (103,'third_place',NULL,NULL,NULL,NULL,'2026-07-25 15:00:00-05','Hard Rock Stadium','Miami','USA'),
  -- FINAL
  (104,'final',NULL,NULL,NULL,NULL,'2026-07-26 17:00:00-05','MetLife Stadium','Nueva York','USA')
ON CONFLICT DO NOTHING;
