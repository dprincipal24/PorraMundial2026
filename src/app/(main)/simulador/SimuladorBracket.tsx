'use client'

import { useMemo } from 'react'
import { TeamFlag } from '@/components/TeamFlag'
import { TEAMS_BY_ID } from '@/lib/data/teams'
import { cn } from '@/lib/utils'
import { Lock, Trophy } from 'lucide-react'
import {
  resolveR32Teams, getKnockoutTeam, getBestThirds, computeAllGroupResults,
  KNOCKOUT_FEED, type ScoreMap, type WinnerMap,
} from './simulatorLogic'

// ── Layout constants ──────────────────────────────────────────
const SLOT = 84    // height of one R32 "slot"
const CARD_H = 72  // match card height
const COL_W = 152  // column width
const COL_GAP = 22 // gap between columns
const BRACKET_H = 8 * SLOT  // 672px

function colX(colIdx: number) { return colIdx * (COL_W + COL_GAP) }

// Y center of a match card given its index within a round
// round 0=R32(8 matches), 1=R16(4), 2=QF(2), 3=SF(1), 4=Final
function matchY(matchIdx: number, round: number): number {
  const slotsPerMatch = Math.pow(2, round)
  return matchIdx * slotsPerMatch * SLOT + (slotsPerMatch * SLOT - CARD_H) / 2
}

// Bracket structure
// Left:  R32(0→7)=col0, R16(0→3)=col1, QF(0→1)=col2, SF(0)=col3
// Center: Final=col4
// Right: SF(0)=col5, QF(0→1)=col6, R16(0→3)=col7, R32(0→7)=col8
const LEFT_R32  = [73,75,74,77,76,78,79,80]   // pairs: 73+75→89, 74+77→90, 76+78→91, 79+80→92
const LEFT_R16  = [89,90,91,92]
const LEFT_QF   = [97,98]
const LEFT_SF   = [101]
const RIGHT_SF  = [102]
const RIGHT_QF  = [99,100]
const RIGHT_R16 = [93,94,95,96]
const RIGHT_R32 = [83,84,81,82,86,88,85,87]   // pairs: 83+84→93, 81+82→94, 86+88→95, 85+87→96
const FINAL     = [104]
const THIRD     = [103]

const TOTAL_COLS = 9
const TOTAL_W = TOTAL_COLS * (COL_W + COL_GAP) - COL_GAP

interface MatchNode {
  matchId: number
  colIdx: number
  rowIdx: number   // index within the round
  round: number    // 0=R32 ... 4=Final
  side: 'left' | 'right' | 'center'
}

function buildNodes(): MatchNode[] {
  const nodes: MatchNode[] = []
  const add = (ids: number[], col: number, round: number, side: MatchNode['side']) =>
    ids.forEach((id, rowIdx) => nodes.push({ matchId: id, colIdx: col, rowIdx, round, side }))

  add(LEFT_R32, 0, 0, 'left')
  add(LEFT_R16, 1, 1, 'left')
  add(LEFT_QF,  2, 2, 'left')
  add(LEFT_SF,  3, 3, 'left')
  add(FINAL,    4, 4, 'center')
  add(RIGHT_SF, 5, 3, 'right')
  add(RIGHT_QF, 6, 2, 'right')
  add(RIGHT_R16,7, 1, 'right')
  add(RIGHT_R32,8, 0, 'right')
  return nodes
}

const NODES = buildNodes()

interface Match {
  id: number; phase: string; home_team_id: string | null; away_team_id: string | null
  home_score: number | null; away_score: number | null; status: string; group_name: string | null
}

interface BracketMatchCardProps {
  matchId: number
  homeId: string | null
  awayId: string | null
  winner: string | null
  locked: boolean
  homeScore: number | null
  awayScore: number | null
  onPickWinner: (teamId: string) => void
  side: 'left' | 'right' | 'center'
  isThird?: boolean
}

