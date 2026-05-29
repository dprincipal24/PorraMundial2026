import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DOWNSTREAM: Record<number, { homeFrom: number; awayFrom: number }> = {
  89: { homeFrom: 74, awayFrom: 77 }, 90: { homeFrom: 73, awayFrom: 75 },
  91: { homeFrom: 76, awayFrom: 78 }, 92: { homeFrom: 79, awayFrom: 80 },
  93: { homeFrom: 83, awayFrom: 84 }, 94: { homeFrom: 81, awayFrom: 82 },
  95: { homeFrom: 86, awayFrom: 88 }, 96: { homeFrom: 85, awayFrom: 87 },
  97: { homeFrom: 89, awayFrom: 90 }, 98: { homeFrom: 93, awayFrom: 94 },
  99: { homeFrom: 91, awayFrom: 92 }, 100: { homeFrom: 95, awayFrom: 96 },
  101: { homeFrom: 97, awayFrom: 98 }, 102: { homeFrom: 99, awayFrom: 100 },
  103: { homeFrom: 101, awayFrom: 102 }, 104: { homeFrom: 101, awayFrom: 102 },
}

const R32 = new Set([73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88])
const R16 = new Set([89,90,91,92,93,94,95,96])
const QF  = new Set([97,98,99,100])
const SF  = new Set([101,102])

function cascadeClear(matchId: number, bracket: Record<number, string>): Record<number, string> {
  const result = { ...bracket }
  function recurse(mid: number) {
    for (const [mStr, feed] of Object.entries(DOWNSTREAM)) {
      const downstream = parseInt(mStr)
      if (feed.homeFrom === mid || feed.awayFrom === mid) {
        if (result[downstream] !== undefined) {
          delete result[downstream]
          recurse(downstream)
        }
      }
    }
  }
  recurse(matchId)
  return result
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { matchId, winnerId } = await request.json() as { matchId: number; winnerId: string | null }

  if (!matchId || matchId < 73 || matchId > 104) {
    return NextResponse.json({ error: 'matchId inválido' }, { status: 400 })
  }

  // Read current bracket
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'knockout_bracket')
    .single()

  let bracket: Record<number, string> = {}
  if (setting?.value) {
    try { bracket = JSON.parse(setting.value) } catch {}
  }

  // Update bracket with downstream cascade
  if (winnerId) {
    bracket = cascadeClear(matchId, bracket)
    bracket[matchId] = winnerId
  } else {
    delete bracket[matchId]
    bracket = cascadeClear(matchId, bracket)
  }

  // Persist bracket
  await supabase
    .from('app_settings')
    .upsert(
      { key: 'knockout_bracket', value: JSON.stringify(bracket), updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )

  // Full recompute of team progress flags from current bracket state
  const r16Teams   = new Set<string>()
  const qfTeams    = new Set<string>()
  const sfTeams    = new Set<string>()
  const finalTeams = new Set<string>()
  let champion: string | null = null

  for (const [midStr, teamId] of Object.entries(bracket)) {
    const mid = parseInt(midStr)
    if (R32.has(mid))       r16Teams.add(teamId)
    else if (R16.has(mid))  qfTeams.add(teamId)
    else if (QF.has(mid))   sfTeams.add(teamId)
    else if (SF.has(mid))   finalTeams.add(teamId)
    else if (mid === 104)   champion = teamId
  }

  const { data: allTeams } = await supabase.from('teams').select('id')

  if (allTeams && allTeams.length > 0) {
    const allIds = allTeams.map((t: { id: string }) => t.id)

    // Reset all knockout flags, then set true for teams that advanced each round.
    // update() is used instead of upsert() to avoid NOT NULL violations on other columns.
    const { error: resetErr } = await supabase
      .from('teams')
      .update({ reached_r16: false, reached_qf: false, reached_sf: false, reached_final: false, is_champion: false })
      .in('id', allIds)

    if (resetErr) return NextResponse.json({ error: resetErr.message }, { status: 500 })

    if (r16Teams.size > 0)
      await supabase.from('teams').update({ reached_r16: true }).in('id', [...r16Teams])
    if (qfTeams.size > 0)
      await supabase.from('teams').update({ reached_qf: true }).in('id', [...qfTeams])
    if (sfTeams.size > 0)
      await supabase.from('teams').update({ reached_sf: true }).in('id', [...sfTeams])
    if (finalTeams.size > 0)
      await supabase.from('teams').update({ reached_final: true }).in('id', [...finalTeams])
    if (champion)
      await supabase.from('teams').update({ is_champion: true }).eq('id', champion)
  }

  return NextResponse.json({ ok: true, bracket })
}
