import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import type { Match, Prediction } from '../types';
import { STAGE_LABELS } from '../data/worldcup2026';

const STAGE_ORDER = ['group', 'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final'];

export default function GroupsPage() {
  const { player } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string>('A');
  const [activeStage, setActiveStage] = useState<string>('group');

  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  useEffect(() => {
    const fetchAll = async () => {
      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, flag, group_id, group_name),
          away_team:teams!matches_away_team_id_fkey(id, name, flag, group_id, group_name)
        `)
        .order('match_date', { ascending: true });

      setMatches(matchData || []);

      if (player) {
        const { data: predData } = await supabase
          .from('predictions')
          .select('*')
          .eq('player_id', player.id);
        const map: Record<string, Prediction> = {};
        (predData || []).forEach((p: Prediction) => { map[p.match_id] = p; });

        setPredictions(map);
      }
      setLoading(false);
    };

    fetchAll();
    const poll = setInterval(fetchAll, 30_000);
    return () => clearInterval(poll);
  }, [player]);

  const stages = [...new Set(matches.map(m => m.stage))];
  const sortedStages = STAGE_ORDER.filter(s => stages.includes(s as any));

  const filteredMatches = activeStage === 'group'
    ? matches.filter(m => m.stage === 'group' && m.group_name === activeGroup)
    : matches.filter(m => m.stage === activeStage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40 text-sm animate-pulse">Cargando partidos...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Stage tabs */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 py-3 w-max">
          {sortedStages.map(stage => (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeStage === stage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {STAGE_LABELS[stage] || stage}
            </button>
          ))}
        </div>
      </div>

      {/* Group tabs (only in group stage) */}
      {activeStage === 'group' && (
        <div className="overflow-x-auto scrollbar-hide border-b border-white/10">
          <div className="flex px-4 w-max">
            {groups.map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
                  activeGroup === g
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      <div className="p-4 space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <div className="text-4xl mb-3">📅</div>
            <p>No hay partidos en esta fase aún</p>
          </div>
        ) : (
          filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id] || null}
            />
          ))
        )}
      </div>
    </div>
  );
}