function BracketMatchCard({
  matchId, homeId, awayId, winner, locked, homeScore, awayScore,
  onPickWinner, side, isThird,
}: BracketMatchCardProps) {
  const homeTeam = homeId ? TEAMS_BY_ID[homeId] : null
  const awayTeam = awayId ? TEAMS_BY_ID[awayId] : null
  const hasTeams = !!homeId && !!awayId
  const canPick = hasTeams && !locked

  function TeamRow({ teamId, score }: { teamId: string | null; score: number | null }) {
    const team = teamId ? TEAMS_BY_ID[teamId] : null
    const isWinner = winner === teamId && !!teamId
    const isLoser = winner && winner !== teamId && !!teamId
    return (
      <button
        type="button"
        disabled={!canPick || !teamId}
        onClick={() => teamId && canPick && onPickWinner(teamId)}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1.5 text-left transition-all rounded',
          canPick && teamId ? 'cursor-pointer hover:bg-white/5' : 'cursor-default',
          isWinner ? 'bg-amber-500/15' : '',
        )}
      >
        {team ? (
          <TeamFlag iso={team.iso} name={team.name} size={18} className="w-4.5 h-3 shrink-0" />
        ) : (
          <span className="w-4.5 h-3 shrink-0 bg-gray-800 rounded-sm" />
        )}
        <span className={cn(
          'text-[11px] leading-tight truncate flex-1',
          isWinner ? 'text-amber-300 font-bold' :
          isLoser ? 'text-gray-600 line-through' :
          team ? 'text-gray-300' : 'text-gray-600 italic',
        )}>
          {team ? team.name : teamId ? teamId : '—'}
        </span>
        {score !== null && (
          <span className={cn('text-xs font-bold shrink-0 ml-1', isWinner ? 'text-amber-400' : 'text-gray-500')}>
            {score}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden bg-gray-900',
      locked ? 'border-gray-700/80' :
      winner ? 'border-amber-500/40' :
      hasTeams ? 'border-gray-700 hover:border-gray-600' : 'border-gray-800',
      isThird ? 'border-orange-500/30' : '',
    )} style={{ width: COL_W, height: CARD_H }}>
      <div className="flex flex-col justify-between h-full py-0.5">
        <TeamRow teamId={homeId} score={homeScore} />
        <div className="mx-2 border-t border-gray-800" />
        <TeamRow teamId={awayId} score={awayScore} />
      </div>
      {locked && (
        <div className="absolute top-0.5 right-0.5">
          <Lock size={8} className="text-gray-600" />
        </div>
      )}
    </div>
  )
}

