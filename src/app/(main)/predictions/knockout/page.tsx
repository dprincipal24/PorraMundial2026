import { createClient } from '@/lib/supabase/server'
import { KnockoutPredictionsClient } from './client'

export type KnockoutUserPred = {
  profile: { id: string; name: string; avatar_url: string | null }
  predsByRound: Record<string, string[]>
}

export default async function KnockoutPredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: settings },
    { data: teams },
    { data: knockoutPreds },
    { data: profile },
  ] = await Promise.all([
    supabase.from('app_settings').select('key, value'),
    supabase.from('teams').select('*').order('group').order('name'),
    supabase.from('knockout_predictions').select('round, team_id').eq('user_id', user!.id),
    supabase.from('profiles').select('is_admin').eq('id', user!.id).single(),
  ])

  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  const isOpen = settingsMap['knockout_predictions_open'] === 'true'
  const deadline = settingsMap['knockout_predictions_deadline'] ?? null
  const isAdmin = profile?.is_admin ?? false

  let allUsersPreds: KnockoutUserPred[] = []

  if (!isOpen || isAdmin) {
    const [{ data: allProfiles }, { data: allKnockoutPreds }] = await Promise.all([
      supabase.from('profiles').select('id, name, avatar_url').order('name'),
      supabase.from('knockout_predictions').select('user_id, round, team_id'),
    ])

    const predsByUser: Record<string, Record<string, string[]>> = {}
    for (const p of (allKnockoutPreds ?? [])) {
      if (!predsByUser[p.user_id]) predsByUser[p.user_id] = {}
      if (!predsByUser[p.user_id][p.round]) predsByUser[p.user_id][p.round] = []
      predsByUser[p.user_id][p.round].push(p.team_id)
    }

    allUsersPreds = (allProfiles ?? []).map((prof) => ({
      profile: prof,
      predsByRound: predsByUser[prof.id] ?? {},
    }))
  }

  return (
    <KnockoutPredictionsClient
      teams={teams ?? []}
      knockoutPredictions={knockoutPreds ?? []}
      userId={user!.id}
      isOpen={isOpen}
      deadline={deadline}
      phase={settingsMap['phase'] ?? 'group_predictions'}
      isAdmin={isAdmin}
      allUsersPreds={allUsersPreds}
    />
  )
}
