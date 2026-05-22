'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { Badge } from '@/components/ui/badge'
import { BarChart2, RefreshCw } from 'lucide-react'
import type { UserScore } from '@/lib/types'

interface LeaderboardClientProps {
  scores: UserScore[]
  currentUserId?: string
  phase: string
}

const PHASE_LABELS: Record<string, string> = {
  registration:          'Registro abierto',
  group_predictions:     'Pronósticos de grupos abiertos',
  groups_playing:        'Fase de grupos en curso',
  knockout_predictions:  'Pronósticos eliminatorias abiertos',
  knockout_playing:      'Fase eliminatoria en curso',
  finished:              'Torneo finalizado',
}

export function LeaderboardClient({ scores: initialScores, currentUserId, phase }: LeaderboardClientProps) {
  const [scores, setScores] = useState<UserScore[]>(initialScores)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const supabase = createClient()

  useEffect(() => {
    // Real-time: refresh scores when a match result changes
    const channel = supabase
      .channel('match-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, async () => {
        const { data } = await supabase.rpc('calculate_scores')
        if (data) {
          setScores(data.map((s: Record<string, unknown>, i: number) => ({ ...s, position: i + 1 } as UserScore)))
          setLastUpdate(new Date())
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  async function refresh() {
    setRefreshing(true)
    const { data } = await supabase.rpc('calculate_scores')
    if (data) {
      setScores(data.map((s: Record<string, unknown>, i: number) => ({ ...s, position: i + 1 } as UserScore)))
      setLastUpdate(new Date())
    }
    setRefreshing(false)
  }

  const myScore = scores.find((s) => s.user_id === currentUserId)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart2 className="text-amber-400" size={22} />
            Clasificación
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {PHASE_LABELS[phase] ?? phase}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* My position card */}
      {myScore && (
        <div className="glass rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-base font-black text-white">
                {myScore.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white">{myScore.name} <span className="text-amber-400 text-xs">(tú)</span></p>
                <p className="text-xs text-gray-500">Posición #{myScore.position} de {scores.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-amber-400">{myScore.total_points}</p>
              <p className="text-xs text-gray-500">puntos</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-800">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{myScore.match_points}</p>
              <p className="text-xs text-gray-500">Partidos</p>
            </div>
            <div className="text-center border-x border-gray-800">
              <p className="text-lg font-bold text-white">{myScore.group_qualify_points}</p>
              <p className="text-xs text-gray-500">Clasificados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{myScore.knockout_points}</p>
              <p className="text-xs text-gray-500">Eliminatorias</p>
            </div>
          </div>
        </div>
      )}

      {/* Scoring legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="gray">Partidos: 3 / 6 pts</Badge>
        <Badge variant="blue">Clasificados: 5 pts</Badge>
        <Badge variant="green">Elim: 5/9/15/25 pts</Badge>
        <Badge variant="gold">Campeón: 40 pts</Badge>
      </div>

      {/* Table */}
      <LeaderboardTable scores={scores} currentUserId={currentUserId} />

      <p className="text-center text-xs text-gray-700">
        Actualizado {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        {' · '}Actualización en tiempo real activada
      </p>
    </div>
  )
}