// SVG connector lines
function BracketConnectors({ nodes }: { nodes: MatchNode[] }) {
  const lines: React.ReactNode[] = []

  // Left side connectors (flowing left → right)
  function leftConnector(fromRound: number, toRound: number, toMatchIdx: number) {
    const fromColIdx = fromRound     // R32=0, R16=1, QF=2, SF=3
    const toColIdx = toRound
    const from0Idx = toMatchIdx * 2
    const from1Idx = toMatchIdx * 2 + 1
    const x1 = colX(fromColIdx) + COL_W
    const midX = colX(toColIdx) - COL_GAP / 2
    const x2 = colX(toColIdx)
    const y0 = matchY(from0Idx, fromRound) + CARD_H / 2
    const y1 = matchY(from1Idx, fromRound) + CARD_H / 2
    const yMid = matchY(toMatchIdx, toRound) + CARD_H / 2
    const key = `l-${fromRound}-${toMatchIdx}`
    lines.push(
      <path key={key} d={`M${x1},${y0} H${midX} V${y1} H${x1} M${midX},${yMid} H${x2}`}
        stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    )
  }

  // Right side connectors (flowing right → left)
  function rightConnector(fromRound: number, toRound: number, toMatchIdx: number) {
    const fromColIdx = TOTAL_COLS - 1 - fromRound  // R32=8, R16=7, QF=6, SF=5
    const toColIdx = TOTAL_COLS - 1 - toRound
    const from0Idx = toMatchIdx * 2
    const from1Idx = toMatchIdx * 2 + 1
    const x1 = colX(fromColIdx)
    const midX = colX(toColIdx) + COL_W + COL_GAP / 2
    const x2 = colX(toColIdx) + COL_W
    const y0 = matchY(from0Idx, fromRound) + CARD_H / 2
    const y1 = matchY(from1Idx, fromRound) + CARD_H / 2
    const yMid = matchY(toMatchIdx, toRound) + CARD_H / 2
    const key = `r-${fromRound}-${toMatchIdx}`
    lines.push(
      <path key={key} d={`M${x1},${y0} H${midX} V${y1} H${x1} M${midX},${yMid} H${x2}`}
        stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    )
  }

  // Left: R32→R16→QF→SF→Final
  for (let i = 0; i < 4; i++) leftConnector(0, 1, i)  // R32→R16
  for (let i = 0; i < 2; i++) leftConnector(1, 2, i)  // R16→QF
  leftConnector(2, 3, 0)  // QF→SF
  // SF left → Final
  const sfLeftX = colX(3) + COL_W
  const sfLeftMidX = colX(4) - COL_GAP / 2
  const sfLeftY = matchY(0, 3) + CARD_H / 2
  const finalY = matchY(0, 4) + CARD_H / 2
  lines.push(<line key="sf-l-final" x1={sfLeftX} y1={sfLeftY} x2={sfLeftMidX} y2={sfLeftY} stroke="#374151" strokeWidth="1.5" />)
  lines.push(<line key="sf-l-final-v" x1={sfLeftMidX} y1={sfLeftY} x2={sfLeftMidX} y2={finalY} stroke="#374151" strokeWidth="1.5" />)
  lines.push(<line key="sf-l-final-h2" x1={sfLeftMidX} y1={finalY} x2={colX(4)} y2={finalY} stroke="#374151" strokeWidth="1.5" />)

  // Right: R32→R16→QF→SF→Final
  for (let i = 0; i < 4; i++) rightConnector(0, 1, i)  // R32→R16
  for (let i = 0; i < 2; i++) rightConnector(1, 2, i)  // R16→QF
  rightConnector(2, 3, 0)  // QF→SF
  // SF right → Final
  const sfRightX = colX(5)
  const sfRightMidX = colX(4) + COL_W + COL_GAP / 2
  const sfRightY = matchY(0, 3) + CARD_H / 2
  lines.push(<line key="sf-r-final" x1={sfRightX} y1={sfRightY} x2={sfRightMidX} y2={sfRightY} stroke="#374151" strokeWidth="1.5" />)
  lines.push(<line key="sf-r-final-v" x1={sfRightMidX} y1={sfRightY} x2={sfRightMidX} y2={finalY} stroke="#374151" strokeWidth="1.5" />)
  lines.push(<line key="sf-r-final-h2" x1={sfRightMidX} y1={finalY} x2={colX(4) + COL_W} y2={finalY} stroke="#374151" strokeWidth="1.5" />)

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible"
      width={TOTAL_W} height={BRACKET_H}>
      {lines}
    </svg>
  )
}

function RoundLabel({ label, colIdx }: { label: string; colIdx: number }) {
  return (
    <div
      className="absolute text-xs font-bold text-gray-600 uppercase tracking-wider text-center"
      style={{ top: -28, left: colX(colIdx), width: COL_W }}
    >
      {label}
    </div>
  )
}

interface SimuladorBracketProps {
  matches: Match[]
  simScores: ScoreMap
  winners: WinnerMap
  lockedMatchIds: Set<number>
  onPickWinner: (matchId: number, teamId: string) => void
  onClearWinner: (matchId: number) => void
}

