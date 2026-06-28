import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './client'
import {
  computeAllGroupResults, getBestThirds, resolveR32Teams, getKnockoutTeam,
  type WinnerMap,
} from '../simulador/simulatorLogic'
import { TEAMS_BY_ID } from '@/lib/data/teams'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()

  if (!profile?.is_admin) redirect('/leaderboard')

  const { data: settings } = await supabase.from('app_settings').select('key, value')
  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))

  const { data: teams } = await supabase.from('teams').select('*').order('group')

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      stadium:stadiums(*)
    `)
    .order('match_date', { ascending: true })

  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at')

  const adminGroupScores: Record<number, { home: number; away: number }> = {}
  for (const m of (matches ?? [])) {
    if (m.phase === 'groups' && m.status === 'finished' && m.home_score !== null && m.away_score !== null) {
      adminGroupScores[m.id] = { home: m.home_score, away: m.away_score }
    }
  }

  let initialBracketWinners: Record<number, string> = {}
  try {
    if (settingsMap['knockout_bracket']) {
      initialBracketWinners = JSON.parse(settingsMap['knockout_bracket'])
    }
  } catch {}

  // Resolve knockout match participants for display in the results tab
  const scoresMapForGroups: Record<number, { home: number; away: number }> = {}
  const matchesForGroups: { id: number; group_name: string | null; home_team_id: string | null; away_team_id: string | null }[] = []
  for (const m of (matches ?? [])) {
    matchesForGroups.push({ id: m.id, group_name: m.group_name, home_team_id: m.home_team_id, away_team_id: m.away_team_id })
    if (m.phase === 'groups' && m.home_score !== null && m.away_score !== null) {
      scoresMapForGroups[m.id] = { home: m.home_score, away: m.away_score }
    }
  }
  const groupResults = computeAllGroupResults(matchesForGroups, scoresMapForGroups)
  const bestThirds = getBestThirds(groupResults)
  const r32Teams = resolveR32Teams(groupResults, bestThirds)

  const bracket: WinnerMap = initialBracketWinners
  const losers: WinnerMap = {}
  for (const sfId of [101, 102]) {
    const winnerId = bracket[sfId]
    if (winnerId) {
      const homeId = getKnockoutTeam(sfId, 'home', r32Teams, bracket)
      const awayId = getKnockoutTeam(sfId, 'away', r32Teams, bracket)
      const loser = homeId === winnerId ? awayId : homeId
      if (loser) losers[sfId] = loser
    }
  }

  const enrichedMatches = (matches ?? []).map(m => {
    if (m.phase === 'groups' || m.home_team) return m
    const homeId = getKnockoutTeam(m.id, 'home', r32Teams, bracket, losers)
    const awayId = getKnockoutTeam(m.id, 'away', r32Teams, bracket, losers)
    return {
      ...m,
      home_team: homeId ? TEAMS_BY_ID[homeId] : m.home_team,
      away_team: awayId ? TEAMS_BY_ID[awayId] : m.away_team,
    }
  })

  return (
    <AdminClient
      settings={settingsMap}
      teams={teams ?? []}
      matches={enrichedMatches}
      profiles={profiles ?? []}
      adminGroupScores={adminGroupScores}
      initialBracketWinners={initialBracketWinners}
    />
  )
}
