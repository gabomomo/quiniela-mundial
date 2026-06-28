import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Shield, CheckCircle, Radio, RotateCcw, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Match } from '../types';
import { STAGE_LABELS } from '../data/worldcup2026';
import { useNow } from '../hooks/useNow';

const KNOCKOUT_STAGES = new Set(['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final']);

type Filter = 'pending' | 'live' | 'finished' | 'all';

interface MatchEdit {
  homeScore: string;
  awayScore: string;
  advancingTeamId: string;
}

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [edits, setEdits] = useState<Record<string, MatchEdit>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const now = useNow(matches);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, flag, group_id, group_name),
        away_team:teams!matches_away_team_id_fkey(id, name, flag, group_id, group_name)
      `)
      .order('match_date', { ascending: true });
    setMatches(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
    const sub = supabase
      .channel('admin_matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const getEdit = (match: Match): MatchEdit => {
    return edits[match.id] ?? {
      homeScore: match.home_score !== null ? String(match.home_score) : '',
      awayScore: match.away_score !== null ? String(match.away_score) : '',
      advancingTeamId: match.advancing_team_id ?? '',
    };
  };

  const setEdit = (matchId: string, patch: Partial<MatchEdit>) => {
    setEdits(prev => ({
      ...prev,
      [matchId]: { ...getEdit(matches.find(m => m.id === matchId)!), ...patch },
    }));
  };

  const markLive = async (match: Match) => {
    setSaving(p => ({ ...p, [match.id]: true }));
    await supabase.from('matches').update({ status: 'live' }).eq('id', match.id);
    setSaving(p => ({ ...p, [match.id]: false }));
  };

  const saveResult = async (match: Match) => {
    const edit = getEdit(match);
    const homeScore = parseInt(edit.homeScore);
    const awayScore = parseInt(edit.awayScore);
    if (isNaN(homeScore) || isNaN(awayScore)) return;

    const isKnockout = KNOCKOUT_STAGES.has(match.stage);
    const isDraw = homeScore === awayScore;

    setSaving(p => ({ ...p, [match.id]: true }));
    await supabase.from('matches').update({
      home_score: homeScore,
      away_score: awayScore,
      advancing_team_id: (isKnockout && isDraw && edit.advancingTeamId) ? edit.advancingTeamId : null,
      status: 'finished',
    }).eq('id', match.id);
    setSaving(p => ({ ...p, [match.id]: false }));
    setSaved(p => ({ ...p, [match.id]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [match.id]: false })), 2500);
    // limpiar edits locales para que tome los valores de la DB
    setEdits(p => { const n = { ...p }; delete n[match.id]; return n; });
    fetchMatches();
  };

  const reopen = async (match: Match) => {
    setSaving(p => ({ ...p, [match.id]: true }));
    await supabase.from('matches').update({
      home_score: null,
      away_score: null,
      advancing_team_id: null,
      status: 'scheduled',
    }).eq('id', match.id);
    setEdits(p => { const n = { ...p }; delete n[match.id]; return n; });
    setSaving(p => ({ ...p, [match.id]: false }));
    fetchMatches();
  };

  const filtered = matches.filter(m => {
    const past = parseISO(m.match_date) <= now;
    if (filter === 'pending') return m.status !== 'finished' && past;
    if (filter === 'live') return m.status === 'live';
    if (filter === 'finished') return m.status === 'finished';
    return true;
  });

  const counts = {
    pending: matches.filter(m => m.status !== 'finished' && parseISO(m.match_date) <= now).length,
    live: matches.filter(m => m.status === 'live').length,
    finished: matches.filter(m => m.status === 'finished').length,
    all: matches.length,
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'pending', label: `Sin resultado (${counts.pending})` },
    { key: 'live', label: `En vivo (${counts.live})` },
    { key: 'finished', label: `Finalizados (${counts.finished})` },
    { key: 'all', label: `Todos (${counts.all})` },
  ];

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A1628]/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-yellow-400" />
          <span className="font-black text-white">Panel de Admin</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="overflow-x-auto px-4 pt-4">
        <div className="flex gap-2 min-w-max">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading && (
          <div className="text-center text-white/40 py-10 animate-pulse">Cargando partidos...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center text-white/40 py-10">No hay partidos en esta categoría</div>
        )}

        {filtered.map(match => {
          const edit = getEdit(match);
          const isSaving = saving[match.id] ?? false;
          const isSaved = saved[match.id] ?? false;
          const isKnockout = KNOCKOUT_STAGES.has(match.stage);
          const homeScore = parseInt(edit.homeScore);
          const awayScore = parseInt(edit.awayScore);
          const editIsDraw = !isNaN(homeScore) && !isNaN(awayScore) && homeScore === awayScore;
          const showAdvancing = isKnockout && editIsDraw && edit.homeScore !== '' && edit.awayScore !== '';
          const matchDate = parseISO(match.match_date);
          const isPast = matchDate <= now;

          const homeName = match.home_team?.name || match.home_team_placeholder || 'TBD';
          const awayName = match.away_team?.name || match.away_team_placeholder || 'TBD';
          const homeFlag = match.home_team?.flag || '🏴';
          const awayFlag = match.away_team?.flag || '🏴';

          const canSave = edit.homeScore !== '' && edit.awayScore !== '' &&
            !isNaN(homeScore) && !isNaN(awayScore) &&
            (!showAdvancing || edit.advancingTeamId !== '');

          return (
            <div key={match.id} className="card p-4 space-y-3">
              {/* Match header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-white/40 font-medium">
                    {STAGE_LABELS[match.stage] || match.stage}
                    {match.group_name && ` · Grupo ${match.group_name}`}
                    {' · '}#{match.match_number}
                  </div>
                  <div className="text-xs text-white/30 mt-0.5">
                    {format(matchDate, "d MMM yyyy · HH:mm", { locale: es })}
                    {' · '}{match.city}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  match.status === 'finished' ? 'bg-white/10 text-white/50' :
                  match.status === 'live' ? 'bg-red-500/20 text-red-400' :
                  isPast ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {match.status === 'finished' ? 'Finalizado' :
                   match.status === 'live' ? '⬤ En vivo' :
                   isPast ? 'Sin resultado' : 'Programado'}
                </span>
              </div>

              {/* Teams & score inputs */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-3xl">{homeFlag}</span>
                  <span className="text-xs font-semibold text-white text-center leading-tight">{homeName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={edit.homeScore}
                    onChange={e => setEdit(match.id, { homeScore: e.target.value, advancingTeamId: '' })}
                    placeholder="0"
                    className="input-field w-14 text-center text-xl font-black h-12"
                  />
                  <span className="text-white/40 font-bold">-</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={edit.awayScore}
                    onChange={e => setEdit(match.id, { awayScore: e.target.value, advancingTeamId: '' })}
                    placeholder="0"
                    className="input-field w-14 text-center text-xl font-black h-12"
                  />
                </div>

                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-3xl">{awayFlag}</span>
                  <span className="text-xs font-semibold text-white text-center leading-tight">{awayName}</span>
                </div>
              </div>

              {/* Advancing team picker (knockout + draw) */}
              {showAdvancing && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                  <p className="text-xs text-amber-300 font-semibold text-center">
                    Empate — ¿quién avanzó? (ET/penales)
                  </p>
                  <div className="flex gap-2">
                    {[
                      { id: match.home_team_id, flag: homeFlag, name: homeName },
                      { id: match.away_team_id, flag: awayFlag, name: awayName },
                    ].map(team => (
                      <button
                        key={team.id}
                        disabled={!team.id}
                        onClick={() => setEdit(match.id, { advancingTeamId: team.id ?? '' })}
                        className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5 border transition-all ${
                          edit.advancingTeamId === team.id
                            ? 'bg-amber-500 border-amber-400 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xl">{team.flag}</span>
                        <span className="text-xs font-semibold leading-tight text-center">{team.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {match.status !== 'live' && match.status !== 'finished' && isPast && (
                  <button
                    onClick={() => markLive(match)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-all border border-red-500/30"
                  >
                    <Radio size={13} />
                    En vivo
                  </button>
                )}

                <button
                  onClick={() => saveResult(match)}
                  disabled={isSaving || !canSave}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    isSaved
                      ? 'bg-green-600/20 border-green-500/30 text-green-400'
                      : canSave
                      ? 'bg-blue-600/30 border-blue-500/30 text-blue-300 hover:bg-blue-600/50'
                      : 'bg-white/5 border-white/10 text-white/30'
                  }`}
                >
                  {isSaved ? <CheckCircle size={13} /> : <Save size={13} />}
                  {isSaving ? 'Guardando...' : isSaved ? 'Guardado' : 'Guardar resultado'}
                </button>

                {match.status === 'finished' && (
                  <button
                    onClick={() => reopen(match)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white/50 text-xs font-semibold hover:bg-white/20 transition-all border border-white/10"
                  >
                    <RotateCcw size={13} />
                    Reabrir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
