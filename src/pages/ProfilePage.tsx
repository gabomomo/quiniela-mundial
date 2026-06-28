import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Trophy, Target } from 'lucide-react';

interface Stats {
  total_predictions: number;
  exact_scores: number;
  correct_results: number;
  total_points: number;
}

export default function ProfilePage() {
  const { player, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!player) return;
    const fetch = async () => {
      const { data: predsData } = await supabase
        .from('predictions')
        .select('points, home_score, away_score')
        .eq('player_id', player.id);

      if (predsData) {
        const total = predsData.reduce((a, p) => a + (p.points || 0), 0);
        const exact = predsData.filter(p => (p.points ?? 0) >= 3).length;
        const correct = predsData.filter(p => (p.points ?? 0) >= 1 && (p.points ?? 0) < 3).length;
        setStats({
          total_predictions: predsData.length,
          exact_scores: exact,
          correct_results: correct,
          total_points: total,
        });
      }

      const { data: lb } = await supabase
        .from('leaderboard')
        .select('player_id')
        .order('total_points', { ascending: false });

      if (lb) {
        const idx = lb.findIndex((e: any) => e.player_id === player.id);
        setRank(idx >= 0 ? idx + 1 : null);
      }
    };
    fetch();
  }, [player]);

  if (!player) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Profile card */}
      <div className="card p-6 text-center">
        <div className="text-6xl mb-3">{player.avatar_emoji}</div>
        <h2 className="text-2xl font-black text-white">{player.name}</h2>
        <p className="text-white/40 text-sm mt-1">{player.email}</p>
        {rank && (
          <div className="mt-3 inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-xl px-4 py-2">
            <Trophy size={16} className="text-yellow-400" />
            <span className="text-white font-bold">Puesto #{rank}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <div className="text-3xl font-black text-white">{stats.total_points}</div>
            <div className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
              <Trophy size={11} />
              Puntos totales
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-black text-white">{stats.total_predictions}</div>
            <div className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
              <Target size={11} />
              Predicciones
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-black text-yellow-400">{stats.exact_scores}</div>
            <div className="text-white/40 text-xs mt-1">Marcadores exactos</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-black text-green-400">{stats.correct_results}</div>
            <div className="text-white/40 text-xs mt-1">Resultados correctos</div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card p-4 text-sm text-white/50 space-y-2">
        <p>• Las predicciones se cierran cuando inicia el partido</p>
        <p>• Marcador exacto otorga <span className="text-yellow-400 font-bold">3 puntos</span></p>
        <p>• Resultado correcto (G/E/P) otorga <span className="text-green-400 font-bold">1 punto</span></p>
        <p>• Los puntos se actualizan al finalizar cada partido</p>
      </div>

<button
        onClick={logout}
        className="btn-danger w-full flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  );
}