export function SimuladorBracket({
  matches, simScores, winners, lockedMatchIds, onPickWinner, onClearWinner,
}: SimuladorBracketProps) {
  const allMatches = useMemo(() => matches, [matches])

  const groupMatches = useMemo(() => allMatches.filter(m => m.group_name !== null), [allMatches])

  const groupResults = useMemo(
    () => computeAllGroupResults(groupMatches, simScores),
    [groupMatches, simScores]
  )
  const bestThirds = useMemo(() => getBestThirds(groupResults), [groupResults])
  const r32Teams = useMemo(() => resolveR32Teams(groupResults, bestThirds), [groupResults, bestThirds])

  function getWinner(matchId: number): string | null {
    if (lockedMatchIds.has(matchId)) return winners[matchId] ?? null
    return winners[matchId] ?? null
  }

  function getTeam(matchId: number, side: 'home' | 'away'): string | null {
    const loserWinners: WinnerMap = {}
    // losers of semis for third place
    if (winners[101]) {
      const sf1Home = getKnockoutTeam(101, 'home', r32Teams, winners)
      const sf1Away = getKnockoutTeam(101, 'away', r32Teams, winners)
      loserWinners[101] = winners[101] === sf1Home ? (sf1Away ?? '') : (sf1Home ?? '')
    }
    if (winners[102]) {
      const sf2Home = getKnockoutTeam(102, 'home', r32Teams, winners)
      const sf2Away = getKnockoutTeam(102, 'away', r32Teams, winners)
      loserWinners[102] = winners[102] === sf2Home ? (sf2Away ?? '') : (sf2Home ?? '')
    }
    return getKnockoutTeam(matchId, side, r32Teams, winners, loserWinners)
  }

  function getAdminScores(matchId: number): { home: number | null; away: number | null } {
    const m = allMatches.find(x => x.id === matchId)
    if (!m || m.status !== 'finished') return { home: null, away: null }
    return { home: m.home_score, away: m.away_score }
  }

  function handlePick(matchId: number, teamId: string) {
    if (lockedMatchIds.has(matchId)) return
    if (winners[matchId] === teamId) {
      onClearWinner(matchId)
    } else {
      onPickWinner(matchId, teamId)
    }
  }

  const nodes = NODES

  // Third place match Y position (below bracket)
  const thirdY = BRACKET_H + 40

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400">Haz clic en un equipo para avanzarlo</span>
        <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded flex items-center gap-1">
          <Lock size={10} /> bloqueado por admin
        </span>
      </div>

      {/* Scrollable bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="relative" style={{ width: TOTAL_W, height: BRACKET_H + 140, minWidth: TOTAL_W }}>
          {/* Round labels */}
          <RoundLabel label="Ronda de 32" colIdx={0} />
          <RoundLabel label="Octavos" colIdx={1} />
          <RoundLabel label="Cuartos" colIdx={2} />
          <RoundLabel label="Semis" colIdx={3} />
          <RoundLabel label="Final" colIdx={4} />
          <RoundLabel label="Semis" colIdx={5} />
          <RoundLabel label="Cuartos" colIdx={6} />
          <RoundLabel label="Octavos" colIdx={7} />
          <RoundLabel label="Ronda de 32" colIdx={8} />

          {/* SVG connectors */}
          <BracketConnectors nodes={nodes} />

          {/* Match cards */}
          {nodes.map(({ matchId, colIdx, rowIdx, round }) => {
            const homeId = getTeam(matchId, 'home')
            const awayId = getTeam(matchId, 'away')
            const w = getWinner(matchId)
            const locked = lockedMatchIds.has(matchId)
            const scores = getAdminScores(matchId)
            const y = matchY(rowIdx, round)
            const x = colX(colIdx)

            return (
              <div key={matchId} className="absolute" style={{ left: x, top: y }}>
                <BracketMatchCard
                  matchId={matchId}
                  homeId={homeId}
                  awayId={awayId}
                  winner={w}
                  locked={locked}
                  homeScore={scores.home}
                  awayScore={scores.away}
                  onPickWinner={teamId => handlePick(matchId, teamId)}
                  side={colIdx < 4 ? 'left' : colIdx === 4 ? 'center' : 'right'}
                />
              </div>
            )
          })}

          {/* Final label */}
          <div
            className="absolute flex items-center justify-center gap-1.5"
            style={{ left: colX(4), top: matchY(0, 4) - 22, width: COL_W }}
          >
            <Trophy size={12} className="text-amber-400" />
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Final</span>
          </div>

          {/* Third place match */}
          {(() => {
            const sf1Loser = (() => {
              const h = getTeam(101, 'home'); const a = getTeam(101, 'away')
              return winners[101] === h ? a : winners[101] === a ? h : null
            })()
            const sf2Loser = (() => {
              const h = getTeam(102, 'home'); const a = getTeam(102, 'away')
              return winners[102] === h ? a : winners[102] === a ? h : null
            })()
            const hasThird = sf1Loser || sf2Loser
            const thirdX = (TOTAL_W - COL_W) / 2
            const thirdScores = getAdminScores(103)
            return (
              <div
                className="absolute flex flex-col items-center gap-1"
                style={{ left: thirdX, top: thirdY }}
              >
                {hasThird && (
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                    3er Puesto
                  </span>
                )}
                {hasThird && (
                  <BracketMatchCard
                    matchId={103}
                    homeId={sf1Loser}
                    awayId={sf2Loser}
                    winner={getWinner(103)}
                    locked={lockedMatchIds.has(103)}
                    homeScore={thirdScores.home}
                    awayScore={thirdScores.away}
                    onPickWinner={teamId => handlePick(103, teamId)}
                    side="center"
                    isThird
                  />
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
