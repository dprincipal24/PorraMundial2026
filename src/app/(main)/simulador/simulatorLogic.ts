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
    if (b.stats.gf !== a.stats.gf) return b.stats.gf - a.stats.gf
    return (FIFA_RANKING[a.teamId] ?? 999) - (FIFA_RANKING[b.teamId] ?? 999)
  })
  return thirds.slice(0, 8).map(t => t.teamId)
}

// Annex C (FIFA Reglamento FWC2026, pp.81-98): exact slot assignment for all 495
// combinations of 8 qualifying groups. Key = 8 group letters sorted, e.g. "ABCDEFGH".
// Value = { slotMatchId: groupLetter } — the group whose 3rd-place team fills that slot.
const ANNEX_C: Record<string, Record<number, string>> = {
  "ABCDEFGH": {74:"C",77:"F",79:"H",80:"E",81:"B",82:"A",85:"G",87:"D"},
  "ABCDEFGI": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"A",85:"G",87:"E"},
  "ABCDEFGJ": {74:"D",77:"F",79:"C",80:"J",81:"B",82:"A",85:"G",87:"E"},
  "ABCDEFGK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"G",87:"E"},
  "ABCDEFGL": {74:"D",77:"F",79:"C",80:"E",81:"B",82:"A",85:"G",87:"L"},
  "ABCDEFHI": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"A",85:"E",87:"D"},
  "ABCDEFHJ": {74:"C",77:"F",79:"H",80:"E",81:"B",82:"A",85:"J",87:"D"},
  "ABCDEFHK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"E",87:"D"},
  "ABCDEFHL": {74:"C",77:"D",79:"H",80:"E",81:"B",82:"A",85:"F",87:"L"},
  "ABCDEFIJ": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"A",85:"J",87:"E"},
  "ABCDEFIK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"E",87:"I"},
  "ABCDEFIL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"A",85:"E",87:"L"},
  "ABCDEFJK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"J",87:"E"},
  "ABCDEFJL": {74:"D",77:"F",79:"C",80:"E",81:"B",82:"A",85:"J",87:"L"},
  "ABCDEFKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"E",87:"L"},
  "ABCDEGHI": {74:"C",77:"D",79:"H",80:"I",81:"B",82:"A",85:"G",87:"E"},
  "ABCDEGHJ": {74:"C",77:"D",79:"H",80:"J",81:"B",82:"A",85:"G",87:"E"},
  "ABCDEGHK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"G",87:"E"},
  "ABCDEGHL": {74:"C",77:"D",79:"H",80:"E",81:"B",82:"A",85:"G",87:"L"},
  "ABCDEGIJ": {74:"C",77:"D",79:"E",80:"J",81:"B",82:"A",85:"G",87:"I"},
  "ABCDEGIK": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABCDEGIL": {74:"C",77:"D",79:"E",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABCDEGJK": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"A",85:"G",87:"J"},
  "ABCDEGJL": {74:"C",77:"D",79:"E",80:"J",81:"B",82:"A",85:"G",87:"L"},
  "ABCDEGKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCDEHIJ": {74:"C",77:"D",79:"H",80:"I",81:"B",82:"A",85:"J",87:"E"},
  "ABCDEHIK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"E",87:"I"},
  "ABCDEHIL": {74:"C",77:"D",79:"H",80:"I",81:"B",82:"A",85:"E",87:"L"},
  "ABCDEHJK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"J",87:"E"},
  "ABCDEHJL": {74:"C",77:"D",79:"H",80:"E",81:"B",82:"A",85:"J",87:"L"},
  "ABCDEHKL": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"E",87:"L"},
  "ABCDEIJK": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCDEIJL": {74:"C",77:"D",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCDEIKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABCDEJKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCDFGHI": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"A",85:"G",87:"D"},
  "ABCDFGHJ": {74:"C",77:"F",79:"H",80:"J",81:"B",82:"A",85:"G",87:"D"},
  "ABCDFGHK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"D"},
  "ABCDFGHL": {74:"D",77:"F",79:"C",80:"H",81:"B",82:"A",85:"G",87:"L"},
  "ABCDFGIJ": {74:"D",77:"F",79:"C",80:"J",81:"B",82:"A",85:"G",87:"I"},
  "ABCDFGIK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABCDFGIL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABCDFGJK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"G",87:"J"},
  "ABCDFGJL": {74:"D",77:"F",79:"C",80:"J",81:"B",82:"A",85:"G",87:"L"},
  "ABCDFGKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCDFHIJ": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"A",85:"J",87:"D"},
  "ABCDFHIK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"F",87:"I"},
  "ABCDFHIL": {74:"C",77:"D",79:"H",80:"I",81:"B",82:"A",85:"F",87:"L"},
  "ABCDFHJK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"J",87:"D"},
  "ABCDFHJL": {74:"D",77:"F",79:"C",80:"H",81:"B",82:"A",85:"J",87:"L"},
  "ABCDFHKL": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"F",87:"L"},
  "ABCDFIJK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCDFIJL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCDFIKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABCDFJKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCDGHIJ": {74:"C",77:"D",79:"H",80:"J",81:"B",82:"A",85:"G",87:"I"},
  "ABCDGHIK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABCDGHIL": {74:"C",77:"D",79:"H",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABCDGHJK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"G",87:"J"},
  "ABCDGHJL": {74:"C",77:"D",79:"H",80:"J",81:"B",82:"A",85:"G",87:"L"},
  "ABCDGHKL": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCDGIJK": {74:"D",77:"G",79:"C",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCDGIJL": {74:"D",77:"G",79:"C",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCDGIKL": {74:"C",77:"D",79:"I",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCDGJKL": {74:"D",77:"G",79:"C",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCDHIJK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCDHIJL": {74:"C",77:"D",79:"H",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCDHIKL": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABCDHJKL": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCDIJKL": {74:"C",77:"D",79:"I",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCEFGHI": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"A",85:"G",87:"E"},
  "ABCEFGHJ": {74:"C",77:"F",79:"H",80:"J",81:"B",82:"A",85:"G",87:"E"},
  "ABCEFGHK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"E"},
  "ABCEFGHL": {74:"C",77:"F",79:"H",80:"E",81:"B",82:"A",85:"G",87:"L"},
  "ABCEFGIJ": {74:"C",77:"F",79:"E",80:"J",81:"B",82:"A",85:"G",87:"I"},
  "ABCEFGIK": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABCEFGIL": {74:"C",77:"F",79:"E",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABCEFGJK": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"A",85:"G",87:"J"},
  "ABCEFGJL": {74:"C",77:"F",79:"E",80:"J",81:"B",82:"A",85:"G",87:"L"},
  "ABCEFGKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCEFHIJ": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"A",85:"J",87:"E"},
  "ABCEFHIK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"E",87:"I"},
  "ABCEFHIL": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"A",85:"E",87:"L"},
  "ABCEFHJK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"J",87:"E"},
  "ABCEFHJL": {74:"C",77:"F",79:"H",80:"E",81:"B",82:"A",85:"J",87:"L"},
  "ABCEFHKL": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"E",87:"L"},
  "ABCEFIJK": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCEFIJL": {74:"C",77:"F",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCEFIKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABCEFJKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCEGHIJ": {74:"C",77:"G",79:"H",80:"I",81:"B",82:"A",85:"J",87:"E"},
  "ABCEGHIK": {74:"C",77:"H",79:"E",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABCEGHIL": {74:"C",77:"H",79:"E",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABCEGHJK": {74:"C",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"E"},
  "ABCEGHJL": {74:"C",77:"G",79:"H",80:"E",81:"B",82:"A",85:"J",87:"L"},
  "ABCEGHKL": {74:"C",77:"H",79:"E",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCEGIJK": {74:"C",77:"G",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCEGIJL": {74:"C",77:"G",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCEGIKL": {74:"A",77:"C",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "ABCEGJKL": {74:"C",77:"G",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCEHIJK": {74:"C",77:"H",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCEHIJL": {74:"C",77:"H",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCEHIKL": {74:"C",77:"H",79:"E",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABCEHJKL": {74:"C",77:"H",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCEIJKL": {74:"A",77:"C",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "ABCFGHIJ": {74:"C",77:"F",79:"H",80:"J",81:"B",82:"A",85:"G",87:"I"},
  "ABCFGHIK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABCFGHIL": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABCFGHJK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"J"},
  "ABCFGHJL": {74:"C",77:"F",79:"H",80:"J",81:"B",82:"A",85:"G",87:"L"},
  "ABCFGHKL": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCFGIJK": {74:"F",77:"G",79:"C",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCFGIJL": {74:"F",77:"G",79:"C",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCFGIKL": {74:"C",77:"F",79:"I",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCFGJKL": {74:"F",77:"G",79:"C",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCFHIJK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCFHIJL": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCFHIKL": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABCFHJKL": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCFIJKL": {74:"C",77:"F",79:"I",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCGHIJK": {74:"C",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABCGHIJL": {74:"C",77:"G",79:"H",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABCGHIKL": {74:"C",77:"H",79:"I",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABCGHJKL": {74:"C",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCGIJKL": {74:"C",77:"G",79:"I",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABCHIJKL": {74:"C",77:"H",79:"I",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDEFGHI": {74:"D",77:"F",79:"H",80:"I",81:"B",82:"A",85:"G",87:"E"},
  "ABDEFGHJ": {74:"D",77:"F",79:"H",80:"J",81:"B",82:"A",85:"G",87:"E"},
  "ABDEFGHK": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"E"},
  "ABDEFGHL": {74:"D",77:"F",79:"H",80:"E",81:"B",82:"A",85:"G",87:"L"},
  "ABDEFGIJ": {74:"D",77:"F",79:"E",80:"J",81:"B",82:"A",85:"G",87:"I"},
  "ABDEFGIK": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABDEFGIL": {74:"D",77:"F",79:"E",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABDEFGJK": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"A",85:"G",87:"J"},
  "ABDEFGJL": {74:"D",77:"F",79:"E",80:"J",81:"B",82:"A",85:"G",87:"L"},
  "ABDEFGKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABDEFHIJ": {74:"D",77:"F",79:"H",80:"I",81:"B",82:"A",85:"J",87:"E"},
  "ABDEFHIK": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"E",87:"I"},
  "ABDEFHIL": {74:"D",77:"F",79:"H",80:"I",81:"B",82:"A",85:"E",87:"L"},
  "ABDEFHJK": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"J",87:"E"},
  "ABDEFHJL": {74:"D",77:"F",79:"H",80:"E",81:"B",82:"A",85:"J",87:"L"},
  "ABDEFHKL": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"E",87:"L"},
  "ABDEFIJK": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABDEFIJL": {74:"D",77:"F",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABDEFIKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABDEFJKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDEGHIJ": {74:"D",77:"G",79:"H",80:"I",81:"B",82:"A",85:"J",87:"E"},
  "ABDEGHIK": {74:"D",77:"H",79:"E",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABDEGHIL": {74:"D",77:"H",79:"E",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABDEGHJK": {74:"D",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"E"},
  "ABDEGHJL": {74:"D",77:"G",79:"H",80:"E",81:"B",82:"A",85:"J",87:"L"},
  "ABDEGHKL": {74:"D",77:"H",79:"E",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABDEGIJK": {74:"D",77:"G",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABDEGIJL": {74:"D",77:"G",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABDEGIKL": {74:"A",77:"D",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "ABDEGJKL": {74:"D",77:"G",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDEHIJK": {74:"D",77:"H",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABDEHIJL": {74:"D",77:"H",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABDEHIKL": {74:"D",77:"H",79:"E",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABDEHJKL": {74:"D",77:"H",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDEIJKL": {74:"A",77:"D",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "ABDFGHIJ": {74:"D",77:"F",79:"H",80:"J",81:"B",82:"A",85:"G",87:"I"},
  "ABDFGHIK": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABDFGHIL": {74:"D",77:"F",79:"H",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABDFGHJK": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"J"},
  "ABDFGHJL": {74:"D",77:"F",79:"H",80:"J",81:"B",82:"A",85:"G",87:"L"},
  "ABDFGHKL": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABDFGIJK": {74:"D",77:"G",79:"F",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABDFGIJL": {74:"D",77:"G",79:"F",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABDFGIKL": {74:"D",77:"F",79:"I",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABDFGJKL": {74:"D",77:"G",79:"F",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDFHIJK": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABDFHIJL": {74:"D",77:"F",79:"H",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABDFHIKL": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABDFHJKL": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDFIJKL": {74:"D",77:"F",79:"I",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDGHIJK": {74:"D",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABDGHIJL": {74:"D",77:"G",79:"H",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABDGHIKL": {74:"D",77:"H",79:"I",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABDGHJKL": {74:"D",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDGIJKL": {74:"D",77:"G",79:"I",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABDHIJKL": {74:"D",77:"H",79:"I",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABEFGHIJ": {74:"F",77:"G",79:"H",80:"I",81:"B",82:"A",85:"J",87:"E"},
  "ABEFGHIK": {74:"F",77:"H",79:"E",80:"K",81:"B",82:"A",85:"G",87:"I"},
  "ABEFGHIL": {74:"F",77:"H",79:"E",80:"I",81:"B",82:"A",85:"G",87:"L"},
  "ABEFGHJK": {74:"F",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"E"},
  "ABEFGHJL": {74:"F",77:"G",79:"H",80:"E",81:"B",82:"A",85:"J",87:"L"},
  "ABEFGHKL": {74:"F",77:"H",79:"E",80:"K",81:"B",82:"A",85:"G",87:"L"},
  "ABEFGIJK": {74:"F",77:"G",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABEFGIJL": {74:"F",77:"G",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABEFGIKL": {74:"A",77:"F",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "ABEFGJKL": {74:"F",77:"G",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABEFHIJK": {74:"F",77:"H",79:"E",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABEFHIJL": {74:"F",77:"H",79:"E",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABEFHIKL": {74:"F",77:"H",79:"E",80:"K",81:"B",82:"A",85:"I",87:"L"},
  "ABEFHJKL": {74:"F",77:"H",79:"E",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABEFIJKL": {74:"A",77:"F",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "ABEGHIJK": {74:"A",77:"G",79:"E",80:"K",81:"B",82:"H",85:"J",87:"I"},
  "ABEGHIJL": {74:"A",77:"G",79:"E",80:"I",81:"B",82:"H",85:"J",87:"L"},
  "ABEGHIKL": {74:"A",77:"H",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "ABEGHJKL": {74:"A",77:"G",79:"E",80:"K",81:"B",82:"H",85:"J",87:"L"},
  "ABEGIJKL": {74:"A",77:"G",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "ABEHIJKL": {74:"A",77:"H",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "ABFGHIJK": {74:"F",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"I"},
  "ABFGHIJL": {74:"F",77:"G",79:"H",80:"I",81:"B",82:"A",85:"J",87:"L"},
  "ABFGHIKL": {74:"A",77:"F",79:"H",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "ABFGHJKL": {74:"F",77:"G",79:"H",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABFGIJKL": {74:"F",77:"G",79:"I",80:"K",81:"B",82:"A",85:"J",87:"L"},
  "ABFHIJKL": {74:"A",77:"F",79:"H",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "ABGHIJKL": {74:"A",77:"G",79:"H",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "ACDEFGHI": {74:"C",77:"F",79:"H",80:"I",81:"E",82:"A",85:"G",87:"D"},
  "ACDEFGHJ": {74:"C",77:"F",79:"H",80:"E",81:"J",82:"A",85:"G",87:"D"},
  "ACDEFGHK": {74:"C",77:"F",79:"H",80:"K",81:"E",82:"A",85:"G",87:"D"},
  "ACDEFGHL": {74:"C",77:"D",79:"H",80:"E",81:"F",82:"A",85:"G",87:"L"},
  "ACDEFGIJ": {74:"D",77:"F",79:"C",80:"I",81:"J",82:"A",85:"G",87:"E"},
  "ACDEFGIK": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"A",85:"G",87:"I"},
  "ACDEFGIL": {74:"D",77:"F",79:"C",80:"I",81:"E",82:"A",85:"G",87:"L"},
  "ACDEFGJK": {74:"D",77:"F",79:"C",80:"K",81:"J",82:"A",85:"G",87:"E"},
  "ACDEFGJL": {74:"D",77:"F",79:"C",80:"E",81:"J",82:"A",85:"G",87:"L"},
  "ACDEFGKL": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"A",85:"G",87:"L"},
  "ACDEFHIJ": {74:"C",77:"F",79:"H",80:"I",81:"E",82:"A",85:"J",87:"D"},
  "ACDEFHIK": {74:"C",77:"D",79:"H",80:"K",81:"F",82:"A",85:"E",87:"I"},
  "ACDEFHIL": {74:"C",77:"D",79:"H",80:"I",81:"F",82:"A",85:"E",87:"L"},
  "ACDEFHJK": {74:"C",77:"F",79:"H",80:"K",81:"E",82:"A",85:"J",87:"D"},
  "ACDEFHJL": {74:"C",77:"D",79:"H",80:"E",81:"F",82:"A",85:"J",87:"L"},
  "ACDEFHKL": {74:"C",77:"D",79:"H",80:"K",81:"F",82:"A",85:"E",87:"L"},
  "ACDEFIJK": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"A",85:"J",87:"I"},
  "ACDEFIJL": {74:"D",77:"F",79:"C",80:"I",81:"E",82:"A",85:"J",87:"L"},
  "ACDEFIKL": {74:"D",77:"F",79:"C",80:"K",81:"I",82:"A",85:"E",87:"L"},
  "ACDEFJKL": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"A",85:"J",87:"L"},
  "ACDEGHIJ": {74:"C",77:"D",79:"H",80:"I",81:"J",82:"A",85:"G",87:"E"},
  "ACDEGHIK": {74:"C",77:"D",79:"H",80:"K",81:"E",82:"A",85:"G",87:"I"},
  "ACDEGHIL": {74:"C",77:"D",79:"H",80:"I",81:"E",82:"A",85:"G",87:"L"},
  "ACDEGHJK": {74:"C",77:"D",79:"H",80:"K",81:"J",82:"A",85:"G",87:"E"},
  "ACDEGHJL": {74:"C",77:"D",79:"H",80:"E",81:"J",82:"A",85:"G",87:"L"},
  "ACDEGHKL": {74:"C",77:"D",79:"H",80:"K",81:"E",82:"A",85:"G",87:"L"},
  "ACDEGIJK": {74:"C",77:"D",79:"E",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ACDEGIJL": {74:"C",77:"D",79:"E",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ACDEGIKL": {74:"C",77:"D",79:"E",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ACDEGJKL": {74:"C",77:"D",79:"E",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ACDEHIJK": {74:"C",77:"D",79:"H",80:"K",81:"E",82:"A",85:"J",87:"I"},
  "ACDEHIJL": {74:"C",77:"D",79:"H",80:"I",81:"E",82:"A",85:"J",87:"L"},
  "ACDEHIKL": {74:"C",77:"D",79:"H",80:"K",81:"I",82:"A",85:"E",87:"L"},
  "ACDEHJKL": {74:"C",77:"D",79:"H",80:"K",81:"E",82:"A",85:"J",87:"L"},
  "ACDEIJKL": {74:"C",77:"D",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ACDFGHIJ": {74:"C",77:"F",79:"H",80:"I",81:"J",82:"A",85:"G",87:"D"},
  "ACDFGHIK": {74:"C",77:"D",79:"H",80:"K",81:"F",82:"A",85:"G",87:"I"},
  "ACDFGHIL": {74:"C",77:"D",79:"H",80:"I",81:"F",82:"A",85:"G",87:"L"},
  "ACDFGHJK": {74:"C",77:"F",79:"H",80:"K",81:"J",82:"A",85:"G",87:"D"},
  "ACDFGHJL": {74:"D",77:"F",79:"C",80:"H",81:"J",82:"A",85:"G",87:"L"},
  "ACDFGHKL": {74:"C",77:"D",79:"H",80:"K",81:"F",82:"A",85:"G",87:"L"},
  "ACDFGIJK": {74:"D",77:"F",79:"C",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ACDFGIJL": {74:"D",77:"F",79:"C",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ACDFGIKL": {74:"D",77:"F",79:"C",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ACDFGJKL": {74:"D",77:"F",79:"C",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ACDFHIJK": {74:"C",77:"D",79:"H",80:"K",81:"F",82:"A",85:"J",87:"I"},
  "ACDFHIJL": {74:"C",77:"D",79:"H",80:"I",81:"F",82:"A",85:"J",87:"L"},
  "ACDFHIKL": {74:"C",77:"D",79:"H",80:"K",81:"I",82:"A",85:"F",87:"L"},
  "ACDFHJKL": {74:"C",77:"D",79:"H",80:"K",81:"F",82:"A",85:"J",87:"L"},
  "ACDFIJKL": {74:"D",77:"F",79:"C",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ACDGHIJK": {74:"C",77:"D",79:"H",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ACDGHIJL": {74:"C",77:"D",79:"H",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ACDGHIKL": {74:"C",77:"D",79:"H",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ACDGHJKL": {74:"C",77:"D",79:"H",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ACDGIJKL": {74:"C",77:"D",79:"I",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ACDHIJKL": {74:"C",77:"D",79:"H",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ACEFGHIJ": {74:"C",77:"F",79:"H",80:"I",81:"J",82:"A",85:"G",87:"E"},
  "ACEFGHIK": {74:"C",77:"F",79:"H",80:"K",81:"E",82:"A",85:"G",87:"I"},
  "ACEFGHIL": {74:"C",77:"F",79:"H",80:"I",81:"E",82:"A",85:"G",87:"L"},
  "ACEFGHJK": {74:"C",77:"F",79:"H",80:"K",81:"J",82:"A",85:"G",87:"E"},
  "ACEFGHJL": {74:"C",77:"F",79:"H",80:"E",81:"J",82:"A",85:"G",87:"L"},
  "ACEFGHKL": {74:"C",77:"F",79:"H",80:"K",81:"E",82:"A",85:"G",87:"L"},
  "ACEFGIJK": {74:"C",77:"F",79:"E",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ACEFGIJL": {74:"C",77:"F",79:"E",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ACEFGIKL": {74:"C",77:"F",79:"E",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ACEFGJKL": {74:"C",77:"F",79:"E",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ACEFHIJK": {74:"C",77:"F",79:"H",80:"K",81:"E",82:"A",85:"J",87:"I"},
  "ACEFHIJL": {74:"C",77:"F",79:"H",80:"I",81:"E",82:"A",85:"J",87:"L"},
  "ACEFHIKL": {74:"C",77:"F",79:"H",80:"K",81:"I",82:"A",85:"E",87:"L"},
  "ACEFHJKL": {74:"C",77:"F",79:"H",80:"K",81:"E",82:"A",85:"J",87:"L"},
  "ACEFIJKL": {74:"C",77:"F",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ACEGHIJK": {74:"C",77:"H",79:"E",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ACEGHIJL": {74:"C",77:"H",79:"E",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ACEGHIKL": {74:"C",77:"H",79:"E",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ACEGHJKL": {74:"C",77:"H",79:"E",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ACEGIJKL": {74:"C",77:"G",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ACEHIJKL": {74:"C",77:"H",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ACFGHIJK": {74:"C",77:"F",79:"H",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ACFGHIJL": {74:"C",77:"F",79:"H",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ACFGHIKL": {74:"C",77:"F",79:"H",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ACFGHJKL": {74:"C",77:"F",79:"H",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ACFGIJKL": {74:"C",77:"F",79:"I",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ACFHIJKL": {74:"C",77:"F",79:"H",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ACGHIJKL": {74:"C",77:"G",79:"H",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ADEFGHIJ": {74:"D",77:"F",79:"H",80:"I",81:"J",82:"A",85:"G",87:"E"},
  "ADEFGHIK": {74:"D",77:"F",79:"H",80:"K",81:"E",82:"A",85:"G",87:"I"},
  "ADEFGHIL": {74:"D",77:"F",79:"H",80:"I",81:"E",82:"A",85:"G",87:"L"},
  "ADEFGHJK": {74:"D",77:"F",79:"H",80:"K",81:"J",82:"A",85:"G",87:"E"},
  "ADEFGHJL": {74:"D",77:"F",79:"H",80:"E",81:"J",82:"A",85:"G",87:"L"},
  "ADEFGHKL": {74:"D",77:"F",79:"H",80:"K",81:"E",82:"A",85:"G",87:"L"},
  "ADEFGIJK": {74:"D",77:"F",79:"E",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ADEFGIJL": {74:"D",77:"F",79:"E",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ADEFGIKL": {74:"D",77:"F",79:"E",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ADEFGJKL": {74:"D",77:"F",79:"E",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ADEFHIJK": {74:"D",77:"F",79:"H",80:"K",81:"E",82:"A",85:"J",87:"I"},
  "ADEFHIJL": {74:"D",77:"F",79:"H",80:"I",81:"E",82:"A",85:"J",87:"L"},
  "ADEFHIKL": {74:"D",77:"F",79:"H",80:"K",81:"I",82:"A",85:"E",87:"L"},
  "ADEFHJKL": {74:"D",77:"F",79:"H",80:"K",81:"E",82:"A",85:"J",87:"L"},
  "ADEFIJKL": {74:"D",77:"F",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ADEGHIJK": {74:"D",77:"H",79:"E",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ADEGHIJL": {74:"D",77:"H",79:"E",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ADEGHIKL": {74:"D",77:"H",79:"E",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ADEGHJKL": {74:"D",77:"H",79:"E",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ADEGIJKL": {74:"D",77:"G",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ADEHIJKL": {74:"D",77:"H",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ADFGHIJK": {74:"D",77:"F",79:"H",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "ADFGHIJL": {74:"D",77:"F",79:"H",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "ADFGHIKL": {74:"D",77:"F",79:"H",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "ADFGHJKL": {74:"D",77:"F",79:"H",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ADFGIJKL": {74:"D",77:"F",79:"I",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "ADFHIJKL": {74:"D",77:"F",79:"H",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "ADGHIJKL": {74:"D",77:"G",79:"H",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "AEFGHIJK": {74:"F",77:"H",79:"E",80:"K",81:"J",82:"A",85:"G",87:"I"},
  "AEFGHIJL": {74:"F",77:"H",79:"E",80:"I",81:"J",82:"A",85:"G",87:"L"},
  "AEFGHIKL": {74:"F",77:"H",79:"E",80:"K",81:"I",82:"A",85:"G",87:"L"},
  "AEFGHJKL": {74:"F",77:"H",79:"E",80:"K",81:"J",82:"A",85:"G",87:"L"},
  "AEFGIJKL": {74:"F",77:"G",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "AEFHIJKL": {74:"F",77:"H",79:"E",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "AEGHIJKL": {74:"A",77:"G",79:"E",80:"K",81:"I",82:"H",85:"J",87:"L"},
  "AFGHIJKL": {74:"F",77:"G",79:"H",80:"K",81:"I",82:"A",85:"J",87:"L"},
  "BCDEFGHI": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"H",85:"G",87:"E"},
  "BCDEFGHJ": {74:"C",77:"F",79:"H",80:"E",81:"B",82:"J",85:"G",87:"D"},
  "BCDEFGHK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"G",87:"E"},
  "BCDEFGHL": {74:"D",77:"F",79:"C",80:"E",81:"B",82:"H",85:"G",87:"L"},
  "BCDEFGIJ": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"J",85:"G",87:"E"},
  "BCDEFGIK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"E",85:"G",87:"I"},
  "BCDEFGIL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"E",85:"G",87:"L"},
  "BCDEFGJK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"J",85:"G",87:"E"},
  "BCDEFGJL": {74:"D",77:"F",79:"C",80:"E",81:"B",82:"J",85:"G",87:"L"},
  "BCDEFGKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"E",85:"G",87:"L"},
  "BCDEFHIJ": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"H",85:"J",87:"E"},
  "BCDEFHIK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"E",87:"I"},
  "BCDEFHIL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"H",85:"E",87:"L"},
  "BCDEFHJK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"J",87:"E"},
  "BCDEFHJL": {74:"D",77:"F",79:"C",80:"E",81:"B",82:"H",85:"J",87:"L"},
  "BCDEFHKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"E",87:"L"},
  "BCDEFIJK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"E",85:"J",87:"I"},
  "BCDEFIJL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"E",85:"J",87:"L"},
  "BCDEFIKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"I",85:"E",87:"L"},
  "BCDEFJKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"E",85:"J",87:"L"},
  "BCDEGHIJ": {74:"C",77:"D",79:"H",80:"I",81:"B",82:"J",85:"G",87:"E"},
  "BCDEGHIK": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"H",85:"G",87:"I"},
  "BCDEGHIL": {74:"C",77:"D",79:"E",80:"I",81:"B",82:"H",85:"G",87:"L"},
  "BCDEGHJK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"J",85:"G",87:"E"},
  "BCDEGHJL": {74:"C",77:"D",79:"H",80:"E",81:"B",82:"J",85:"G",87:"L"},
  "BCDEGHKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"H",85:"G",87:"L"},
  "BCDEGIJK": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"J",85:"G",87:"I"},
  "BCDEGIJL": {74:"C",77:"D",79:"E",80:"I",81:"B",82:"J",85:"G",87:"L"},
  "BCDEGIKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BCDEGJKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BCDEHIJK": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"H",85:"J",87:"I"},
  "BCDEHIJL": {74:"C",77:"D",79:"E",80:"I",81:"B",82:"H",85:"J",87:"L"},
  "BCDEHIKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"H",85:"I",87:"L"},
  "BCDEHJKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"H",85:"J",87:"L"},
  "BCDEIJKL": {74:"C",77:"D",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BCDFGHIJ": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"J",85:"G",87:"D"},
  "BCDFGHIK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"G",87:"I"},
  "BCDFGHIL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"H",85:"G",87:"L"},
  "BCDFGHJK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"J",85:"G",87:"D"},
  "BCDFGHJL": {74:"D",77:"F",79:"C",80:"J",81:"B",82:"H",85:"G",87:"L"},
  "BCDFGHKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"G",87:"L"},
  "BCDFGIJK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"J",85:"G",87:"I"},
  "BCDFGIJL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"J",85:"G",87:"L"},
  "BCDFGIKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BCDFGJKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BCDFHIJK": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"J",87:"I"},
  "BCDFHIJL": {74:"D",77:"F",79:"C",80:"I",81:"B",82:"H",85:"J",87:"L"},
  "BCDFHIKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"I",87:"L"},
  "BCDFHJKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"H",85:"J",87:"L"},
  "BCDFIJKL": {74:"D",77:"F",79:"C",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BCDGHIJK": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"J",85:"G",87:"I"},
  "BCDGHIJL": {74:"C",77:"D",79:"H",80:"I",81:"B",82:"J",85:"G",87:"L"},
  "BCDGHIKL": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BCDGHJKL": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BCDGIJKL": {74:"C",77:"D",79:"I",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BCDHIJKL": {74:"C",77:"D",79:"H",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BCEFGHIJ": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"J",85:"G",87:"E"},
  "BCEFGHIK": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"H",85:"G",87:"I"},
  "BCEFGHIL": {74:"C",77:"F",79:"E",80:"I",81:"B",82:"H",85:"G",87:"L"},
  "BCEFGHJK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"J",85:"G",87:"E"},
  "BCEFGHJL": {74:"C",77:"F",79:"H",80:"E",81:"B",82:"J",85:"G",87:"L"},
  "BCEFGHKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"H",85:"G",87:"L"},
  "BCEFGIJK": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"J",85:"G",87:"I"},
  "BCEFGIJL": {74:"C",77:"F",79:"E",80:"I",81:"B",82:"J",85:"G",87:"L"},
  "BCEFGIKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BCEFGJKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BCEFHIJK": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"H",85:"J",87:"I"},
  "BCEFHIJL": {74:"C",77:"F",79:"E",80:"I",81:"B",82:"H",85:"J",87:"L"},
  "BCEFHIKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"H",85:"I",87:"L"},
  "BCEFHJKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"H",85:"J",87:"L"},
  "BCEFIJKL": {74:"C",77:"F",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BCEGHIJK": {74:"C",77:"G",79:"E",80:"K",81:"B",82:"H",85:"J",87:"I"},
  "BCEGHIJL": {74:"C",77:"G",79:"E",80:"I",81:"B",82:"H",85:"J",87:"L"},
  "BCEGHIKL": {74:"C",77:"H",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BCEGHJKL": {74:"C",77:"G",79:"E",80:"K",81:"B",82:"H",85:"J",87:"L"},
  "BCEGIJKL": {74:"C",77:"G",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BCEHIJKL": {74:"C",77:"H",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BCFGHIJK": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"J",85:"G",87:"I"},
  "BCFGHIJL": {74:"C",77:"F",79:"H",80:"I",81:"B",82:"J",85:"G",87:"L"},
  "BCFGHIKL": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BCFGHJKL": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BCFGIJKL": {74:"C",77:"F",79:"I",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BCFHIJKL": {74:"C",77:"F",79:"H",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BCGHIJKL": {74:"C",77:"G",79:"H",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BDEFGHIJ": {74:"D",77:"F",79:"H",80:"I",81:"B",82:"J",85:"G",87:"E"},
  "BDEFGHIK": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"H",85:"G",87:"I"},
  "BDEFGHIL": {74:"D",77:"F",79:"E",80:"I",81:"B",82:"H",85:"G",87:"L"},
  "BDEFGHJK": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"J",85:"G",87:"E"},
  "BDEFGHJL": {74:"D",77:"F",79:"H",80:"E",81:"B",82:"J",85:"G",87:"L"},
  "BDEFGHKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"H",85:"G",87:"L"},
  "BDEFGIJK": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"J",85:"G",87:"I"},
  "BDEFGIJL": {74:"D",77:"F",79:"E",80:"I",81:"B",82:"J",85:"G",87:"L"},
  "BDEFGIKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BDEFGJKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BDEFHIJK": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"H",85:"J",87:"I"},
  "BDEFHIJL": {74:"D",77:"F",79:"E",80:"I",81:"B",82:"H",85:"J",87:"L"},
  "BDEFHIKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"H",85:"I",87:"L"},
  "BDEFHJKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"H",85:"J",87:"L"},
  "BDEFIJKL": {74:"D",77:"F",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BDEGHIJK": {74:"D",77:"G",79:"E",80:"K",81:"B",82:"H",85:"J",87:"I"},
  "BDEGHIJL": {74:"D",77:"G",79:"E",80:"I",81:"B",82:"H",85:"J",87:"L"},
  "BDEGHIKL": {74:"D",77:"H",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BDEGHJKL": {74:"D",77:"G",79:"E",80:"K",81:"B",82:"H",85:"J",87:"L"},
  "BDEGIJKL": {74:"D",77:"G",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BDEHIJKL": {74:"D",77:"H",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BDFGHIJK": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"J",85:"G",87:"I"},
  "BDFGHIJL": {74:"D",77:"F",79:"H",80:"I",81:"B",82:"J",85:"G",87:"L"},
  "BDFGHIKL": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BDFGHJKL": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BDFGIJKL": {74:"D",77:"F",79:"I",80:"K",81:"B",82:"J",85:"G",87:"L"},
  "BDFHIJKL": {74:"D",77:"F",79:"H",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BDGHIJKL": {74:"D",77:"G",79:"H",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BEFGHIJK": {74:"F",77:"G",79:"E",80:"K",81:"B",82:"H",85:"J",87:"I"},
  "BEFGHIJL": {74:"F",77:"G",79:"E",80:"I",81:"B",82:"H",85:"J",87:"L"},
  "BEFGHIKL": {74:"F",77:"H",79:"E",80:"K",81:"B",82:"I",85:"G",87:"L"},
  "BEFGHJKL": {74:"F",77:"G",79:"E",80:"K",81:"B",82:"H",85:"J",87:"L"},
  "BEFGIJKL": {74:"F",77:"G",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BEFHIJKL": {74:"F",77:"H",79:"E",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "BEGHIJKL": {74:"B",77:"G",79:"E",80:"K",81:"I",82:"H",85:"J",87:"L"},
  "BFGHIJKL": {74:"F",77:"G",79:"H",80:"K",81:"B",82:"I",85:"J",87:"L"},
  "CDEFGHIJ": {74:"D",77:"F",79:"C",80:"I",81:"J",82:"H",85:"G",87:"E"},
  "CDEFGHIK": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"H",85:"G",87:"I"},
  "CDEFGHIL": {74:"D",77:"F",79:"C",80:"I",81:"E",82:"H",85:"G",87:"L"},
  "CDEFGHJK": {74:"D",77:"F",79:"C",80:"K",81:"J",82:"H",85:"G",87:"E"},
  "CDEFGHJL": {74:"D",77:"F",79:"C",80:"E",81:"J",82:"H",85:"G",87:"L"},
  "CDEFGHKL": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"H",85:"G",87:"L"},
  "CDEFGIJK": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"J",85:"G",87:"I"},
  "CDEFGIJL": {74:"D",77:"F",79:"C",80:"I",81:"E",82:"J",85:"G",87:"L"},
  "CDEFGIKL": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"I",85:"G",87:"L"},
  "CDEFGJKL": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"J",85:"G",87:"L"},
  "CDEFHIJK": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"H",85:"J",87:"I"},
  "CDEFHIJL": {74:"D",77:"F",79:"C",80:"I",81:"E",82:"H",85:"J",87:"L"},
  "CDEFHIKL": {74:"D",77:"F",79:"C",80:"K",81:"I",82:"H",85:"E",87:"L"},
  "CDEFHJKL": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"H",85:"J",87:"L"},
  "CDEFIJKL": {74:"D",77:"F",79:"C",80:"K",81:"E",82:"I",85:"J",87:"L"},
  "CDEGHIJK": {74:"C",77:"D",79:"E",80:"K",81:"J",82:"H",85:"G",87:"I"},
  "CDEGHIJL": {74:"C",77:"D",79:"E",80:"I",81:"J",82:"H",85:"G",87:"L"},
  "CDEGHIKL": {74:"C",77:"D",79:"E",80:"K",81:"I",82:"H",85:"G",87:"L"},
  "CDEGHJKL": {74:"C",77:"D",79:"E",80:"K",81:"J",82:"H",85:"G",87:"L"},
  "CDEGIJKL": {74:"C",77:"D",79:"E",80:"K",81:"I",82:"J",85:"G",87:"L"},
  "CDEHIJKL": {74:"C",77:"D",79:"E",80:"K",81:"I",82:"H",85:"J",87:"L"},
  "CDFGHIJK": {74:"D",77:"F",79:"C",80:"K",81:"J",82:"H",85:"G",87:"I"},
  "CDFGHIJL": {74:"D",77:"F",79:"C",80:"I",81:"J",82:"H",85:"G",87:"L"},
  "CDFGHIKL": {74:"D",77:"F",79:"C",80:"K",81:"I",82:"H",85:"G",87:"L"},
  "CDFGHJKL": {74:"D",77:"F",79:"C",80:"K",81:"J",82:"H",85:"G",87:"L"},
  "CDFGIJKL": {74:"D",77:"F",79:"C",80:"K",81:"I",82:"J",85:"G",87:"L"},
  "CDFHIJKL": {74:"D",77:"F",79:"C",80:"K",81:"I",82:"H",85:"J",87:"L"},
  "CDGHIJKL": {74:"C",77:"D",79:"H",80:"K",81:"I",82:"J",85:"G",87:"L"},
  "CEFGHIJK": {74:"C",77:"F",79:"E",80:"K",81:"J",82:"H",85:"G",87:"I"},
  "CEFGHIJL": {74:"C",77:"F",79:"E",80:"I",81:"J",82:"H",85:"G",87:"L"},
  "CEFGHIKL": {74:"C",77:"F",79:"E",80:"K",81:"I",82:"H",85:"G",87:"L"},
  "CEFGHJKL": {74:"C",77:"F",79:"E",80:"K",81:"J",82:"H",85:"G",87:"L"},
  "CEFGIJKL": {74:"C",77:"F",79:"E",80:"K",81:"I",82:"J",85:"G",87:"L"},
  "CEFHIJKL": {74:"C",77:"F",79:"E",80:"K",81:"I",82:"H",85:"J",87:"L"},
  "CEGHIJKL": {74:"C",77:"G",79:"E",80:"K",81:"I",82:"H",85:"J",87:"L"},
  "CFGHIJKL": {74:"C",77:"F",79:"H",80:"K",81:"I",82:"J",85:"G",87:"L"},
  "DEFGHIJK": {74:"D",77:"F",79:"E",80:"K",81:"J",82:"H",85:"G",87:"I"},
  "DEFGHIJL": {74:"D",77:"F",79:"E",80:"I",81:"J",82:"H",85:"G",87:"L"},
  "DEFGHIKL": {74:"D",77:"F",79:"E",80:"K",81:"I",82:"H",85:"G",87:"L"},
  "DEFGHJKL": {74:"D",77:"F",79:"E",80:"K",81:"J",82:"H",85:"G",87:"L"},
  "DEFGIJKL": {74:"D",77:"F",79:"E",80:"K",81:"I",82:"J",85:"G",87:"L"},
  "DEFHIJKL": {74:"D",77:"F",79:"E",80:"K",81:"I",82:"H",85:"J",87:"L"},
  "DEGHIJKL": {74:"D",77:"G",79:"E",80:"K",81:"I",82:"H",85:"J",87:"L"},
  "DFGHIJKL": {74:"D",77:"F",79:"H",80:"K",81:"I",82:"J",85:"G",87:"L"},
  "EFGHIJKL": {74:"F",77:"G",79:"E",80:"K",81:"I",82:"H",85:"J",87:"L"},
}

function assignThirdsToSlots(
  groupResults: Record<string, GroupResult>,
  bestThirds: string[],
): Record<number, string | null> {
  const thirdByGroup: Record<string, string> = {}
  for (const g of GROUPS) {
    const third = groupResults[g]?.third
    if (third && bestThirds.includes(third)) thirdByGroup[g] = third
  }
  const key = Object.keys(thirdByGroup).sort().join('')
  const entry = ANNEX_C[key]
  const slots = [74, 77, 79, 80, 81, 82, 85, 87]
  const result: Record<number, string | null> = {}
  for (const slot of slots) {
    const g = entry?.[slot]
    result[slot] = g ? (thirdByGroup[g] ?? null) : null
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
  89:  { homeFrom: 74, awayFrom: 77 },
  90:  { homeFrom: 73, awayFrom: 75 },
  91:  { homeFrom: 76, awayFrom: 78 },
  92:  { homeFrom: 79, awayFrom: 80 },
  93:  { homeFrom: 83, awayFrom: 84 },
  94:  { homeFrom: 81, awayFrom: 82 },
  95:  { homeFrom: 86, awayFrom: 88 },
  96:  { homeFrom: 85, awayFrom: 87 },
  97:  { homeFrom: 89, awayFrom: 90 },
  98:  { homeFrom: 93, awayFrom: 94 },
  99:  { homeFrom: 91, awayFrom: 92 },
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
