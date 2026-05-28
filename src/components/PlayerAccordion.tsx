'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { TeamFlag } from '@/components/TeamFlag'
import { cn } from '@/lib/utils'
import { ChevronDown, Search, X } from 'lucide-react'
import type { AwardPlayer, TeamForAward } from '@/lib/data/awards'

interface PlayerAccordionProps {
  teams: TeamForAward[]
  value: string
  onChange: (name: string) => void
  disabled?: boolean
  placeholder?: string
}

const POS_LABEL: Record<string, string> = { GK: 'POR', DEF: 'DEF', MID: 'MED', FWD: 'DEL' }
const POS_COLOR: Record<string, string> = {
  GK:  'text-yellow-400 bg-yellow-500/15',
  DEF: 'text-blue-400 bg-blue-500/15',
  MID: 'text-green-400 bg-green-500/15',
  FWD: 'text-red-400 bg-red-500/15',
}

export function PlayerAccordion({ teams, value, onChange, disabled, placeholder = '— Elige un jugador —' }: PlayerAccordionProps) {
  const [open, setOpen] = useState(false)
  const [expandedIso, setExpandedIso] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = useMemo<AwardPlayer | null>(() => {
    for (const team of teams) {
      const p = team.players.find(p => p.name === value)
      if (p) return p
    }
    return null
  }, [teams, value])

  const isSearching = search.trim().length > 0

  const visibleTeams = useMemo(() => {
    if (!isSearching) return teams
    const q = search.toLowerCase()
    return teams
      .map(t => ({ ...t, players: t.players.filter(p => p.name.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) }))
      .filter(t => t.players.length > 0)
  }, [teams, search, isSearching])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        setExpandedIso(null)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function handleOpen() {
    setOpen(true)
    setTimeout(() => searchRef.current?.focus(), 30)
  }

  function handleSelect(player: AwardPlayer) {
    onChange(player.name)
    setOpen(false)
    setSearch('')
    setExpandedIso(null)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  function toggleTeam(iso: string) {
    setExpandedIso(prev => (prev === iso ? null : iso))
  }

  return (
    <div ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white flex items-center gap-2 focus:outline-none focus:border-amber-500 disabled:opacity-50 cursor-pointer hover:border-gray-600 transition-colors"
      >
        {selected ? (
          <>
            <TeamFlag iso={selected.iso} name={selected.country} size={20} className="w-5 h-3.5 shrink-0" />
            <span className="flex-1 text-left font-medium">{selected.name}</span>
            <span className="text-gray-500 text-xs shrink-0">{selected.country}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 hover:text-white transition-colors ml-1 p-0.5 rounded"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <span className="text-gray-500 flex-1 text-left">{placeholder}</span>
            <ChevronDown size={14} className={cn('text-gray-500 shrink-0 transition-transform', open && 'rotate-180')} />
          </>
        )}
      </button>

      {/* Panel acordeón */}
      {open && !disabled && (
        <div className="mt-2 rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
          {/* Buscador */}
          <div className="p-2 border-b border-gray-800">
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <Search size={13} className="text-gray-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugador o selección..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none min-w-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); searchRef.current?.focus() }}
                  className="text-gray-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Lista de selecciones */}
          <div className="max-h-72 overflow-y-auto">
            {visibleTeams.length === 0 && (
              <div className="py-6 text-center text-gray-500 text-sm">Sin resultados</div>
            )}
            {visibleTeams.map(team => {
              const isExpanded = isSearching || expandedIso === team.iso
              const hasSelected = team.players.some(p => p.name === value)
              return (
                <div key={team.iso} className="border-b border-gray-800/50 last:border-0">
                  {/* Cabecera de selección */}
                  <button
                    type="button"
                    onClick={() => !isSearching && toggleTeam(team.iso)}
                    className={cn(
                      'w-full px-3 py-2.5 flex items-center gap-2.5 transition-colors text-left',
                      isSearching ? 'cursor-default' : 'hover:bg-gray-800/60 cursor-pointer',
                      hasSelected && !isExpanded ? 'bg-amber-500/5' : '',
                    )}
                  >
                    <TeamFlag iso={team.iso} name={team.name} size={20} className="w-5 h-3.5 shrink-0" />
                    <span className={cn('flex-1 text-sm font-semibold', hasSelected ? 'text-amber-400' : 'text-white')}>
                      {team.name}
                    </span>
                    <span className="text-xs text-gray-600">{team.players.length}</span>
                    {!isSearching && (
                      <ChevronDown size={14} className={cn('text-gray-500 transition-transform shrink-0', isExpanded && 'rotate-180')} />
                    )}
                  </button>

                  {/* Jugadores de la selección */}
                  {isExpanded && (
                    <div className="border-t border-gray-800/40 bg-gray-800/20">
                      {team.players.map(player => {
                        const isSel = value === player.name
                        return (
                          <button
                            key={player.name}
                            type="button"
                            onClick={() => handleSelect(player)}
                            className={cn(
                              'w-full px-4 py-1.5 flex items-center gap-2.5 transition-colors text-sm',
                              isSel ? 'bg-amber-500/15 hover:bg-amber-500/20' : 'hover:bg-gray-700/40',
                            )}
                          >
                            <span className={cn(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 w-8 text-center',
                              POS_COLOR[player.position] ?? 'text-gray-400 bg-gray-700',
                            )}>
                              {POS_LABEL[player.position] ?? player.position}
                            </span>
                            <span className={cn('flex-1 text-left', isSel ? 'text-amber-400 font-semibold' : 'text-gray-200')}>
                              {player.name}
                            </span>
                            {isSel && <span className="text-amber-400 text-xs shrink-0">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
