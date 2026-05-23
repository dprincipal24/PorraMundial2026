'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { TeamFlag } from '@/components/TeamFlag'
import { PlayerSelect } from '@/components/PlayerSelect'
import { cn } from '@/lib/utils'
import { AWARDS, PLAYERS_BY_AWARD, type AwardType } from '@/lib/data/awards'
import { Save, Lock, CheckCircle, XCircle, Medal, AlertTriangle, Users } from 'lucide-react'

type AllUserPred = {
  profile: { id: string; name: string; avatar_url: string | null }
  picks: Record<string, string>
}

interface AwardPredictionsClientProps {
  userId: string
  predMap: Record<string, string>
  winners: Record<string, string>
  isOpen: boolean
  deadline: string | null
  isAdmin: boolean
  allUsersPreds: AllUserPred[]
}

function UserAvatar({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    return <Image src={avatarUrl} alt={name} width={28} height={28} className="w-7 h-7 rounded-full object-cover flex-shrink-0" unoptimized />
  }
  if (avatarUrl && avatarUrl.length <= 4) {
    return <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-base flex-shrink-0">{avatarUrl}</div>
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function AwardPredictionsClient({
  userId,
  predMap: initialPredMap,
  winners,
  isOpen,
  isAdmin,
  allUsersPreds,
}: AwardPredictionsClientProps) {
  const [predMap, setPredMap] = useState<Record<string, string>>(initialPredMap)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine')

  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const upserts = Object.entries(predMap)
        .filter(([, player]) => player)
        .map(([award_type, player_name]) => ({ user_id: userId, award_type, player_name }))

      if (upserts.length > 0) {
        const { error } = await supabase
          .from('award_predictions')
          .upsert(upserts, { onConflict: 'user_id,award_type' })
        if (error) throw error
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(`Error al guardar: ${(e as Error).message}`)
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const completedCount = AWARDS.filter(a => predMap[a.type]).length
  const missingCount = AWARDS.length - completedCount
  const canSeeAll = !isOpen || isAdmin

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

      {/* Missing warning */}
      {isOpen && missingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <span className="text-sm">
            <span className="text-white font-semibold">Pronósticos pendientes: </span>
            <span className="text-amber-400">{missingCount} premio{missingCount !== 1 ? 's' : ''} sin seleccionar</span>
          </span>
        </div>
      )}

      {/* Tabs */}
      {canSeeAll && (
        <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('mine')}
            className={cn('px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer',
              activeTab === 'mine' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white')}
          >
            Mis pronósticos
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer',
              activeTab === 'all' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white')}
          >
            <Users size={14} />
            Participantes
          </button>
        </div>
      )}

      {/* ── TAB: MIS PRONÓSTICOS ── */}
      {activeTab === 'mine' && (
        <div className="space-y-4">
          {AWARDS.map((award) => {
            const myPick = predMap[award.type] ?? ''
            const winner = winners[award.settingKey]
            const isCorrect = winner && myPick === winner
            const isWrong = winner && myPick && myPick !== winner
            const players = PLAYERS_BY_AWARD[award.type as AwardType]
            const winnerPlayer = winner ? players.find(p => p.name === winner) : null

            return (
              <div
                key={award.type}
                className={cn(
                  'glass rounded-xl p-5 border transition-all',
                  isCorrect ? 'border-green-500/50 bg-green-500/5' :
                  isWrong   ? 'border-red-500/20' :
                  myPick    ? 'border-amber-500/30' : 'border-gray-800',
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
                      <CheckCircle size={16} />+25 pts
                    </div>
                  )}
                  {isWrong && (
                    <div className="flex items-center gap-1 text-red-400 text-sm shrink-0">
                      <XCircle size={16} />Fallado
                    </div>
                  )}
                </div>

                {winner && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm flex items-center gap-2 flex-wrap">
                    <span className="text-gray-400">Ganador real:</span>
                    {winnerPlayer && <TeamFlag iso={winnerPlayer.iso} name={winnerPlayer.country} size={20} className="w-5 h-3.5" />}
                    <span className="text-white font-bold">{winner}</span>
                  </div>
                )}

                {isOpen ? (
                  <PlayerSelect
                    players={players}
                    value={myPick}
                    onChange={(name) => setPredMap(prev => ({ ...prev, [award.type as AwardType]: name }))}
                  />
                ) : (
                  <div className="px-3 py-2.5 bg-gray-800/50 rounded-lg text-sm flex items-center gap-2">
                    {myPick ? (
                      <>
                        {(() => { const p = players.find(pl => pl.name === myPick); return p ? <TeamFlag iso={p.iso} name={p.country} size={20} className="w-5 h-3.5" /> : null })()}
                        <span className="text-amber-400 font-semibold">{myPick}</span>
                      </>
                    ) : (
                      <span className="text-gray-600">Sin pronóstico</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB: PARTICIPANTES ── */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            {isOpen && isAdmin ? 'Vista admin — pronósticos en tiempo real' : 'Plazo cerrado — predicciones visibles'}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-500 font-semibold text-xs">Participante</th>
                  {AWARDS.map(a => (
                    <th key={a.type} className="text-center py-3 px-2 text-gray-500 font-semibold text-xs">
                      {a.emoji}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {allUsersPreds.map((userPred) => {
                  const isMe = userPred.profile.id === userId
                  return (
                    <tr key={userPred.profile.id} className={cn('transition-colors', isMe ? 'bg-amber-500/5' : 'hover:bg-gray-800/30')}>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar avatarUrl={userPred.profile.avatar_url} name={userPred.profile.name} />
                          <span className={cn('font-medium text-xs', isMe ? 'text-amber-400' : 'text-white')}>
                            {userPred.profile.name}
                            {isMe && <span className="ml-1 text-amber-500">(tú)</span>}
                          </span>
                        </div>
                      </td>
                      {AWARDS.map((award) => {
                        const pick = userPred.picks[award.type]
                        const winner = winners[award.settingKey]
                        const correct = winner && pick === winner
                        const wrong = winner && pick && pick !== winner
                        const pickPlayer = pick ? PLAYERS_BY_AWARD[award.type as AwardType].find(p => p.name === pick) : null
                        return (
                          <td key={award.type} className="text-center py-2.5 px-2">
                            {pick ? (
                              <span className={cn(
                                'text-xs font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-1',
                                correct ? 'text-green-400 bg-green-500/10' :
                                wrong   ? 'text-red-400 bg-red-500/10' :
                                          'text-amber-300 bg-amber-500/10',
                              )}>
                                {pickPlayer && <TeamFlag iso={pickPlayer.iso} name={pickPlayer.country} size={16} className="w-4 h-2.5 shrink-0" />}
                                {pick.split(' ')[0]}
                              </span>
                            ) : (
                              <span className="text-gray-700 text-xs">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save */}
      {isOpen && activeTab === 'mine' && (
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
