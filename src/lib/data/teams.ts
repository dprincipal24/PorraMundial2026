import type { Team } from '@/lib/types'

// Grupos reales del sorteo FIFA del 5 de diciembre de 2025
export const TEAMS: Team[] = [
  // Grupo A
  { id: 'MEX', name: 'México',        flag: '🇲🇽', iso: 'mx', group: 'A', confederation: 'CONCACAF' },
  { id: 'RSA', name: 'Sudáfrica',     flag: '🇿🇦', iso: 'za', group: 'A', confederation: 'CAF' },
  { id: 'KOR', name: 'Corea del Sur', flag: '🇰🇷', iso: 'kr', group: 'A', confederation: 'AFC' },
  { id: 'CZE', name: 'Chequia',       flag: '🇨🇿', iso: 'cz', group: 'A', confederation: 'UEFA' },
  // Grupo B
  { id: 'CAN', name: 'Canadá',        flag: '🇨🇦', iso: 'ca', group: 'B', confederation: 'CONCACAF' },
  { id: 'BIH', name: 'Bosnia-Herzegovina', flag: '🇧🇦', iso: 'ba', group: 'B', confederation: 'UEFA' },
  { id: 'QAT', name: 'Qatar',         flag: '🇶🇦', iso: 'qa', group: 'B', confederation: 'AFC' },
  { id: 'SUI', name: 'Suiza',         flag: '🇨🇭', iso: 'ch', group: 'B', confederation: 'UEFA' },
  // Grupo C
  { id: 'BRA', name: 'Brasil',        flag: '🇧🇷', iso: 'br', group: 'C', confederation: 'CONMEBOL' },
  { id: 'MAR', name: 'Marruecos',     flag: '🇲🇦', iso: 'ma', group: 'C', confederation: 'CAF' },
  { id: 'HAI', name: 'Haití',         flag: '🇭🇹', iso: 'ht', group: 'C', confederation: 'CONCACAF' },
  { id: 'SCO', name: 'Escocia',       flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', iso: 'gb-sct', group: 'C', confederation: 'UEFA' },
  // Grupo D
  { id: 'USA', name: 'Estados Unidos',flag: '🇺🇸', iso: 'us', group: 'D', confederation: 'CONCACAF' },
  { id: 'PAR', name: 'Paraguay',      flag: '🇵🇾', iso: 'py', group: 'D', confederation: 'CONMEBOL' },
  { id: 'AUS', name: 'Australia',     flag: '🇦🇺', iso: 'au', group: 'D', confederation: 'AFC' },
  { id: 'TUR', name: 'Turquía',       flag: '🇹🇷', iso: 'tr', group: 'D', confederation: 'UEFA' },
  // Grupo E
  { id: 'GER', name: 'Alemania',      flag: '🇩🇪', iso: 'de', group: 'E', confederation: 'UEFA' },
  { id: 'CUW', name: 'Curazao',       flag: '🇨🇼', iso: 'cw', group: 'E', confederation: 'CONCACAF' },
  { id: 'CIV', name: 'Costa de Marfil',flag:'🇨🇮', iso: 'ci', group: 'E', confederation: 'CAF' },
  { id: 'ECU', name: 'Ecuador',       flag: '🇪🇨', iso: 'ec', group: 'E', confederation: 'CONMEBOL' },
  // Grupo F
  { id: 'NED', name: 'Países Bajos',  flag: '🇳🇱', iso: 'nl', group: 'F', confederation: 'UEFA' },
  { id: 'JPN', name: 'Japón',         flag: '🇯🇵', iso: 'jp', group: 'F', confederation: 'AFC' },
  { id: 'SWE', name: 'Suecia',        flag: '🇸🇪', iso: 'se', group: 'F', confederation: 'UEFA' },
  { id: 'TUN', name: 'Túnez',         flag: '🇹🇳', iso: 'tn', group: 'F', confederation: 'CAF' },
  // Grupo G
  { id: 'BEL', name: 'Bélgica',       flag: '🇧🇪', iso: 'be', group: 'G', confederation: 'UEFA' },
  { id: 'EGY', name: 'Egipto',        flag: '🇪🇬', iso: 'eg', group: 'G', confederation: 'CAF' },
  { id: 'IRN', name: 'Irán',          flag: '🇮🇷', iso: 'ir', group: 'G', confederation: 'AFC' },
  { id: 'NZL', name: 'Nueva Zelanda', flag: '🇳🇿', iso: 'nz', group: 'G', confederation: 'OFC' },
  // Grupo H
  { id: 'ESP', name: 'España',        flag: '🇪🇸', iso: 'es', group: 'H', confederation: 'UEFA' },
  { id: 'CPV', name: 'Cabo Verde',    flag: '🇨🇻', iso: 'cv', group: 'H', confederation: 'CAF' },
  { id: 'KSA', name: 'Arabia Saudí',  flag: '🇸🇦', iso: 'sa', group: 'H', confederation: 'AFC' },
  { id: 'URU', name: 'Uruguay',       flag: '🇺🇾', iso: 'uy', group: 'H', confederation: 'CONMEBOL' },
  // Grupo I
  { id: 'FRA', name: 'Francia',       flag: '🇫🇷', iso: 'fr', group: 'I', confederation: 'UEFA' },
  { id: 'SEN', name: 'Senegal',       flag: '🇸🇳', iso: 'sn', group: 'I', confederation: 'CAF' },
  { id: 'IRQ', name: 'Irak',          flag: '🇮🇶', iso: 'iq', group: 'I', confederation: 'AFC' },
  { id: 'NOR', name: 'Noruega',       flag: '🇳🇴', iso: 'no', group: 'I', confederation: 'UEFA' },
  // Grupo J
  { id: 'ARG', name: 'Argentina',     flag: '🇦🇷', iso: 'ar', group: 'J', confederation: 'CONMEBOL' },
  { id: 'ALG', name: 'Argelia',       flag: '🇩🇿', iso: 'dz', group: 'J', confederation: 'CAF' },
  { id: 'AUT', name: 'Austria',       flag: '🇦🇹', iso: 'at', group: 'J', confederation: 'UEFA' },
  { id: 'JOR', name: 'Jordania',      flag: '🇯🇴', iso: 'jo', group: 'J', confederation: 'AFC' },
  // Grupo K
  { id: 'POR', name: 'Portugal',      flag: '🇵🇹', iso: 'pt', group: 'K', confederation: 'UEFA' },
  { id: 'COD', name: 'Congo DR',      flag: '🇨🇩', iso: 'cd', group: 'K', confederation: 'CAF' },
  { id: 'UZB', name: 'Uzbekistán',    flag: '🇺🇿', iso: 'uz', group: 'K', confederation: 'AFC' },
  { id: 'COL', name: 'Colombia',      flag: '🇨🇴', iso: 'co', group: 'K', confederation: 'CONMEBOL' },
  // Grupo L
  { id: 'ENG', name: 'Inglaterra',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', iso: 'gb-eng', group: 'L', confederation: 'UEFA' },
  { id: 'CRO', name: 'Croacia',       flag: '🇭🇷', iso: 'hr', group: 'L', confederation: 'UEFA' },
  { id: 'GHA', name: 'Ghana',         flag: '🇬🇭', iso: 'gh', group: 'L', confederation: 'CAF' },
  { id: 'PAN', name: 'Panamá',        flag: '🇵🇦', iso: 'pa', group: 'L', confederation: 'CONCACAF' },
]

export const TEAMS_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]))
export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export function getTeamsByGroup(group: string) {
  return TEAMS.filter((t) => t.group === group)
}

export function flagUrl(iso: string, size: 40 | 80 = 40): string {
  return `https://flagcdn.com/w${size}/${iso.toLowerCase()}.png`
}
