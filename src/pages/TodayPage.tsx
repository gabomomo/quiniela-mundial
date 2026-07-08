import { useState, useEffect } from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import type { Match, Prediction } from '../types';

export default function TodayPage() {
  const { player } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);

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

    // Realtime
    const sub = supabase
      .channel('today_matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchAll)
      .subscribe();

    // Polling cada 30 segundos como respaldo
    const poll = setInterval(fetchAll, 30_000);

    return () => {
      supabase.removeChannel(sub);
      clearInterval(poll);
    };
  }, [player]);

  const todayMatches = matches.filter(m => isToday(parseISO(m.match_date)));
  const liveMatches = matches.filter(m => m.status === 'live');
  // Próximos: partidos programados, a futuro, con equipos ya definidos (no placeholders TBD)
  const now = new Date();
  const upcomingMatches = matches.filter(m =>
    m.status === 'scheduled' &&
    m.home_team_id && m.away_team_id &&
    !isToday(parseISO(m.match_date)) &&
    parseISO(m.match_date) > now
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40 animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header fecha */}
      <div>
        <h2 className="text-xl font-black text-white">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </h2>
        <p className="text-white/40 text-sm capitalize">Mundial 2026</p>
      </div>

      {/* EN VIVO */}
      {liveMatches.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide">En Vivo</h3>
          </div>
          <div className="space-y-3">
            {liveMatches.map(match => (
              <MatchCard key={match.id} match={match} prediction={predictions[match.id] || null} />
            ))}
          </div>
        </section>
      )}

      {/* PARTIDOS DE HOY */}
      {todayMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wide">Hoy</h3>
            <span className="text-xs text-white/30">{todayMatches.length} partido{todayMatches.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3">
            {todayMatches.map(match => (
              <MatchCard key={match.id} match={match} prediction={predictions[match.id] || null} />
            ))}
          </div>
        </section>
      )}

      {/* Sin partidos hoy */}
      {todayMatches.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-3">😴</div>
          <p className="font-semibold text-white">No hay partidos hoy</p>
          <p className="text-white/40 text-sm mt-1">Disfruta el descanso</p>
        </div>
      )}

      {/* PRÓXIMOS PARTIDOS */}
      {upcomingMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-wide">Próximos partidos</h3>
            <span className="text-xs text-white/30">{upcomingMatches.length} partido{upcomingMatches.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3">
            {upcomingMatches.map(match => (
              <MatchCard key={match.id} match={match} prediction={predictions[match.id] || null} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
