-- ============================================================
-- PORRA MUNDIAL 2026 — Esquema de base de datos (Supabase)
-- Ejecuta TODO este archivo en: Supabase → SQL Editor → New query
-- ============================================================

-- ─────────────────────────────────────────────
-- PERFILES (one-to-one con auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  avatar_url text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuarios ven todos los perfiles"
  on public.profiles for select using (true);

create policy "Usuario edita su propio perfil"
  on public.profiles for update using (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- EQUIPOS
-- Incluye columnas de avance en el torneo desde el inicio
-- ─────────────────────────────────────────────
create table if not exists public.teams (
  id                  text primary key,
  name                text not null,
  flag                text not null,
  "group"             text not null,
  confederation       text not null,
  -- Estado del torneo (el admin lo marca conforme avanza)
  qualified_knockout  boolean not null default false,
  reached_r16         boolean not null default false,
  reached_qf          boolean not null default false,
  reached_sf          boolean not null default false,
  reached_final       boolean not null default false,
  is_champion         boolean not null default false
);

alter table public.teams enable row level security;

create policy "Todos ven equipos"
  on public.teams for select using (true);

create policy "Solo admin modifica equipos"
  on public.teams for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- ESTADIOS
-- ─────────────────────────────────────────────
create table if not exists public.stadiums (
  id           serial primary key,
  name         text not null,
  city         text not null,
  country      text not null,
  country_flag text not null,
  capacity     integer not null
);

alter table public.stadiums enable row level security;

create policy "Todos ven estadios"
  on public.stadiums for select using (true);

create policy "Solo admin modifica estadios"
  on public.stadiums for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- PARTIDOS
-- ─────────────────────────────────────────────
create table if not exists public.matches (
  id               serial primary key,
  phase            text not null check (phase in ('groups','r32','r16','qf','sf','third_place','final')),
  group_name       text,
  match_number     integer not null,
  home_team_id     text references public.teams(id),
  away_team_id     text references public.teams(id),
  home_placeholder text,
  away_placeholder text,
  match_date       timestamptz not null,
  stadium_id       integer references public.stadiums(id),
  home_score       integer,
  away_score       integer,
  status           text not null default 'scheduled' check (status in ('scheduled','live','finished'))
);

alter table public.matches enable row level security;

create policy "Todos ven partidos"
  on public.matches for select using (true);

create policy "Solo admin modifica partidos"
  on public.matches for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ─────────────────────────────────────────────
-- PREDICCIONES DE PARTIDO (resultado exacto 1X2 / marcador)
-- ─────────────────────────────────────────────
create table if not exists public.match_predictions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  match_id   integer not null references public.matches(id) on delete cascade,
  home_score integer not null,
  away_score integer not null,
  created_at timestamptz not null default now(),
  unique(user_id, match_id)
);

alter table public.match_predictions enable row level security;

create policy "Usuario ve sus predicciones de partido"
  on public.match_predictions for select using (auth.uid() = user_id);

create policy "Admin ve todas las predicciones de partido"
  on public.match_predictions for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Usuario crea predicciones de partido"
  on public.match_predictions for insert with check (auth.uid() = user_id);

create policy "Usuario actualiza sus predicciones de partido"
  on public.match_predictions for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- PREDICCIONES DE CLASIFICACIÓN (quién pasa de grupos)
-- ─────────────────────────────────────────────
create table if not exists public.group_qualify_predictions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  team_id    text not null references public.teams(id),
  created_at timestamptz not null default now(),
  unique(user_id, team_id)
);

alter table public.group_qualify_predictions enable row level security;

create policy "Usuario ve sus predicciones de clasificación"
  on public.group_qualify_predictions for select using (auth.uid() = user_id);

create policy "Admin ve todas las pred. clasificación"
  on public.group_qualify_predictions for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Usuario inserta predicciones de clasificación"
  on public.group_qualify_predictions for insert with check (auth.uid() = user_id);

create policy "Usuario borra predicciones de clasificación"
  on public.group_qualify_predictions for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- PREDICCIONES ELIMINATORIAS (equipos por ronda)
