import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Match, Prediction } from '../types';

export function useMatches(groupName?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      let query = supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, flag, group_id, group_name),
          away_team:teams!matches_away_team_id_fkey(id, name, flag, group_id, group_name)
        `)
        .order('match_date', { ascending: true });

      if (groupName) {
        query = query.eq('group_name', groupName);
      }

      const { data } = await query;
      setMatches(data || []);
      setLoading(false);
    };

    fetchMatches();

    const sub = supabase
      .channel('matches_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [groupName]);

  return { matches, loading };
}

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, flag, group_id, group_name),
          away_team:teams!matches_away_team_id_fkey(id, name, flag, group_id, group_name)
        `)
        .eq('id', matchId)
        .single();
      setMatch(data);
      setLoading(false);
    };
    fetch();

    const sub = supabase
      .channel(`match_${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [matchId]);

  return { match, loading };
}

export function useMatchPredictions(matchId: string) {
  const [predictions, setPredictions] = useState<(Prediction & { player_name: string; avatar_emoji: string })[]>([]);

  useEffect(() => {
    if (!matchId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('predictions')
        .select('*, players(name, avatar_emoji)')
        .eq('match_id', matchId);
      setPredictions((data || []).map((p: any) => ({
        ...p,
        player_name: p.players?.name || '',
        avatar_emoji: p.players?.avatar_emoji || '⚽',
      })));
    };
    fetch();

    const sub = supabase
      .channel(`preds_${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions', filter: `match_id=eq.${matchId}` }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [matchId]);

  return predictions;
}

export function usePlayerPrediction(matchId: string, playerId: string) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    if (!matchId || !playerId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)
        .eq('player_id', playerId)
        .single();
      setPrediction(data || null);
    };
    fetch();
  }, [matchId, playerId]);

  return { prediction, setPrediction };
}
