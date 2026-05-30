-- ============================================================
-- MIGRACIÓN: Control de pagos por usuario
-- Ejecuta en: Supabase → SQL Editor → New query
-- ============================================================

-- 1. Añadir columna has_paid a profiles
alter table public.profiles
  add column if not exists has_paid boolean not null default false;

-- 2. Actualizar calculate_scores() para incluir has_paid
drop function if exists public.calculate_scores();
create or replace function public.calculate_scores()
returns table (
  user_id              uuid,
  name                 text,
  avatar_url           text,
  match_points         integer,
  group_qualify_points integer,
  knockout_points      integer,
  award_points         integer,
  total_points         integer,
  has_paid             boolean
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
  ),
  award_pts as (
    select
      ap.user_id,
      sum(case
        when ap.award_type = 'golden_ball'  and (select value from app_settings where key = 'golden_ball_winner')  = ap.player_name then 25
        when ap.award_type = 'golden_boot'  and (select value from app_settings where key = 'golden_boot_winner')  = ap.player_name then 25
        when ap.award_type = 'golden_glove' and (select value from app_settings where key = 'golden_glove_winner') = ap.player_name then 25
        when ap.award_type = 'best_young'   and (select value from app_settings where key = 'best_young_winner')   = ap.player_name then 25
        else 0
      end)::integer as pts
    from award_predictions ap
    group by ap.user_id
  )
  select
    p.id                                                                                       as user_id,
    p.name,
    p.avatar_url,
    coalesce(mp.pts, 0)                                                                        as match_points,
    coalesce(qp.pts, 0)                                                                        as group_qualify_points,
    coalesce(kp.pts, 0)                                                                        as knockout_points,
    coalesce(ap.pts, 0)                                                                        as award_points,
    (coalesce(mp.pts, 0) + coalesce(qp.pts, 0) + coalesce(kp.pts, 0) + coalesce(ap.pts, 0))  as total_points,
    p.has_paid
  from profiles p
  left join match_pts    mp on mp.user_id = p.id
  left join qualify_pts  qp on qp.user_id = p.id
  left join knockout_pts kp on kp.user_id = p.id
  left join award_pts    ap on ap.user_id = p.id
  where p.is_banned is not true
  order by total_points desc;
$$;
