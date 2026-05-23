'use client'

import { TeamFlag } from '@/components/TeamFlag'
import { TEAMS, TEAMS_BY_ID } from '@/lib/data/teams'
import { cn } from '@/lib/utils'
import {
  simulateGroupStandings, computeAllGroupResults, getBestThirds,
  GROUPS, type ScoreMap, type GroupResult,
} from './simulatorLogic'
import { Lock, RotateCcw, Wand2, ChevronRight } from 'lucide-react'

interface Match {
  id: number; group_name: string | null
  home_team_id: string | null; away_team_id: string | null
}

interface SimuladorGroupsProps {
  matches: Match[]
  simScores: ScoreMap
  lockedMatchIds: Set<number>
  onScoreChange: (matchId: number, side: 'home' | 'away', value: number) => void
  onGroupReset: (groupMatchIds: number[]) => void
  onFillFromPredictions: () => void
  hasPredictions: boolean
  activeGroup: string
  onGroupChange: (g: string) => void
}

function ScoreInput({
  value, locked, onChange,
}: { value: number | undefined; locked: boolean; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      disabled={locked}
      value={value ?? ''}
      placeholder="–"
      onChange={e => {
        const v = parseInt(e.target.value)
        if (!isNaN(v) && v >= 0) onChange(v)
      }}
      className={cn(
        'w-10 h-9 text-center text-sm font-bold rounded-lg border bg-transparent transition-colors',
        locked
          ? 'border-gray-700/60 text-gray-600 cursor-not-allowed'
          : 'border-gray-700 hover:border-gray-500 focus:border-cyan-500 focus:outline-none text-white',
      )}
    />
  )
}

