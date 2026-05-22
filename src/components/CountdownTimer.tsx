'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  deadline: string
  label: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function CountdownTimer({ deadline, label }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    function calc() {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) {
        setExpired(true)
        setTimeLeft(null)
        return
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ d, h, m, s })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (expired) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm">
        <Clock size={14} />
        <span>Plazo cerrado</span>
      </div>
    )
  }

  if (!timeLeft) return null

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock size={14} className="text-amber-400" />
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-1 font-mono font-bold">
        {timeLeft.d > 0 && <span className="text-amber-400">{timeLeft.d}d</span>}
        <span className="text-white">{pad(timeLeft.h)}h</span>
        <span className="text-gray-500">:</span>
        <span className="text-white">{pad(timeLeft.m)}m</span>
        <span className="text-gray-500">:</span>
        <span className="text-white">{pad(timeLeft.s)}s</span>
      </div>
    </div>
  )
}
