import { TEAMS } from '@/lib/data/teams'

export type ScoreMap = Record<number, { home: number; away: number }>
export type WinnerMap = Record<number, string>

// FIFA/Coca-Cola Men's World Ranking — 1 abril 2026 (última actualización antes del torneo)
// Fuente: Wikipedia "FIFA World Rankings" — top 20 de abril 2026 confirmados.
// Para equipos fuera del top 20: posiciones del sorteo (nov 2025) sin cambios relevantes.
// Equipos de repesca (TUR, SWE, BIH, CZE, IRQ, COD): estimaciones nov 2025.
// Número más bajo = mejor ranking (rank 1 gana el desempate).
export const FIFA_RANKING: Record<string, number> = {
  // ── Top 20 abril 2026 — CONFIRMADOS (Italia #12 y Dinamarca #20 no están en el Mundial)
  FRA: 1,  ESP: 2,  ARG: 3,  ENG: 4,  POR: 5,  BRA: 6,
  NED: 7,  MAR: 8,  BEL: 9,  GER: 10, CRO: 11,
  COL: 13, SEN: 14, MEX: 15, USA: 16, URU: 17, JPN: 18, SUI: 19,
  // ── Fuera del top 20 — posiciones nov 2025 (no han variado significativamente)
  IRN: 21, KOR: 22, ECU: 23, AUT: 24, AUS: 26, CAN: 27,
  NOR: 29, PAN: 30,
  EGY: 34, ALG: 35, SCO: 36, PAR: 39, TUN: 40, CIV: 42,
  UZB: 50, QAT: 51, KSA: 60, RSA: 61,
  JOR: 66, CPV: 68, GHA: 72, CUW: 82, HAI: 84, NZL: 86,
  // ── Clasificados por repesca — estimaciones nov 2025
  SWE: 25, TUR: 37, CZE: 44, BIH: 57, COD: 59, IRQ: 63,
}

export type TeamStats = {
  teamId: string
  points: number; played: number; won: number; drawn: number; lost: number
  gf: number; ga: number; gd: number
}

export type GroupResult = {
  first: string | null; second: string | null
  third: string | null; thirdStats: TeamStats | null; fourth: string | null
}

function calcH2H(
  teamId: string,
  tiedIds: string[],
  groupMatches: { id: number; home_team_id: string | null; away_team_id: string | null }[],
  scores: ScoreMap,
): { points: number; gd: number; gf: number } {
  let pts = 0, gf = 0, ga = 0
  for (const m of groupMatches) {
    const p = scores[m.id]
    if (!p || !m.home_team_id || !m.away_team_id) continue
    if (!tiedIds.includes(m.home_team_id) || !tiedIds.includes(m.away_team_id)) continue
    if (m.home_team_id === teamId) {
      gf += p.home; ga += p.away
      if (p.home > p.away) pts += 3; else if (p.home === p.away) pts += 1
    } else if (m.away_team_id === teamId) {
      gf += p.away; ga += p.home
      if (p.away > p.home) pts += 3; else if (p.away === p.home) pts += 1
    }
  }
  return { points: pts, gd: gf - ga, gf }
}

