import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AwardPredictionsClient } from './client'
import { AWARDS } from '@/lib/data/awards'

export const revalidate = 0

export default async function AwardPredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: predictions }, { data: settings }] = await Promise.all([
    supabase.from('award_predictions').select('*').eq('user_id', user.id),
    supabase.from('app_settings').select('key, value')
      .in('key', [...AWARDS.map(a => a.settingKey), 'awards_predictions_open', 'awards_predictions_deadline']),
  ])

  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  const predMap = Object.fromEntries((predictions ?? []).map((p: { award_type: string; player_name: string }) => [p.award_type, p.player_name]))
  const isOpen = settingsMap['awards_predictions_open'] !== 'false'
  const deadline = settingsMap['awards_predictions_deadline'] ?? null

  return (
    <AwardPredictionsClient
      userId={user.id}
      predMap={predMap}
      winners={settingsMap}
      isOpen={isOpen}
      deadline={deadline}
    />
  )
}
