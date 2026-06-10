-- ============================================================
-- CORRECCIÓN DE DATOS - Mundial 2026
-- Sorteo oficial: 5 de diciembre de 2025, Washington D.C.
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Limpiar datos anteriores
DELETE FROM predictions;
DELETE FROM matches;
DELETE FROM teams;

-- ============================================================
-- EQUIPOS CORRECTOS
-- ============================================================
INSERT INTO teams (id, name, flag, group_id, group_name) VALUES
  -- GRUPO A
  ('mex','México','🇲🇽','A','A'),
  ('rsa','Sudáfrica','🇿🇦','A','A'),
  ('kor','Corea del Sur','🇰🇷','A','A'),
  ('cze','República Checa','🇨🇿','A','A'),
  -- GRUPO B
  ('can','Canadá','🇨🇦','B','B'),
  ('bih','Bosnia y Herzegovina','🇧🇦','B','B'),
  ('qat','Catar','🇶🇦','B','B'),
  ('sui','Suiza','🇨🇭','B','B'),
  -- GRUPO C
  ('bra','Brasil','🇧🇷','C','C'),
  ('mar','Marruecos','🇲🇦','C','C'),
  ('hai','Haití','🇭🇹','C','C'),
  ('sco','Escocia','🏴󠁧󠁢󠁳󠁣󠁴󠁿','C','C'),
  -- GRUPO D
  ('usa','Estados Unidos','🇺🇸','D','D'),
  ('par','Paraguay','🇵🇾','D','D'),
  ('aus','Australia','🇦🇺','D','D'),
  ('tur','Turquía','🇹🇷','D','D'),
  -- GRUPO E
  ('ger','Alemania','🇩🇪','E','E'),
  ('cur','Curazao','🇨🇼','E','E'),
  ('civ','Costa de Marfil','🇨🇮','E','E'),
  ('ecu','Ecuador','🇪🇨','E','E'),
  -- GRUPO F
  ('ned','Países Bajos','🇳🇱','F','F'),
  ('jpn','Japón','🇯🇵','F','F'),
  ('swe','Suecia','🇸🇪','F','F'),
  ('tun','Túnez','🇹🇳','F','F'),
  -- GRUPO G
  ('bel','Bélgica','🇧🇪','G','G'),
  ('egy','Egipto','🇪🇬','G','G'),
  ('irn','Irán','🇮🇷','G','G'),
  ('nzl','Nueva Zelanda','🇳🇿','G','G'),
  -- GRUPO H
  ('esp','España','🇪🇸','H','H'),
  ('cpv','Cabo Verde','🇨🇻','H','H'),
  ('ksa','Arabia Saudita','🇸🇦','H','H'),
  ('uru','Uruguay','🇺🇾','H','H'),
  -- GRUPO I
  ('fra','Francia','🇫🇷','I','I'),
  ('sen','Senegal','🇸🇳','I','I'),
  ('irq','Irak','🇮🇶','I','I'),
  ('nor','Noruega','🇳🇴','I','I'),
  -- GRUPO J
  ('arg','Argentina','🇦🇷','J','J'),
  ('alg','Argelia','🇩🇿','J','J'),
  ('aut','Austria','🇦🇹','J','J'),
  ('jor','Jordania','🇯🇴','J','J'),
  -- GRUPO K
  ('por','Portugal','🇵🇹','K','K'),
  ('cod','R.D. Congo','🇨🇩','K','K'),
  ('uzb','Uzbekistán','🇺🇿','K','K'),
  ('col','Colombia','🇨🇴','K','K'),
  -- GRUPO L
  ('eng','Inglaterra','🏴󠁧󠁢󠁥󠁮󠁧󠁿','L','L'),
  ('cro','Croacia','🇭🇷','L','L'),
  ('gha','Ghana','🇬🇭','L','L'),
  ('pan','Panamá','🇵🇦','L','L')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, flag=EXCLUDED.flag, group_id=EXCLUDED.group_id, group_name=EXCLUDED.group_name;

-- ============================================================
-- PARTIDOS FASE DE GRUPOS (72 partidos)
-- Horarios en ET (Eastern Time, UTC-4 en verano)
-- ============================================================

INSERT INTO matches (match_number, stage, group_id, group_name, home_team_id, away_team_id, home_team_placeholder, away_team_placeholder, match_date, venue, city, country) VALUES

