'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { FlaskConical, Cloud, CloudOff, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SimuladorGroups } from './SimuladorGroups'
import { SimuladorBracket } from './SimuladorBracket'
import type { ScoreMap, WinnerMap } from './simulatorLogic'

interface Match {
  id: number; phase: string; group_name: string | null
  home_team_id: string | null; away_team_id: string | null
  home_score: number | null; away_score: number | null; status: string
}

interface Props {
  matches: Match[]
  adminGroupScores: ScoreMap
  adminKnockoutWinners: WinnerMap
  lockedMatchIds: number[]
  userId: string
  userGroupPredictions: ScoreMap
}

const DOWNSTREAM: Record<number, { homeFrom: number; awayFrom: number }> = {
  89: { homeFrom: 73, awayFrom: 75 }, 90: { homeFrom: 74, awayFrom: 77 },
  91: { homeFrom: 76, awayFrom: 78 }, 92: { homeFrom: 79, awayFrom: 80 },
  93: { homeFrom: 83, awayFrom: 84 }, 94: { homeFrom: 81, awayFrom: 82 },
  95: { homeFrom: 86, awayFrom: 88 }, 96: { homeFrom: 85, awayFrom: 87 },
  97: { homeFrom: 89, awayFrom: 90 }, 98: { homeFrom: 91, awayFrom: 92 },
  99: { homeFrom: 93, awayFrom: 94 }, 100: { homeFrom: 95, awayFrom: 96 },
  101: { homeFrom: 97, awayFrom: 98 }, 102: { homeFrom: 99, awayFrom: 100 },
  103: { homeFrom: 101, awayFrom: 102 }, 104: { homeFrom: 101, awayFrom: 102 },
}

function clearDownstreamFrom(
  changedMatchId: number,
  winners: WinnerMap,
  lockedIds: Set<number>,
): WinnerMap {
  const next = { ...winners }
  function recurse(mid: number) {
    for (const [midStr, feed] of Object.entries(DOWNSTREAM)) {
      const downstream = parseInt(midStr)
      if (feed.homeFrom === mid || feed.awayFrom === mid) {
        if (!lockedIds.has(downstream) && next[downstream] !== undefined) {
          delete next[downstream]
          recurse(downstream)
        }
      }
    }
  }
  recurse(changedMatchId)
  return next
}

