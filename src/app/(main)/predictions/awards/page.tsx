import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AwardPredictionsClient } from './client'
import { AWARDS } from '@/lib/data/awards'

export const revalidate = 0

export default async function AwardPredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: predictions },
    { data: settings },
    { data: profile },
  ] = await Promise.all([
    supabase.from('award_predictions').select('*').eq('user_id', user.id),
    supabase.from('app_settings').select('key, value')
      .in('key', [...AWARDS.map(a => a.settingKey), 'awards_predictions_open', 'awards_predictions_deadline']),
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
  ])

  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  const predMap = Object.fromEntries((predictions ?? []).map((p: { award_type: string; player_name: string }) => [p.award_type, p.player_name]))
  const isOpen = settingsMap['awards_predictions_open'] !== 'false'
  const deadline = settingsMap['awards_predictions_deadline'] ?? null
  const isAdmin = profile?.is_admin ?? false

  // Fetch all users' award predictions when closed or admin
  let allUsersPreds: Array<{
    profile: { id: string; name: string; avatar_url: string | null }
    picks: Record<string, string>
  }> = []

  if (!isOpen || isAdmin) {
    const [{ data: allProfiles }, { data: allAwardPreds }] = await Promise.all([
      supabase.from('profiles').select('id, name, avatar_url').order('name'),
      supabase.from('award_predictions').select('user_id, award_type, player_name'),
    ])

    const picksByUser: Record<string, Record<string, string>> = {}
    for (const p of (allAwardPreds ?? [])) {
      if (!picksByUser[p.user_id]) picksByUser[p.user_id] = {}
      picksByUser[p.user_id][p.award_type] = p.player_name
    }

    allUsersPreds = (allProfiles ?? []).map((prof) => ({
      profile: prof,
      picks: picksByUser[prof.id] ?? {},
    }))
  }

  return (
    <AwardPredictionsClient
      userId={user.id}
      predMap={predMap}
      winners={settingsMap}
      isOpen={isOpen}
      deadline={deadline}
      isAdmin={isAdmin}
      allUsersPreds={allUsersPreds}
    />
  )
}
