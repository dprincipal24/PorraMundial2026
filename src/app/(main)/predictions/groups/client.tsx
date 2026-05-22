'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchCard } from '@/components/MatchCard'
import { CountdownTimer } from '@/components/CountdownTimer'
import { Button } from '@/components/ui/button'
import { TeamFlag } from '@/components/TeamFlag'
import { GROUPS, getTeamsByGroup } from '@/lib/data/teams'
import { cn } from '@/lib/utils'
import { Save, Lock, CheckCircle, Users, Star } from 'lucide-react'
import type { Match, MatchPrediction, Team } from '@/lib/types'

interface GroupPredictionsClientProps {
  matches: Match[]
  predictions: MatchPrediction[]
  qualifyPredictions: string[]
  teams: Team[]
  userId: string
  isOpen: boolean
  deadline: string | null
}

export function GroupPredictionsClient({
  matches,
  predictions: initialPredictions,
  qualifyPredictions: initialQualify,
  teams,
  userId,
  isOpen,
  deadline,
}: GroupPredictionsClientProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'qualify'>('matches')
  const [activeGroup, setActiveGroup] = useState('A')
  const [predMap, setPredMap] = useState<Record<number, { home: number; away: number }>>(() =>
    Object.fromEntries(initialPredictions.map((p) => [p.match_id, { home: p.home_score, away: p.away_score }])),
  )
  const [qualifySet, setQualifySet] = useState<Set<string>>(new Set(initialQualify))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handlePredictionChange = useCallback((matchId: number, home: number, away: number) => {
    setPredMap((prev) => ({ ...prev, [matchId]: { home, away } }))
  }, [])

  const groupMatches = matches.filter((m) => m.group_name === activeGroup)
  const groupTeams = teams.filter((t) => t.group === activeGroup)

  // Max 2 qualifiers per group
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
      // Save match predictions
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

      // Save qualify predictions: delete old, insert new
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

  const totalMatchPreds = Object.keys(predMap).length
  const totalMatches = matches.length

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
            {totalMatchPreds}/{totalMatches} partidos pronosticados
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

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('matches')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer',
            activeTab === 'matches' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white',
          )}
        >
          ⚽ Partidos
        </button>
        <button
          onClick={() => setActiveTab('qualify')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer',
            activeTab === 'qualify' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white',
          )}
        >
          <Users size={14} className="inline mr-1" />
          Clasificados (+5 pts)
        </button>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-1.5">
        {GROUPS.map((g) => {
          const count = matches.filter((m) => m.group_name === g && predMap[m.id] !== undefined).length
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
              {count === total && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-gray-900" />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'matches' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Grupo {activeGroup}
            </h2>
            <span className="text-xs text-gray-600">
              {matches.filter((m) => m.group_name === activeGroup && predMap[m.id] !== undefined).length}/
              {matches.filter((m) => m.group_name === activeGroup).length} completados
            </span>
          </div>
          {groupMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={
                predMap[match.id]
                  ? {
                      id: '',
                      user_id: userId,
                      match_id: match.id,
                      home_score: predMap[match.id].home,
                      away_score: predMap[match.id].away,
                      created_at: '',
                    }
                  : undefined
              }
              onPredictionChange={isOpen ? handlePredictionChange : undefined}
              locked={!isOpen}
              showResult={match.status === 'finished'}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Selecciona los <strong className="text-white">2 equipos</strong> de cada grupo que crees que clasificarán.
            Cada acierto vale <strong className="text-amber-400">+5 puntos</strong>.
          </p>
          <div className="space-y-4">
            {GROUPS.map((g) => {
              const gTeams = groupTeams.filter((t) => t.group === g)
              if (gTeams.length === 0 && g !== activeGroup) return null
              const allGroupTeams = teams.filter((t) => t.group === g)
              const count = groupQualifyCount(g)
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
                      const selected = qualifySet.has(team.id)
                      const disabled = !isOpen || (!selected && groupQualifyCount(g) >= 2)
                      return (
                        <button
                          key={team.id}
                          disabled={disabled}
                          onClick={() => toggleQualify(team.id, g)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer',
                            selected
                              ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                              : disabled
                              ? 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed'
                              : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:text-white',
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

      {/* Save button */}
      {isOpen && (
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
