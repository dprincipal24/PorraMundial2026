'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { LeaderboardTable } from '@/components/LeaderboardTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart2, RefreshCw, Coins, X, Check } from 'lucide-react'
import { AVATAR_EMOJIS } from '@/lib/data/awards'
import type { UserScore } from '@/lib/types'

interface LeaderboardClientProps {
  scores: UserScore[]
  currentUserId?: string
  phase: string
  groupPredsClosed?: boolean
}

const PHASE_LABELS: Record<string, string> = {
  registration:          'Registro abierto',
  group_predictions:     'Pronósticos de grupos abiertos',
  groups_playing:        'Fase de grupos en curso',
  knockout_predictions:  'Pronósticos eliminatorias abiertos',
  knockout_playing:      'Fase eliminatoria en curso',
  finished:              'Torneo finalizado',
}

function pot1st(n: number) { return Math.max(0, 8 * n - 10) }
function pot2nd(n: number) { return Math.max(0, 2 * n) }
const pot3rd = 10

function AvatarDisplay({ avatarUrl, name, size = 10 }: { avatarUrl: string | null; name: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    return <Image src={avatarUrl} alt={name} width={40} height={40} className={`${cls} object-cover`} unoptimized />
  }
  if (avatarUrl && avatarUrl.length <= 4) {
    return <div className={`${cls} bg-gray-800 flex items-center justify-center text-2xl`}>{avatarUrl}</div>
  }
  return (
    <div className={`${cls} bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-base font-black text-white`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function LeaderboardClient({ scores: initialScores, currentUserId, phase, groupPredsClosed }: LeaderboardClientProps) {
  const [scores, setScores] = useState<UserScore[]>(initialScores)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [urlInput, setUrlInput] = useState<string>('')

  const supabase = createClient()
  const myScore = scores.find((s) => s.user_id === currentUserId)
  const N = scores.length

  useEffect(() => {
    if (myScore) {
      setAvatarUrl(myScore.avatar_url ?? '')
      if (myScore.avatar_url?.startsWith('http')) setUrlInput(myScore.avatar_url)
    }
  }, [myScore])

  useEffect(() => {
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

  async function saveAvatar(value: string) {
    if (!currentUserId) return
    setSavingAvatar(true)
    await supabase.from('profiles').update({ avatar_url: value || null }).eq('id', currentUserId)
    setAvatarUrl(value)
    setScores(prev => prev.map(s => s.user_id === currentUserId ? { ...s, avatar_url: value || null } : s))
    setSavingAvatar(false)
    setShowAvatarPicker(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart2 className="text-amber-400" size={22} />
            Clasificación
          </h1>
          <p className="text-gray-500 text-sm mt-1">{PHASE_LABELS[phase] ?? phase}</p>
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

      {/* Bote */}
      {N > 0 && (
        <div className="glass rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Coins size={18} className="text-yellow-400" />
            <h2 className="font-black text-yellow-400 text-lg">Bote: {N * 10}€</h2>
            <span className="text-xs text-gray-500">({N} jugadores × 10€)</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-amber-500/10 rounded-lg py-2 px-3">
              <p className="text-amber-400 text-xl font-black">🥇 {pot1st(N)}€</p>
              <p className="text-xs text-gray-500 mt-0.5">1.º clasificado</p>
            </div>
            <div className="bg-gray-400/10 rounded-lg py-2 px-3">
              <p className="text-gray-300 text-xl font-black">🥈 {pot2nd(N)}€</p>
              <p className="text-xs text-gray-500 mt-0.5">2.º clasificado</p>
            </div>
            <div className="bg-amber-700/10 rounded-lg py-2 px-3">
              <p className="text-amber-700 text-xl font-black">🥉 {pot3rd}€</p>
              <p className="text-xs text-gray-500 mt-0.5">3.º clasificado</p>
            </div>
          </div>
        </div>
      )}

      {/* My position card */}
      {myScore && (
        <div className="glass rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="relative group cursor-pointer"
                title="Cambiar avatar"
              >
                <AvatarDisplay avatarUrl={myScore.avatar_url} name={myScore.name} size={10} />
                <span className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">✏️</span>
              </button>
              <div>
                <p className="font-bold text-white">{myScore.name} <span className="text-amber-400 text-xs">(tú)</span></p>
                <p className="text-xs text-gray-500">Posición #{myScore.position} de {N}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-amber-400">{myScore.total_points}</p>
              <p className="text-xs text-gray-500">puntos</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-800">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{myScore.match_points}</p>
              <p className="text-xs text-gray-500">Partidos</p>
            </div>
            <div className="text-center border-x border-gray-800">
              <p className="text-lg font-bold text-white">{myScore.group_qualify_points}</p>
              <p className="text-xs text-gray-500">Clasif.</p>
            </div>
            <div className="text-center border-r border-gray-800">
              <p className="text-lg font-bold text-white">{myScore.knockout_points}</p>
              <p className="text-xs text-gray-500">Elim.</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-300">{myScore.award_points ?? 0}</p>
              <p className="text-xs text-gray-500">Premios</p>
            </div>
          </div>
        </div>
      )}

      {/* Avatar picker */}
      {showAvatarPicker && (
        <div className="glass rounded-xl p-5 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Elige tu avatar</h3>
            <button onClick={() => setShowAvatarPicker(false)} className="text-gray-500 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>

          {/* Emoji grid */}
          <div className="grid grid-cols-10 gap-1.5">
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => saveAvatar(emoji)}
                disabled={savingAvatar}
                className={`text-2xl p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ${avatarUrl === emoji ? 'bg-amber-500/20 ring-1 ring-amber-500' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Custom URL */}
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="O pega una URL de imagen..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => saveAvatar(urlInput)}
              disabled={savingAvatar || !urlInput.startsWith('http')}
            >
              <Check size={14} />
              Usar URL
            </Button>
          </div>

          {/* Remove avatar */}
          {(myScore?.avatar_url) && (
            <button
              onClick={() => saveAvatar('')}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Quitar avatar
            </button>
          )}
        </div>
      )}

      {/* Scoring legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="gray">Partidos: 3 / 6 pts</Badge>
        <Badge variant="blue">Clasificados: 5 pts</Badge>
        <Badge variant="green">Elim: 5/9/15/25 pts</Badge>
        <Badge variant="gold">Campeón: 40 pts</Badge>
        <Badge variant="blue">Premios: 25 pts c/u</Badge>
      </div>

      {/* Table */}
      <LeaderboardTable scores={scores} currentUserId={currentUserId} linkable={groupPredsClosed} />

      <p className="text-center text-xs text-gray-700">
        Actualizado {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        {' · '}Actualización en tiempo real activada
      </p>
    </div>
  )
}
