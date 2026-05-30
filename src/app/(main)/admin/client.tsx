'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatMatchDate } from '@/lib/utils'
import { TeamFlag } from '@/components/TeamFlag'
import {
  Settings, Users, Trophy, Star, Save, CheckCircle,
  Building2, Crown, Database, Medal, KeyRound, X, GitBranch,
  Ban, Trash2, AlertTriangle,
} from 'lucide-react'
import { AWARDS, TEAMS_BY_AWARD, type AwardType } from '@/lib/data/awards'
import { PlayerAccordion } from '@/components/PlayerAccordion'
import type { Match, Team, Profile } from '@/lib/types'
import { SimuladorBracket } from '../simulador/SimuladorBracket'
import type { ScoreMap, WinnerMap } from '../simulador/simulatorLogic'

type AdminTab = 'phase' | 'results' | 'qualify' | 'awards' | 'users' | 'bracket'

const BRACKET_DOWNSTREAM: Record<number, { homeFrom: number; awayFrom: number }> = {
  89: { homeFrom: 74, awayFrom: 77 }, 90: { homeFrom: 73, awayFrom: 75 },
  91: { homeFrom: 76, awayFrom: 78 }, 92: { homeFrom: 79, awayFrom: 80 },
  93: { homeFrom: 83, awayFrom: 84 }, 94: { homeFrom: 81, awayFrom: 82 },
  95: { homeFrom: 86, awayFrom: 88 }, 96: { homeFrom: 85, awayFrom: 87 },
  97: { homeFrom: 89, awayFrom: 90 }, 98: { homeFrom: 93, awayFrom: 94 },
  99: { homeFrom: 91, awayFrom: 92 }, 100: { homeFrom: 95, awayFrom: 96 },
  101: { homeFrom: 97, awayFrom: 98 }, 102: { homeFrom: 99, awayFrom: 100 },
  103: { homeFrom: 101, awayFrom: 102 }, 104: { homeFrom: 101, awayFrom: 102 },
}

function bracketCascadeClear(matchId: number, winners: WinnerMap): WinnerMap {
  const next = { ...winners }
  function recurse(mid: number) {
    for (const [mStr, feed] of Object.entries(BRACKET_DOWNSTREAM)) {
      const downstream = parseInt(mStr)
      if (feed.homeFrom === mid || feed.awayFrom === mid) {
        if (next[downstream] !== undefined) {
          delete next[downstream]
          recurse(downstream)
        }
      }
    }
  }
  recurse(matchId)
  return next
}

const PHASE_OPTIONS = [
  { value: 'registration',         label: 'Registro abierto',               desc: 'Sólo se pueden crear cuentas' },
  { value: 'group_predictions',    label: 'Pronósticos grupos abiertos',     desc: 'Usuarios pueden pronosticar partidos de grupos' },
  { value: 'groups_playing',       label: 'Fase de grupos en curso',         desc: 'Grupos en juego, pronósticos cerrados' },
  { value: 'knockout_predictions', label: 'Pronósticos eliminatorias',       desc: 'Usuarios pueden pronosticar eliminatorias' },
  { value: 'knockout_playing',     label: 'Eliminatoria en curso',           desc: 'Partidos eliminatorios en juego' },
  { value: 'finished',             label: 'Torneo finalizado',               desc: 'Todo terminado' },
]

interface AdminClientProps {
  settings: Record<string, string>
  teams: Team[]
  matches: Match[]
  profiles: Profile[]
  adminGroupScores: ScoreMap
  initialBracketWinners: WinnerMap
}

