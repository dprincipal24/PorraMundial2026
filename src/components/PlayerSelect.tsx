'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  function openDropdown() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropH = 260
    const top = window.innerHeight - rect.bottom >= dropH
      ? rect.bottom + 2
      : rect.top - dropH - 2
    setDropPos({ top, left: rect.left, width: rect.width })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return
      if (dropRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onScroll(e: Event) {
      if (dropRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const selected = players.find(p => p.name === value)

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openDropdown()}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white flex items-center gap-2 focus:outline-none focus:border-amber-500 disabled:opacity-50 cursor-pointer hover:border-gray-600 transition-colors"
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

      {open && dropPos && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-800 text-left transition-colors border-b border-gray-800"
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
        </div>,
        document.body,
      )}
    </div>
  )
}
