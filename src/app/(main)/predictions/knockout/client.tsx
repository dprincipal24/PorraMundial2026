'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { CountdownTimer } from '@/components/CountdownTimer'
import { TeamFlag } from '@/components/TeamFlag'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TEAMS } from '@/lib/data/teams'
import {
  Save, Lock, CheckCircle, Trophy, Users, ArrowLeft,
  AlertCircle, ChevronDown, ChevronRight,
} from 'lucide-react'
import type { Team } from '@/lib/types'
import type { KnockoutUserPred } from './page'

const ISO_MAP: Record<string, string> = Object.fromEntries(TEAMS.map(t => [t.id, t.iso]))

const ROUNDS = [
  { key: 'r16',      label: 'Octavos de Final', pts: 5,  count: 16, emoji: '🔟' },
  { key: 'qf',       label: 'Cuartos de Final',  pts: 9,  count: 8,  emoji: '⚡' },
  { key: 'sf',       label: 'Semifinales',        pts: 15, count: 4,  emoji: '🔥' },
  { key: 'final',    label: 'Final',              pts: 25, count: 2,  emoji: '🌟' },
  { key: 'champion', label: 'Campeón del Mundo',  pts: 40, count: 1,  emoji: '🏆' },
]

interface Props {
  teams: Team[]
  knockoutPredictions: { round: string; team_id: string }[]
  userId: string
  isOpen: boolean
  deadline: string | null
  phase: string
  isAdmin: boolean
  allUsersPreds: KnockoutUserPred[]
}

