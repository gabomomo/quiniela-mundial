import { createClient } from 'jsr:@supabase/supabase-js@2';

const FOOTBALL_DATA_KEY = Deno.env.get('FOOTBALL_DATA_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function normalize(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

// Mapeo de nombres de football-data.org a nuestros team IDs
const TEAM_NAME_MAP: Record<string, string> = {
  mexico: 'mex',
  'south africa': 'rsa',
  'korea republic': 'kor',
  'south korea': 'kor',
  czechia: 'cze',
  'czech republic': 'cze',
  canada: 'can',
  'bosnia-herzegovina': 'bih',
  'bosnia and herzegovina': 'bih',
  qatar: 'qat',
  switzerland: 'sui',
  brazil: 'bra',
  morocco: 'mar',
  haiti: 'hai',
  scotland: 'sco',
  'united states': 'usa',
  paraguay: 'par',
  australia: 'aus',
  turkey: 'tur',
  germany: 'ger',
  curacao: 'cur',
  'ivory coast': 'civ',
  ecuador: 'ecu',
  netherlands: 'ned',
  japan: 'jpn',
  sweden: 'swe',
  tunisia: 'tun',
  belgium: 'bel',
  egypt: 'egy',
  iran: 'irn',
  'new zealand': 'nzl',
  spain: 'esp',
  'cape verde': 'cpv',
  'cape verde islands': 'cpv',
  'saudi arabia': 'ksa',
  uruguay: 'uru',
  france: 'fra',
  senegal: 'sen',
  iraq: 'irq',
  norway: 'nor',
  argentina: 'arg',
  algeria: 'alg',
  austria: 'aut',
  jordan: 'jor',
  portugal: 'por',
  'dr congo': 'cod',
  'congo, dr': 'cod',
  uzbekistan: 'uzb',
  colombia: 'col',
  england: 'eng',
  croatia: 'cro',
  ghana: 'gha',
  panama: 'pan',
};

function resolveTeamId(name: string): string | null {
  const key = normalize(name);
  for (const [mapKey, id] of Object.entries(TEAM_NAME_MAP)) {
    if (normalize(mapKey) === key) return id;
  }
  for (const [mapKey, id] of Object.entries(TEAM_NAME_MAP)) {
    if (key.includes(normalize(mapKey)) || normalize(mapKey).includes(key)) return id;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!FOOTBALL_DATA_KEY) {
    return new Response(JSON.stringify({ error: 'FOOTBALL_DATA_KEY not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Obtener todos los partidos del Mundial 2026
    const apiRes = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY } }
    );

    if (!apiRes.ok) {
      throw new Error(`API error: ${apiRes.status} ${await apiRes.text()}`);
    }

    const apiData = await apiRes.json();
    const fixtures = apiData.matches ?? [];

    if (fixtures.length === 0) {
      return new Response(JSON.stringify({ message: 'No matches found' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Obtener nuestros partidos
    const { data: ourMatches, error: matchError } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status');

    if (matchError) throw matchError;

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 3. Procesar cada partido de la API
    for (const fixture of fixtures) {
      const apiStatus: string = fixture.status; // TIMED, SCHEDULED, IN_PLAY, PAUSED, FINISHED, SUSPENDED, POSTPONED

      // Solo procesar los que están en juego o terminados
      if (!['IN_PLAY', 'PAUSED', 'FINISHED'].includes(apiStatus)) continue;

      const homeApiName: string = fixture.homeTeam?.name ?? '';
      const awayApiName: string = fixture.awayTeam?.name ?? '';

      // football-data.org: score.fullTime es ACUMULATIVO (90' + tiempo extra + penales).
      // Para definiciones por penales guardamos el marcador del tiempo regular (empate)
      // y registramos por separado quién avanzó; nunca el marcador de la tanda de penales.
      const score = fixture.score ?? {};
      const duration: string = score.duration ?? 'REGULAR'; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
      const isShootout = duration === 'PENALTY_SHOOTOUT';

      let homeGoals: number | null;
      let awayGoals: number | null;
      if (isShootout) {
        // 90' (regularTime); si la API no lo trae, restamos los penales del fullTime
        homeGoals = score.regularTime?.home ?? ((score.fullTime?.home ?? 0) - (score.penalties?.home ?? 0));
        awayGoals = score.regularTime?.away ?? ((score.fullTime?.away ?? 0) - (score.penalties?.away ?? 0));
      } else {
        homeGoals = score.fullTime?.home ?? score.halfTime?.home ?? null;
        awayGoals = score.fullTime?.away ?? score.halfTime?.away ?? null;
      }

      const homeId = resolveTeamId(homeApiName);
      const awayId = resolveTeamId(awayApiName);

      if (!homeId || !awayId) {
        errors.push(`Sin mapeo: ${homeApiName} vs ${awayApiName}`);
        continue;
      }

      const match = ourMatches?.find(m => m.home_team_id === homeId && m.away_team_id === awayId);
      if (!match) { skipped++; continue; }

      const newStatus = apiStatus === 'FINISHED' ? 'finished' : 'live';

      // No reescribir si ya está finalizado con goles
      if (match.status === 'finished' && newStatus === 'finished' && homeGoals !== null) { skipped++; continue; }

      // Actualizar: si hay goles los incluye, si no solo actualiza el status
      const updatePayload: Record<string, unknown> = { status: newStatus };
      if (homeGoals !== null && awayGoals !== null) {
        updatePayload.home_score = homeGoals;
        updatePayload.away_score = awayGoals;
        // Solo en definiciones por penales registramos quién avanzó (el resto se decide por marcador)
        if (isShootout) {
          updatePayload.advancing_team_id =
            score.winner === 'HOME_TEAM' ? homeId :
            score.winner === 'AWAY_TEAM' ? awayId : null;
        }
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update(updatePayload)
        .eq('id', match.id);

      if (updateError) {
        errors.push(`Error ${homeApiName} vs ${awayApiName}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, fixtures_from_api: fixtures.length, updated, skipped, errors }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
