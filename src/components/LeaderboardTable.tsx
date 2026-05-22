import { cn } from '@/lib/utils'
import { Trophy, Medal } from 'lucide-react'
import type { UserScore } from '@/lib/types'

interface LeaderboardTableProps {
  scores: UserScore[]
  currentUserId?: string
}

function PositionIcon({ pos }: { pos: number }) {
  if (pos === 1) return <Trophy size={16} className="text-amber-400" />
  if (pos === 2) return <Medal size={16} className="text-gray-400" />
  if (pos === 3) return <Medal size={16} className="text-amber-700" />
  return <span className="text-gray-500 text-sm font-bold w-4 text-center">{pos}</span>
}

export function LeaderboardTable({ scores, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_repeat(4,auto)] gap-x-4 px-4 py-3 bg-gray-900 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span className="w-8 text-center">#</span>
        <span>Participante</span>
        <span className="hidden sm:block text-right">Partidos</span>
        <span className="hidden sm:block text-right">Grupos</span>
        <span className="hidden sm:block text-right">Elim.</span>
        <span className="text-right text-amber-400">Total</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-800/50">
        {scores.map((score, idx) => {
          const isMe = score.user_id === currentUserId
          return (
            <div
              key={score.user_id}
              className={cn(
                'grid grid-cols-[auto_1fr_repeat(4,auto)] gap-x-4 px-4 py-3 items-center transition-colors',
                isMe ? 'bg-amber-500/8 border-l-2 border-amber-500' : 'hover:bg-gray-800/30',
                idx < 3 && !isMe && 'bg-gray-800/20',
              )}
            >
              <div className="w-8 flex items-center justify-center">
                <PositionIcon pos={idx + 1} />
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                  {score.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isMe ? 'text-amber-400' : 'text-white')}>
                    {score.name}
                    {isMe && <span className="ml-1 text-xs text-amber-500">(tú)</span>}
                  </p>
                </div>
              </div>

              <span className="hidden sm:block text-right text-sm text-gray-400">
                {score.match_points}
              </span>
              <span className="hidden sm:block text-right text-sm text-gray-400">
                {score.group_qualify_points}
              </span>
              <span className="hidden sm:block text-right text-sm text-gray-400">
                {score.knockout_points}
              </span>
              <span className={cn(
                'text-right text-base font-black',
                idx === 0 ? 'text-amber-400' : isMe ? 'text-amber-300' : 'text-white',
              )}>
                {score.total_points}
              </span>
            </div>
          )
        })}

        {scores.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <Trophy size={32} className="mx-auto mb-3 opacity-30" />
            <p>Aún no hay puntuaciones</p>
          </div>
        )}
      </div>
    </div>
  )
}
