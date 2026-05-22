'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CountdownTimer } from '@/components/CountdownTimer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Save, Lock, CheckCircle, Trophy, Clock } from 'lucide-react'
import type { Team } from '@/lib/types'

const ROUNDS = [
  { key: 'r16',     label: 'Octavos de Final',  pts: 5,  teams: 16, emoji: '🔟' },
  { key: 'qf',      label: 'Cuartos de Final',   pts: 9,  teams: 8,  emoji: '⚡' },
  { key: 'sf',      label: 'Semifinales',         pts: 15, teams: 4,  emoji: '🔥' },
  { key: 'final',   label: 'Final',               pts: 25, teams: 2,  emoji: '🌟' },
  { key: 'champion',label: 'Campeón del Mundo',   pts: 40, teams: 1,  emoji: '🏆' },
]

interface KnockoutPredictionsClientProps {
  teams: Team[]
  knockoutPredictions: { round: string; team_id: string }[]
  userId: string
  isOpen: boolean
  deadline: string | null
  phase: string
}

export function KnockoutPredictionsClient({
  teams,
  knockoutPredictions: initial,
  userId,
  isOpen,
  deadline,
  phase,
}: KnockoutPredictionsClientProps) {
  const [predsMap, setPredsMap] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {}
    for (const r of ROUNDS) m[r.key] = new Set()
    for (const p of initial) m[p.round]?.add(p.team_id)
    return m
  })
  const [activeRound, setActiveRound] = useState('r16')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  function toggleTeam(round: string, teamId: string) {
    if (!isOpen) return
    const maxTeams = ROUNDS.find((r) => r.key === round)!.teams
    setPredsMap((prev) => {
      const next = { ...prev, [round]: new Set(prev[round]) }
      if (next[round].has(teamId)) {
        next[round].delete(teamId)
      } else {
        if (next[round].size >= maxTeams) return prev
        next[round].add(teamId)
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await supabase.from('knockout_predictions').delete().eq('user_id', userId)
      const rows = []
      for (const [round, teamIds] of Object.entries(predsMap)) {
        for (const team_id of teamIds) {
          rows.push({ user_id: userId, round, team_id })
        }
      }
      if (rows.length > 0) {
        const { error } = await supabase.from('knockout_predictions').insert(rows)
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

  const notYetAvailable = ['group_predictions', 'groups_playing', 'registration'].includes(phase)

  if (notYetAvailable) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Clock size={48} className="mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-bold text-white mb-2">Todavía no disponible</h2>
        <p className="text-gray-400">
          Las predicciones de eliminatorias se abrirán una vez que finalice la fase de grupos.
        </p>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-bold text-white mb-2">Equipos pendientes</h2>
        <p className="text-gray-400">
          El administrador aún no ha registrado los equipos clasificados. Vuelve pronto.
        </p>
      </div>
    )
  }

  const currentRound = ROUNDS.find((r) => r.key === activeRound)!
  const currentPreds = predsMap[activeRound]
  const availableTeams = activeRound === 'r16' ? teams : teams.filter((t) => {
    const prevRound = ROUNDS[ROUNDS.findIndex((r) => r.key === activeRound) - 1]
    return prevRound ? predsMap[prevRound.key].has(t.id) : true
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="text-amber-400" size={22} />
            Predicciones Eliminatorias
          </h1>
          <p className="text-gray-500 text-sm mt-1">Selecciona los equipos que avanzarán en cada ronda</p>
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

      {/* Round tabs */}
      <div className="flex flex-wrap gap-2">
        {ROUNDS.map((round) => {
          const count = predsMap[round.key].size
          const complete = count === round.teams
          return (
            <button
              key={round.key}
              onClick={() => setActiveRound(round.key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border cursor-pointer',
                activeRound === round.key
                  ? 'bg-amber-500 text-gray-900 border-amber-500'
                  : complete
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-white',
              )}
            >
              <span>{round.emoji}</span>
              <span className="hidden sm:inline">{round.label}</span>
              <span className="sm:hidden">{round.key.toUpperCase()}</span>
              <span className={cn(
                'text-xs font-bold px-1.5 py-0.5 rounded-full',
                activeRound === round.key ? 'bg-black/20' : 'bg-gray-700',
              )}>
                {count}/{round.teams}
              </span>
              <span className="text-xs opacity-60">+{round.pts}</span>
            </button>
          )
        })}
      </div>

      {/* Team selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white">{currentRound.emoji} {currentRound.label}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Selecciona {currentRound.teams} equipo{currentRound.teams !== 1 ? 's' : ''} ·{' '}
              <span className="text-amber-400">+{currentRound.pts} pts por acierto</span>
            </p>
          </div>
          <span className={cn(
            'text-sm font-bold',
            currentPreds.size === currentRound.teams ? 'text-green-400' : 'text-gray-500',
          )}>
            {currentPreds.size}/{currentRound.teams}
          </span>
        </div>

        {availableTeams.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            Selecciona primero los equipos de la ronda anterior
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {availableTeams.map((team) => {
              const selected = currentPreds.has(team.id)
              const disabled = !isOpen || (!selected && currentPreds.size >= currentRound.teams)
              return (
                <button
                  key={team.id}
                  disabled={disabled}
                  onClick={() => toggleTeam(activeRound, team.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer',
                    selected
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                      : disabled
                      ? 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-50'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-700',
                  )}
                >
                  <span className="text-3xl">{team.flag}</span>
                  <span className="text-center text-xs leading-tight">{team.name}</span>
                  {selected && <CheckCircle size={14} className="text-amber-400" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Save */}
      {isOpen && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="flex flex-col items-end gap-2">
            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-1">{error}</p>}
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
  )
}
