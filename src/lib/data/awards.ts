// ─── Lista por premio: cada uno tiene su propio conjunto de candidatos ───────

export type AwardType = 'golden_ball' | 'golden_boot' | 'golden_glove' | 'best_young'

export interface AwardPlayer {
  name: string
  country: string
  iso: string  // código para TeamFlag (flagcdn.com)
}

/** Balón de Oro – mejor jugador del torneo */
export const GOLDEN_BALL_PLAYERS: AwardPlayer[] = [
  { name: 'Kylian Mbappé',       country: 'Francia',    iso: 'fr' },
  { name: 'Lamine Yamal',        country: 'España',     iso: 'es' },
  { name: 'Harry Kane',          country: 'Inglaterra', iso: 'gb-eng' },
  { name: 'Lionel Messi',        country: 'Argentina',  iso: 'ar' },
  { name: 'Jude Bellingham',     country: 'Inglaterra', iso: 'gb-eng' },
  { name: 'Vinicius Jr',         country: 'Brasil',     iso: 'br' },
  { name: 'Rodri',               country: 'España',     iso: 'es' },
  { name: 'Phil Foden',          country: 'Inglaterra', iso: 'gb-eng' },
  { name: 'Florian Wirtz',       country: 'Alemania',   iso: 'de' },
  { name: 'Antoine Griezmann',   country: 'Francia',    iso: 'fr' },
  { name: 'Cristiano Ronaldo',   country: 'Portugal',   iso: 'pt' },
  { name: 'Michael Olise',       country: 'Francia',    iso: 'fr' },
  { name: 'Bukayo Saka',         country: 'Inglaterra', iso: 'gb-eng' },
  { name: 'Rafael Leão',         country: 'Portugal',   iso: 'pt' },
  { name: 'Ousmane Dembélé',    country: 'Francia',    iso: 'fr' },
  { name: 'Jamal Musiala',       country: 'Alemania',   iso: 'de' },
  { name: 'Pedri',               country: 'España',     iso: 'es' },
  { name: 'Arda Güler',          country: 'Turquía',    iso: 'tr' },
  { name: 'Alejandro Garnacho',  country: 'Argentina',  iso: 'ar' },
  { name: 'Rodrygo',             country: 'Brasil',     iso: 'br' },
]

/** Bota de Oro – máximo goleador */
export const GOLDEN_BOOT_PLAYERS: AwardPlayer[] = [
  { name: 'Kylian Mbappé',       country: 'Francia',    iso: 'fr' },
  { name: 'Harry Kane',          country: 'Inglaterra', iso: 'gb-eng' },
  { name: 'Lionel Messi',        country: 'Argentina',  iso: 'ar' },
  { name: 'Vinicius Jr',         country: 'Brasil',     iso: 'br' },
  { name: 'Cristiano Ronaldo',   country: 'Portugal',   iso: 'pt' },
  { name: 'Michael Olise',       country: 'Francia',    iso: 'fr' },
  { name: 'Lamine Yamal',        country: 'España',     iso: 'es' },
  { name: 'Antoine Griezmann',   country: 'Francia',    iso: 'fr' },
  { name: 'Bukayo Saka',         country: 'Inglaterra', iso: 'gb-eng' },
  { name: 'Endrick',             country: 'Brasil',     iso: 'br' },
  { name: 'Alejandro Garnacho',  country: 'Argentina',  iso: 'ar' },
  { name: 'Phil Foden',          country: 'Inglaterra', iso: 'gb-eng' },
  { name: 'Rafael Leão',         country: 'Portugal',   iso: 'pt' },
  { name: 'Rodrygo',             country: 'Brasil',     iso: 'br' },
  { name: 'Ousmane Dembélé',    country: 'Francia',    iso: 'fr' },
  { name: 'Arda Güler',          country: 'Turquía',    iso: 'tr' },
  { name: 'Estêvão',             country: 'Brasil',     iso: 'br' },
  { name: 'Jude Bellingham',     country: 'Inglaterra', iso: 'gb-eng' },
  { name: 'Dušan Vlahović',      country: 'Serbia',     iso: 'rs' },
  { name: 'Jamal Musiala',       country: 'Alemania',   iso: 'de' },
]

