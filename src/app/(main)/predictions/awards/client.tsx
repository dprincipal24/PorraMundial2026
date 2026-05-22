'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AWARDS, AWARD_PLAYERS, type AwardType } from '@/lib/data/awards'
import { Save, Lock, CheckCircle, XCircle, Medal } from 'lucide-react'

interface AwardPredictionsClientProps {
  userId: string
  predMap: Record<string, string>
  winners: Record<string, string>
  isOpen: boolean
  deadline: string | null
}

export function AwardPredictionsClient({ userId, predMap: initialPredMap, winners, isOpen }: AwardPredictionsClientProps) {
  const [predMap, setPredMap] = useState<Record<string, string>>(initialPredMap)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const upserts = Object.entries(predMap)
        .filter(([, player]) => player)
        .map(([award_type, player_name]) => ({
          user_id: userId,
          award_type,
          player_name,
        }))

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('award_predictions')
          .upsert(upserts, { onConflict: 'user_id,award_type' })
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

  const completedCount = AWARDS.filter(a => predMap[a.type]).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Medal className="text-amber-400" size={22} />
            Premios Individuales
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {completedCount}/4 premios pronosticados · 25 pts cada uno
          </p>
        </div>
        {!isOpen && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <Lock size={14} />
            <span>Cerrado</span>
          </div>
        )}
      </div>

      {/* Award cards */}
      <div className="space-y-4">
        {AWARDS.map((award) => {
          const myPick = predMap[award.type] ?? ''
          const winner = winners[award.settingKey]
          const isCorrect = winner && myPick === winner
          const isWrong = winner && myPick && myPick !== winner

          return (
            <div
              key={award.type}
              className={cn(
                'glass rounded-xl p-5 border transition-all',
                isCorrect ? 'border-green-500/50 bg-green-500/5' :
                isWrong   ? 'border-red-500/20' :
                myPick    ? 'border-amber-500/30' :
                            'border-gray-800',
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-black text-white text-lg flex items-center gap-2">
                    <span className="text-2xl">{award.emoji}</span>
                    {award.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{award.description} · 25 pts</p>
                </div>
                {isCorrect && (
                  <div className="flex items-center gap-1 text-green-400 text-sm font-bold shrink-0">
                    <CheckCircle size={16} />
                    +25 pts
                  </div>
                )}
                {isWrong && (
                  <div className="flex items-center gap-1 text-red-400 text-sm shrink-0">
                    <XCircle size={16} />
                    Fallado
                  </div>
                )}
              </div>

              {/* Winner announced */}
              {winner && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
                  <span className="text-gray-400">Ganador real: </span>
                  <span className="text-white font-bold">
                    {AWARD_PLAYERS.find(p => p.name === winner)?.flag} {winner}
                  </span>
                </div>
              )}

              {/* Selector */}
              {isOpen ? (
                <select
                  value={myPick}
                  onChange={(e) => setPredMap(prev => ({ ...prev, [award.type as AwardType]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">— Elige un jugador —</option>
                  {AWARD_PLAYERS.map((player) => (
                    <option key={player.name} value={player.name}>
                      {player.flag} {player.name} ({player.country})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2.5 bg-gray-800/50 rounded-lg text-sm">
                  {myPick
                    ? <span className="text-amber-400 font-semibold">
                        {AWARD_PLAYERS.find(p => p.name === myPick)?.flag} {myPick}
                      </span>
                    : <span className="text-gray-600">Sin pronóstico</span>
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save */}
      {isOpen && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="flex flex-col items-end gap-2">
            {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-1">{error}</p>}
            {saved && (
              <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded px-3 py-1 flex items-center gap-1">
                <CheckCircle size={12} /> Guardado
              </p>
            )}
            <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-2xl shadow-amber-500/30">
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar premios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
