export interface Player {
  id: string;
  name: string;
  email: string;
  pin: string;
  avatar_emoji: string;
  is_admin: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string; // A-L
}

export interface Team {
  id: string;
  name: string;
  flag: string;
  group_id: string;
  group_name: string;
}

export interface Match {
  id: string;
  match_number: number;
  stage: 'group' | 'round_of_32' | 'round_of_16' | 'quarterfinal' | 'semifinal' | 'third_place' | 'final';
  group_id: string | null;
  group_name: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_placeholder: string | null;
  away_team_placeholder: string | null;
  match_date: string; // ISO string
  venue: string;
  city: string;
  country: string;
  home_score: number | null;
  away_score: number | null;
  advancing_team_id: string | null;
  predictions_open: boolean;
  status: 'scheduled' | 'live' | 'finished';
  // joined
  home_team?: Team;
  away_team?: Team;
}

export interface Prediction {
  id: string;
  player_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  predicted_winner_id: string | null;
  points: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  avatar_emoji: string;
  total_points: number;
  exact_scores: number;
  correct_results: number;
  predictions_count: number;
}
