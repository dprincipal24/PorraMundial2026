'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Star, Trophy, Medal } from 'lucide-react'

const PRED_TABS = [
  { href: '/predictions/groups',   label: 'Fase Grupos',   icon: Star },
  { href: '/predictions/knockout', label: 'Eliminatorias', icon: Trophy },
  { href: '/predictions/awards',   label: 'Premios individuales', icon: Medal },
]

export function PredictionsNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-white/5 bg-gray-950/50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex">
          {PRED_TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-3 text-sm font-semibold border-b-2 transition-colors',
                  active
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-white hover:border-gray-600',
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
