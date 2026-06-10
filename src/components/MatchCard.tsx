import { useNavigate } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Clock } from 'lucide-react';
import type { Match } from '../types';

interface Props {
  match: Match;
  prediction?: { home_score: number; away_score: number } | null;
}

export default function MatchCard({ match, prediction }: Props) {
  const navigate = useNavigate();
  const matchDate = parseISO(match.match_date);
  const isLocked = match.status !== 'scheduled' || isPast(matchDate);
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';

  const homeTeam = match.home_team;
  const awayTeam = match.away_team;
  const homeName = homeTeam?.name || match.home_team_placeholder || 'TBD';
  const awayName = awayTeam?.name || match.away_team_placeholder || 'TBD';
  const homeFlag = homeTeam?.flag || '🏴';
  const awayFlag = awayTeam?.flag || '🏴';

  return (
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      className="card p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Clock size={11} />
          <span>{format(matchDate, "d MMM · HH:mm", { locale: es })}</span>
        </div>
        <div className="flex items-center gap-1">
          {isLive && (
            <span className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              EN VIVO
            </span>
          )}
          {isFinished && (
            <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">Finalizado</span>
          )}
          {!isLive && !isFinished && !isLocked && (
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Abierto</span>
          )}
          {!isLive && !isFinished && isLocked && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">🔒 Cerrado</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{homeFlag}</span>
          <span className="text-xs font-semibold text-white text-center leading-tight">{homeName}</span>
        </div>

        {/* Score area */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          {isFinished && match.home_score !== null ? (
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-white">{match.home_score}</span>
              <span className="text-white/40 font-bold">-</span>
              <span className="text-2xl font-black text-white">{match.away_score}</span>
            </div>
          ) : (
            <div className="text-white/30 font-bold text-lg">VS</div>
          )}
          {prediction !== null && prediction !== undefined && (
            <div className="flex items-center gap-1 bg-blue-600/30 border border-blue-500/30 rounded-lg px-2 py-0.5">
              <span className="text-xs text-blue-300 font-semibold">
                {prediction.home_score} - {prediction.away_score}
              </span>
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{awayFlag}</span>
          <span className="text-xs font-semibold text-white text-center leading-tight">{awayName}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-white/30 mt-3 justify-center">
        <MapPin size={10} />
        <span>{match.venue} · {match.city}</span>
      </div>
    </div>
  );
}
