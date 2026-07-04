'use server'

import { createClient } from '@/lib/supabase/server'
import { TEAMS_BY_ID } from '@/lib/data/teams'

export type PredictionEntry = {
  user_name: string
  home_score: number
  away_score: number
}

export async function getMatchAllPredictions(matchId: number): Promise<PredictionEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('match_predictions')
    .select('home_score, away_score, profiles(name)')
    .eq('match_id', matchId)

  if (!data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .map(d => ({
      user_name: d.profiles?.name ?? 'Anónimo',
      home_score: d.home_score,
      away_score: d.away_score,
    }))
    .sort((a, b) => a.user_name.localeCompare(b.user_name))
}

export type KnockoutCrossEntry = {
  user_name: string
  teams: { id: string; name: string; iso: string }[]
}

// Ronda que se alcanza al ganar un partido de cada fase eliminatoria
const NEXT_ROUND: Record<string, string> = {
  r32: 'r16', r16: 'qf', qf: 'sf', sf: 'final', final: 'champion',
}

export async function getKnockoutCrossPredictions(
  phase: string,
  homeTeamId: string,
  awayTeamId: string,
): Promise<KnockoutCrossEntry[] | null> {
  const round = NEXT_ROUND[phase]
  if (!round) return null

  const supabase = await createClient()

  const [{ data: profiles }, { data: preds }] = await Promise.all([
    supabase.from('profiles').select('id, name, is_banned'),
    supabase
      .from('knockout_predictions')
      .select('user_id, team_id')
      .eq('round', round)
      .in('team_id', [homeTeamId, awayTeamId]),
  ])

  if (!profiles) return []

  const picksByUser: Record<string, string[]> = {}
  for (const p of preds ?? []) {
    if (!picksByUser[p.user_id]) picksByUser[p.user_id] = []
    picksByUser[p.user_id].push(p.team_id)
  }

  return profiles
    .filter(p => !p.is_banned)
    .map(p => ({
      user_name: p.name ?? 'Anónimo',
      teams: (picksByUser[p.id] ?? [])
        .map(teamId => TEAMS_BY_ID[teamId])
        .filter((t): t is NonNullable<typeof t> => Boolean(t))
        .map(t => ({ id: t.id, name: t.name, iso: t.iso })),
    }))
    .sort((a, b) => a.user_name.localeCompare(b.user_name))
}
