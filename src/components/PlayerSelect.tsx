'use client'

import { useState, useRef, useEffect } from 'react'
import { TeamFlag } from '@/components/TeamFlag'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import type { AwardPlayer } from '@/lib/data/awards'

interface PlayerSelectProps {
  players: AwardPlayer[]
  value: string
  onChange: (name: string) => void
  disabled?: boolean
  placeholder?: string
}

export function PlayerSelect({ players, value, onChange, disabled, placeholder = '— Elige un jugador —' }: PlayerSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = players.find(p => p.name === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white flex items-center gap-2 focus:outline-none focus:border-amber-500 disabled:opacity-50 cursor-pointer"
      >
        {selected ? (
          <>
            <TeamFlag iso={selected.iso} name={selected.country} size={20} className="w-5 h-3.5 shrink-0" />
            <span className="flex-1 text-left">{selected.name}</span>
            <span className="text-gray-500 text-xs shrink-0">({selected.country})</span>
          </>
        ) : (
          <span className="text-gray-500 flex-1 text-left">{placeholder}</span>
        )}
        <ChevronDown size={14} className={cn('text-gray-500 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-800 text-left transition-colors"
          >
            {placeholder}
          </button>
          {players.map(player => (
            <button
              key={player.name}
              type="button"
              onClick={() => { onChange(player.name); setOpen(false) }}
              className={cn(
                'w-full px-3 py-2.5 text-sm flex items-center gap-2.5 hover:bg-gray-800 transition-colors',
                value === player.name ? 'bg-amber-500/10 text-amber-400' : 'text-white',
              )}
            >
              <TeamFlag iso={player.iso} name={player.country} size={20} className="w-5 h-3.5 shrink-0" />
              <span className="flex-1 text-left">{player.name}</span>
              <span className="text-gray-500 text-xs shrink-0">({player.country})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
