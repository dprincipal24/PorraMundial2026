import { createClient } from '@/lib/supabase/server'
import { KnockoutPredictionsClient } from './client'

export default async function KnockoutPredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: settings } = await supabase.from('app_settings').select('key, value')
  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  const isOpen = settingsMap['knockout_predictions_open'] === 'true'
  const deadline = settingsMap['knockout_predictions_deadline'] ?? null

  // Qualified teams (who passed groups)
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('qualified_knockout', true)
    .order('group')

  // User's current knockout predictions
  const { data: knockoutPreds } = await supabase
    .from('knockout_predictions')
    .select('round, team_id')
    .eq('user_id', user!.id)

  return (
    <KnockoutPredictionsClient
      teams={teams ?? []}
      knockoutPredictions={knockoutPreds ?? []}
      userId={user!.id}
      isOpen={isOpen}
      deadline={deadline}
      phase={settingsMap['phase'] ?? 'group_predictions'}
    />
  )
}
