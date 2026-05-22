import { cn, formatMatchDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TeamFlag } from '@/components/TeamFlag'
import { MapPin, Clock, Building2 } from 'lucide-react'
import type { Match, MatchPrediction } from '@/lib/types'

interface MatchCardProps {
  match: Match
  prediction?: MatchPrediction
  onPredictionChange?: (matchId: number, home: number, away: number) => void
  showResult?: boolean
  locked?: boolean
}

function TeamDisplay({
  team,
  isHome,
}: {
  team: { name: string; flag: string; iso?: string } | undefined
  isHome: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 flex-1', isHome ? 'items-end' : 'items-start')}>
      {team?.iso
        ? <TeamFlag iso={team.iso} name={team.name} size={48} className="w-12 h-8" />
        : <span className="text-4xl leading-none">🏳️</span>
      }
      <span className="text-xs md:text-sm font-semibold text-gray-200 text-center leading-tight max-w-[80px] truncate w-full">
        {team?.name ?? '???'}
      </span>
    </div>
  )
}

export function MatchCard({ match, prediction, onPredictionChange, locked }: MatchCardProps) {
  const dateInfo = formatMatchDate(match.match_date)
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const hasResult = (isFinished || isLive) && match.home_score !== null && match.away_score !== null

  const resultColor = () => {
    if (!isFinished || match.home_score === null || match.away_score === null || !prediction) return ''
    if (match.home_score === prediction.home_score && match.away_score === prediction.away_score)
      return 'border-amber-500/50 bg-amber-500/5'
    const a1x2 = match.home_score > match.away_score ? '1' : match.home_score === match.away_score ? 'X' : '2'
    const p1x2 = prediction.home_score > prediction.away_score ? '1' : prediction.home_score === prediction.away_score ? 'X' : '2'
    if (a1x2 === p1x2) return 'border-green-500/50 bg-green-500/5'
    return 'border-red-500/20'
  }

  return (
    <div className={cn(
      'rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden transition-all',
      isLive && 'border-red-500/40',
      resultColor(),
    )}>
      {/* Header: fecha, estado */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            <span className="capitalize">{dateInfo.weekday} {dateInfo.day} · {dateInfo.time}</span>
          </span>
        </div>
        {isLive && <Badge variant="live">EN VIVO</Badge>}
        {isFinished && <Badge variant="gray">Finalizado</Badge>}
        {match.status === 'scheduled' && <Badge variant="blue">Programado</Badge>}
      </div>

      {/* Equipos + marcador */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-4">
          <TeamDisplay team={match.home_team} isHome={true} />

          {/* Marcador central o inputs */}
          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            {!locked && onPredictionChange ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={prediction?.home_score ?? ''}
                  onChange={(e) =>
                    onPredictionChange(match.id, parseInt(e.target.value) || 0, prediction?.away_score ?? 0)
                  }
                  className="w-12 h-12 text-center text-xl font-black bg-gray-800 border border-gray-700 rounded-lg text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="—"
                />
                <span className="text-gray-500 text-lg font-bold">:</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={prediction?.away_score ?? ''}
                  onChange={(e) =>
                    onPredictionChange(match.id, prediction?.home_score ?? 0, parseInt(e.target.value) || 0)
                  }
                  className="w-12 h-12 text-center text-xl font-black bg-gray-800 border border-gray-700 rounded-lg text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="—"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {/* Fila pronóstico */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-amber-400/70 uppercase tracking-wider font-semibold">Pronóstico</span>
                  {prediction ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-black text-amber-400">{prediction.home_score}</span>
                      <span className="text-gray-500 text-sm">:</span>
                      <span className="text-xl font-black text-amber-400">{prediction.away_score}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-gray-600">—</span>
                      <span className="text-gray-700 text-sm">:</span>
                      <span className="text-lg font-bold text-gray-600">—</span>
                    </div>
                  )}
                </div>

                {/* Fila resultado real (solo live o finalizado) */}
                {(isLive || isFinished) && (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-gray-400/70 uppercase tracking-wider font-semibold">Resultado</span>
                    {hasResult ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-black text-white">{match.home_score}</span>
                        <span className="text-gray-500 text-sm">:</span>
                        <span className="text-2xl font-black text-white">{match.away_score}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-gray-500">—</span>
                        <span className="text-gray-600 text-sm">:</span>
                        <span className="text-lg font-bold text-gray-500">—</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {match.group_name && (
              <span className="text-xs text-gray-600 font-medium">Grupo {match.group_name}</span>
            )}
          </div>

          <TeamDisplay team={match.away_team} isHome={false} />
        </div>
      </div>

      {/* Estadio */}
      {match.stadium && (
        <div className="px-4 py-2 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Building2 size={11} />
            <span>{match.stadium.name}</span>
            <span>·</span>
            <MapPin size={11} />
            <span>{match.stadium.city}, {match.stadium.country_flag} {match.stadium.country}</span>
          </div>
        </div>
      )}
    </div>
  )
}
