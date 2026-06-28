import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, MapPin, Calendar, Clock, Lock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useMatch, useMatchPredictions, usePlayerPrediction } from '../hooks/useMatches';
import { useNow } from '../hooks/useNow';
import { STAGE_LABELS } from '../data/worldcup2026';

const KNOCKOUT_STAGES = new Set(['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final']);

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { player } = useAuth();
  const { match, loading } = useMatch(id!);
  const allPredictions = useMatchPredictions(id!);
  const { prediction, setPrediction } = usePlayerPrediction(id!, player?.id || '');

  const [homeInput, setHomeInput] = useState('');
  const [awayInput, setAwayInput] = useState('');
  const [predictedWinnerId, setPredictedWinnerId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const now = useNow(match ? [match] : []);

  useEffect(() => {
    if (prediction && homeInput === '' && awayInput === '') {
      setHomeInput(String(prediction.home_score));
      setAwayInput(String(prediction.away_score));
      setPredictedWinnerId(prediction.predicted_winner_id || '');
    }
  }, [prediction]);

  if (loading || !match) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40 animate-pulse">Cargando...</div>
      </div>
    );
  }

  const matchDate = parseISO(match.match_date);
  const isLocked = match.predictions_open ? false : (match.status !== 'scheduled' || matchDate <= now);
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isKnockout = KNOCKOUT_STAGES.has(match.stage);

  const homeTeam = match.home_team;
  const awayTeam = match.away_team;
  const homeName = homeTeam?.name || match.home_team_placeholder || 'TBD';
  const awayName = awayTeam?.name || match.away_team_placeholder || 'TBD';
  const homeFlag = homeTeam?.flag || '🏴';
  const awayFlag = awayTeam?.flag || '🏴';

  const homeVal = parseInt(homeInput);
  const awayVal = parseInt(awayInput);
  const inputIsDraw = homeInput !== '' && awayInput !== '' && !isNaN(homeVal) && !isNaN(awayVal) && homeVal === awayVal;
  const showWinnerPicker = isKnockout && !isLocked && inputIsDraw;

  const savePrediction = async () => {
    if (!player || homeInput === '' || awayInput === '') return;
    if (showWinnerPicker && !predictedWinnerId) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      player_id: player.id,
      match_id: match.id,
      home_score: parseInt(homeInput),
      away_score: parseInt(awayInput),
      predicted_winner_id: (isKnockout && inputIsDraw) ? predictedWinnerId || null : null,
    };

    if (prediction) {
      const { data } = await supabase
        .from('predictions')
        .update({
          home_score: payload.home_score,
          away_score: payload.away_score,
          predicted_winner_id: payload.predicted_winner_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prediction.id)
        .select()
        .single();
      if (data) setPrediction(data);
    } else {
      const { data } = await supabase
        .from('predictions')
        .insert(payload)
        .select()
        .single();
      if (data) setPrediction(data);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getPointLabel = (p: { home_score: number; away_score: number; predicted_winner_id?: string | null }) => {
    if (!isFinished || match.home_score === null || match.away_score === null) return null;

    const exactHome = p.home_score === match.home_score;
    const exactAway = p.away_score === match.away_score;
    const matchIsDraw = match.home_score === match.away_score;

    if (isKnockout && matchIsDraw) {
      const predIsDraw = p.home_score === p.away_score;
      const advancingBonus =
        p.predicted_winner_id && match.advancing_team_id && p.predicted_winner_id === match.advancing_team_id ? 1 : 0;

      if (exactHome && exactAway) {
        const total = 3 + advancingBonus;
        return { label: `+${total}`, color: 'text-yellow-400' };
      }
      if (predIsDraw) {
        const total = 1 + advancingBonus;
        return { label: `+${total}`, color: 'text-green-400' };
      }
      return { label: '0', color: 'text-white/40' };
    }

    if (exactHome && exactAway) return { label: '+3', color: 'text-yellow-400' };
    const predResult = Math.sign(p.home_score - p.away_score);
    const realResult = Math.sign(match.home_score - match.away_score!);
    if (predResult === realResult) return { label: '+1', color: 'text-green-400' };
    return { label: '0', color: 'text-white/40' };
  };

  const advancingTeam = match.advancing_team_id === match.home_team_id ? homeTeam : awayTeam;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A1628]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="font-bold text-white text-sm">
            {STAGE_LABELS[match.stage] || match.stage}
            {match.group_name && ` · Grupo ${match.group_name}`}
          </div>
          <div className="text-white/40 text-xs">Partido #{match.match_number}</div>
        </div>
        {isLive && (
          <span className="ml-auto flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>EN VIVO
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Match info */}
        <div className="card p-5">
          <div className="flex items-center gap-4 text-white/50 text-xs mb-5 justify-center flex-wrap gap-y-2">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{format(matchDate, "EEEE d 'de' MMMM", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{format(matchDate, "HH:mm")} hrs</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>{match.venue}, {match.city}</span>
            </div>
          </div>

          {/* Teams & score */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-5xl">{homeFlag}</span>
              <span className="font-bold text-white text-center text-sm leading-tight">{homeName}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              {isFinished && match.home_score !== null ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-white">{match.home_score}</span>
                    <span className="text-white/30 text-2xl font-light">-</span>
                    <span className="text-4xl font-black text-white">{match.away_score}</span>
                  </div>
                  {isKnockout && match.home_score === match.away_score && advancingTeam && (
                    <div className="text-xs text-white/50 mt-1">
                      Avanza: <span className="text-white font-semibold">{advancingTeam.flag} {advancingTeam.name}</span>
                    </div>
                  )}
                </div>
              ) : isLive ? (
                <div className="text-red-400 font-black text-2xl animate-pulse">EN VIVO</div>
              ) : (
                <div className="text-white/20 font-bold text-2xl">VS</div>
              )}
              {!isFinished && !isLive && (
                <div className="text-white/30 text-xs">
                  {format(matchDate, "HH:mm")}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-5xl">{awayFlag}</span>
              <span className="font-bold text-white text-center text-sm leading-tight">{awayName}</span>
            </div>
          </div>
        </div>

        {/* My prediction */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              Mi predicción
              {isLocked && <Lock size={13} className="text-yellow-400" />}
            </h3>
            {prediction && isFinished && (() => {
              const pt = getPointLabel(prediction);
              return pt ? <span className={`font-black text-lg ${pt.color}`}>{pt.label} pts</span> : null;
            })()}
          </div>

          {isLocked ? (
            prediction ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-white/40 text-xs mb-1">{homeName}</div>
                    <div className="text-3xl font-black text-white">{prediction.home_score}</div>
                  </div>
                  <div className="text-white/30 font-bold text-xl">-</div>
                  <div className="text-center">
                    <div className="text-white/40 text-xs mb-1">{awayName}</div>
                    <div className="text-3xl font-black text-white">{prediction.away_score}</div>
                  </div>
                </div>
                {isKnockout && prediction.home_score === prediction.away_score && prediction.predicted_winner_id && (
                  <div className="text-xs text-white/50">
                    Avanza:{' '}
                    <span className="text-white font-semibold">
                      {prediction.predicted_winner_id === match.home_team_id
                        ? `${homeFlag} ${homeName}`
                        : `${awayFlag} ${awayName}`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-white/30 text-sm">
                <Lock size={20} className="mx-auto mb-2 text-yellow-400/60" />
                No registraste predicción para este partido
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-white/40 text-xs mb-1 text-center">{homeName}</div>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={homeInput}
                    onChange={e => { setHomeInput(e.target.value); setPredictedWinnerId(''); }}
                    placeholder="0"
                    className="input-field text-center text-2xl font-bold h-14"
                  />
                </div>
                <div className="text-white/30 font-bold text-xl mt-5">-</div>
                <div className="flex-1">
                  <div className="text-white/40 text-xs mb-1 text-center">{awayName}</div>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={awayInput}
                    onChange={e => { setAwayInput(e.target.value); setPredictedWinnerId(''); }}
                    placeholder="0"
                    className="input-field text-center text-2xl font-bold h-14"
                  />
                </div>
              </div>

              {/* Winner picker — solo visible en knockout cuando los scores son iguales */}
              {showWinnerPicker && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 space-y-2">
                  <p className="text-xs text-blue-300 font-semibold text-center">
                    Empate en 90 min — ¿quién avanza?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPredictedWinnerId(homeTeam?.id || '')}
                      disabled={!homeTeam}
                      className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-3 border transition-all ${
                        predictedWinnerId === homeTeam?.id
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{homeFlag}</span>
                      <span className="text-xs font-semibold leading-tight text-center">{homeName}</span>
                    </button>
                    <button
                      onClick={() => setPredictedWinnerId(awayTeam?.id || '')}
                      disabled={!awayTeam}
                      className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-3 border transition-all ${
                        predictedWinnerId === awayTeam?.id
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{awayFlag}</span>
                      <span className="text-xs font-semibold leading-tight text-center">{awayName}</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={savePrediction}
                disabled={saving || homeInput === '' || awayInput === '' || (showWinnerPicker && !predictedWinnerId)}
                className={`btn-primary w-full ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
              >
                {saving ? 'Guardando...' : saved ? '✓ Guardado' : prediction ? 'Actualizar predicción' : 'Guardar predicción'}
              </button>
            </div>
          )}
        </div>

        {/* All predictions */}
        {(isFinished || isLive || isLocked) && allPredictions.length > 0 && (
          <div className="card p-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
              <Users size={14} />
              Predicciones de todos ({allPredictions.length})
            </h3>
            <div className="space-y-2">
              {allPredictions.map(p => {
                const pt = isFinished ? getPointLabel(p) : null;
                const pIsDraw = p.home_score === p.away_score;
                return (
                  <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.avatar_emoji}</span>
                      <span className="text-sm font-medium text-white">{p.player_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-white text-sm">
                          {p.home_score} - {p.away_score}
                        </span>
                        {isKnockout && pIsDraw && p.predicted_winner_id && (
                          <span className="text-xs text-white/40">
                            {p.predicted_winner_id === match.home_team_id ? homeFlag : awayFlag}
                          </span>
                        )}
                      </div>
                      {pt && (
                        <span className={`font-black text-sm ${pt.color}`}>{pt.label}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scoring rules */}
        <div className="card p-4">
          <h3 className="font-bold text-white text-sm mb-3">Sistema de puntos</h3>
          {isKnockout ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Marcador exacto + quién avanza</span>
                <span className="font-bold text-yellow-400">4 pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Marcador exacto</span>
                <span className="font-bold text-yellow-400">3 pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Resultado correcto (G/P) o empate exacto sin ganador</span>
                <span className="font-bold text-green-400">1–2 pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Resultado incorrecto</span>
                <span className="font-bold text-white/30">0 pts</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/40 leading-relaxed">
                Si predices empate, elige quién avanza (ET/penales) para sumar +1 adicional al acertar.
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Marcador exacto</span>
                <span className="font-bold text-yellow-400">3 pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Resultado correcto (G/E/P)</span>
                <span className="font-bold text-green-400">1 pt</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Resultado incorrecto</span>
                <span className="font-bold text-white/30">0 pts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