export function AdminClient({ settings: initialSettings, teams, matches, profiles, adminGroupScores, initialBracketWinners }: AdminClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('phase')
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')

  // Results state
  const [selectedPhase, setSelectedPhase] = useState<string>('groups')
  const [scores, setScores] = useState<Record<number, { home: string; away: string; status: string }>>(() => {
    const initial: Record<number, { home: string; away: string; status: string }> = {}
    for (const match of matches) {
      initial[match.id] = {
        home: match.home_score?.toString() ?? '',
        away: match.away_score?.toString() ?? '',
        status: match.status,
      }
    }
    return initial
  })
  const [qualifyMap, setQualifyMap] = useState<Record<string, {
    qualified: boolean; r16: boolean; qf: boolean; sf: boolean; final: boolean; champion: boolean
  }>>(() => {
    const m: Record<string, { qualified: boolean; r16: boolean; qf: boolean; sf: boolean; final: boolean; champion: boolean }> = {}
    for (const t of teams) {
      m[t.id] = {
        qualified: (t as Team & { qualified_knockout?: boolean }).qualified_knockout ?? false,
        r16: (t as Team & { reached_r16?: boolean }).reached_r16 ?? false,
        qf: (t as Team & { reached_qf?: boolean }).reached_qf ?? false,
        sf: (t as Team & { reached_sf?: boolean }).reached_sf ?? false,
        final: (t as Team & { reached_final?: boolean }).reached_final ?? false,
        champion: (t as Team & { is_champion?: boolean }).is_champion ?? false,
      }
    }
    return m
  })

  const [bracketWinners, setBracketWinners] = useState<WinnerMap>(initialBracketWinners)
  const [bracketSaving, setBracketSaving] = useState(false)

  const supabase = createClient()

  async function saveSettings(updates: Record<string, string>) {
    setSaving(true)
    for (const [key, value] of Object.entries(updates)) {
      await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    }
    setSettings((prev) => ({ ...prev, ...updates }))
    setSaved('Configuración guardada')
    setSaving(false)
    setTimeout(() => setSaved(''), 3000)
    router.refresh()
  }

  async function saveMatchResult(matchId: number) {
    const s = scores[matchId]
    if (!s) return
    setSaving(true)
    const homeScore = parseInt(s.home)
    const awayScore = parseInt(s.away)
    const { error } = await supabase.from('matches').update({
      home_score: isNaN(homeScore) ? null : homeScore,
      away_score: isNaN(awayScore) ? null : awayScore,
      status: s.status || 'finished',
    }).eq('id', matchId)
    if (!error) {
      setSaved(`Partido #${matchId} actualizado`)
      setTimeout(() => setSaved(''), 2000)
    }
    setSaving(false)
    router.refresh()
  }

  async function saveQualifications() {
    setSaving(true)
    for (const [teamId, vals] of Object.entries(qualifyMap)) {
      await supabase.from('teams').update({
        qualified_knockout: vals.qualified,
        reached_r16: vals.r16,
        reached_qf: vals.qf,
        reached_sf: vals.sf,
        reached_final: vals.final,
        is_champion: vals.champion,
      }).eq('id', teamId)
    }
    setSaved('Clasificaciones guardadas')
    setSaving(false)
    setTimeout(() => setSaved(''), 3000)
    router.refresh()
  }

  async function makeAdmin(userId: string, isAdmin: boolean) {
    await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId)
    router.refresh()
  }

  const [resetingUser, setResetingUser] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetMsg, setResetMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null)

  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [deleteMsg, setDeleteMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null)
  const [banningUser, setBanningUser] = useState<string | null>(null)

  async function handleBanUser(userId: string, banned: boolean) {
    setBanningUser(userId)
    const res = await fetch('/api/admin/ban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, banned }),
    })
    if (res.ok) {
      setResetMsg({ id: userId, ok: true, text: banned ? 'Usuario baneado' : 'Baneo eliminado' })
    } else {
      const data = await res.json()
      setResetMsg({ id: userId, ok: false, text: data.error ?? 'Error' })
    }
    setBanningUser(null)
    setTimeout(() => setResetMsg(null), 3000)
    router.refresh()
  }

  async function handleDeleteUser(userId: string) {
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (res.ok) {
      setDeleteMsg({ id: userId, ok: true, text: 'Usuario eliminado' })
      setDeletingUser(null)
    } else {
      setDeleteMsg({ id: userId, ok: false, text: data.error ?? 'Error' })
    }
    setTimeout(() => setDeleteMsg(null), 3000)
    router.refresh()
  }

  async function handleResetPassword(userId: string) {
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password: newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      setResetMsg({ id: userId, ok: true, text: 'Contraseña cambiada' })
      setResetingUser(null)
      setNewPassword('')
    } else {
      setResetMsg({ id: userId, ok: false, text: data.error ?? 'Error' })
    }
    setTimeout(() => setResetMsg(null), 3000)
  }

  async function seedMatches() {
    setSaving(true)
    const res = await fetch('/api/admin/seed', { method: 'POST' })
    if (res.ok) {
      setSaved('104 partidos cargados en la base de datos')
    } else {
      setSaved('Error al cargar partidos (revisa la service role key)')
    }
    setSaving(false)
    setTimeout(() => setSaved(''), 4000)
    router.refresh()
  }

  const handleBracketPickWinner = useCallback(async (matchId: number, teamId: string) => {
    setBracketWinners(prev => {
      const cleared = bracketCascadeClear(matchId, prev)
      return { ...cleared, [matchId]: teamId }
    })
    setBracketSaving(true)
    const res = await fetch('/api/admin/bracket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, winnerId: teamId }),
    })
    const data = await res.json()
    if (res.ok) {
      setBracketWinners(data.bracket as WinnerMap)
      setSaved('Ganador guardado')
      setTimeout(() => setSaved(''), 2000)
    } else {
      setSaved(`Error: ${data.error ?? 'desconocido'}`)
      router.refresh()
    }
    setBracketSaving(false)
  }, [router])

  const handleBracketClearWinner = useCallback(async (matchId: number) => {
    setBracketWinners(prev => {
      const { [matchId]: _, ...rest } = prev
      return bracketCascadeClear(matchId, rest as WinnerMap)
    })
    setBracketSaving(true)
    const res = await fetch('/api/admin/bracket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, winnerId: null }),
    })
    const data = await res.json()
    if (res.ok) {
      setBracketWinners(data.bracket as WinnerMap)
    } else {
      router.refresh()
    }
    setBracketSaving(false)
  }, [router])

  const filteredMatches = matches.filter((m) =>
    selectedPhase === 'groups' ? m.phase === 'groups' : m.phase !== 'groups',
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="text-purple-400" size={22} />
            Panel de Administración
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona la porra del Mundial 2026</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <CheckCircle size={14} />
            {saved}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit flex-wrap">
        {[
          { key: 'phase',   label: 'Fase',            icon: Star },
          { key: 'results', label: 'Resultados',       icon: Trophy },
          { key: 'qualify', label: 'Clasificaciones',  icon: Crown },
          { key: 'bracket', label: 'Bracket',          icon: GitBranch },
          { key: 'awards',  label: 'Premios',          icon: Medal },
          { key: 'users',   label: 'Usuarios',         icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as AdminTab)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer',
              tab === key ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white',
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── TAB: FASE ─── */}
      {tab === 'phase' && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">Estado del torneo</h2>
          {/* Seed button */}
          <div className="glass rounded-xl p-4 border border-dashed border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white text-sm flex items-center gap-2">
                  <Database size={15} className="text-purple-400" />
                  Cargar partidos iniciales
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Inserta los 104 partidos del Mundial en la base de datos. Hazlo UNA vez al configurar la app.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={seedMatches} disabled={saving}>
                Cargar 104 partidos
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {PHASE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => saveSettings({ phase: opt.value })}
                className={cn(
                  'text-left p-4 rounded-xl border transition-all cursor-pointer',
                  settings['phase'] === opt.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{opt.label}</p>
                  {settings['phase'] === opt.value && <Badge variant="blue">Activo</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="glass rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white">Plazos de predicciones</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: 'group_predictions_deadline', label: 'Cierre pronósticos grupos', openKey: 'group_predictions_open' },
                { key: 'knockout_predictions_deadline', label: 'Cierre pronósticos elim.', openKey: 'knockout_predictions_open' },
              ].map(({ key, label, openKey }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      defaultValue={settings[key]?.slice(0, 16)}
                      onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={settings[openKey] === 'true'}
                        onChange={(e) => setSettings((prev) => ({ ...prev, [openKey]: e.target.checked ? 'true' : 'false' }))}
                        className="accent-purple-500 w-4 h-4"
                      />
                      <span className="text-xs text-gray-400">Abierto</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => saveSettings({
                group_predictions_deadline: settings['group_predictions_deadline'] ?? '',
                group_predictions_open: settings['group_predictions_open'] ?? 'false',
                knockout_predictions_deadline: settings['knockout_predictions_deadline'] ?? '',
                knockout_predictions_open: settings['knockout_predictions_open'] ?? 'false',
              })}
              variant="secondary"
              disabled={saving}
            >
              <Save size={14} />
              Guardar plazos
            </Button>
          </div>
        </div>
      )}

      {/* ─── TAB: RESULTADOS ─── */}
      {tab === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-white">Introducir resultados</h2>
            <div className="flex gap-1">
              {['groups', 'knockout'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPhase(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    selectedPhase === p ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white',
                  )}
                >
                  {p === 'groups' ? 'Grupos' : 'Eliminatorias'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredMatches.map((match) => {
              const current = scores[match.id]
              const dateInfo = formatMatchDate(match.match_date)
              const isLive = current?.status === 'live'
              const isFinished = current?.status === 'finished'
              return (
                <div key={match.id} className={cn(
                  'glass rounded-xl overflow-hidden border',
                  isLive ? 'border-red-500/40' : isFinished ? 'border-gray-700' : 'border-gray-800',
                )}>
                  {/* Fila principal */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Equipo local */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {match.home_team?.iso
                        ? <TeamFlag iso={match.home_team.iso} name={match.home_team.name} size={40} className="w-10 h-7 flex-shrink-0" />
                        : <span className="text-2xl flex-shrink-0">{match.home_team?.flag ?? '🏳️'}</span>
                      }
                      <span className="text-sm font-semibold text-white truncate">
                        {match.home_team?.name ?? match.home_placeholder ?? '?'}
                      </span>
                    </div>

                    {/* Inputs marcador */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={current?.home ?? ''}
                        onChange={(e) => setScores((prev) => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], home: e.target.value }
                        }))}
                        className="w-12 h-10 text-center text-lg font-black bg-gray-800 border border-gray-700 rounded-lg text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-gray-500 font-bold">:</span>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={current?.away ?? ''}
                        onChange={(e) => setScores((prev) => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], away: e.target.value }
                        }))}
                        className="w-12 h-10 text-center text-lg font-black bg-gray-800 border border-gray-700 rounded-lg text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Equipo visitante */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-semibold text-white truncate text-right">
                        {match.away_team?.name ?? match.away_placeholder ?? '?'}
                      </span>
                      {match.away_team?.iso
                        ? <TeamFlag iso={match.away_team.iso} name={match.away_team.name} size={40} className="w-10 h-7 flex-shrink-0" />
                        : <span className="text-2xl flex-shrink-0">{match.away_team?.flag ?? '🏳️'}</span>
                      }
                    </div>
                  </div>

                  {/* Fila inferior: fecha + estado + guardar */}
                  <div className="flex items-center justify-between px-4 pb-3 gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{dateInfo.short}</span>
                      {match.group_name && <span>· Grupo {match.group_name}</span>}
                      {match.stadium && (
                        <>
                          <span>·</span>
                          <Building2 size={10} />
                          <span className="truncate max-w-[120px]">{match.stadium.name}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={current?.status ?? match.status}
                        onChange={(e) => setScores((prev) => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], status: e.target.value }
                        }))}
                        className="bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 px-2 py-1.5 focus:outline-none focus:border-purple-500"
                      >
                        <option value="scheduled">Programado</option>
                        <option value="live">En Vivo</option>
                        <option value="finished">Finalizado</option>
                      </select>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => saveMatchResult(match.id)}
                        disabled={saving}
                      >
                        <Save size={12} />
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── TAB: CLASIFICACIONES ─── */}
      {tab === 'qualify' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">Clasificados de grupos</h2>
            <Button onClick={saveQualifications} disabled={saving} variant="secondary">
              <Save size={14} />
              Guardar todo
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Marca los 32 equipos que pasan de la fase de grupos. Da 5 puntos a quien los acertó. Las fases eliminatorias se gestionan en la pestaña Bracket.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-500 font-semibold text-xs">Equipo</th>
                  <th className="text-center py-3 px-2 text-gray-500 font-semibold text-xs">Clasificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {teams.map((team) => {
                  const vals = qualifyMap[team.id] ?? { qualified: false, r16: false, qf: false, sf: false, final: false, champion: false }
                  return (
                    <tr key={team.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {team.iso
                            ? <TeamFlag iso={team.iso} name={team.name} size={40} className="w-10 h-7 flex-shrink-0" />
                            : <span className="text-lg">{team.flag}</span>
                          }
                          <div>
                            <p className="font-medium text-white text-xs">{team.name}</p>
                            <p className="text-gray-600 text-xs">Grupo {team.group}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2">
                        <input
                          type="checkbox"
                          checked={vals.qualified ?? false}
                          onChange={(e) =>
                            setQualifyMap((prev) => ({
                              ...prev,
                              [team.id]: { ...prev[team.id], qualified: e.target.checked },
                            }))
                          }
                          className="accent-amber-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: BRACKET ─── */}
      {tab === 'bracket' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                <GitBranch size={16} className="text-purple-400" />
                Bracket eliminatorio
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Haz clic en un equipo para establecerlo como ganador. Esto bloquea la casilla en el simulador y actualiza las clasificaciones automáticamente.
              </p>
            </div>
            {bracketSaving && (
              <span className="text-xs text-purple-400 animate-pulse">Guardando…</span>
            )}
          </div>
          <SimuladorBracket
            matches={matches}
            simScores={adminGroupScores}
            winners={bracketWinners}
            lockedMatchIds={new Set()}
            onPickWinner={handleBracketPickWinner}
            onClearWinner={handleBracketClearWinner}
          />
        </div>
      )}

      {/* ─── TAB: PREMIOS ─── */}
      {tab === 'awards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">Ganadores de premios individuales</h2>
          </div>
          <p className="text-xs text-gray-500">
            Cuando se anuncie el ganador de cada premio, selecciónalo aquí. Los usuarios que lo hayan acertado recibirán 25 puntos automáticamente.
          </p>
          <div className="space-y-3">
            {AWARDS.map((award) => (
              <div key={award.type} className="glass rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{award.emoji}</span>
                  <div>
                    <p className="font-bold text-white">{award.label}</p>
                    <p className="text-xs text-gray-500">{award.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <PlayerAccordion
                      teams={TEAMS_BY_AWARD[award.type as AwardType]}
                      value={settings[award.settingKey] ?? ''}
                      onChange={(name) => setSettings(prev => ({ ...prev, [award.settingKey]: name }))}
                      placeholder="— Sin ganador todavía —"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => saveSettings({ [award.settingKey]: settings[award.settingKey] ?? '' })}
                  >
                    <Save size={12} />
                    Guardar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB: USUARIOS ─── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">{profiles.length} participantes registrados</h2>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={cn(
                  'glass rounded-xl border overflow-hidden',
                  profile.is_banned ? 'border-orange-500/30 bg-orange-500/5' : 'border-gray-800',
                )}
              >
                <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white',
                      profile.is_banned
                        ? 'bg-gradient-to-br from-gray-600 to-gray-700'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600',
                    )}>
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={cn('font-semibold text-sm', profile.is_banned ? 'text-gray-500 line-through' : 'text-white')}>
                        {profile.name}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(profile.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(resetMsg?.id === profile.id || deleteMsg?.id === profile.id) && (
                      <span className={cn('text-xs font-semibold', (resetMsg ?? deleteMsg)!.ok ? 'text-green-400' : 'text-red-400')}>
                        {(resetMsg ?? deleteMsg)!.text}
                      </span>
                    )}
                    {profile.is_admin && <Badge variant="blue">Admin</Badge>}
                    {profile.is_banned && (
                      <Badge variant="gray" className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        Baneado
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResetingUser(resetingUser === profile.id ? null : profile.id)
                        setDeletingUser(null)
                        setNewPassword('')
                      }}
                    >
                      <KeyRound size={12} />
                      Contraseña
                    </Button>
                    <Button
                      size="sm"
                      variant={profile.is_admin ? 'danger' : 'outline'}
                      onClick={() => makeAdmin(profile.id, !profile.is_admin)}
                    >
                      {profile.is_admin ? 'Quitar admin' : 'Hacer admin'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={banningUser === profile.id}
                      onClick={() => handleBanUser(profile.id, !profile.is_banned)}
                      className={cn(
                        profile.is_banned
                          ? 'border-green-600 text-green-400 hover:bg-green-500/10'
                          : 'border-orange-600 text-orange-400 hover:bg-orange-500/10',
                      )}
                    >
                      <Ban size={12} />
                      {profile.is_banned ? 'Desbanear' : 'Banear'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-800 text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        setDeletingUser(deletingUser === profile.id ? null : profile.id)
                        setResetingUser(null)
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>

                {resetingUser === profile.id && (
                  <div className="px-4 pb-4 flex items-center gap-2 border-t border-gray-800 pt-3">
                    <input
                      type="text"
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && newPassword.length >= 6 && handleResetPassword(profile.id)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleResetPassword(profile.id)}
                      disabled={newPassword.length < 6}
                    >
                      <Save size={12} />
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setResetingUser(null); setNewPassword('') }}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                )}

                {deletingUser === profile.id && (
                  <div className="px-4 pb-4 flex items-center gap-3 border-t border-red-900/40 pt-3 bg-red-500/5">
                    <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300 flex-1">
                      Eliminar a <strong>{profile.name}</strong> borrará su cuenta permanentemente. Esta acción no se puede deshacer.
                    </p>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteUser(profile.id)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingUser(null)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
