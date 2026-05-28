import { ALL_TEAMS, type Position } from './squads'

export type AwardType = 'golden_ball' | 'golden_boot' | 'golden_glove' | 'best_young'

export interface AwardPlayer {
  name: string
  country: string
  iso: string
  position: Position
  dob: string
}

export interface TeamForAward {
  name: string
  iso: string
  players: AwardPlayer[]
}

// Jóvenes: nacidos el 2 de enero de 2004 o después (≤21 años al 1 ene 2026)
const YOUNG_CUTOFF = '2004-01-02'

function buildTeams(posFilter?: Position[], youngOnly = false): TeamForAward[] {
  return ALL_TEAMS
    .map(team => ({
      name: team.name,
      iso: team.iso,
      players: team.players
        .filter(p => !posFilter || posFilter.includes(p.position))
        .filter(p => !youngOnly || p.dob >= YOUNG_CUTOFF)
        .map(p => ({ name: p.name, country: team.name, iso: team.iso, position: p.position, dob: p.dob })),
    }))
    .filter(t => t.players.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export const TEAMS_BY_AWARD: Record<AwardType, TeamForAward[]> = {
  golden_ball:  buildTeams(),
  golden_boot:  buildTeams(['MID', 'FWD']),
  golden_glove: buildTeams(['GK']),
  best_young:   buildTeams(undefined, true),
}

/** Lista plana de jugadores por premio (para búsquedas y panel de admin) */
export const PLAYERS_BY_AWARD: Record<AwardType, AwardPlayer[]> = {
  golden_ball:  TEAMS_BY_AWARD.golden_ball.flatMap(t => t.players),
  golden_boot:  TEAMS_BY_AWARD.golden_boot.flatMap(t => t.players),
  golden_glove: TEAMS_BY_AWARD.golden_glove.flatMap(t => t.players),
  best_young:   TEAMS_BY_AWARD.best_young.flatMap(t => t.players),
}

export const AWARDS = [
  {
    type: 'golden_ball'  as AwardType,
    label: 'Balón de Oro',
    emoji: '🏅',
    description: 'Mejor jugador del torneo',
    settingKey: 'golden_ball_winner',
  },
  {
    type: 'golden_boot'  as AwardType,
    label: 'Bota de Oro',
    emoji: '👟',
    description: 'Máximo goleador',
    settingKey: 'golden_boot_winner',
  },
  {
    type: 'golden_glove' as AwardType,
    label: 'Guante de Oro',
    emoji: '🧤',
    description: 'Mejor portero',
    settingKey: 'golden_glove_winner',
  },
  {
    type: 'best_young'   as AwardType,
    label: 'Mejor Jugador Joven',
    emoji: '⭐',
    description: 'Mejor jugador (≤21 años a 1 ene 2026)',
    settingKey: 'best_young_winner',
  },
]

export const AVATAR_EMOJIS = [
  // Deportes
  '⚽', '🏆', '🥇', '🎯', '🏅', '🥊', '🏋️', '🤸', '🏄', '🚴',
  // Animales 1
  '🦁', '🐯', '🦊', '🐺', '🦈', '🦝', '🐸', '🦅', '🦉', '🐉',
  // Animales 2
  '🦄', '🐮', '🦋', '🦜', '🦂', '🐆', '🦦', '🦥', '🐻', '🦬',
  // Tecnología / espacio
  '🤖', '👾', '🚀', '🛸', '🌙', '⭐', '🌟', '💫', '⚡', '🔥',
  // Fantasía / personajes
  '👑', '💎', '👻', '💀', '🧙', '🦸', '🧟', '🥷', '🧛', '🎭',
  // Comida
  '🍕', '🍔', '🌮', '🍣', '🎂', '🍩', '🌯', '🍜', '🍦', '🥐',
  // Objetos / misc
  '🎸', '🎪', '🎮', '🎩', '🔮', '💣', '🎲', '🌈', '🌊', '🌸',
]
