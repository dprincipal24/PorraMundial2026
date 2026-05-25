'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import { TeamFlag } from '@/components/TeamFlag'
import { cn } from '@/lib/utils'

export type MatchData = {
  id: number
  match_date: string
  phase: string
  group_name: string | null
  status: string
  home_score: number | null
  away_score: number | null
  home_team: { name: string; iso: string } | null
  away_team: { name: string; iso: string } | null
  home_placeholder: string | null
  away_placeholder: string | null
  stadium: { name: string; city: string; country_flag: string } | null
}

interface Props {
  matchesByDate: Record<string, MatchData[]>
  allDates: string[]
  todayISO: string
}

function phaseLabel(phase: string, groupName: string | null): string {
  if (phase === 'groups' && groupName) return `Grupo ${groupName}`
  const map: Record<string, string> = {
    r32: '1/16 Final', r16: 'Octavos', qf: 'Cuartos',
    sf: 'Semis', third_place: '3.er Puesto', final: 'Final',
  }
  return map[phase] ?? phase
}

function formatDateHeader(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function MatchRow({ match }: { match: MatchData }) {
  const time = new Date(match.match_date).toLocaleTimeString('es-ES', {
    timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit',
  })

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const hasScore = (isLive || isFinished) && match.home_score !== null

  const home = match.home_team ?? { name: match.home_placeholder ?? '?', iso: '' }
  const away = match.away_team ?? { name: match.away_placeholder ?? '?', iso: '' }

  return (
    <div className="px-3 py-3 border-b border-gray-800/50 last:border-0">
      {/* Time + phase + status */}
      <div className="flex items-center justify-between mb-1.5 text-[10px]">
        <span className="text-gray-400 font-semibold tabular-nums">{time}h</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">{phaseLabel(match.phase, match.group_name)}</span>
          {isLive && (
            <span className="flex items-center gap-1 text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              VIVO
            </span>
          )}
          {isFinished && <span className="text-gray-700">Finalizado</span>}
        </div>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-1.5">
        {/* Home */}
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-white text-right truncate leading-tight">{home.name}</span>
          {home.iso
            ? <TeamFlag iso={home.iso} name={home.name} size={24} className="w-8 h-[21px] flex-shrink-0" />
            : <span className="text-base flex-shrink-0">🏳️</span>
          }
        </div>

        {/* Center score or vs */}
        <div className="flex-shrink-0 w-12 text-center">
          {hasScore ? (
            <span className={cn('text-sm font-black', isLive ? 'text-red-300' : 'text-white')}>
              {match.home_score}–{match.away_score}
            </span>
          ) : (
            <span className="text-[10px] text-gray-700 font-semibold">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {away.iso
            ? <TeamFlag iso={away.iso} name={away.name} size={24} className="w-8 h-[21px] flex-shrink-0" />
            : <span className="text-base flex-shrink-0">🏳️</span>
          }
          <span className="text-xs font-semibold text-white truncate leading-tight">{away.name}</span>
        </div>
      </div>

      {/* Stadium */}
      {match.stadium && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-600">
          <Building2 size={9} className="flex-shrink-0" />
          <span className="truncate">{match.stadium.name}</span>
          <span className="flex-shrink-0">· {match.stadium.country_flag} {match.stadium.city}</span>
        </div>
      )}
    </div>
  )
}

interface PanelProps {
  title: string
  subtitle: string
  matches: MatchData[]
  emptyText: string
  isToday?: boolean
  nav?: { onPrev: () => void; onNext: () => void; canPrev: boolean; canNext: boolean }
}

function Panel({ title, subtitle, matches, emptyText, isToday, nav }: PanelProps) {
  return (
    <div className="glass rounded-xl border border-gray-800 overflow-hidden flex flex-col min-h-[220px]">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between gap-1">
        {nav ? (
          <button
            onClick={nav.onPrev}
            disabled={!nav.canPrev}
            className={cn('p-1 rounded hover:bg-gray-800 transition-colors text-gray-400', !nav.canPrev && 'opacity-20 cursor-not-allowed')}
          >
            <ChevronLeft size={15} />
          </button>
        ) : <div className="w-6" />}

        <div className="text-center flex-1 min-w-0">
          <p className="font-bold text-white text-sm capitalize truncate">
            {title}
            {isToday && <span className="ml-1.5 text-[10px] font-normal text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">HOY</span>}
          </p>
          <p className="text-[10px] text-gray-500 capitalize truncate">{subtitle}</p>
        </div>

        {nav ? (
          <button
            onClick={nav.onNext}
            disabled={!nav.canNext}
            className={cn('p-1 rounded hover:bg-gray-800 transition-colors text-gray-400', !nav.canNext && 'opacity-20 cursor-not-allowed')}
          >
            <ChevronRight size={15} />
          </button>
        ) : <div className="w-6" />}
      </div>

      {/* Match list */}
      {matches.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8 text-center text-gray-600 text-xs px-4">
          {emptyText}
        </div>
      ) : (
        <div className="overflow-y-auto">
          {matches.map(m => <MatchRow key={m.id} match={m} />)}
        </div>
      )}
    </div>
  )
}

export function MatchSchedule({ matchesByDate, allDates, todayISO }: Props) {
  const futureDates = allDates.filter(d => d > todayISO)
  const initialDate = futureDates[0] ?? allDates[allDates.length - 1] ?? todayISO
  const [selectedDate, setSelectedDate] = useState(initialDate)

  const currentIdx = allDates.indexOf(selectedDate)
  const safeIdx = currentIdx === -1 ? 0 : currentIdx
  const canPrev = safeIdx > 0
  const canNext = safeIdx < allDates.length - 1

  const todayMatches = matchesByDate[todayISO] ?? []
  const selectedMatches = allDates.length > 0 ? (matchesByDate[selectedDate] ?? []) : []

  const matchCount = selectedMatches.length
  const matchCountLabel = `${matchCount} partido${matchCount !== 1 ? 's' : ''}`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Left: Today */}
      <Panel
        title={formatDateHeader(todayISO)}
        subtitle="partidos de hoy"
        matches={todayMatches}
        emptyText="Hoy no hay partidos del Mundial 2026"
        isToday
      />

      {/* Right: Browse dates */}
      {allDates.length > 0 ? (
        <Panel
          title={formatDateHeader(selectedDate)}
          subtitle={matchCountLabel}
          matches={selectedMatches}
          emptyText=""
          isToday={selectedDate === todayISO}
          nav={{
            canPrev,
            canNext,
            onPrev: () => canPrev && setSelectedDate(allDates[safeIdx - 1]),
            onNext: () => canNext && setSelectedDate(allDates[safeIdx + 1]),
          }}
        />
      ) : (
        <Panel
          title="Próximos partidos"
          subtitle=""
          matches={[]}
          emptyText="No hay partidos programados todavía"
        />
      )}
    </div>
  )
}
