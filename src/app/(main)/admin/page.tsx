import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './client'

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

  return (
    <AdminClient
      settings={settingsMap}
      teams={teams ?? []}
      matches={matches ?? []}
      profiles={profiles ?? []}
    />
  )
}
