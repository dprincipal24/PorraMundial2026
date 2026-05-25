import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Trophy, Medal } from 'lucide-react'
import type { UserScore } from '@/lib/types'
import type { KnockoutBreakdown } from '@/app/(main)/leaderboard/page'

interface LeaderboardTableProps {
  scores: UserScore[]
  currentUserId?: string
  linkable?: boolean
  knockoutBreakdown?: KnockoutBreakdown
}

function PositionIcon({ pos }: { pos: number }) {
  if (pos === 1) return <Trophy size={16} className="text-amber-400" />
  if (pos === 2) return <Medal size={16} className="text-gray-400" />
  if (pos === 3) return <Medal size={16} className="text-amber-700" />
  return <span className="text-gray-500 text-sm font-bold">{pos}</span>
}

function Avatar({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        unoptimized
      />
    )
  }
  if (avatarUrl && avatarUrl.length <= 4) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
        {avatarUrl}
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const thCls = 'px-2 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap'
const tdCls = 'px-2 py-3 text-right text-sm text-white'

export function LeaderboardTable({ scores, currentUserId, linkable, knockoutBreakdown }: LeaderboardTableProps) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-900 border-b border-gray-800">
            <th className="px-3 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
            <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Participante</th>
            <th className={cn(thCls, 'hidden sm:table-cell')}>Grupos</th>
            <th className={cn(thCls, 'hidden sm:table-cell')}>1/16</th>
            <th className={cn(thCls, 'hidden sm:table-cell')}>1/8</th>
            <th className={cn(thCls, 'hidden sm:table-cell')}>1/4</th>
            <th className={cn(thCls, 'hidden sm:table-cell')}>1/2</th>
            <th className={cn(thCls, 'hidden sm:table-cell')}>Final</th>
            <th className={cn(thCls, 'hidden sm:table-cell')}>Camp.</th>
            <th className={cn(thCls, 'hidden sm:table-cell')}>Prem.</th>
            <th className="px-2 py-3 text-right text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, idx) => {
            const isMe = score.user_id === currentUserId
            const ko = knockoutBreakdown?.[score.user_id]
            return (
              <tr
                key={score.user_id}
                className={cn(
                  'border-b border-gray-800/50 transition-colors',
                  isMe ? 'bg-amber-500/10' : idx < 3 ? 'bg-gray-800/20 hover:bg-gray-800/30' : 'hover:bg-gray-800/30',
                )}
              >
                <td className={cn('px-3 py-3 text-center', isMe && 'border-l-2 border-amber-500')}>
                  <div className="flex items-center justify-center">
                    <PositionIcon pos={idx + 1} />
                  </div>
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar avatarUrl={score.avatar_url} name={score.name} />
                    <div className="min-w-0">
                      {linkable ? (
                        <Link
                          href={`/predictions/groups?view=${score.user_id}`}
                          className={cn(
                            'text-sm font-semibold truncate block hover:underline underline-offset-2',
                            isMe ? 'text-amber-400' : 'text-white',
                          )}
                        >
                          {score.name}
                          {isMe && <span className="ml-1 text-xs text-amber-500">(tú)</span>}
                        </Link>
                      ) : (
                        <p className={cn('text-sm font-semibold truncate', isMe ? 'text-amber-400' : 'text-white')}>
                          {score.name}
                          {isMe && <span className="ml-1 text-xs text-amber-500">(tú)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className={cn(tdCls, 'hidden sm:table-cell')}>{score.match_points}</td>
                <td className={cn(tdCls, 'hidden sm:table-cell')}>{score.group_qualify_points}</td>
                <td className={cn(tdCls, 'hidden sm:table-cell')}>{ko?.r16 ?? 0}</td>
                <td className={cn(tdCls, 'hidden sm:table-cell')}>{ko?.qf ?? 0}</td>
                <td className={cn(tdCls, 'hidden sm:table-cell')}>{ko?.sf ?? 0}</td>
                <td className={cn(tdCls, 'hidden sm:table-cell')}>{ko?.final ?? 0}</td>
                <td className={cn(tdCls, 'hidden sm:table-cell')}>{ko?.champion ?? 0}</td>
                <td className={cn(tdCls, 'hidden sm:table-cell')}>{score.award_points ?? 0}</td>
                <td className={cn(
                  'px-2 py-3 text-right text-base font-black',
                  idx === 0 ? 'text-amber-400' : isMe ? 'text-amber-300' : 'text-white',
                )}>
                  {score.total_points}
                </td>
              </tr>
            )
          })}

          {scores.length === 0 && (
            <tr>
              <td colSpan={11} className="py-16 text-center text-gray-500">
                <Trophy size={32} className="mx-auto mb-3 opacity-30" />
                <p>Aún no hay puntuaciones</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
