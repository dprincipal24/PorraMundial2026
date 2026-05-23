'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MatchCard } from '@/components/MatchCard'
import { CountdownTimer } from '@/components/CountdownTimer'
import { Button } from '@/components/ui/button'
import { TeamFlag } from '@/components/TeamFlag'
import { GROUPS } from '@/lib/data/teams'
import { cn } from '@/lib/utils'
import { Save, Lock, CheckCircle, Users, Star, AlertTriangle, ArrowLeft } from 'lucide-react'
import type { Match, MatchPrediction, Team } from '@/lib/types'

// ── FIFA 2026 group standings simulation ──────────────────────────────────────

type TeamStats = {
  teamId: string
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
}

function calcH2H(
  teamId: string,
  tiedIds: string[],
  groupMatches: Match[],
  predMap: Record<number, { home: number; away: number }>,
): { points: number; gd: number; gf: number } {
  let pts = 0, gf = 0, ga = 0
  for (const m of groupMatches) {
    const p = predMap[m.id]
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

function simulateGroupStandings(
  groupTeams: Team[],
  groupMatches: Match[],
  predMap: Record<number, { home: number; away: number }>,
): TeamStats[] {
  const s: Record<string, TeamStats> = {}
  for (const t of groupTeams) s[t.id] = { teamId: t.id, points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0 }

  for (const m of groupMatches) {
    const p = predMap[m.id]
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

  // Break ties with FIFA tiebreakers: H2H pts → H2H GD → H2H GF → overall GD → overall GF
  const result: TeamStats[] = []
  let i = 0
  while (i < all.length) {
    let j = i + 1
    while (j < all.length && all[j].points === all[i].points) j++
    const tied = all.slice(i, j)
    if (tied.length > 1) {
      const ids = tied.map(t => t.teamId)
      tied.sort((a, b) => {
        const ha = calcH2H(a.teamId, ids, groupMatches, predMap)
        const hb = calcH2H(b.teamId, ids, groupMatches, predMap)
        if (hb.points !== ha.points) return hb.points - ha.points
        if (hb.gd !== ha.gd) return hb.gd - ha.gd
        if (hb.gf !== ha.gf) return hb.gf - ha.gf
        if (b.gd !== a.gd) return b.gd - a.gd
        return b.gf - a.gf
      })
    }
    result.push(...tied)
    i = j
  }
  return result
}

type AllUserPred = {
  profile: { id: string; name: string; avatar_url: string | null }
  matchPreds: Record<number, { home: number; away: number }>
  qualifyTeamIds: string[]
}

interface GroupPredictionsClientProps {
  matches: Match[]
  predictions: MatchPrediction[]
  qualifyPredictions: string[]
  teams: Team[]
  userId: string
  isOpen: boolean
  deadline: string | null
  isAdmin: boolean
  allUsersPreds: AllUserPred[]
  totalGroupMatches: number
  initialViewingUser?: AllUserPred | null
}

function UserAvatar({ avatarUrl, name, size = 7 }: { avatarUrl: string | null; name: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    return <Image src={avatarUrl} alt={name} width={28} height={28} className={`${cls} object-cover`} unoptimized />
  }
  if (avatarUrl && avatarUrl.length <= 4) {
    return <div className={`${cls} bg-gray-800 flex items-center justify-center text-base`}>{avatarUrl}</div>
  }
  return (
    <div className={`${cls} bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-black text-white`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function GroupPredictionsClient({
  matches,
  predictions: initialPredictions,
  qualifyPredictions: initialQualify,
  teams,
  userId,
  isOpen,
  deadline,
  isAdmin,
  allUsersPreds,
  totalGroupMatches,
  initialViewingUser,
}: GroupPredictionsClientProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'qualify' | 'all'>('matches')
  const [activeGroup, setActiveGroup] = useState('A')
  const [predMap, setPredMap] = useState<Record<number, { home: number; away: number }>>(() =>
    Object.fromEntries(initialPredictions.map((p) => [p.match_id, { home: p.home_score, away: p.away_score }])),
  )
  const [qualifySet, setQualifySet] = useState<Set<string>>(new Set(initialQualify))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [viewingUser, setViewingUser] = useState<AllUserPred | null>(initialViewingUser ?? null)

  const supabase = createClient()

  const handlePredictionChange = useCallback((matchId: number, home: number, away: number) => {
    setPredMap((prev) => ({ ...prev, [matchId]: { home, away } }))
  }, [])

  const groupMatches = matches.filter((m) => m.group_name === activeGroup)
  const groupTeams = teams.filter((t) => t.group === activeGroup)

  const groupQualifyCount = (group: string) =>
    teams.filter((t) => t.group === group && qualifySet.has(t.id)).length

  function toggleQualify(teamId: string, group: string) {
    if (!isOpen) return
    setQualifySet((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        if (groupQualifyCount(group) >= 2) return prev
        next.add(teamId)
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const upserts = Object.entries(predMap)
        .filter(([, v]) => v.home !== undefined && v.away !== undefined)
        .map(([matchId, v]) => ({
          user_id: userId,
          match_id: parseInt(matchId),
          home_score: v.home,
          away_score: v.away,
        }))

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('match_predictions')
          .upsert(upserts, { onConflict: 'user_id,match_id' })
        if (error) throw error
      }

      await supabase.from('group_qualify_predictions').delete().eq('user_id', userId)
      if (qualifySet.size > 0) {
        const { error } = await supabase.from('group_qualify_predictions').insert(
          Array.from(qualifySet).map((team_id) => ({ user_id: userId, team_id })),
        )
        if (error) throw error
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Error al guardar. Inténtalo de nuevo.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const myMatchCount = Object.keys(predMap).length
  const missingMatches = totalGroupMatches - myMatchCount
  const TOTAL_QUALIFY = GROUPS.length * 2
  const missingQualify = TOTAL_QUALIFY - qualifySet.size
  const showWarning = isOpen && (missingMatches > 0 || missingQualify > 0)

  const canSeeAll = !isOpen || isAdmin
  const tabs = [
    { key: 'matches', label: '⚽ Partidos' },
    { key: 'qualify', label: <><Users size={14} className="inline mr-1" />Clasificados (+5 pts)</> },
    ...(canSeeAll ? [{ key: 'all', label: <><Users size={14} className="inline mr-1" />Participantes</> }] : []),
  ] as { key: string; label: React.ReactNode }[]

  // Active match/qualify data depending on view mode
  const activePredMap = viewingUser
    ? Object.fromEntries(Object.entries(viewingUser.matchPreds).map(([id, v]) => [parseInt(id), v]))
    : predMap
  const activeQualifySet = viewingUser
    ? new Set(viewingUser.qualifyTeamIds)
    : qualifySet

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Star className="text-amber-400" size={22} />
            Fase de Grupos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {myMatchCount}/{totalGroupMatches} partidos pronosticados
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          {deadline && isOpen && <CountdownTimer deadline={deadline} label="Cierra" />}
          {!isOpen && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <Lock size={14} />
              <span>Predicciones cerradas</span>
            </div>
          )}
        </div>
      </div>

      {/* Missing predictions warning */}
      {showWarning && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <div className="text-sm">
            <span className="text-white font-semibold">Pronósticos pendientes: </span>
            {missingMatches > 0 && (
              <span className="text-amber-400">{missingMatches} partido{missingMatches !== 1 ? 's' : ''}</span>
            )}
            {missingMatches > 0 && missingQualify > 0 && <span className="text-gray-500"> · </span>}
            {missingQualify > 0 && (
              <span className="text-amber-400">{missingQualify} clasificado{missingQualify !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      )}

      {/* Viewing another user banner */}
      {viewingUser && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <UserAvatar avatarUrl={viewingUser.profile.avatar_url} name={viewingUser.profile.name} />
          <span className="text-sm text-blue-300 font-semibold flex-1">
            Viendo predicciones de {viewingUser.profile.name}
          </span>
          <button
            onClick={() => setViewingUser(null)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            Volver a las mías
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit flex-wrap">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key as typeof activeTab); setViewingUser(null) }}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer',
              activeTab === key ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Group tabs (not shown in "all" tab) */}
      {activeTab !== 'all' && (
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => {
            const count = viewingUser
              ? matches.filter((m) => m.group_name === g && activePredMap[m.id] !== undefined).length
              : matches.filter((m) => m.group_name === g && predMap[m.id] !== undefined).length
            const total = matches.filter((m) => m.group_name === g).length
            return (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={cn(
                  'relative px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer',
                  activeGroup === g
                    ? 'bg-amber-500 text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white',
                )}
              >
                {g}
                {count === total && total > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-gray-900" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── TAB: PARTIDOS ── */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {/* Simulated standings based on predictions */}
          {(() => {
            const standings = simulateGroupStandings(groupTeams, groupMatches, activePredMap)
            const predictedCount = groupMatches.filter(m => activePredMap[m.id] !== undefined).length
            if (predictedCount === 0) return null
            return (
              <div className="glass rounded-xl overflow-hidden border border-gray-800">
                <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Clasificación simulada · Grupo {activeGroup}
                  </span>
                  <span className="text-xs text-gray-600">{predictedCount}/{groupMatches.length} partidos</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800/60">
                      <th className="text-left py-2 pl-4 pr-2 text-gray-600 font-semibold w-6">#</th>
                      <th className="text-left py-2 px-2 text-gray-600 font-semibold">Equipo</th>
                      <th className="text-center py-2 px-1.5 text-gray-600 font-semibold">PJ</th>
                      <th className="text-center py-2 px-1.5 text-gray-600 font-semibold">G</th>
                      <th className="text-center py-2 px-1.5 text-gray-600 font-semibold">E</th>
                      <th className="text-center py-2 px-1.5 text-gray-600 font-semibold">P</th>
                      <th className="text-center py-2 px-1.5 text-gray-600 font-semibold">GF</th>
                      <th className="text-center py-2 px-1.5 text-gray-600 font-semibold">GC</th>
                      <th className="text-center py-2 px-1.5 text-gray-600 font-semibold">DG</th>
                      <th className="text-center py-2 pl-1.5 pr-4 text-gray-600 font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {standings.map((row, idx) => {
                      const team = groupTeams.find(t => t.id === row.teamId)
                      if (!team) return null
                      const qualifies = idx < 2
                      return (
                        <tr key={row.teamId} className={cn(qualifies ? 'bg-green-500/5' : '')}>
                          <td className="py-2 pl-4 pr-2">
                            <span className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs',
                              qualifies ? 'bg-green-500/20 text-green-400' : 'text-gray-600',
                            )}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1.5">
                              <TeamFlag iso={team.iso} name={team.name} size={20} className="w-5 h-3.5 shrink-0" />
                              <span className={cn('font-medium truncate max-w-[80px]', qualifies ? 'text-white' : 'text-gray-400')}>
                                {team.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-2 px-1.5 text-gray-400">{row.played}</td>
                          <td className="text-center py-2 px-1.5 text-gray-400">{row.won}</td>
                          <td className="text-center py-2 px-1.5 text-gray-400">{row.drawn}</td>
                          <td className="text-center py-2 px-1.5 text-gray-400">{row.lost}</td>
                          <td className="text-center py-2 px-1.5 text-gray-400">{row.gf}</td>
                          <td className="text-center py-2 px-1.5 text-gray-400">{row.ga}</td>
                          <td className={cn('text-center py-2 px-1.5 font-medium', row.gd > 0 ? 'text-green-400' : row.gd < 0 ? 'text-red-400' : 'text-gray-400')}>
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </td>
                          <td className={cn('text-center py-2 pl-1.5 pr-4 font-bold', qualifies ? 'text-amber-400' : 'text-gray-300')}>
                            {row.points}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-gray-800/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500/50 inline-block"></span>
                  <span className="text-xs text-gray-600">Clasifican a eliminatorias</span>
                </div>
              </div>
            )
          })()}

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Grupo {activeGroup}</h2>
            <span className="text-xs text-gray-600">
              {matches.filter((m) => m.group_name === activeGroup && activePredMap[m.id] !== undefined).length}/
              {matches.filter((m) => m.group_name === activeGroup).length} completados
            </span>
          </div>
          {groupMatches.map((match) => {
            const pred = activePredMap[match.id]
            return (
              <MatchCard
                key={match.id}
                match={match}
                prediction={
                  pred
                    ? { id: '', user_id: userId, match_id: match.id, home_score: pred.home, away_score: pred.away, created_at: '' }
                    : undefined
                }
                onPredictionChange={isOpen && !viewingUser ? handlePredictionChange : undefined}
                locked={!isOpen || !!viewingUser}
                showResult={match.status === 'finished'}
              />
            )
          })}

        </div>
      )}

      {/* ── TAB: CLASIFICADOS ── */}
      {activeTab === 'qualify' && (
        <div className="space-y-4">
          {!viewingUser && (
            <p className="text-sm text-gray-400">
              Selecciona los <strong className="text-white">2 equipos</strong> de cada grupo que crees que clasificarán.
              Cada acierto vale <strong className="text-amber-400">+5 puntos</strong>.
            </p>
          )}
          <div className="space-y-4">
            {GROUPS.map((g) => {
              const allGroupTeams = teams.filter((t) => t.group === g)
              const count = allGroupTeams.filter(t => activeQualifySet.has(t.id)).length
              return (
                <div key={g} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">Grupo {g}</h3>
                    <span className={cn('text-xs font-semibold', count === 2 ? 'text-green-400' : 'text-gray-500')}>
                      {count}/2 seleccionados
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allGroupTeams.map((team) => {
                      const selected = activeQualifySet.has(team.id)
                      const disabled = !isOpen || !!viewingUser || (!selected && groupQualifyCount(g) >= 2)
                      return (
                        <button
                          key={team.id}
                          disabled={disabled}
                          onClick={() => toggleQualify(team.id, g)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                            selected
                              ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                              : disabled
                              ? 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed'
                              : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:text-white cursor-pointer',
                          )}
                        >
                          {team.iso
                            ? <TeamFlag iso={team.iso} name={team.name} size={24} className="w-6 h-4 flex-shrink-0" />
                            : <span className="text-xl">{team.flag}</span>
                          }
                          <span className="truncate">{team.name}</span>
                          {selected && <CheckCircle size={14} className="ml-auto text-amber-400 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB: PARTICIPANTES ── */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            {isOpen && isAdmin ? 'Vista admin — pronósticos en tiempo real' : 'Plazo cerrado — predicciones visibles'}
          </p>
          {allUsersPreds.map((userPred) => {
            const isMe = userPred.profile.id === userId
            const matchCount = Object.keys(userPred.matchPreds).length
            const qualifyCount = userPred.qualifyTeamIds.length
            const pct = totalGroupMatches > 0 ? Math.round((matchCount / totalGroupMatches) * 100) : 0
            return (
              <div
                key={userPred.profile.id}
                className={cn(
                  'glass rounded-xl p-4 flex items-center gap-3 border',
                  isMe ? 'border-amber-500/30' : 'border-gray-800',
                )}
              >
                <UserAvatar avatarUrl={userPred.profile.avatar_url} name={userPred.profile.name} size={9} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {userPred.profile.name}
                    {isMe && <span className="ml-1 text-xs text-amber-400">(tú)</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{matchCount}/{totalGroupMatches} partidos</span>
                    <span className="text-xs text-gray-500">{qualifyCount}/24 clasificados</span>
                    <span className={cn(
                      'text-xs font-semibold',
                      pct === 100 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400',
                    )}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setViewingUser(userPred); setActiveTab('matches') }}
                  className="text-xs text-gray-400 hover:text-amber-400 border border-gray-700 hover:border-amber-500/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Ver →
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Save button (only when editing own predictions) */}
      {isOpen && !viewingUser && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="flex flex-col items-end gap-2">
            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-1">{error}</p>}
            {saved && (
              <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded px-3 py-1 flex items-center gap-1">
                <CheckCircle size={12} /> Guardado correctamente
              </p>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="shadow-2xl shadow-amber-500/30"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar predicciones'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