export function simulateGroupStandings(
  groupTeamIds: string[],
  groupMatches: { id: number; home_team_id: string | null; away_team_id: string | null }[],
  scores: ScoreMap,
): TeamStats[] {
  const s: Record<string, TeamStats> = {}
  for (const id of groupTeamIds) {
    s[id] = { teamId: id, points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0 }
  }
  for (const m of groupMatches) {
    const p = scores[m.id]
    if (!p || !m.home_team_id || !m.away_team_id) continue
    const hs = s[m.home_team_id], as_ = s[m.away_team_id]
    if (!hs || !as_) continue
    const h = p.home, a = p.away
    hs.played++; as_.played++
    hs.gf += h; hs.ga += a; hs.gd = hs.gf - hs.ga
    as_.gf += a; as_.ga += h; as_.gd = as_.gf - as_.ga
    if (h > a)      { hs.won++;   hs.points += 3; as_.lost++ }
    else if (h < a) { as_.won++;  as_.points += 3; hs.lost++ }
    else            { hs.drawn++; hs.points++;     as_.drawn++; as_.points++ }
  }
  const all = Object.values(s).sort((a, b) => b.points - a.points)
  const result: TeamStats[] = []
  let i = 0
  while (i < all.length) {
    let j = i + 1
    while (j < all.length && all[j].points === all[i].points) j++
    const tied = all.slice(i, j)
    if (tied.length > 1) {
      const ids = tied.map(t => t.teamId)
      tied.sort((a, b) => {
        // Orden oficial FIFA Art. 17 — Reglamento Copa del Mundo 2026:
        // 1. Puntos en partidos H2H entre los empatados
        const ha = calcH2H(a.teamId, ids, groupMatches, scores)
        const hb = calcH2H(b.teamId, ids, groupMatches, scores)
        if (hb.points !== ha.points) return hb.points - ha.points
        // 2. Diferencia de goles H2H
        if (hb.gd !== ha.gd) return hb.gd - ha.gd
        // 3. Goles a favor H2H
        if (hb.gf !== ha.gf) return hb.gf - ha.gf
        // 4. Diferencia de goles en todos los partidos del grupo
        if (b.gd !== a.gd) return b.gd - a.gd
        // 5. Goles a favor en todos los partidos del grupo
        if (b.gf !== a.gf) return b.gf - a.gf
        // 6. (Fair play — no aplicable en simulador)
        // 7. Ranking FIFA (nov 2025, fecha del sorteo) — número más bajo = mejor
        const rankA = FIFA_RANKING[a.teamId] ?? 999
        const rankB = FIFA_RANKING[b.teamId] ?? 999
        return rankA - rankB
      })
    }
    result.push(...tied)
    i = j
  }
  return result
}

export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const

export function computeAllGroupResults(
  allMatches: { id: number; group_name: string | null; home_team_id: string | null; away_team_id: string | null }[],
  scores: ScoreMap,
): Record<string, GroupResult> {
  const results: Record<string, GroupResult> = {}
  for (const g of GROUPS) {
    const groupTeamIds = TEAMS.filter(t => t.group === g).map(t => t.id)
    const groupMatches = allMatches.filter(m => m.group_name === g)
    const standings = simulateGroupStandings(groupTeamIds, groupMatches, scores)
    results[g] = {
      first: standings[0]?.teamId ?? null,
      second: standings[1]?.teamId ?? null,
      third: standings[2]?.teamId ?? null,
      thirdStats: standings[2] ?? null,
      fourth: standings[3]?.teamId ?? null,
    }
  }
  return results
}

export function getBestThirds(groupResults: Record<string, GroupResult>): string[] {
  const thirds: { teamId: string; stats: TeamStats }[] = []
  for (const g of GROUPS) {
    const r = groupResults[g]
    if (r.third && r.thirdStats) thirds.push({ teamId: r.third, stats: r.thirdStats })
  }
  thirds.sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points
    if (b.stats.gd !== a.stats.gd) return b.stats.gd - a.stats.gd
    return b.stats.gf - a.stats.gf
  })
  return thirds.slice(0, 8).map(t => t.teamId)
}

// FIFA Annex C: which groups are allowed to fill each third-place slot
const THIRD_SLOT_ALLOWED: Record<number, string[]> = {
  74: ['A', 'B', 'C', 'D', 'F'],
  77: ['C', 'D', 'F', 'G', 'H'],
  79: ['C', 'E', 'F', 'H', 'I'],
  80: ['E', 'H', 'I', 'J', 'K'],
  81: ['B', 'E', 'F', 'I', 'J'],
  82: ['A', 'E', 'H', 'I', 'J'],
  85: ['E', 'F', 'G', 'I', 'J'],
  87: ['D', 'E', 'I', 'J', 'L'],
}

