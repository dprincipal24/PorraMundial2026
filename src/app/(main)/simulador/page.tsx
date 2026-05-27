import { createClient } from '@/lib/supabase/server'
import { SimuladorClient } from './client'
import type { ScoreMap, WinnerMap } from './simulatorLogic'

export default async function SimuladorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: matches }, { data: userPreds }, { data: settings }] = await Promise.all([
    supabase
      .from('matches')
      .select('id, phase, group_name, match_number, home_team_id, away_team_id, home_placeholder, away_placeholder, home_score, away_score, status')
      .order('match_date', { ascending: true }),
    supabase
      .from('match_predictions')
      .select('match_id, home_score, away_score')
      .eq('user_id', user!.id),
    supabase.from('app_settings').select('key, value'),
  ])

  const adminGroupScores: ScoreMap = {}
  const adminKnockoutWinners: WinnerMap = {}

  for (const m of (matches ?? [])) {
    if (m.status === 'finished' && m.home_score !== null && m.away_score !== null) {
      if (m.phase === 'groups') {
        adminGroupScores[m.id] = { home: m.home_score, away: m.away_score }
      } else if (m.home_team_id && m.away_team_id) {
        if (m.home_score > m.away_score) adminKnockoutWinners[m.id] = m.home_team_id
        else if (m.away_score > m.home_score) adminKnockoutWinners[m.id] = m.away_team_id
      }
    }
  }

  // Merge admin-set bracket winners (override / supplement match results)
  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  try {
    if (settingsMap['knockout_bracket']) {
      const bracket = JSON.parse(settingsMap['knockout_bracket']) as WinnerMap
      for (const [midStr, teamId] of Object.entries(bracket)) {
        adminKnockoutWinners[parseInt(midStr)] = teamId as string
      }
    }
  } catch {}

  const lockedMatchIds = [...new Set([
    ...(matches ?? []).filter(m => m.status === 'finished').map(m => m.id as number),
    ...Object.keys(adminKnockoutWinners).filter(k => parseInt(k) >= 73).map(k => parseInt(k)),
  ])]

  // User's own group-phase predictions → for auto-fill
  const userGroupPredictions: ScoreMap = {}
  for (const p of (userPreds ?? [])) {
    userGroupPredictions[p.match_id] = { home: p.home_score, away: p.away_score }
  }

  return (
    <SimuladorClient
      matches={matches ?? []}
      adminGroupScores={adminGroupScores}
      adminKnockoutWinners={adminKnockoutWinners}
      lockedMatchIds={lockedMatchIds}
      userId={user!.id}
      userGroupPredictions={userGroupPredictions}
    />
  )
}
