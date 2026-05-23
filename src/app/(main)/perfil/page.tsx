import { createClient } from '@/lib/supabase/server'
import { PerfilClient } from './client'

const KNOCKOUT_TOTAL = 31  // 16+8+4+2+1
const QUALIFY_TOTAL = 32
const AWARDS_TOTAL = 4

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: settings },
    { count: matchPredCount },
    { count: qualifyPredCount },
    { count: knockoutPredCount },
    { count: awardPredCount },
    { count: groupMatchTotal },
  ] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url').eq('id', user!.id).single(),
    supabase.from('app_settings').select('key, value'),
    supabase.from('match_predictions').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('group_qualify_predictions').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('knockout_predictions').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('award_predictions').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('matches').select('id', { count: 'exact', head: true }).eq('phase', 'groups'),
  ])

  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))

  return (
    <PerfilClient
      userId={user!.id}
      userEmail={user!.email!}
      initialName={profile?.name ?? ''}
      initialAvatar={profile?.avatar_url ?? null}
      phase={settingsMap['phase'] ?? 'registration'}
      groupOpen={settingsMap['group_predictions_open'] === 'true'}
      knockoutOpen={settingsMap['knockout_predictions_open'] === 'true'}
      awardsOpen={settingsMap['awards_predictions_open'] !== 'false'}
      matchPredCount={matchPredCount ?? 0}
      groupMatchTotal={groupMatchTotal ?? 0}
      qualifyPredCount={qualifyPredCount ?? 0}
      qualifyTotal={QUALIFY_TOTAL}
      knockoutPredCount={knockoutPredCount ?? 0}
      knockoutTotal={KNOCKOUT_TOTAL}
      awardPredCount={awardPredCount ?? 0}
      awardTotal={AWARDS_TOTAL}
    />
  )
}