-- ======= GRUPO A =======
-- Jornada 1
(1,'group','A','A','mex','rsa',NULL,NULL,'2026-06-11 13:00:00-04','Estadio Azteca','Ciudad de México','MEX'),
(2,'group','A','A','kor','cze',NULL,NULL,'2026-06-11 20:00:00-04','Estadio Akron','Guadalajara','MEX'),
-- Jornada 2
(3,'group','A','A','mex','kor',NULL,NULL,'2026-06-15 16:00:00-04','Estadio Azteca','Ciudad de México','MEX'),
(4,'group','A','A','rsa','cze',NULL,NULL,'2026-06-15 19:00:00-04','Estadio Akron','Guadalajara','MEX'),
-- Jornada 3 (simultáneos)
(5,'group','A','A','cze','mex',NULL,NULL,'2026-06-19 20:00:00-04','Estadio BBVA','Monterrey','MEX'),
(6,'group','A','A','rsa','kor',NULL,NULL,'2026-06-19 20:00:00-04','Estadio Akron','Guadalajara','MEX'),

-- ======= GRUPO B =======
-- Jornada 1
(7,'group','B','B','can','bih',NULL,NULL,'2026-06-12 15:00:00-04','BMO Field / Rogers Centre','Toronto','CAN'),
(8,'group','B','B','qat','sui',NULL,NULL,'2026-06-12 21:00:00-04','Levi''s Stadium','Santa Clara','USA'),
-- Jornada 2
(9,'group','B','B','can','qat',NULL,NULL,'2026-06-16 16:00:00-04','BC Place','Vancouver','CAN'),
(10,'group','B','B','bih','sui',NULL,NULL,'2026-06-16 19:00:00-04','Levi''s Stadium','Santa Clara','USA'),
-- Jornada 3
(11,'group','B','B','sui','can',NULL,NULL,'2026-06-20 20:00:00-04','SoFi Stadium','Los Ángeles','USA'),
(12,'group','B','B','bih','qat',NULL,NULL,'2026-06-20 20:00:00-04','BC Place','Vancouver','CAN'),