function GroupStandings({
  standings, groupLabel,
}: {
  standings: ReturnType<typeof simulateGroupStandings>
  groupLabel: string
}) {
  return (
    <div className="glass rounded-xl overflow-hidden border border-gray-800">
      <div className="px-4 py-2 border-b border-gray-800">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Clasificación · Grupo {groupLabel}
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800/60">
            <th className="text-left py-2 pl-3 pr-1 text-gray-600 font-semibold w-5">#</th>
            <th className="text-left py-2 px-2 text-gray-600 font-semibold">Equipo</th>
            <th className="text-center py-2 px-1 text-gray-600 font-semibold">PJ</th>
            <th className="text-center py-2 px-1 text-gray-600 font-semibold">G</th>
            <th className="text-center py-2 px-1 text-gray-600 font-semibold">E</th>
            <th className="text-center py-2 px-1 text-gray-600 font-semibold">P</th>
            <th className="text-center py-2 px-1 text-gray-600 font-semibold">GF</th>
            <th className="text-center py-2 px-1 text-gray-600 font-semibold">GC</th>
            <th className="text-center py-2 px-1 text-gray-600 font-semibold">DG</th>
            <th className="text-center py-2 pl-1 pr-3 text-gray-600 font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/40">
          {standings.map((row, idx) => {
            const team = TEAMS_BY_ID[row.teamId]
            if (!team) return null
            const qualifies = idx < 2
            const isThird = idx === 2
            return (
              <tr key={row.teamId} className={cn(
                qualifies ? 'bg-green-500/5' : isThird ? 'bg-yellow-500/5' : '',
              )}>
                <td className="py-1.5 pl-3 pr-1">
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs',
                    qualifies ? 'bg-green-500/20 text-green-400'
                    : isThird ? 'text-yellow-500'
                    : 'text-gray-600',
                  )}>{idx + 1}</span>
                </td>
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag iso={team.iso} name={team.name} size={20} className="w-5 h-3.5 shrink-0" />
                    <span className={cn(
                      'truncate max-w-[80px] font-medium',
                      qualifies ? 'text-white' : isThird ? 'text-yellow-200' : 'text-gray-500',
                    )}>{team.name}</span>
                  </div>
                </td>
                <td className="text-center py-1.5 px-1 text-gray-400">{row.played}</td>
                <td className="text-center py-1.5 px-1 text-gray-400">{row.won}</td>
                <td className="text-center py-1.5 px-1 text-gray-400">{row.drawn}</td>
                <td className="text-center py-1.5 px-1 text-gray-400">{row.lost}</td>
                <td className="text-center py-1.5 px-1 text-gray-400">{row.gf}</td>
                <td className="text-center py-1.5 px-1 text-gray-400">{row.ga}</td>
                <td className={cn(
                  'text-center py-1.5 px-1 font-medium',
                  row.gd > 0 ? 'text-green-400' : row.gd < 0 ? 'text-red-400' : 'text-gray-400',
                )}>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                <td className={cn(
                  'text-center py-1.5 pl-1 pr-3 font-bold',
                  qualifies ? 'text-amber-400' : isThird ? 'text-yellow-400' : 'text-gray-400',
                )}>{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function SimuladorGroups({
  matches, simScores, lockedMatchIds, onScoreChange,
  onGroupReset, onFillFromPredictions, hasPredictions,
  activeGroup, onGroupChange,
}: SimuladorGroupsProps) {
  const groupMatches = matches.filter(m => m.group_name === activeGroup)
  const groupTeamIds = TEAMS.filter(t => t.group === activeGroup).map(t => t.id)
  const standings = simulateGroupStandings(groupTeamIds, groupMatches, simScores)

  const allGroupResults = computeAllGroupResults(matches, simScores)
  const bestThirds = getBestThirds(allGroupResults)

  const groupMatchIds = groupMatches.map(m => m.id)
  const activeGroupHasNonLocked = groupMatchIds.some(id => !lockedMatchIds.has(id))

  // Count how many non-locked matches in this group have scores
  const filledInGroup = groupMatchIds.filter(id => !lockedMatchIds.has(id) && simScores[id] !== undefined).length
  const editableInGroup = groupMatchIds.filter(id => !lockedMatchIds.has(id)).length

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {hasPredictions && (
          <button
            onClick={onFillFromPredictions}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all cursor-pointer"
          >
            <Wand2 size={13} />
            Volcar mis pronósticos
          </button>
        )}
        {!hasPredictions && (
          <span className="text-xs text-gray-600 italic">
            (Aún no tienes pronósticos en Fase de Grupos)
          </span>
        )}
      </div>

      {/* Group selector + group reset */}
      <div className="flex flex-wrap items-center gap-1.5">
        {GROUPS.map(g => {
          const gMatches = matches.filter(m => m.group_name === g)
          const editableIds = gMatches.filter(m => !lockedMatchIds.has(m.id)).map(m => m.id)
          const filled = gMatches.filter(m => simScores[m.id] !== undefined).length
          const done = filled === gMatches.length && gMatches.length > 0
          const isActive = activeGroup === g
          return (
            <button
              key={g}
              onClick={() => onGroupChange(g)}
              className={cn(
                'relative px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer',
                isActive
                  ? 'bg-cyan-500 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white',
              )}
            >
              {g}
              {done && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-gray-900" />
              )}
            </button>
          )
        })}

        {/* Per-group reset */}
        {activeGroupHasNonLocked && filledInGroup > 0 && (
          <button
            onClick={() => onGroupReset(groupMatchIds)}
            title={`Reiniciar grupo ${activeGroup}`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-400 border border-gray-700 hover:border-orange-500/40 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ml-1"
          >
            <RotateCcw size={12} />
            Reiniciar grupo {activeGroup}
          </button>
        )}
      </div>

      {/* Progress bar for current group */}
      {editableInGroup > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${(filledInGroup / editableInGroup) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0">
            {filledInGroup}/{editableInGroup} partidos simulados
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Matches */}
        <div className="space-y-2">
          {groupMatches.map(m => {
            const home = TEAMS_BY_ID[m.home_team_id ?? '']
            const away = TEAMS_BY_ID[m.away_team_id ?? '']
            const score = simScores[m.id]
            const locked = lockedMatchIds.has(m.id)
            return (
              <div key={m.id} className={cn(
                'glass rounded-xl border px-4 py-3',
                locked ? 'border-gray-700/50 opacity-80' : 'border-gray-800',
              )}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className={cn(
                      'text-sm font-semibold text-right truncate max-w-[90px]',
                      score && score.home > score.away ? 'text-white' : 'text-gray-400',
                    )}>{home?.name ?? '?'}</span>
                    <TeamFlag iso={home?.iso ?? 'un'} name={home?.name ?? ''} size={24} className="w-6 h-4 shrink-0" />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <ScoreInput value={score?.home} locked={locked} onChange={v => onScoreChange(m.id, 'home', v)} />
                    <span className="text-gray-600 text-xs">–</span>
                    <ScoreInput value={score?.away} locked={locked} onChange={v => onScoreChange(m.id, 'away', v)} />
                    {locked && <Lock size={11} className="text-gray-600 ml-0.5" />}
                  </div>

                  <div className="flex items-center gap-1.5 flex-1 justify-start">
                    <TeamFlag iso={away?.iso ?? 'un'} name={away?.name ?? ''} size={24} className="w-6 h-4 shrink-0" />
                    <span className={cn(
                      'text-sm font-semibold truncate max-w-[90px]',
                      score && score.away > score.home ? 'text-white' : 'text-gray-400',
                    )}>{away?.name ?? '?'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Standings + best thirds */}
        <div className="space-y-4">
          <GroupStandings standings={standings} groupLabel={activeGroup} />

          <div className="glass rounded-xl border border-gray-800 p-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Mejores 3eros · Top 8 clasificados
            </p>
            {bestThirds.length === 0 ? (
              <p className="text-xs text-gray-600">Introduce resultados en todos los grupos</p>
            ) : (
              <div className="space-y-1">
                {bestThirds.map((teamId, i) => {
                  const team = TEAMS_BY_ID[teamId]
                  const stats = Object.values(allGroupResults).find(r => r.third === teamId)?.thirdStats
                  if (!team) return null
                  return (
                    <div key={teamId} className="flex items-center gap-2 py-0.5">
                      <span className="text-xs font-bold text-amber-400 w-4">{i + 1}</span>
                      <TeamFlag iso={team.iso} name={team.name} size={20} className="w-5 h-3.5" />
                      <span className="text-xs text-white flex-1 truncate">{team.name}</span>
                      {stats && (
                        <span className="text-xs text-gray-500 shrink-0">
                          {stats.points}pts · DG{stats.gd > 0 ? `+${stats.gd}` : stats.gd}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clasificados summary */}
      <div className="glass rounded-xl border border-gray-800 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Resumen clasificados · Ronda de 32
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {GROUPS.map(g => {
            const r = allGroupResults[g]
            const first = r?.first ? TEAMS_BY_ID[r.first] : null
            const second = r?.second ? TEAMS_BY_ID[r.second] : null
            return (
              <div key={g} className={cn(
                'rounded-lg p-2 space-y-1 border cursor-pointer transition-colors',
                g === activeGroup
                  ? 'bg-gray-800 border-cyan-500/40'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700',
              )} onClick={() => onGroupChange(g)}>
                <p className="text-xs font-bold text-gray-500">Grupo {g}</p>
                {first ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-green-400 font-bold">1</span>
                    <TeamFlag iso={first.iso} name={first.name} size={16} className="w-4 h-3" />
                    <span className="text-xs text-white truncate">{first.name}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">—</div>
                )}
                {second ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-amber-500 font-bold">2</span>
                    <TeamFlag iso={second.iso} name={second.name} size={16} className="w-4 h-3" />
                    <span className="text-xs text-gray-300 truncate">{second.name}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">—</div>
                )}
              </div>
            )
          })}
        </div>

        {bestThirds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">8 mejores terceros:</p>
            <div className="flex flex-wrap gap-1.5">
              {bestThirds.map(id => {
                const t = TEAMS_BY_ID[id]
                return t ? (
                  <div key={id} className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 rounded-md px-1.5 py-0.5">
                    <TeamFlag iso={t.iso} name={t.name} size={16} className="w-4 h-3" />
                    <span className="text-xs text-yellow-200">{t.name}</span>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <ChevronRight size={12} />
          Ve a <strong className="text-cyan-400 mx-1">Eliminatorias</strong> para ver el cuadro completo
        </p>
      </div>
    </div>
  )
}
