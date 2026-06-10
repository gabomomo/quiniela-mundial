import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import type { Match } from '../types';
import { STAGE_LABELS } from '../data/worldcup2026';

export default function AdminPage() {
  const { player } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { home: string; away: string; status: string }>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'live' | 'finished'>('pending');

  // Solo el admin puede acceder
  useEffect(() => {
    if (player && !player.is_admin) {
      navigate('/');
    }
  }, [player, navigate]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, flag, group_id, group_name),
          away_team:teams!matches_away_team_id_fkey(id, name, flag, group_id, group_name)
        `)
        .order('match_date', { ascending: true });

      setMatches(data || []);

      const init: Record<string, { home: string; away: string; status: string }> = {};
      (data || []).forEach((m: Match) => {
        init[m.id] = {
          home: m.home_score !== null ? String(m.home_score) : '',
          away: m.away_score !== null ? String(m.away_score) : '',
          status: m.status,
        };
      });
      setScores(init);
      setLoading(false);
    };
    fetch();
  }, []);

  const saveMatch = async (matchId: string) => {
    const s = scores[matchId];
    if (!s || s.home === '' || s.away === '') return;
    setSaving(matchId);

    const { error } = await supabase
      .from('matches')
      .update({
        home_score: parseInt(s.home),
        away_score: parseInt(s.away),
        status: s.status,
      })
      .eq('id', matchId);

    setSaving(null);
    if (!error) {
      setSaved(matchId);
      setTimeout(() => setSaved(null), 2000);
      setMatches(prev =>
        prev.map(m => m.id === matchId
          ? { ...m, home_score: parseInt(s.home), away_score: parseInt(s.away), status: s.status as any }
          : m
        )
      );
    }
  };

  const filtered = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'pending') return m.status === 'scheduled';
    if (filter === 'live') return m.status === 'live';
    if (filter === 'finished') return m.status === 'finished';
    return true;
  });

  if (!player?.is_admin) return null;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-[#0A1628]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1 hover:bg-white/10 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="font-bold text-white">Panel de Admin</div>
          <div className="text-white/40 text-xs">Actualizar marcadores</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {(['pending','live','finished','all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            {{ pending: 'Pendientes', live: 'En Vivo', finished: 'Terminados', all: 'Todos' }[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-white/40 animate-pulse">Cargando...</div>
      ) : (
        <div className="px-4 pb-8 space-y-3">
          {filtered.map(match => {
            const s = scores[match.id] || { home: '', away: '', status: 'scheduled' };
            const homeName = match.home_team?.name || match.home_team_placeholder || 'TBD';
            const awayName = match.away_team?.name || match.away_team_placeholder || 'TBD';
            const homeFlag = match.home_team?.flag || '🏴';
            const awayFlag = match.away_team?.flag || '🏴';
            const isSaving = saving === match.id;
            const isSaved = saved === match.id;

            return (
              <div key={match.id} className="card p-4">
                {/* Info */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/40 text-xs">
                    {STAGE_LABELS[match.stage]}{match.group_name ? ` · Grupo ${match.group_name}` : ''}
                    {' · '}{format(parseISO(match.match_date), "d MMM HH:mm", { locale: es })}
                  </span>
                  <select
                    value={s.status}
                    onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...s, status: e.target.value } }))}
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="scheduled">Programado</option>
                    <option value="live">En Vivo</option>
                    <option value="finished">Terminado</option>
                  </select>
                </div>

                {/* Teams + score inputs */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 justify-end">
                    <span className="text-sm font-semibold text-white truncate text-right">{homeName}</span>
                    <span className="text-xl">{homeFlag}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={s.home}
                      onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...s, home: e.target.value } }))}
                      placeholder="-"
                      className="w-12 h-10 text-center text-lg font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    />
                    <span className="text-white/30 font-bold">:</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={s.away}
                      onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...s, away: e.target.value } }))}
                      placeholder="-"
                      className="w-12 h-10 text-center text-lg font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xl">{awayFlag}</span>
                    <span className="text-sm font-semibold text-white truncate">{awayName}</span>
                  </div>

                  <button
                    onClick={() => saveMatch(match.id)}
                    disabled={isSaving || s.home === '' || s.away === ''}
                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-30'
                    }`}
                  >
                    {isSaved ? <CheckCircle size={16} /> : <Save size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
