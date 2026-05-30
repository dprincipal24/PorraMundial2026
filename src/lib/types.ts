export type AppPhase =
  | 'registration'
  | 'group_predictions'
  | 'groups_playing'
  | 'knockout_predictions'
  | 'knockout_playing'
  | 'finished'

export type MatchPhase = 'groups' | 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final'

export type MatchStatus = 'scheduled' | 'live' | 'finished'

export interface Team {
  id: string
  name: string
  flag: string
  iso: string
  group: string
  confederation: string
  // Tournament progress (set by admin)
  qualified_knockout?: boolean
  reached_r16?: boolean
  reached_qf?: boolean
  reached_sf?: boolean
  reached_final?: boolean
  is_champion?: boolean
}

export interface Stadium {
  id: number
  name: string
  city: string
  country: string
  country_flag: string
  capacity: number
}

export interface Match {
  id: number
  phase: MatchPhase
  group_name: string | null
  match_number: number
  home_team_id: string | null
  away_team_id: string | null
  home_placeholder: string | null
  away_placeholder: string | null
  match_date: string
  stadium_id: number
  home_score: number | null
  away_score: number | null
  status: MatchStatus
  home_team?: Team
  away_team?: Team
  stadium?: Stadium
}

export interface MatchPrediction {
  id: string
  user_id: string
  match_id: number
  home_score: number
  away_score: number
  created_at: string
}

export interface KnockoutPrediction {
  id: string
  user_id: string
  round: string
  team_id: string
  created_at: string
}

export interface GroupQualifyPrediction {
  id: string
  user_id: string
  team_id: string
  created_at: string
}

export interface Profile {
  id: string
  name: string
  avatar_url: string | null
  is_admin: boolean
  is_banned: boolean
  has_paid: boolean
  created_at: string
}

export interface AwardPrediction {
  id: string
  user_id: string
  award_type: string
  player_name: string
  created_at: string
}

export interface UserScore {
  user_id: string
  name: string
  avatar_url: string | null
  match_points: number
  group_qualify_points: number
  knockout_points: number
  award_points: number
  total_points: number
  has_paid: boolean
  position: number
}

export interface AppSettings {
  phase: AppPhase
  group_predictions_deadline: string | null
  knockout_predictions_deadline: string | null
}

export type PredictionResult = 'correct_exact' | 'correct_1x2' | 'wrong' | 'pending'

export interface MatchWithPrediction extends Match {
  prediction?: MatchPrediction
  result?: PredictionResult
  points_earned?: number
}
