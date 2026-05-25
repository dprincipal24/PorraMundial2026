import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from './client'

export const revalidate = 0

export type KnockoutBreakdown = Record<string, { r16: number; qf: number; sf: number; final: number; champion: number }>

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [scoresRes, settingsRes, profileRes, teamsRes, knockoutPredsRes] = await Promise.all([
    supabase.rpc('calculate_scores'),
    supabase.from('app_settings').select('key, value'),
    supabase.from('profiles').select('is_admin').eq('id', user!.id).single(),
    supabase.from('teams').select('id, reached_r16, reached_qf, reached_sf, reached_final, is_champion'),
    supabase.from('knockout_predictions').select('user_id, round, team_id'),
  ])

  const ranked = (scoresRes.data ?? []).map((s: Record<string, unknown>, i: number) => ({ ...s, position: i + 1 }))
  const settingsMap = Object.fromEntries(((settingsRes.data ?? []) as { key: string; value: string }[]).map(s => [s.key, s.value]))
  const groupPredsClosed = settingsMap['group_predictions_open'] !== 'true'
  const knockoutPredsClosed = settingsMap['knockout_predictions_open'] !== 'true'
  const isAdmin = profileRes.data?.is_admin ?? false

  type TeamRow = { id: string; reached_r16: boolean | null; reached_qf: boolean | null; reached_sf: boolean | null; reached_final: boolean | null; is_champion: boolean | null }
  const teamProgress = Object.fromEntries(((teamsRes.data ?? []) as TeamRow[]).map(t => [t.id, t]))

  const ROUND_FLAG: Record<string, keyof TeamRow> = { r16: 'reached_r16', qf: 'reached_qf', sf: 'reached_sf', final: 'reached_final', champion: 'is_champion' }
  const ROUND_PTS: Record<string, number> = { r16: 5, qf: 9, sf: 15, final: 25, champion: 40 }

  const knockoutBreakdown: KnockoutBreakdown = {}
  for (const pred of (knockoutPredsRes.data ?? []) as { user_id: string; round: string; team_id: string }[]) {
    if (!knockoutBreakdown[pred.user_id]) knockoutBreakdown[pred.user_id] = { r16: 0, qf: 0, sf: 0, final: 0, champion: 0 }
    const team = teamProgress[pred.team_id]
    const flag = ROUND_FLAG[pred.round]
    const pts = ROUND_PTS[pred.round]
    if (team && flag && pts !== undefined && team[flag]) {
      knockoutBreakdown[pred.user_id][pred.round as keyof typeof knockoutBreakdown[string]] += pts
    }
  }

  return (
    <LeaderboardClient
      scores={ranked}
      currentUserId={user?.id}
      phase={settingsMap['phase'] ?? 'group_predictions'}
      groupPredsClosed={groupPredsClosed}
      knockoutPredsClosed={knockoutPredsClosed}
      isAdmin={isAdmin}
      knockoutBreakdown={knockoutBreakdown}
    />
  )
}
