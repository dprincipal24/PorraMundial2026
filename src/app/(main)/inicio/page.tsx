import { createClient } from '@/lib/supabase/server'
import { CountdownTimer } from '@/components/CountdownTimer'
import { Star, BarChart2, Lock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const PHASE_CONFIG: Record<string, { label: string; emoji: string; desc: string; color: string }> = {
  registration:         { label: 'Registro abierto',               emoji: '📋', desc: 'Los participantes se están registrando',          color: 'text-blue-400' },
  group_predictions:    { label: 'Pronósticos de grupos abiertos', emoji: '⚽', desc: 'Ya puedes introducir tus predicciones de grupos',  color: 'text-green-400' },
  groups_playing:       { label: 'Fase de grupos en curso',        emoji: '🏟️', desc: 'Los partidos de grupos se están jugando',          color: 'text-amber-400' },
  knockout_predictions: { label: 'Pronósticos eliminatorias',      emoji: '🎯', desc: 'Introduce tus predicciones para la eliminatoria',  color: 'text-green-400' },
  knockout_playing:     { label: 'Eliminatoria en curso',          emoji: '🔥', desc: 'Los partidos eliminatorios se están jugando',       color: 'text-red-400' },
  finished:             { label: 'Torneo finalizado',              emoji: '🏆', desc: '¡El Mundial 2026 ha terminado!',                   color: 'text-amber-400' },
}

export default async function InicioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: settings }, { data: scores }] = await Promise.all([
    supabase.from('app_settings').select('key, value'),
    supabase.rpc('calculate_scores'),
  ])

  const settingsMap = Object.fromEntries((settings ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  const phase = settingsMap['phase'] ?? 'registration'
  const phaseConfig = PHASE_CONFIG[phase] ?? PHASE_CONFIG['registration']

  const groupOpen = settingsMap['group_predictions_open'] === 'true'
  const knockoutOpen = settingsMap['knockout_predictions_open'] === 'true'
  const groupDeadline = settingsMap['group_predictions_deadline'] ?? null
  const knockoutDeadline = settingsMap['knockout_predictions_deadline'] ?? null
  const activeDeadline = groupOpen ? groupDeadline : knockoutOpen ? knockoutDeadline : null
  const anyPredictionsOpen = groupOpen || knockoutOpen

  const N = (scores ?? []).length
  const myScore = (scores ?? []).find((s: { user_id: string }) => s.user_id === user?.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Hero */}
      <div className="text-center py-2">
        <div className="flex justify-center mb-2">
          <Image
            src="https://files.tips.gg/static/image/news/World-Cup-2026-Logo-PNG.png"
            alt="FIFA World Cup 2026"
            width={320}
            height={320}
            className="w-64 sm:w-80 h-auto drop-shadow-2xl"
            unoptimized
            priority
          />
        </div>
        <h1 className="text-3xl font-black text-white">Porra Mundial 2026</h1>
        <p className="text-gray-500 text-sm mt-1">USA · Canadá · México</p>
      </div>

      {/* Fase actual */}
      <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fase actual</p>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{phaseConfig.emoji}</span>
          <div>
            <p className={`text-xl font-black ${phaseConfig.color}`}>{phaseConfig.label}</p>
            <p className="text-gray-400 text-sm mt-0.5">{phaseConfig.desc}</p>
          </div>
        </div>

        {activeDeadline && (
          <div className="pt-3 border-t border-white/10">
            <CountdownTimer deadline={activeDeadline} label="Cierre de pronósticos" />
          </div>
        )}

        {!anyPredictionsOpen && (groupDeadline || knockoutDeadline) && (
          <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-sm text-red-400">
            <Lock size={14} />
            <span>Pronósticos cerrados</span>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/predictions/groups" className="glass rounded-xl p-4 border border-white/10 hover:border-amber-500/40 transition-colors">
          <Star size={20} className="text-amber-400 mb-2" />
          <p className="font-bold text-white text-sm">Mis pronósticos</p>
          <p className="text-xs text-gray-500 mt-0.5">Grupos, eliminatorias y premios</p>
        </Link>
        <Link href="/leaderboard" className="glass rounded-xl p-4 border border-white/10 hover:border-blue-500/40 transition-colors">
          <BarChart2 size={20} className="text-blue-400 mb-2" />
          <p className="font-bold text-white text-sm">Clasificación</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {N} participantes
            {myScore ? ` · Tú #${(scores ?? []).findIndex((s: { user_id: string }) => s.user_id === user?.id) + 1}` : ''}
          </p>
        </Link>
      </div>
    </div>
  )
}
