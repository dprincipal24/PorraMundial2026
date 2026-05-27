'use server'

import { createClient } from '@/lib/supabase/server'

export type PredictionEntry = {
  user_name: string
  home_score: number
  away_score: number
}

export async function getMatchAllPredictions(matchId: number): Promise<PredictionEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('match_predictions')
    .select('home_score, away_score, profiles(name)')
    .eq('match_id', matchId)

  if (!data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .map(d => ({
      user_name: d.profiles?.name ?? 'Anónimo',
      home_score: d.home_score,
      away_score: d.away_score,
    }))
    .sort((a, b) => a.user_name.localeCompare(b.user_name))
}