/** Guante de Oro – mejor portero (solo porteros) */
export const GOLDEN_GLOVE_PLAYERS: AwardPlayer[] = [
  { name: 'Emiliano Martínez',  country: 'Argentina', iso: 'ar' },
  { name: 'Thibaut Courtois',    country: 'Bélgica',   iso: 'be' },
  { name: 'Mike Maignan',        country: 'Francia',   iso: 'fr' },
  { name: 'Alisson Becker',      country: 'Brasil',    iso: 'br' },
  { name: 'Unai Simón',          country: 'España',    iso: 'es' },
  { name: 'Jordan Pickford',     country: 'Inglaterra',iso: 'gb-eng' },
  { name: 'Diogo Costa',         country: 'Portugal',  iso: 'pt' },
  { name: 'Gregor Kobel',        country: 'Suiza',     iso: 'ch' },
  { name: 'Oliver Baumann',      country: 'Alemania',  iso: 'de' },
  { name: 'David Raya',          country: 'España',    iso: 'es' },
  { name: 'Yann Sommer',         country: 'Suiza',     iso: 'ch' },
  { name: 'Andriy Lunin',        country: 'Ucrania',   iso: 'ua' },
]

/**
 * Mejor Jugador Joven – elegible si tiene ≤21 años el 1 de enero de 2026
 * (nacido a partir del 2 de enero de 2004)
 */
export const BEST_YOUNG_PLAYERS: AwardPlayer[] = [
  { name: 'Lamine Yamal',         country: 'España',     iso: 'es' },     // n. jul 2007
  { name: 'Pau Cubarsí',          country: 'España',     iso: 'es' },     // n. ene 2007
  { name: 'Estêvão',              country: 'Brasil',     iso: 'br' },     // n. abr 2007
  { name: 'Endrick',              country: 'Brasil',     iso: 'br' },     // n. jul 2006
  { name: 'Warren Zaïre-Emery',  country: 'Francia',    iso: 'fr' },     // n. mar 2006
  { name: 'Kobbie Mainoo',        country: 'Inglaterra', iso: 'gb-eng' }, // n. abr 2005
  { name: 'Désiré Doué',          country: 'Francia',    iso: 'fr' },     // n. jun 2005
  { name: 'Arda Güler',           country: 'Turquía',    iso: 'tr' },     // n. feb 2005
  { name: 'Mathys Tel',           country: 'Francia',    iso: 'fr' },     // n. abr 2005
  { name: 'João Neves',           country: 'Portugal',   iso: 'pt' },     // n. jun 2004
  { name: 'Gavi',                 country: 'España',     iso: 'es' },     // n. feb 2004
  { name: 'Alejandro Garnacho',   country: 'Argentina',  iso: 'ar' },     // n. jul 2004
  { name: 'Sávio',                country: 'Brasil',     iso: 'br' },     // n. sep 2004
]

/** Mapa de cada premio a su lista de jugadores */
export const PLAYERS_BY_AWARD: Record<AwardType, AwardPlayer[]> = {
  golden_ball:  GOLDEN_BALL_PLAYERS,
  golden_boot:  GOLDEN_BOOT_PLAYERS,
  golden_glove: GOLDEN_GLOVE_PLAYERS,
  best_young:   BEST_YOUNG_PLAYERS,
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
  '⚽', '🦁', '🐯', '🦅', '🦊', '🐺', '🦈', '🦝', '🐸', '👑',
  '🤖', '👾', '🎭', '🔥', '⚡', '🌙', '🎯', '🏆', '💎', '🚀',
  '🎸', '🍕', '🦄', '🐉', '👻', '🎪', '🌟', '🎮', '🏄', '🎩',
]
