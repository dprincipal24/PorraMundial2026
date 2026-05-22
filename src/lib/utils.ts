import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMatchDate(dateStr: string) {
  const date = new Date(dateStr)
  return {
    day: format(date, "d 'de' MMMM", { locale: es }),
    time: format(date, 'HH:mm'),
    weekday: format(date, 'EEEE', { locale: es }),
    full: format(date, "EEEE d 'de' MMMM, HH:mm", { locale: es }),
    short: format(date, 'dd/MM HH:mm'),
  }
}

export function formatCountdown(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { locale: es, addSuffix: true })
}

export function get1X2(homeScore: number, awayScore: number): '1' | 'X' | '2' {
  if (homeScore > awayScore) return '1'
  if (homeScore === awayScore) return 'X'
  return '2'
}

export function calculateMatchPoints(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number,
): number {
  if (actualHome === predHome && actualAway === predAway) return 6
  if (get1X2(actualHome, actualAway) === get1X2(predHome, predAway)) return 3
  return 0
}

export function getMatchPredictionResult(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number,
): 'correct_exact' | 'correct_1x2' | 'wrong' {
  if (actualHome === predHome && actualAway === predAway) return 'correct_exact'
  if (get1X2(actualHome, actualAway) === get1X2(predHome, predAway)) return 'correct_1x2'
  return 'wrong'
}

export function getRoundLabel(round: string): string {
  const labels: Record<string, string> = {
    r32: 'Ronda de 32',
    r16: 'Octavos de Final',
    qf: 'Cuartos de Final',
    sf: 'Semifinales',
    final: 'Final',
    champion: 'Campeón',
  }
  return labels[round] ?? round
}

export function getRoundPoints(round: string): number {
  const points: Record<string, number> = {
    groups: 5,
    r32: 5,
    r16: 9,
    qf: 15,
    sf: 25,
    champion: 40,
  }
  return points[round] ?? 0
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
