-- ============================================================
-- SEED DATA — Equipos y Estadios
-- Ejecutar DESPUÉS del schema.sql
-- ============================================================

-- ESTADIOS
insert into public.stadiums (id, name, city, country, country_flag, capacity) values
(1,  'MetLife Stadium',           'East Rutherford (Nueva York)', 'Estados Unidos', '🇺🇸', 82500),
(2,  'AT&T Stadium',              'Arlington (Dallas)',            'Estados Unidos', '🇺🇸', 80000),
(3,  'SoFi Stadium',              'Inglewood (Los Ángeles)',       'Estados Unidos', '🇺🇸', 70240),
(4,  'Levi''s Stadium',           'Santa Clara (San Francisco)',   'Estados Unidos', '🇺🇸', 68500),
(5,  'Arrowhead Stadium',         'Kansas City',                   'Estados Unidos', '🇺🇸', 76416),
(6,  'Gillette Stadium',          'Foxborough (Boston)',           'Estados Unidos', '🇺🇸', 65878),
(7,  'Lincoln Financial Field',   'Filadelfia',                    'Estados Unidos', '🇺🇸', 68532),
(8,  'Bank of America Stadium',   'Charlotte',                     'Estados Unidos', '🇺🇸', 74867),
(9,  'Hard Rock Stadium',         'Miami Gardens (Miami)',         'Estados Unidos', '🇺🇸', 64767),
(10, 'NRG Stadium',               'Houston',                       'Estados Unidos', '🇺🇸', 72220),
(11, 'Lumen Field',               'Seattle',                       'Estados Unidos', '🇺🇸', 69000),
(12, 'BC Place',                  'Vancouver',                     'Canadá',         '🇨🇦', 54500),
(13, 'BMO Field',                 'Toronto',                       'Canadá',         '🇨🇦', 30000),
(14, 'Estadio Azteca',            'Ciudad de México',              'México',         '🇲🇽', 87523),
(15, 'Estadio Akron',             'Guadalajara',                   'México',         '🇲🇽', 49850),
(16, 'Estadio BBVA',              'Monterrey',                     'México',         '🇲🇽', 53500)
on conflict (id) do update set
  name=excluded.name, city=excluded.city, country=excluded.country,
  country_flag=excluded.country_flag, capacity=excluded.capacity;

-- EQUIPOS (48 selecciones)
insert into public.teams (id, name, flag, "group", confederation) values
('BRA','Brasil',          '🇧🇷','A','CONMEBOL'),
('SRB','Serbia',          '🇷🇸','A','UEFA'),
('MAR','Marruecos',       '🇲🇦','A','CAF'),
('PAN','Panamá',          '🇵🇦','A','CONCACAF'),
('FRA','Francia',         '🇫🇷','B','UEFA'),
('HUN','Hungría',         '🇭🇺','B','UEFA'),
('CIV','Costa de Marfil', '🇨🇮','B','CAF'),
('JPN','Japón',           '🇯🇵','B','AFC'),
('ESP','España',          '🇪🇸','C','UEFA'),
('AUT','Austria',         '🇦🇹','C','UEFA'),
('SEN','Senegal',         '🇸🇳','C','CAF'),
('CAN','Canadá',          '🇨🇦','C','CONCACAF'),
('GER','Alemania',        '🇩🇪','D','UEFA'),
('DEN','Dinamarca',       '🇩🇰','D','UEFA'),
('NGA','Nigeria',         '🇳🇬','D','CAF'),
('ECU','Ecuador',         '🇪🇨','D','CONMEBOL'),
('ENG','Inglaterra',      '🏴󠁧󠁢󠁥󠁮󠁧󠁿','E','UEFA'),
('CRO','Croacia',         '🇭🇷','E','UEFA'),
('KSA','Arabia Saudí',    '🇸🇦','E','AFC'),
('CHI','Chile',           '🇨🇱','E','CONMEBOL'),
('ARG','Argentina',       '🇦🇷','F','CONMEBOL'),
('NOR','Noruega',         '🇳🇴','F','UEFA'),
('GHA','Ghana',           '🇬🇭','F','CAF'),
('AUS','Australia',       '🇦🇺','F','AFC'),
('POR','Portugal',        '🇵🇹','G','UEFA'),
('SUI','Suiza',           '🇨🇭','G','UEFA'),
('TUN','Túnez',           '🇹🇳','G','CAF'),
('CRC','Costa Rica',      '🇨🇷','G','CONCACAF'),
('NED','Países Bajos',    '🇳🇱','H','UEFA'),
('TUR','Turquía',         '🇹🇷','H','UEFA'),
('EGY','Egipto',          '🇪🇬','H','CAF'),
('URU','Uruguay',         '🇺🇾','H','CONMEBOL'),
('ITA','Italia',          '🇮🇹','I','UEFA'),
('SCO','Escocia',         '🏴󠁧󠁢󠁳󠁣󠁴󠁿','I','UEFA'),
('ALG','Argelia',         '🇩🇿','I','CAF'),
('KOR','Corea del Sur',   '🇰🇷','I','AFC'),
('USA','Estados Unidos',  '🇺🇸','J','CONCACAF'),
('QAT','Qatar',           '🇶🇦','J','AFC'),
('JAM','Jamaica',         '🇯🇲','J','CONCACAF'),
('JOR','Jordania',        '🇯🇴','J','AFC'),
('MEX','México',          '🇲🇽','K','CONCACAF'),
('IRN','Irán',            '🇮🇷','K','AFC'),
('VEN','Venezuela',       '🇻🇪','K','CONMEBOL'),
('NZL','Nueva Zelanda',   '🇳🇿','K','OFC'),
('COL','Colombia',        '🇨🇴','L','CONMEBOL'),
('PAR','Paraguay',        '🇵🇾','L','CONMEBOL'),
('CMR','Camerún',         '🇨🇲','L','CAF'),
('UZB','Uzbekistán',      '🇺🇿','L','AFC')
on conflict (id) do update set
  name=excluded.name, flag=excluded.flag, "group"=excluded."group",
  confederation=excluded.confederation;
