import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MATCHES } from '@/lib/data/matches'

// Seeds the matches table. Only admins can call this (RLS enforced by Supabase).
export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.from('matches').upsert(
    MATCHES.map((m) => ({
      id: m.id,
      phase: m.phase,
      group_name: m.group_name,
      match_number: m.match_number,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_placeholder: m.home_placeholder,
      away_placeholder: m.away_placeholder,
      match_date: m.match_date,
      stadium_id: m.stadium_id,
      home_score: null,
      away_score: null,
      status: 'scheduled',
    })),
    { onConflict: 'id' },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, count: MATCHES.length })
}