// Bipartite matching (augmenting paths) — greedy can strand valid thirds when
// an early assignment blocks a later one from finding any eligible slot
function assignThirdsToSlots(
  groupResults: Record<string, GroupResult>,
  bestThirds: string[],
): Record<number, string | null> {
  const thirdGroup: Record<string, string> = {}
  for (const g of GROUPS) {
    const third = groupResults[g]?.third
    if (third && bestThirds.includes(third)) thirdGroup[third] = g
  }
  const slots = Object.keys(THIRD_SLOT_ALLOWED).map(Number)
  const slotOf: Record<number, string> = {}

  function augment(team: string, visited: Set<number>): boolean {
    const g = thirdGroup[team] ?? ''
    for (const slot of slots) {
      if (visited.has(slot) || !THIRD_SLOT_ALLOWED[slot].includes(g)) continue
      visited.add(slot)
      if (slotOf[slot] === undefined || augment(slotOf[slot], visited)) {
        slotOf[slot] = team
        return true
      }
    }
    return false
  }

  for (const team of bestThirds) {
    augment(team, new Set<number>())
  }

  const result: Record<number, string | null> = {}
  for (const slot of slots) {
    result[slot] = slotOf[slot] ?? null
  }
  return result
}

// Maps R32 match IDs to computed team IDs from group simulation (FIFA official bracket)
export function resolveR32Teams(
  groupResults: Record<string, GroupResult>,
  bestThirds: string[],
): Record<number, { home: string | null; away: string | null }> {
  const t = (g: string) => groupResults[g] ?? { first: null, second: null }
  const thirds = assignThirdsToSlots(groupResults, bestThirds)
  return {
    73: { home: t('A').second, away: t('B').second },
    74: { home: t('E').first,  away: thirds[74] ?? null },
    75: { home: t('F').first,  away: t('C').second },
    76: { home: t('C').first,  away: t('F').second },
    77: { home: t('I').first,  away: thirds[77] ?? null },
    78: { home: t('E').second, away: t('I').second },
    79: { home: t('A').first,  away: thirds[79] ?? null },
    80: { home: t('L').first,  away: thirds[80] ?? null },
    81: { home: t('D').first,  away: thirds[81] ?? null },
    82: { home: t('G').first,  away: thirds[82] ?? null },
    83: { home: t('K').second, away: t('L').second },
    84: { home: t('H').first,  away: t('J').second },
    85: { home: t('B').first,  away: thirds[85] ?? null },
    86: { home: t('J').first,  away: t('H').second },
    87: { home: t('K').first,  away: thirds[87] ?? null },
    88: { home: t('D').second, away: t('G').second },
  }
}

// For each knockout match, which two matches feed it (home/away)
export const KNOCKOUT_FEED: Record<number, { homeFrom: number; awayFrom: number }> = {
  89:  { homeFrom: 73, awayFrom: 75 },
  90:  { homeFrom: 74, awayFrom: 77 },
  91:  { homeFrom: 76, awayFrom: 78 },
  92:  { homeFrom: 79, awayFrom: 80 },
  93:  { homeFrom: 83, awayFrom: 84 },
  94:  { homeFrom: 81, awayFrom: 82 },
  95:  { homeFrom: 86, awayFrom: 88 },
  96:  { homeFrom: 85, awayFrom: 87 },
  97:  { homeFrom: 89, awayFrom: 90 },
  98:  { homeFrom: 91, awayFrom: 92 },
  99:  { homeFrom: 93, awayFrom: 94 },
  100: { homeFrom: 95, awayFrom: 96 },
  101: { homeFrom: 97, awayFrom: 98 },
  102: { homeFrom: 99, awayFrom: 100 },
  103: { homeFrom: 101, awayFrom: 102 }, // third place (losers)
  104: { homeFrom: 101, awayFrom: 102 }, // final (winners)
}

export function getKnockoutTeam(
  matchId: number,
  side: 'home' | 'away',
  r32Teams: Record<number, { home: string | null; away: string | null }>,
  winners: WinnerMap,
  losers?: WinnerMap,
): string | null {
  if (matchId >= 73 && matchId <= 88) return r32Teams[matchId]?.[side] ?? null
  const feed = KNOCKOUT_FEED[matchId]
  if (!feed) return null
  const feedMatchId = side === 'home' ? feed.homeFrom : feed.awayFrom
  // For third place match, use losers
  if (matchId === 103) return losers?.[feedMatchId] ?? null
  return winners[feedMatchId] ?? null
}
