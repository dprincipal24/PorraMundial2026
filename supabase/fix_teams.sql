-- ============================================================
-- ACTUALIZACIÓN COMPLETA — Equipos reales + columna iso + estadio Atlanta
-- (sorteo celebrado el 5 de diciembre de 2025 en Miami)
-- Ejecuta en: Supabase → SQL Editor → New query
-- ============================================================

-- Borramos predicciones y datos anteriores
delete from public.knockout_predictions;
delete from public.group_qualify_predictions;
delete from public.match_predictions;
delete from public.matches;
delete from public.teams;

-- Añadimos la columna iso si no existe
alter table public.teams add column if not exists iso text;

-- Añadimos Mercedes-Benz Stadium (Atlanta) si no existe
insert into public.stadiums (id, name, city, country, country_flag, capacity)
values (17, 'Mercedes-Benz Stadium', 'Atlanta', 'Estados Unidos', '🇺🇸', 71000)
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  country = excluded.country,
  country_flag = excluded.country_flag,
  capacity = excluded.capacity;

-- Insertamos los 48 equipos reales con grupos e iso correctos
insert into public.teams (id, name, flag, "group", confederation, iso) values
-- Grupo A
('MEX', 'México',              '🇲🇽', 'A', 'CONCACAF', 'mx'),
('RSA', 'Sudáfrica',           '🇿🇦', 'A', 'CAF',      'za'),
('KOR', 'Corea del Sur',       '🇰🇷', 'A', 'AFC',      'kr'),
('CZE', 'Chequia',             '🇨🇿', 'A', 'UEFA',     'cz'),
-- Grupo B
('CAN', 'Canadá',              '🇨🇦', 'B', 'CONCACAF', 'ca'),
('BIH', 'Bosnia-Herzegovina',  '🇧🇦', 'B', 'UEFA',     'ba'),
('QAT', 'Qatar',               '🇶🇦', 'B', 'AFC',      'qa'),
('SUI', 'Suiza',               '🇨🇭', 'B', 'UEFA',     'ch'),
-- Grupo C
('BRA', 'Brasil',              '🇧🇷', 'C', 'CONMEBOL', 'br'),
('MAR', 'Marruecos',           '🇲🇦', 'C', 'CAF',      'ma'),
('HAI', 'Haití',               '🇭🇹', 'C', 'CONCACAF', 'ht'),
('SCO', 'Escocia',             '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C', 'UEFA',     'gb-sct'),
-- Grupo D
('USA', 'Estados Unidos',      '🇺🇸', 'D', 'CONCACAF', 'us'),
('PAR', 'Paraguay',            '🇵🇾', 'D', 'CONMEBOL', 'py'),
('AUS', 'Australia',           '🇦🇺', 'D', 'AFC',      'au'),
('TUR', 'Turquía',             '🇹🇷', 'D', 'UEFA',     'tr'),
-- Grupo E
('GER', 'Alemania',            '🇩🇪', 'E', 'UEFA',     'de'),
('CUW', 'Curazao',             '🇨🇼', 'E', 'CONCACAF', 'cw'),
('CIV', 'Costa de Marfil',     '🇨🇮', 'E', 'CAF',      'ci'),
('ECU', 'Ecuador',             '🇪🇨', 'E', 'CONMEBOL', 'ec'),
-- Grupo F
('NED', 'Países Bajos',        '🇳🇱', 'F', 'UEFA',     'nl'),
('JPN', 'Japón',               '🇯🇵', 'F', 'AFC',      'jp'),
('SWE', 'Suecia',              '🇸🇪', 'F', 'UEFA',     'se'),
('TUN', 'Túnez',               '🇹🇳', 'F', 'CAF',      'tn'),
-- Grupo G
('BEL', 'Bélgica',             '🇧🇪', 'G', 'UEFA',     'be'),
('EGY', 'Egipto',              '🇪🇬', 'G', 'CAF',      'eg'),
('IRN', 'Irán',                '🇮🇷', 'G', 'AFC',      'ir'),
('NZL', 'Nueva Zelanda',       '🇳🇿', 'G', 'OFC',      'nz'),
-- Grupo H
('ESP', 'España',              '🇪🇸', 'H', 'UEFA',     'es'),
('CPV', 'Cabo Verde',          '🇨🇻', 'H', 'CAF',      'cv'),
('KSA', 'Arabia Saudí',        '🇸🇦', 'H', 'AFC',      'sa'),
('URU', 'Uruguay',             '🇺🇾', 'H', 'CONMEBOL', 'uy'),
-- Grupo I
('FRA', 'Francia',             '🇫🇷', 'I', 'UEFA',     'fr'),
('SEN', 'Senegal',             '🇸🇳', 'I', 'CAF',      'sn'),
('IRQ', 'Irak',                '🇮🇶', 'I', 'AFC',      'iq'),
('NOR', 'Noruega',             '🇳🇴', 'I', 'UEFA',     'no'),
-- Grupo J
('ARG', 'Argentina',           '🇦🇷', 'J', 'CONMEBOL', 'ar'),
('ALG', 'Argelia',             '🇩🇿', 'J', 'CAF',      'dz'),
('AUT', 'Austria',             '🇦🇹', 'J', 'UEFA',     'at'),
('JOR', 'Jordania',            '🇯🇴', 'J', 'AFC',      'jo'),
-- Grupo K
('POR', 'Portugal',            '🇵🇹', 'K', 'UEFA',     'pt'),
('COD', 'Congo DR',            '🇨🇩', 'K', 'CAF',      'cd'),
('UZB', 'Uzbekistán',          '🇺🇿', 'K', 'AFC',      'uz'),
('COL', 'Colombia',            '🇨🇴', 'K', 'CONMEBOL', 'co'),
-- Grupo L
('ENG', 'Inglaterra',          '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'L', 'UEFA',     'gb-eng'),
('CRO', 'Croacia',             '🇭🇷', 'L', 'UEFA',     'hr'),
('GHA', 'Ghana',               '🇬🇭', 'L', 'CAF',      'gh'),
('PAN', 'Panamá',              '🇵🇦', 'L', 'CONCACAF', 'pa');
