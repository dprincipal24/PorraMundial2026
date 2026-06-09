import { createClient } from '@/lib/supabase/server'
import { GroupPredictionsClient } from './client'

export default async function GroupPredictionsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: settings },
    { data: matches },
    { data: predictions },
    { data: qualifyPreds },
    { data: teams },
    { data: profile },
  ] = await Promise.all([
    supabase.from('app_settings').select('key, value'),
    supabase.from('matches').select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      stadium:stadiums(*)
    `).eq('phase', 'groups').order('match_date', { ascending: true }),
    supabase.from('match_predictions').select('*').eq('user_id', user!.id),
    supabase.from('group_qualify_predictions').select('team_id').eq('user_id', user!.id),
    supabase.from('teams').select('*').order('group'),
    supabase.from('profiles').select('is_admin').eq('id', user!.id).single(),
  ])

  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  const isOpen = settingsMap['group_predictions_open'] === 'true'
  const deadline = settingsMap['group_predictions_deadline'] ?? null
  const isAdmin = profile?.is_admin ?? false

  // Fetch everyone's predictions when closed or admin
  let allUsersPreds: Array<{
    profile: { id: string; name: string; avatar_url: string | null }
    matchPreds: Record<number, { home: number; away: number }>
    qualifyTeamIds: string[]
  }> = []

  if (!isOpen || isAdmin) {
    const [{ data: allProfiles }, { data: allMatchPreds }, { data: allQualifyPreds }] = await Promise.all([
      supabase.from('profiles').select('id, name, avatar_url').order('name'),
      supabase.from('match_predictions').select('user_id, match_id, home_score, away_score').limit(10000),
      supabase.from('group_qualify_predictions').select('user_id, team_id').limit(10000),
    ])

    const matchPredsByUser: Record<string, Record<number, { home: number; away: number }>> = {}
    for (const p of (allMatchPreds ?? [])) {
      if (!matchPredsByUser[p.user_id]) matchPredsByUser[p.user_id] = {}
      matchPredsByUser[p.user_id][p.match_id] = { home: p.home_score, away: p.away_score }
    }

    const qualifyByUser: Record<string, string[]> = {}
    for (const p of (allQualifyPreds ?? [])) {
      if (!qualifyByUser[p.user_id]) qualifyByUser[p.user_id] = []
      qualifyByUser[p.user_id].push(p.team_id)
    }

    allUsersPreds = (allProfiles ?? []).map((prof) => ({
      profile: prof,
      matchPreds: matchPredsByUser[prof.id] ?? {},
      qualifyTeamIds: qualifyByUser[prof.id] ?? [],
    }))
  }

  const { view: viewUserId } = await searchParams
  const initialViewingUser = viewUserId
    ? (allUsersPreds.find(p => p.profile.id === viewUserId) ?? null)
    : null

  return (
    <GroupPredictionsClient
      matches={matches ?? []}
      predictions={predictions ?? []}
      qualifyPredictions={(qualifyPreds ?? []).map((q: { team_id: string }) => q.team_id)}
      teams={teams ?? []}
      userId={user!.id}
      isOpen={isOpen}
      deadline={deadline}
      isAdmin={isAdmin}
      allUsersPreds={allUsersPreds}
      totalGroupMatches={(matches ?? []).length}
      initialViewingUser={initialViewingUser}
    />
  )
}
