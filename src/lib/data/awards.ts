export const AWARD_PLAYERS = [
  { name: 'Kylian Mbappé',        country: 'Francia',    flag: '🇫🇷' },
  { name: 'Lamine Yamal',         country: 'España',     flag: '🇪🇸' },
  { name: 'Harry Kane',           country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Lionel Messi',         country: 'Argentina',  flag: '🇦🇷' },
  { name: 'Michael Olise',        country: 'Francia',    flag: '🇫🇷' },
  { name: 'Jude Bellingham',      country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Vinicius Jr',          country: 'Brasil',     flag: '🇧🇷' },
  { name: 'Pedri',                country: 'España',     flag: '🇪🇸' },
  { name: 'Rodri',                country: 'España',     flag: '🇪🇸' },
  { name: 'Phil Foden',           country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Antoine Griezmann',    country: 'Francia',    flag: '🇫🇷' },
  { name: 'Cristiano Ronaldo',    country: 'Portugal',   flag: '🇵🇹' },
  { name: 'Endrick',              country: 'Brasil',     flag: '🇧🇷' },
  { name: 'Warren Zaïre-Emery',  country: 'Francia',    flag: '🇫🇷' },
  { name: 'Kobbie Mainoo',        country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Florian Wirtz',        country: 'Alemania',   flag: '🇩🇪' },
  { name: 'Alisson Becker',       country: 'Brasil',     flag: '🇧🇷' },
  { name: 'Emiliano Martínez',   country: 'Argentina',  flag: '🇦🇷' },
  { name: 'Thibaut Courtois',     country: 'Bélgica',   flag: '🇧🇪' },
  { name: 'Mike Maignan',         country: 'Francia',    flag: '🇫🇷' },
] as const

export type AwardType = 'golden_ball' | 'golden_boot' | 'golden_glove' | 'best_young'

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
    description: 'Mejor jugador sub-21',
    settingKey: 'best_young_winner',
  },
]

export const AVATAR_EMOJIS = [
  '⚽', '🦁', '🐯', '🦅', '🦊', '🐺', '🦈', '🦝', '🐸', '👑',
  '🤖', '👾', '🎭', '🔥', '⚡', '🌙', '🎯', '🏆', '💎', '🚀',
  '🎸', '🍕', '🦄', '🐉', '👻', '🎪', '🌟', '🎮', '🏄', '🎩',
]