-- ======= GRUPO C =======
-- Jornada 1
(13,'group','C','C','bra','mar',NULL,NULL,'2026-06-13 18:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(14,'group','C','C','hai','sco',NULL,NULL,'2026-06-13 21:00:00-04','Gillette Stadium','Boston','USA'),
-- Jornada 2
(15,'group','C','C','bra','hai',NULL,NULL,'2026-06-17 16:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(16,'group','C','C','mar','sco',NULL,NULL,'2026-06-17 19:00:00-04','Gillette Stadium','Boston','USA'),
-- Jornada 3
(17,'group','C','C','sco','bra',NULL,NULL,'2026-06-21 20:00:00-04','Hard Rock Stadium','Miami','USA'),
(18,'group','C','C','mar','hai',NULL,NULL,'2026-06-21 20:00:00-04','Gillette Stadium','Boston','USA'),

-- ======= GRUPO D =======
-- Jornada 1
(19,'group','D','D','usa','par',NULL,NULL,'2026-06-12 21:00:00-04','SoFi Stadium','Los Ángeles','USA'),
(20,'group','D','D','aus','tur',NULL,NULL,'2026-06-13 00:00:00-04','BC Place','Vancouver','CAN'),
-- Jornada 2
(21,'group','D','D','usa','aus',NULL,NULL,'2026-06-17 16:00:00-04','AT&T Stadium','Dallas','USA'),
(22,'group','D','D','par','tur',NULL,NULL,'2026-06-17 19:00:00-04','Hard Rock Stadium','Miami','USA'),
-- Jornada 3
(23,'group','D','D','tur','usa',NULL,NULL,'2026-06-25 22:00:00-04','SoFi Stadium','Los Ángeles','USA'),
(24,'group','D','D','par','aus',NULL,NULL,'2026-06-25 22:00:00-04','Levi''s Stadium','Santa Clara','USA'),

-- ======= GRUPO E =======
-- Jornada 1
(25,'group','E','E','ger','cur',NULL,NULL,'2026-06-14 13:00:00-04','NRG Stadium','Houston','USA'),
(26,'group','E','E','civ','ecu',NULL,NULL,'2026-06-14 16:00:00-04','Lincoln Financial Field','Filadelfia','USA'),
-- Jornada 2
(27,'group','E','E','ger','civ',NULL,NULL,'2026-06-18 16:00:00-04','AT&T Stadium','Dallas','USA'),
(28,'group','E','E','cur','ecu',NULL,NULL,'2026-06-18 19:00:00-04','NRG Stadium','Houston','USA'),
-- Jornada 3
(29,'group','E','E','ecu','ger',NULL,NULL,'2026-06-25 16:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(30,'group','E','E','cur','civ',NULL,NULL,'2026-06-25 16:00:00-04','Lincoln Financial Field','Filadelfia','USA'),

-- ======= GRUPO F =======
-- Jornada 1
(31,'group','F','F','ned','jpn',NULL,NULL,'2026-06-14 19:00:00-04','AT&T Stadium','Dallas','USA'),
(32,'group','F','F','swe','tun',NULL,NULL,'2026-06-14 22:00:00-04','Levi''s Stadium','Santa Clara','USA'),
-- Jornada 2
(33,'group','F','F','ned','swe',NULL,NULL,'2026-06-18 16:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(34,'group','F','F','jpn','tun',NULL,NULL,'2026-06-18 19:00:00-04','Arrowhead Stadium','Kansas City','USA'),
-- Jornada 3
(35,'group','F','F','jpn','swe',NULL,NULL,'2026-06-25 19:00:00-04','AT&T Stadium','Dallas','USA'),
(36,'group','F','F','tun','ned',NULL,NULL,'2026-06-25 19:00:00-04','Arrowhead Stadium','Kansas City','USA'),

-- ======= GRUPO G =======
-- Jornada 1
(37,'group','G','G','bel','egy',NULL,NULL,'2026-06-15 18:00:00-04','Lumen Field','Seattle','USA'),
(38,'group','G','G','irn','nzl',NULL,NULL,'2026-06-16 00:00:00-04','SoFi Stadium','Los Ángeles','USA'),
-- Jornada 2
(39,'group','G','G','bel','irn',NULL,NULL,'2026-06-19 16:00:00-04','Lumen Field','Seattle','USA'),
(40,'group','G','G','egy','nzl',NULL,NULL,'2026-06-19 19:00:00-04','Rose Bowl','Los Ángeles','USA'),
-- Jornada 3
(41,'group','G','G','egy','irn',NULL,NULL,'2026-06-26 23:00:00-04','Lumen Field','Seattle','USA'),
(42,'group','G','G','nzl','bel',NULL,NULL,'2026-06-26 23:00:00-04','BC Place','Vancouver','CAN'),

-- ======= GRUPO H =======
-- Jornada 1
(43,'group','H','H','esp','cpv',NULL,NULL,'2026-06-15 13:00:00-04','Mercedes-Benz Stadium','Atlanta','USA'),
(44,'group','H','H','ksa','uru',NULL,NULL,'2026-06-15 18:00:00-04','Hard Rock Stadium','Miami','USA'),
-- Jornada 2
(45,'group','H','H','esp','ksa',NULL,NULL,'2026-06-19 19:00:00-04','AT&T Stadium','Dallas','USA'),
(46,'group','H','H','cpv','uru',NULL,NULL,'2026-06-19 22:00:00-04','Mercedes-Benz Stadium','Atlanta','USA'),
-- Jornada 3
(47,'group','H','H','cpv','ksa',NULL,NULL,'2026-06-26 20:00:00-04','NRG Stadium','Houston','USA'),
(48,'group','H','H','uru','esp',NULL,NULL,'2026-06-26 20:00:00-04','Estadio Akron','Guadalajara','MEX'),

-- ======= GRUPO I =======
-- Jornada 1
(49,'group','I','I','fra','sen',NULL,NULL,'2026-06-16 15:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(50,'group','I','I','irq','nor',NULL,NULL,'2026-06-16 18:00:00-04','Gillette Stadium','Boston','USA'),
-- Jornada 2
(51,'group','I','I','fra','irq',NULL,NULL,'2026-06-20 16:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(52,'group','I','I','sen','nor',NULL,NULL,'2026-06-20 19:00:00-04','Gillette Stadium','Boston','USA'),
-- Jornada 3
(53,'group','I','I','nor','fra',NULL,NULL,'2026-06-26 15:00:00-04','Gillette Stadium','Boston','USA'),
(54,'group','I','I','sen','irq',NULL,NULL,'2026-06-26 15:00:00-04','BMO Field / Rogers Centre','Toronto','CAN'),

-- ======= GRUPO J =======
-- Jornada 1
(55,'group','J','J','arg','alg',NULL,NULL,'2026-06-16 21:00:00-04','Arrowhead Stadium','Kansas City','USA'),
(56,'group','J','J','aut','jor',NULL,NULL,'2026-06-17 00:00:00-04','Levi''s Stadium','Santa Clara','USA'),
-- Jornada 2
(57,'group','J','J','arg','aut',NULL,NULL,'2026-06-21 16:00:00-04','Rose Bowl','Los Ángeles','USA'),
(58,'group','J','J','alg','jor',NULL,NULL,'2026-06-21 19:00:00-04','Arrowhead Stadium','Kansas City','USA'),
-- Jornada 3
(59,'group','J','J','jor','arg',NULL,NULL,'2026-06-27 20:00:00-04','SoFi Stadium','Los Ángeles','USA'),
(60,'group','J','J','alg','aut',NULL,NULL,'2026-06-27 20:00:00-04','Arrowhead Stadium','Kansas City','USA'),

-- ======= GRUPO K =======
-- Jornada 1
(61,'group','K','K','por','cod',NULL,NULL,'2026-06-17 13:00:00-04','NRG Stadium','Houston','USA'),
(62,'group','K','K','uzb','col',NULL,NULL,'2026-06-17 22:00:00-04','Estadio Azteca','Ciudad de México','MEX'),
-- Jornada 2
(63,'group','K','K','por','uzb',NULL,NULL,'2026-06-21 16:00:00-04','NRG Stadium','Houston','USA'),
(64,'group','K','K','cod','col',NULL,NULL,'2026-06-21 19:00:00-04','Mercedes-Benz Stadium','Atlanta','USA'),
-- Jornada 3
(65,'group','K','K','col','por',NULL,NULL,'2026-06-27 20:00:00-04','Hard Rock Stadium','Miami','USA'),
(66,'group','K','K','cod','uzb',NULL,NULL,'2026-06-27 20:00:00-04','NRG Stadium','Houston','USA'),

-- ======= GRUPO L =======
-- Jornada 1
(67,'group','L','L','eng','cro',NULL,NULL,'2026-06-17 16:00:00-04','AT&T Stadium','Dallas','USA'),
(68,'group','L','L','gha','pan',NULL,NULL,'2026-06-17 19:00:00-04','BMO Field / Rogers Centre','Toronto','CAN'),
-- Jornada 2
(69,'group','L','L','eng','gha',NULL,NULL,'2026-06-21 19:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(70,'group','L','L','cro','pan',NULL,NULL,'2026-06-21 22:00:00-04','Lincoln Financial Field','Filadelfia','USA'),
-- Jornada 3
(71,'group','L','L','pan','eng',NULL,NULL,'2026-06-27 20:00:00-04','AT&T Stadium','Dallas','USA'),
(72,'group','L','L','cro','gha',NULL,NULL,'2026-06-27 20:00:00-04','Lincoln Financial Field','Filadelfia','USA'),

-- ======= RONDA DE 32 =======
(73,'round_of_32',NULL,NULL,NULL,NULL,'1A','2B','2026-07-01 15:00:00-04','TBD','TBD','USA'),
(74,'round_of_32',NULL,NULL,NULL,NULL,'1B','2A','2026-07-01 19:00:00-04','TBD','TBD','USA'),
(75,'round_of_32',NULL,NULL,NULL,NULL,'1C','2D','2026-07-02 15:00:00-04','TBD','TBD','USA'),
(76,'round_of_32',NULL,NULL,NULL,NULL,'1D','2C','2026-07-02 19:00:00-04','TBD','TBD','USA'),
(77,'round_of_32',NULL,NULL,NULL,NULL,'1E','2F','2026-07-03 15:00:00-04','TBD','TBD','USA'),
(78,'round_of_32',NULL,NULL,NULL,NULL,'1F','2E','2026-07-03 19:00:00-04','TBD','TBD','USA'),
(79,'round_of_32',NULL,NULL,NULL,NULL,'1G','2H','2026-07-04 15:00:00-04','TBD','TBD','USA'),
(80,'round_of_32',NULL,NULL,NULL,NULL,'1H','2G','2026-07-04 19:00:00-04','TBD','TBD','USA'),
(81,'round_of_32',NULL,NULL,NULL,NULL,'1I','2J','2026-07-05 15:00:00-04','TBD','TBD','USA'),
(82,'round_of_32',NULL,NULL,NULL,NULL,'1J','2I','2026-07-05 19:00:00-04','TBD','TBD','USA'),
(83,'round_of_32',NULL,NULL,NULL,NULL,'1K','2L','2026-07-06 15:00:00-04','TBD','TBD','USA'),
(84,'round_of_32',NULL,NULL,NULL,NULL,'1L','2K','2026-07-06 19:00:00-04','TBD','TBD','USA'),
(85,'round_of_32',NULL,NULL,NULL,NULL,'3er Mejor 1','3er Mejor 2','2026-07-07 15:00:00-04','TBD','TBD','USA'),
(86,'round_of_32',NULL,NULL,NULL,NULL,'3er Mejor 3','3er Mejor 4','2026-07-07 19:00:00-04','TBD','TBD','USA'),
(87,'round_of_32',NULL,NULL,NULL,NULL,'3er Mejor 5','3er Mejor 6','2026-07-08 15:00:00-04','TBD','TBD','USA'),
(88,'round_of_32',NULL,NULL,NULL,NULL,'3er Mejor 7','3er Mejor 8','2026-07-08 19:00:00-04','TBD','TBD','USA'),

-- ======= OCTAVOS DE FINAL =======
(89,'round_of_16',NULL,NULL,NULL,NULL,'W73','W74','2026-07-10 15:00:00-04','TBD','TBD','USA'),
(90,'round_of_16',NULL,NULL,NULL,NULL,'W75','W76','2026-07-10 19:00:00-04','TBD','TBD','USA'),
(91,'round_of_16',NULL,NULL,NULL,NULL,'W77','W78','2026-07-11 15:00:00-04','TBD','TBD','USA'),
(92,'round_of_16',NULL,NULL,NULL,NULL,'W79','W80','2026-07-11 19:00:00-04','TBD','TBD','USA'),
(93,'round_of_16',NULL,NULL,NULL,NULL,'W81','W82','2026-07-12 15:00:00-04','TBD','TBD','USA'),
(94,'round_of_16',NULL,NULL,NULL,NULL,'W83','W84','2026-07-12 19:00:00-04','TBD','TBD','USA'),
(95,'round_of_16',NULL,NULL,NULL,NULL,'W85','W86','2026-07-13 15:00:00-04','TBD','TBD','USA'),
(96,'round_of_16',NULL,NULL,NULL,NULL,'W87','W88','2026-07-13 19:00:00-04','TBD','TBD','USA'),

-- ======= CUARTOS DE FINAL =======
(97,'quarterfinal',NULL,NULL,NULL,NULL,'W89','W90','2026-07-17 15:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(98,'quarterfinal',NULL,NULL,NULL,NULL,'W91','W92','2026-07-17 19:00:00-04','AT&T Stadium','Dallas','USA'),
(99,'quarterfinal',NULL,NULL,NULL,NULL,'W93','W94','2026-07-18 15:00:00-04','SoFi Stadium','Los Ángeles','USA'),
(100,'quarterfinal',NULL,NULL,NULL,NULL,'W95','W96','2026-07-18 19:00:00-04','Hard Rock Stadium','Miami','USA'),

-- ======= SEMIFINALES =======
(101,'semifinal',NULL,NULL,NULL,NULL,'W97','W98','2026-07-21 19:00:00-04','MetLife Stadium','Nueva York/NJ','USA'),
(102,'semifinal',NULL,NULL,NULL,NULL,'W99','W100','2026-07-22 19:00:00-04','AT&T Stadium','Dallas','USA'),

-- ======= TERCER LUGAR =======
(103,'third_place',NULL,NULL,NULL,NULL,'Perdedor SF1','Perdedor SF2','2026-07-25 15:00:00-04','Hard Rock Stadium','Miami','USA'),

-- ======= FINAL =======
(104,'final',NULL,NULL,NULL,NULL,'W101','W102','2026-07-19 19:00:00-04','MetLife Stadium','Nueva York/NJ','USA')

ON CONFLICT DO NOTHING;
