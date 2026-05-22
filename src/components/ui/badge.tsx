import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'green' | 'red' | 'blue' | 'gray' | 'live'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
        {
          'bg-amber-500/20 text-amber-400 border border-amber-500/30': variant === 'gold',
          'bg-green-500/20 text-green-400 border border-green-500/30': variant === 'green',
          'bg-red-500/20 text-red-400 border border-red-500/30': variant === 'red',
          'bg-blue-500/20 text-blue-400 border border-blue-500/30': variant === 'blue',
          'bg-gray-700 text-gray-300': variant === 'gray',
          'bg-red-600 text-white border border-red-500': variant === 'live',
        },
        className,
      )}
    >
      {variant === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white live-pulse" />}
      {children}
    </span>
  )
}