export function SimuladorClient({
  matches, adminGroupScores, adminKnockoutWinners,
  lockedMatchIds: lockedArr, userId, userGroupPredictions,
}: Props) {
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('groups')
  const [simScores, setSimScores] = useState<ScoreMap>(adminGroupScores)
  const [knockoutWinners, setKnockoutWinners] = useState<WinnerMap>(adminKnockoutWinners)
  const [activeGroup, setActiveGroup] = useState('A')
  const [saveState, setSaveState] = useState<'idle' | 'pending' | 'saved'>('idle')
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lockedMatchIds = useMemo(() => new Set<number>(lockedArr), [lockedArr])
  const storageKey = `porra_sim_${userId}`

  // Load from localStorage on mount, merging admin-locked results on top
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const { simScores: savedScores, knockoutWinners: savedW } = JSON.parse(raw) as {
          simScores: ScoreMap; knockoutWinners: WinnerMap
        }
        setSimScores(() => {
          const merged = { ...savedScores }
          // Admin locked results always win
          for (const id of lockedArr) {
            const s = adminGroupScores[id]
            if (s !== undefined) merged[id] = s
            else delete merged[id]
          }
          return merged
        })
        setKnockoutWinners(() => {
          const merged = { ...savedW }
          for (const [idStr, w] of Object.entries(adminKnockoutWinners)) {
            merged[parseInt(idStr)] = w
          }
          return merged
        })
        setSaveState('saved')
      }
    } catch {}
    setLoaded(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to localStorage (debounced 700ms)
  useEffect(() => {
    if (!loaded) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('pending')
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ simScores, knockoutWinners }))
        setSaveState('saved')
      } catch {}
    }, 700)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [simScores, knockoutWinners, loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScoreChange = useCallback((matchId: number, side: 'home' | 'away', value: number) => {
    if (lockedMatchIds.has(matchId)) return
    setSimScores(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] ?? { home: 0, away: 0 }), [side]: value },
    }))
  }, [lockedMatchIds])

  const handlePickWinner = useCallback((matchId: number, teamId: string) => {
    if (lockedMatchIds.has(matchId)) return
    setKnockoutWinners(prev => {
      const withPick = { ...prev, [matchId]: teamId }
      return clearDownstreamFrom(matchId, withPick, lockedMatchIds)
    })
  }, [lockedMatchIds])

  const handleClearWinner = useCallback((matchId: number) => {
    if (lockedMatchIds.has(matchId)) return
    setKnockoutWinners(prev => { const n = { ...prev }; delete n[matchId]; return n })
  }, [lockedMatchIds])

  // Fill non-locked group matches from user's saved predictions
  const handleFillFromPredictions = useCallback(() => {
    setSimScores(prev => {
      const next = { ...prev }
      for (const [idStr, score] of Object.entries(userGroupPredictions)) {
        const id = parseInt(idStr)
        if (!lockedMatchIds.has(id)) next[id] = score
      }
      return next
    })
  }, [userGroupPredictions, lockedMatchIds])

  // Reset scores for a specific group (non-locked only)
  const handleGroupReset = useCallback((groupMatchIds: number[]) => {
    setSimScores(prev => {
      const next = { ...prev }
      for (const id of groupMatchIds) {
        if (!lockedMatchIds.has(id)) delete next[id]
      }
      return next
    })
  }, [lockedMatchIds])

  // Full reset back to admin-only state + clear localStorage
  const handleFullReset = useCallback(() => {
    setSimScores(adminGroupScores)
    setKnockoutWinners(adminKnockoutWinners)
    try { localStorage.removeItem(storageKey) } catch {}
    setSaveState('idle')
  }, [adminGroupScores, adminKnockoutWinners, storageKey])

  const hasPredictions = Object.keys(userGroupPredictions).length > 0

  const tabs = [
    { key: 'groups' as const,  label: '⚽ Fase de Grupos' },
    { key: 'bracket' as const, label: '🏆 Eliminatorias' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FlaskConical className="text-cyan-400" size={22} />
            Simulador
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Simula resultados y descubre quién se clasifica.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          {/* Save indicator */}
          <span className={cn(
            'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all',
            saveState === 'saved'
              ? 'text-green-400 border-green-500/30 bg-green-500/5'
              : saveState === 'pending'
              ? 'text-gray-500 border-gray-700 bg-gray-900'
              : 'text-gray-700 border-transparent',
          )}>
            {saveState === 'saved'
              ? <><Check size={11} /> Guardado</>
              : saveState === 'pending'
              ? <><Cloud size={11} className="animate-pulse" /> Guardando…</>
              : <><CloudOff size={11} /> Sin guardar</>
            }
          </span>
          <button
            onClick={handleFullReset}
            className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-500/40 rounded-lg px-3 py-1.5 transition-all cursor-pointer"
          >
            Reiniciar todo
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer',
              activeTab === key ? 'bg-cyan-500 text-gray-900' : 'text-gray-400 hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'groups' && (
        <SimuladorGroups
          matches={matches}
          simScores={simScores}
          lockedMatchIds={lockedMatchIds}
          onScoreChange={handleScoreChange}
          onGroupReset={handleGroupReset}
          onFillFromPredictions={handleFillFromPredictions}
          hasPredictions={hasPredictions}
          activeGroup={activeGroup}
          onGroupChange={setActiveGroup}
        />
      )}

      {activeTab === 'bracket' && (
        <SimuladorBracket
          matches={matches}
          simScores={simScores}
          winners={knockoutWinners}
          lockedMatchIds={lockedMatchIds}
          onPickWinner={handlePickWinner}
          onClearWinner={handleClearWinner}
        />
      )}
    </div>
  )
}
