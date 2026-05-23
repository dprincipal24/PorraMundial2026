import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from './client'

export const revalidate = 0

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch scores via the DB function
  const { data: scores } = await supabase.rpc('calculate_scores')

  // Add position
  const ranked = (scores ?? []).map((s: Record<string, unknown>, i: number) => ({ ...s, position: i + 1 }))

  // Fetch settings for current phase info
  const { data: settings } = await supabase.from('app_settings').select('key, value')
  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))

  return (
    <LeaderboardClient
      scores={ranked}
      currentUserId={user?.id}
      phase={settingsMap['phase'] ?? 'group_predictions'}
    />
  )
}