function UserAvatar({ avatarUrl, name, size = 7 }: { avatarUrl: string | null; name: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  if (avatarUrl?.startsWith('http')) {
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

// ── Custom dropdown to show flag emojis (native <select> strips them on Windows) ──
interface TeamSelectProps {
  value: string
  options: [string, Team[]][]
  onChange: (id: string) => void
  isDup: boolean
  teamMap: Record<string, Team>
}

function TeamSelect({ value, options, onChange, isDup, teamMap }: TeamSelectProps) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  function openDropdown() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropH = 248
    const top = window.innerHeight - rect.bottom >= dropH
      ? rect.bottom + 2
      : rect.top - dropH - 2
    setDropPos({ top, left: rect.left, width: Math.max(rect.width, 190) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return
      if (dropRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onScroll(e: Event) {
      if (dropRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const selected = value ? teamMap[value] : null

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={cn(
          'w-full flex items-center gap-1.5 px-2.5 py-2 border rounded-lg text-sm text-left cursor-pointer transition-colors',
          isDup
            ? 'border-red-500 bg-red-500/10 text-red-300'
            : value
            ? 'border-amber-500/60 bg-amber-500/5 text-white'
            : 'border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600',
        )}
      >
        {selected ? (
          <>
            <TeamFlag iso={ISO_MAP[selected.id] ?? 'un'} name={selected.name} size={20} className="w-5 h-3.5 shrink-0" />
            <span className="flex-1 truncate text-xs">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-xs">— Elegir —</span>
        )}
        <ChevronDown size={11} className="text-gray-500 flex-shrink-0" />
      </button>

      {open && dropPos && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-800 transition-colors border-b border-gray-800"
            >
              — Elegir —
            </button>
            {options.map(([group, groupTeams]) => (
              <div key={group}>
                <p className="px-3 pt-2 pb-0.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Grupo {group}
                </p>
                {groupTeams.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { onChange(t.id); setOpen(false) }}
                    className={cn(
                      'w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 transition-colors',
                      value === t.id ? 'bg-amber-500/10 text-amber-300' : 'text-gray-300',
                    )}
                  >
                    <TeamFlag iso={ISO_MAP[t.id] ?? 'un'} name={t.name} size={20} className="w-5 h-3.5 shrink-0" />
                    <span className="text-xs flex-1">{t.name}</span>
                    {value === t.id && <CheckCircle size={11} className="text-amber-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

// ─────────────────────────────────────────────

function initPredsMap(initial: { round: string; team_id: string }[]): Record<string, string[]> {
  const byRound: Record<string, string[]> = {}
  for (const p of initial) {
    if (!byRound[p.round]) byRound[p.round] = []
    byRound[p.round].push(p.team_id)
  }
  const m: Record<string, string[]> = {}
  for (const r of ROUNDS) {
    const existing = byRound[r.key] ?? []
    m[r.key] = [...existing, ...Array(Math.max(0, r.count - existing.length)).fill('')]
  }
  return m
}

function findDups(slots: string[]): Set<number> {
  const positions: Record<string, number[]> = {}
  slots.forEach((id, i) => {
    if (!id) return
    if (!positions[id]) positions[id] = []
    positions[id].push(i)
  })
  const dups = new Set<number>()
  for (const idxs of Object.values(positions)) {
    if (idxs.length > 1) idxs.forEach(i => dups.add(i))
  }
  return dups
}

function groupedByGroup(teams: Team[]): [string, Team[]][] {
  const map: Record<string, Team[]> = {}
  for (const t of teams) {
    if (!map[t.group]) map[t.group] = []
    map[t.group].push(t)
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

// ─────────────────────────────────────────────

export function KnockoutPredictionsClient({
  teams,
  knockoutPredictions: initial,
  userId,
  isOpen,
  deadline,
  isAdmin,
  allUsersPreds,
}: Props) {
  const [predsMap, setPredsMap] = useState<Record<string, string[]>>(() => initPredsMap(initial))
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(() => {
    for (const r of ROUNDS) {
      if (initial.filter(p => p.round === r.key).length < r.count) return new Set([r.key])
    }
    return new Set(['r16'])
  })
  const [activeTab, setActiveTab] = useState<'bracket' | 'all'>('bracket')
  const [viewingUser, setViewingUser] = useState<KnockoutUserPred | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const supabase = createClient()
  const canSeeAll = !isOpen || isAdmin
  const canEdit = isOpen && !viewingUser

  const activePreds: Record<string, string[]> = viewingUser
    ? Object.fromEntries(ROUNDS.map(r => [r.key, viewingUser.predsByRound[r.key] ?? []]))
    : predsMap

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

  function availableForRound(roundKey: string): Team[] {
    if (roundKey === 'r16') return teams
    const prevIdx = ROUNDS.findIndex(r => r.key === roundKey) - 1
    const unique = new Set(activePreds[ROUNDS[prevIdx].key].filter(Boolean))
    return teams.filter(t => unique.has(t.id))
  }

  function setSlot(roundKey: string, slotIdx: number, teamId: string) {
    if (!canEdit) return
    setPredsMap(prev => {
      const next: Record<string, string[]> = { ...prev }
      next[roundKey] = [...prev[roundKey]]
      next[roundKey][slotIdx] = teamId
      const roundIdx = ROUNDS.findIndex(r => r.key === roundKey)
      for (let i = roundIdx + 1; i < ROUNDS.length; i++) {
        const available = new Set(next[ROUNDS[i - 1].key].filter(Boolean))
        next[ROUNDS[i].key] = next[ROUNDS[i].key].map(id => (id && available.has(id) ? id : ''))
      }
      return next
    })
  }

  function toggleRound(key: string) {
    setExpandedRounds(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleSave() {
    if (ROUNDS.some(r => findDups(predsMap[r.key]).size > 0)) {
      setSaveError('Tienes equipos repetidos. Corrígelos antes de guardar.')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await supabase.from('knockout_predictions').delete().eq('user_id', userId)
      const rows: { user_id: string; round: string; team_id: string }[] = []
      for (const [round, slots] of Object.entries(predsMap)) {
        for (const team_id of new Set(slots.filter(Boolean))) {
          rows.push({ user_id: userId, round, team_id })
        }
      }
      if (rows.length > 0) {
        const { error } = await supabase.from('knockout_predictions').insert(rows)
        if (error) throw error
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen && !isAdmin && initial.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Lock size={48} className="mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-bold text-white mb-2">Todavía no disponible</h2>
        <p className="text-gray-400">Las predicciones de eliminatorias se abrirán próximamente.</p>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-bold text-white mb-2">Equipos pendientes</h2>
        <p className="text-gray-400">El administrador aún no ha cargado los equipos. Vuelve pronto.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="text-amber-400" size={22} />
            Predicciones Eliminatorias
          </h1>
          <p className="text-gray-500 text-sm mt-1">Elige los equipos que avanzarán en cada ronda</p>
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

      {/* Viewing user banner */}
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
      {canSeeAll && (
        <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit">
          <button
            onClick={() => { setActiveTab('bracket'); setViewingUser(null) }}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer',
              activeTab === 'bracket' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white',
            )}
          >
            🏆 Mis predicciones
          </button>
          <button
            onClick={() => { setActiveTab('all'); setViewingUser(null) }}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'all' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white',
            )}
          >
            <Users size={14} />
            Participantes
          </button>
        </div>
      )}

      {/* ── BRACKET TAB ── */}
      {activeTab === 'bracket' && (
        <div className="space-y-3">
          {ROUNDS.map((round, roundIdx) => {
            const slots = activePreds[round.key]
            const filled = new Set(slots.filter(Boolean)).size
            const isDone = filled === round.count
            const isExpanded = expandedRounds.has(round.key)
            const dups = canEdit ? findDups(predsMap[round.key]) : new Set<number>()
            const hasDups = dups.size > 0
            const available = availableForRound(round.key)
            const availableGrouped = groupedByGroup(available)
            const displayTeams = [...new Set(slots.filter(Boolean))].map(id => teamMap[id]).filter(Boolean)

            return (
              <div
                key={round.key}
                className={cn(
                  'glass rounded-2xl border',
                  isDone && !hasDups
                    ? 'border-green-500/30'
                    : hasDups
                    ? 'border-red-500/30'
                    : 'border-white/10',
                )}
              >
                {/* Accordion header */}
                <button
                  onClick={() => toggleRound(round.key)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-white/5 transition-colors rounded-2xl"
                >
                  <span className="text-2xl">{round.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        'font-black text-base',
                        isDone && !hasDups ? 'text-green-400' : 'text-white',
                      )}>
                        {round.label}
                      </p>
                      <span className="text-xs text-amber-400 font-semibold">+{round.pts} pts</span>
                      {hasDups && (
                        <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                          <AlertCircle size={11} />
                          Hay repetidos
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {filled}/{round.count} equipos seleccionados
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isDone && !hasDups && <CheckCircle size={16} className="text-green-400" />}
                    {isExpanded
                      ? <ChevronDown size={16} className="text-gray-500" />
                      : <ChevronRight size={16} className="text-gray-500" />
                    }
                  </div>
                </button>

                {/* Accordion body */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/5">
                    {canEdit ? (
                      <div className="space-y-3 pt-4">
                        <p className="text-xs text-gray-500">
                          {roundIdx === 0
                            ? `Elige ${round.count} equipos de los ${teams.length} del Mundial`
                            : available.length === 0
                            ? `Primero completa los ${ROUNDS[roundIdx - 1].label}`
                            : `Elige ${round.count} de los ${available.length} que seleccionaste antes`
                          }
                        </p>

                        {available.length === 0 && roundIdx > 0 ? (
                          <p className="text-sm text-gray-500 py-2">
                            Selecciona equipos en{' '}
                            <span className="text-amber-400">{ROUNDS[roundIdx - 1].label}</span>{' '}
                            para desbloquear esta ronda.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {Array.from({ length: round.count }, (_, slotIdx) => (
                              <TeamSelect
                                key={slotIdx}
                                value={predsMap[round.key][slotIdx]}
                                options={availableGrouped}
                                onChange={id => setSlot(round.key, slotIdx, id)}
                                isDup={dups.has(slotIdx)}
                                teamMap={teamMap}
                              />
                            ))}
                          </div>
                        )}

                        {hasDups && (
                          <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                            <span>Tienes equipos repetidos. Cada equipo solo puede aparecer una vez en esta ronda.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Read-only: chips */
                      <div className="pt-3 flex flex-wrap gap-2">
                        {displayTeams.length === 0 ? (
                          <p className="text-sm text-gray-600 py-1">Sin predicciones</p>
                        ) : (
                          displayTeams.map(t => (
                            <div
                              key={t.id}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg"
                            >
                              <TeamFlag iso={ISO_MAP[t.id] ?? 'un'} name={t.name} size={20} className="w-5 h-3.5 shrink-0" />
                              <span className="text-xs text-gray-300">{t.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Save button */}
          {canEdit && (
            <div className="sticky bottom-4 flex justify-end pt-2">
              <div className="flex flex-col items-end gap-2">
                {saveError && (
                  <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-1">
                    {saveError}
                  </p>
                )}
                {saved && (
                  <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded px-3 py-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Guardado correctamente
                  </p>
                )}
                <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-2xl shadow-amber-500/30">
                  <Save size={16} />
                  {saving ? 'Guardando...' : 'Guardar predicciones'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PARTICIPANTS TAB ── */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            {isOpen && isAdmin ? 'Vista admin — pronósticos en tiempo real' : 'Plazo cerrado — predicciones visibles'}
          </p>
          {allUsersPreds.map(userPred => {
            const isMe = userPred.profile.id === userId
            const totalSelected = ROUNDS.reduce(
              (sum, r) => sum + (userPred.predsByRound[r.key] ?? []).length, 0,
            )
            const maxTotal = ROUNDS.reduce((sum, r) => sum + r.count, 0)
            const completedRounds = ROUNDS.filter(r =>
              (userPred.predsByRound[r.key] ?? []).length === r.count,
            ).length
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
                    <span className="text-xs text-gray-500">{completedRounds}/5 rondas</span>
                    <span className="text-xs text-gray-500">{totalSelected}/{maxTotal} equipos</span>
                    <span className={cn(
                      'text-xs font-semibold',
                      completedRounds === 5 ? 'text-green-400' : completedRounds >= 3 ? 'text-amber-400' : 'text-red-400',
                    )}>
                      {Math.round((totalSelected / maxTotal) * 100)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setViewingUser(userPred); setActiveTab('bracket') }}
                  className="text-xs text-gray-400 hover:text-amber-400 border border-gray-700 hover:border-amber-500/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Ver →
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
