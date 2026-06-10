import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { LeaderboardEntry } from '../types';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const { player } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false });
      setEntries(data || []);
      setLoading(false);
    };
    fetch();

    const sub = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const myRank = entries.findIndex(e => e.player_id === player?.id) + 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40 animate-pulse">Cargando tabla...</div>
      </div>
    );
  }

  const medalIcons = ['🥇', '🥈', '🥉'];

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-black text-white">Tabla de Posiciones</h2>
        <p className="text-white/40 text-sm">Mundial 2026</p>
      </div>

      {player && myRank > 0 && (
        <div className="card p-4 mb-4 border-blue-500/30 bg-blue-600/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600/30 text-blue-300 font-black text-sm">
                #{myRank}
              </div>
              <span className="text-lg">{player.avatar_emoji}</span>
              <div>
                <div className="font-semibold text-white text-sm">{player.name} <span className="text-blue-400 text-xs">(Tú)</span></div>
                <div className="text-white/40 text-xs">{entries[myRank - 1]?.predictions_count || 0} predicciones</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white">{entries[myRank - 1]?.total_points || 0}</div>
              <div className="text-white/40 text-xs">puntos</div>
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Aún no hay puntos</p>
          <p className="text-sm mt-1">Los puntos se calculan al finalizar cada partido</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isMe = entry.player_id === player?.id;
            return (
              <div
                key={entry.player_id}
                className={`card p-4 flex items-center gap-3 ${isMe ? 'border-blue-500/40 bg-blue-600/10' : ''}`}
              >
                <div className="w-8 text-center">
                  {rank <= 3 ? (
                    <span className="text-xl">{medalIcons[rank - 1]}</span>
                  ) : (
                    <span className={`font-black text-sm ${isMe ? 'text-blue-400' : 'text-white/40'}`}>#{rank}</span>
                  )}
                </div>

                <span className="text-2xl">{entry.avatar_emoji}</span>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm flex items-center gap-1 truncate">
                    {entry.player_name}
                    {isMe && <span className="text-blue-400 text-xs">(Tú)</span>}
                  </div>
                  <div className="text-white/40 text-xs flex gap-2">
                    <span>🎯 {entry.exact_scores} exactos</span>
                    <span>✓ {entry.correct_results} resultados</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xl font-black ${rank === 1 ? 'text-yellow-400' : isMe ? 'text-blue-300' : 'text-white'}`}>
                    {entry.total_points}
                  </div>
                  <div className="text-white/40 text-xs">pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 card p-4 text-center">
        <div className="text-white/40 text-xs space-y-1">
          <p>🥇 Marcador exacto = <span className="text-yellow-400 font-bold">3 puntos</span></p>
          <p>✅ Resultado correcto = <span className="text-green-400 font-bold">1 punto</span></p>
          <p>❌ Resultado incorrecto = <span className="text-white/30 font-bold">0 puntos</span></p>
        </div>
      </div>
    </div>
  );
}
