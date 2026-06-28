-- ============================================================
-- ACTUALIZACIÓN RONDA DE 32 - Mundial 2026
-- Fuente: FIFA / ESPN / NBC Sports (28 junio 2026)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Partido 73: Sudáfrica vs Canadá
-- 28 jun, 3pm ET — SoFi Stadium, Los Ángeles
UPDATE matches SET
  home_team_id = 'rsa', away_team_id = 'can',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-06-28T19:00:00Z',
  venue = 'SoFi Stadium', city = 'Los Ángeles', country = 'USA'
WHERE match_number = 73;

-- Partido 74: Brasil vs Japón
-- 29 jun, 1pm ET — NRG Stadium, Houston
UPDATE matches SET
  home_team_id = 'bra', away_team_id = 'jpn',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-06-29T17:00:00Z',
  venue = 'NRG Stadium', city = 'Houston', country = 'USA'
WHERE match_number = 74;

-- Partido 75: Alemania vs Paraguay
-- 29 jun, 4:30pm ET — Gillette Stadium, Boston
UPDATE matches SET
  home_team_id = 'ger', away_team_id = 'par',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-06-29T20:30:00Z',
  venue = 'Gillette Stadium', city = 'Boston', country = 'USA'
WHERE match_number = 75;

-- Partido 76: Países Bajos vs Marruecos
-- 29 jun, 9pm ET — Estadio BBVA, Monterrey
UPDATE matches SET
  home_team_id = 'ned', away_team_id = 'mar',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-06-30T01:00:00Z',
  venue = 'Estadio BBVA', city = 'Monterrey', country = 'MEX'
WHERE match_number = 76;

-- Partido 77: Costa de Marfil vs Noruega
-- 30 jun, 1pm ET — AT&T Stadium, Dallas
UPDATE matches SET
  home_team_id = 'civ', away_team_id = 'nor',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-06-30T17:00:00Z',
  venue = 'AT&T Stadium', city = 'Dallas', country = 'USA'
WHERE match_number = 77;

-- Partido 78: Francia vs Suecia
-- 30 jun, 5pm ET — MetLife Stadium, Nueva York/NJ
UPDATE matches SET
  home_team_id = 'fra', away_team_id = 'swe',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-06-30T21:00:00Z',
  venue = 'MetLife Stadium', city = 'Nueva York/NJ', country = 'USA'
WHERE match_number = 78;

-- Partido 79: México vs Ecuador
-- 30 jun, 9pm ET — Estadio Azteca, Ciudad de México
UPDATE matches SET
  home_team_id = 'mex', away_team_id = 'ecu',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-01T01:00:00Z',
  venue = 'Estadio Azteca', city = 'Ciudad de México', country = 'MEX'
WHERE match_number = 79;

-- Partido 80: Inglaterra vs R.D. Congo
-- 1 jul, 12pm ET — Mercedes-Benz Stadium, Atlanta
UPDATE matches SET
  home_team_id = 'eng', away_team_id = 'cod',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-01T16:00:00Z',
  venue = 'Mercedes-Benz Stadium', city = 'Atlanta', country = 'USA'
WHERE match_number = 80;

-- Partido 81: Bélgica vs Senegal
-- 1 jul, 4pm ET — Lumen Field, Seattle
UPDATE matches SET
  home_team_id = 'bel', away_team_id = 'sen',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-01T20:00:00Z',
  venue = 'Lumen Field', city = 'Seattle', country = 'USA'
WHERE match_number = 81;

-- Partido 82: Estados Unidos vs Bosnia y Herzegovina
-- 1 jul, 8pm ET — Levi's Stadium, Santa Clara
UPDATE matches SET
  home_team_id = 'usa', away_team_id = 'bih',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-02T00:00:00Z',
  venue = 'Levi''s Stadium', city = 'Santa Clara', country = 'USA'
WHERE match_number = 82;

-- Partido 83: España vs Austria
-- 2 jul, 3pm ET — SoFi Stadium, Los Ángeles
UPDATE matches SET
  home_team_id = 'esp', away_team_id = 'aut',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-02T19:00:00Z',
  venue = 'SoFi Stadium', city = 'Los Ángeles', country = 'USA'
WHERE match_number = 83;

-- Partido 84: Portugal vs Croacia
-- 2 jul, 7pm ET — BMO Field / Rogers Centre, Toronto
UPDATE matches SET
  home_team_id = 'por', away_team_id = 'cro',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-02T23:00:00Z',
  venue = 'BMO Field / Rogers Centre', city = 'Toronto', country = 'CAN'
WHERE match_number = 84;

-- Partido 85: Suiza vs Argelia
-- 2 jul, 8pm ET — BC Place, Vancouver
UPDATE matches SET
  home_team_id = 'sui', away_team_id = 'alg',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-03T00:00:00Z',
  venue = 'BC Place', city = 'Vancouver', country = 'CAN'
WHERE match_number = 85;

-- Partido 86: Australia vs Egipto
-- 3 jul, 2pm ET — AT&T Stadium, Dallas
UPDATE matches SET
  home_team_id = 'aus', away_team_id = 'egy',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-03T18:00:00Z',
  venue = 'AT&T Stadium', city = 'Dallas', country = 'USA'
WHERE match_number = 86;

-- Partido 87: Argentina vs Cabo Verde
-- 3 jul, 6pm ET — Hard Rock Stadium, Miami
UPDATE matches SET
  home_team_id = 'arg', away_team_id = 'cpv',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-03T22:00:00Z',
  venue = 'Hard Rock Stadium', city = 'Miami', country = 'USA'
WHERE match_number = 87;

-- Partido 88: Colombia vs Ghana
-- 3 jul, 9:30pm ET — Arrowhead Stadium, Kansas City
UPDATE matches SET
  home_team_id = 'col', away_team_id = 'gha',
  home_team_placeholder = NULL, away_team_placeholder = NULL,
  match_date = '2026-07-04T01:30:00Z',
  venue = 'Arrowhead Stadium', city = 'Kansas City', country = 'USA'
WHERE match_number = 88;
