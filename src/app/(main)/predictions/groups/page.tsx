import { createClient } from '@/lib/supabase/server'
import { GroupPredictionsClient } from './client'

export default async function GroupPredictionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value')

  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  const isOpen = settingsMap['group_predictions_open'] === 'true'
  const deadline = settingsMap['group_predictions_deadline'] ?? null

  // Fetch all group stage matches with teams and stadiums
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      stadium:stadiums(*)
    `)
    .eq('phase', 'groups')
    .order('match_date', { ascending: true })

  // Fetch user's existing predictions
  const { data: predictions } = await supabase
    .from('match_predictions')
    .select('*')
    .eq('user_id', user!.id)

  // Fetch user's qualifying predictions
  const { data: qualifyPreds } = await supabase
    .from('group_qualify_predictions')
    .select('team_id')
    .eq('user_id', user!.id)

  // Fetch all teams with qualification status
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('group')

  return (
    <GroupPredictionsClient
      matches={matches ?? []}
      predictions={predictions ?? []}
      qualifyPredictions={(qualifyPreds ?? []).map((q: { team_id: string }) => q.team_id)}
      teams={teams ?? []}
      userId={user!.id}
      isOpen={isOpen}
      deadline={deadline}
    />
  )
}