-- ─────────────────────────────────────────────
create table if not exists public.knockout_predictions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  round      text not null check (round in ('r16','qf','sf','final','champion')),
  team_id    text not null references public.teams(id),
  created_at timestamptz not null default now(),
  unique(user_id, round, team_id)
);

alter table public.knockout_predictions enable row level security;

create policy "Usuario ve sus predicciones eliminatorias"
  on public.knockout_predictions for select using (auth.uid() = user_id);

create policy "Admin ve todas las pred. eliminatorias"
  on public.knockout_predictions for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Usuario inserta predicciones eliminatorias"
  on public.knockout_predictions for insert with check (auth.uid() = user_id);

create policy "Usuario borra predicciones eliminatorias"
  on public.knockout_predictions for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- CONFIGURACIÓN DE LA APP
-- ─────────────────────────────────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Todos ven configuración"
  on public.app_settings for select using (true);

create policy "Solo admin modifica configuración"
  on public.app_settings for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

insert into public.app_settings (key, value) values
  ('phase',                        'group_predictions'),
  ('group_predictions_open',       'true'),
  ('group_predictions_deadline',   '2026-06-10T22:00:00Z'),
  ('knockout_predictions_open',    'false'),
  ('knockout_predictions_deadline', null)
on conflict (key) do nothing;

-- ─────────────────────────────────────────────
-- FUNCIÓN DE PUNTUACIÓN
-- Las columnas qualified_knockout, reached_r16, etc. ya existen
-- en la tabla teams (definidas arriba), así que esta función es válida.
-- ─────────────────────────────────────────────
create or replace function public.calculate_scores()
returns table (
  user_id              uuid,
  name                 text,
  avatar_url           text,
  match_points         integer,
  group_qualify_points integer,
  knockout_points      integer,
  total_points         integer
)
language sql stable security definer set search_path = public as $$
  with
  match_pts as (
    select
      mp.user_id,
      sum(case
        when m.home_score = mp.home_score and m.away_score = mp.away_score then 6
        when (
          case when m.home_score > m.away_score then '1'
               when m.home_score = m.away_score then 'X'
               else '2' end
          =
          case when mp.home_score > mp.away_score then '1'
               when mp.home_score = mp.away_score then 'X'
               else '2' end
        ) then 3
        else 0
      end)::integer as pts
    from match_predictions mp
    join matches m on m.id = mp.match_id
    where m.status = 'finished'
    group by mp.user_id
  ),
  qualify_pts as (
    select
      gqp.user_id,
      (count(*) * 5)::integer as pts
    from group_qualify_predictions gqp
    join teams t on t.id = gqp.team_id
    where t.qualified_knockout = true
    group by gqp.user_id
  ),
  knockout_pts as (
    select
      kp.user_id,
      sum(case kp.round
        when 'r16'      then 5
        when 'qf'       then 9
        when 'sf'       then 15
        when 'final'    then 25
        when 'champion' then 40
        else 0
      end)::integer as pts
    from knockout_predictions kp
    join teams t on t.id = kp.team_id
    where
      (kp.round = 'r16'      and t.reached_r16   = true) or
      (kp.round = 'qf'       and t.reached_qf    = true) or
      (kp.round = 'sf'       and t.reached_sf    = true) or
      (kp.round = 'final'    and t.reached_final = true) or
      (kp.round = 'champion' and t.is_champion   = true)
    group by kp.user_id
  )
  select
    p.id                                                    as user_id,
    p.name,
    p.avatar_url,
    coalesce(mp.pts, 0)                                     as match_points,
    coalesce(qp.pts, 0)                                     as group_qualify_points,
    coalesce(kp.pts, 0)                                     as knockout_points,
    (coalesce(mp.pts, 0) + coalesce(qp.pts, 0) + coalesce(kp.pts, 0)) as total_points
  from profiles p
  left join match_pts  mp on mp.user_id = p.id
  left join qualify_pts qp on qp.user_id = p.id
  left join knockout_pts kp on kp.user_id = p.id
  order by total_points desc;
$$;

-- ─────────────────────────────────────────────
-- NOTA REALTIME:
-- Para activar actualizaciones en tiempo real, ve a:
-- Supabase Dashboard → Database → Replication
-- y activa las tablas "matches" y "app_settings"
-- ─────────────────────────────────────────────
