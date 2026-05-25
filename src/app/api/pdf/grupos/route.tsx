import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { GroupsPdfDocument, type MatchRow, type UserGroupPred } from '@/lib/pdf/GroupsPdf'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('No autorizado', { status: 401 })

  const [profileRes, settingsRes] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase.from('app_settings').select('key, value'),
  ])

  const isAdmin = profileRes.data?.is_admin ?? false
  const settingsMap = Object.fromEntries(
    ((settingsRes.data ?? []) as { key: string; value: string }[]).map(s => [s.key, s.value])
  )
  const groupsOpen = settingsMap['group_predictions_open'] === 'true'

  if (!isAdmin && groupsOpen) {
    return new NextResponse('Los pronósticos de grupos aún están abiertos', { status: 403 })
  }

  const [profilesRes, matchesRes, matchPredsRes, qualifyPredsRes, awardPredsRes] = await Promise.all([
    supabase.from('profiles').select('id, name').order('name'),
    supabase.from('matches').select(`
      id, group_name, match_number,
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name),
      home_placeholder, away_placeholder
    `).eq('phase', 'groups').order('id'),
    supabase.from('match_predictions').select('user_id, match_id, home_score, away_score'),
    supabase.from('group_qualify_predictions').select('user_id, team_id'),
    supabase.from('award_predictions').select('user_id, award_type, player_name'),
  ])

  const profiles = (profilesRes.data ?? []) as { id: string; name: string }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawMatches = (matchesRes.data ?? []) as any[]
  const allMatchPreds = (matchPredsRes.data ?? []) as { user_id: string; match_id: number; home_score: number; away_score: number }[]
  const allQualifyPreds = (qualifyPredsRes.data ?? []) as { user_id: string; team_id: string }[]
  const allAwardPreds = (awardPredsRes.data ?? []) as { user_id: string; award_type: string; player_name: string }[]

  const matches: MatchRow[] = rawMatches.map(m => ({
    id: m.id as number,
    group: (m.group_name ?? '') as string,
    num: m.match_number as number,
    home: (m.home_team?.name ?? m.home_placeholder ?? '?') as string,
    away: (m.away_team?.name ?? m.away_placeholder ?? '?') as string,
  }))

  const matchPredsByUser: Record<string, Record<number, { home: number; away: number }>> = {}
  for (const p of allMatchPreds) {
    if (!matchPredsByUser[p.user_id]) matchPredsByUser[p.user_id] = {}
    matchPredsByUser[p.user_id][p.match_id] = { home: p.home_score, away: p.away_score }
  }

  const qualifyByUser: Record<string, string[]> = {}
  for (const p of allQualifyPreds) {
    if (!qualifyByUser[p.user_id]) qualifyByUser[p.user_id] = []
    qualifyByUser[p.user_id].push(p.team_id)
  }

  const awardsByUser: Record<string, Record<string, string>> = {}
  for (const p of allAwardPreds) {
    if (!awardsByUser[p.user_id]) awardsByUser[p.user_id] = {}
    awardsByUser[p.user_id][p.award_type] = p.player_name
  }

  const users: UserGroupPred[] = profiles.map(prof => ({
    id: prof.id,
    name: prof.name,
    matchPreds: matchPredsByUser[prof.id] ?? {},
    qualifyIds: qualifyByUser[prof.id] ?? [],
    awards: awardsByUser[prof.id] ?? {},
  }))

  const now = new Date()
  const generatedAt = now.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const buffer = await renderToBuffer(
    <GroupsPdfDocument users={users} matches={matches} generatedAt={generatedAt} />
  )

  const filename = `porra-mundial-grupos-${now.toISOString().slice(0, 10)}.pdf`
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
