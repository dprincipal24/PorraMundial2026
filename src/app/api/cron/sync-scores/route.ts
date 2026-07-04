import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  computeAllGroupResults, getBestThirds, resolveR32Teams, getKnockoutTeam,
  type WinnerMap,
} from '@/app/(main)/simulador/simulatorLogic'

export const dynamic = 'force-dynamic'

// Endpoint no oficial de ESPN (el mismo que usa el proyecto open-source
// "claudinho" para este Mundial). Sin clave, sin límite publicado — se trata
// con cuidado: solo se llama cuando hay partidos propios en juego (ver abajo)
// y nunca se sobrescribe un partido que ya tenemos como 'finished'.
const ESPN_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

interface EspnCompetitor {
  homeAway?: 'home' | 'away'
  score?: string
  team?: { abbreviation?: string }
}
interface EspnEvent {
  status?: { type?: { state?: string } }
  competitions?: {
    status?: { type?: { state?: string } }
    competitors?: EspnCompetitor[]
  }[]
}

interface EspnMatchInfo {
  status: 'live' | 'finished' | 'scheduled'
  scoreByCode: Record<string, number>
}

function toEspnDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date()
  const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString()

  const { data: candidateMatches } = await supabase
    .from('matches')
    .select('id, phase, group_name, home_team_id, away_team_id, home_score, away_score, status, match_date')
    .neq('status', 'finished')
    .gte('match_date', windowStart)
    .lte('match_date', windowEnd)

  if (!candidateMatches || candidateMatches.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, updated: 0, note: 'sin partidos en la ventana actual, no se llamó a ESPN' })
  }

  // Resolver equipos de cada partido: directo en fase de grupos, vía la misma
  // lógica de bracket que usa "Inicio" para eliminatorias.
  const getTeamsFor = await (async () => {
    const needsBracket = candidateMatches.some(m => m.phase !== 'groups')
    if (!needsBracket) {
      return (m: typeof candidateMatches[number]) => ({ home: m.home_team_id, away: m.away_team_id })
    }

    const [{ data: allMatches }, { data: settingsRows }] = await Promise.all([
      supabase.from('matches').select('id, group_name, home_team_id, away_team_id, home_score, away_score, phase'),
      supabase.from('app_settings').select('value').eq('key', 'knockout_bracket'),
    ])

    const matchesForGroups = (allMatches ?? []).map(m => ({
      id: m.id, group_name: m.group_name, home_team_id: m.home_team_id, away_team_id: m.away_team_id,
    }))
    const scoresMap: Record<number, { home: number; away: number }> = {}
    for (const m of allMatches ?? []) {
      if (m.phase === 'groups' && m.home_score !== null && m.away_score !== null) {
        scoresMap[m.id] = { home: m.home_score, away: m.away_score }
      }
    }

    const groupResults = computeAllGroupResults(matchesForGroups, scoresMap)
    const bestThirds = getBestThirds(groupResults)
    const r32Teams = resolveR32Teams(groupResults, bestThirds)

    let bracket: WinnerMap = {}
    try { bracket = JSON.parse(settingsRows?.[0]?.value ?? '{}') } catch { /* deja bracket vacío */ }

    const losers: WinnerMap = {}
    for (const sfId of [101, 102]) {
      const winnerId = bracket[sfId]
      if (winnerId) {
        const homeId = getKnockoutTeam(sfId, 'home', r32Teams, bracket)
        const awayId = getKnockoutTeam(sfId, 'away', r32Teams, bracket)
        const loser = homeId === winnerId ? awayId : homeId
        if (loser) losers[sfId] = loser
      }
    }

    return (m: typeof candidateMatches[number]) => {
      if (m.phase === 'groups') return { home: m.home_team_id, away: m.away_team_id }
      return {
        home: getKnockoutTeam(m.id, 'home', r32Teams, bracket, losers),
        away: getKnockoutTeam(m.id, 'away', r32Teams, bracket, losers),
      }
    }
  })()

  // Ventana ±1 día UTC para no perder un partido que ESPN archiva en el día
  // adyacente por el cambio horario.
  const yesterday = toEspnDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))
  const tomorrow = toEspnDate(new Date(now.getTime() + 24 * 60 * 60 * 1000))
  const url = `${ESPN_SCOREBOARD}?dates=${yesterday}-${tomorrow}&limit=300`

  let events: EspnEvent[] = []
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`ESPN respondió ${res.status}`)
    const json = await res.json()
    events = json.events ?? []
  } catch (err) {
    return NextResponse.json({ ok: false, error: `Fallo consultando ESPN: ${String(err)}` }, { status: 502 })
  }

  // Emparejar por código de equipo (no por id — ESPN numera distinto), sin
  // depender de qué lado sea local en cada sistema.
  const eventByPair = new Map<string, EspnMatchInfo>()
  for (const ev of events) {
    const comp = ev.competitions?.[0]
    const competitors = comp?.competitors ?? []
    const home = competitors.find(c => c.homeAway === 'home')
    const away = competitors.find(c => c.homeAway === 'away')
    const homeCode = home?.team?.abbreviation?.toUpperCase()
    const awayCode = away?.team?.abbreviation?.toUpperCase()
    if (!homeCode || !awayCode) continue

    const state = comp?.status?.type?.state ?? ev.status?.type?.state
    const status: EspnMatchInfo['status'] = state === 'post' ? 'finished' : state === 'in' ? 'live' : 'scheduled'
    if (status === 'scheduled') continue

    const homeScore = home?.score !== undefined ? parseInt(home.score, 10) : NaN
    const awayScore = away?.score !== undefined ? parseInt(away.score, 10) : NaN
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue

    const key = [homeCode, awayCode].sort().join('-')
    eventByPair.set(key, { status, scoreByCode: { [homeCode]: homeScore, [awayCode]: awayScore } })
  }

  let updated = 0
  const errors: string[] = []

  for (const m of candidateMatches) {
    const { home, away } = getTeamsFor(m)
    if (!home || !away) continue

    const key = [home.toUpperCase(), away.toUpperCase()].sort().join('-')
    const ev = eventByPair.get(key)
    if (!ev) continue

    const homeScore = ev.scoreByCode[home.toUpperCase()]
    const awayScore = ev.scoreByCode[away.toUpperCase()]
    if (homeScore === undefined || awayScore === undefined) continue

    const noChange = m.status === ev.status && m.home_score === homeScore && m.away_score === awayScore
    if (noChange) continue

    const { error } = await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore, status: ev.status })
      .eq('id', m.id)

    if (error) errors.push(`match ${m.id}: ${error.message}`)
    else updated++
  }

  return NextResponse.json({ ok: errors.length === 0, checked: candidateMatches.length, updated, errors })
}
