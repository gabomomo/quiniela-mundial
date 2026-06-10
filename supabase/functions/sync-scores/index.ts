import { createClient } from 'jsr:@supabase/supabase-js@2';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// API-Football: World Cup 2026 = league 1, season 2026
const LEAGUE_ID = 1;
const SEASON = 2026;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Normaliza nombres de equipos para comparar
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Mapeo de nombres del API a nuestros team IDs
const TEAM_NAME_MAP: Record<string, string> = {
  mexico: 'mex',
  'south africa': 'rsa',
  'korea republic': 'kor',
  'south korea': 'kor',
  'czech republic': 'cze',
  czechia: 'cze',
  canada: 'can',
  'bosnia': 'bih',
  'bosnia and herzegovina': 'bih',
  qatar: 'qat',
  switzerland: 'sui',
  brazil: 'bra',
  morocco: 'mar',
  haiti: 'hai',
  scotland: 'sco',
  'united states': 'usa',
  usa: 'usa',
  paraguay: 'par',
  australia: 'aus',
  turkey: 'tur',
  germany: 'ger',
  curacao: 'cur',
  'ivory coast': 'civ',
  "cote d'ivoire": 'civ',
  ecuador: 'ecu',
  netherlands: 'ned',
  holland: 'ned',
  japan: 'jpn',
  sweden: 'swe',
  tunisia: 'tun',
  belgium: 'bel',
  egypt: 'egy',
  iran: 'irn',
  'new zealand': 'nzl',
  spain: 'esp',
  'cape verde': 'cpv',
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
  'congo dr': 'cod',
  uzbekistan: 'uzb',
  colombia: 'col',
  england: 'eng',
  croatia: 'cro',
  ghana: 'gha',
  panama: 'pan',
};

function resolveTeamId(apiName: string): string | null {
  const key = normalize(apiName);
  // Búsqueda exacta primero
  for (const [mapKey, id] of Object.entries(TEAM_NAME_MAP)) {
    if (normalize(mapKey) === key) return id;
  }
  // Búsqueda parcial
  for (const [mapKey, id] of Object.entries(TEAM_NAME_MAP)) {
    if (key.includes(normalize(mapKey)) || normalize(mapKey).includes(key)) return id;
  }
  return null;
}

Deno.serve(async (req) => {
  // Permitir llamadas desde cron (sin auth header)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!RAPIDAPI_KEY) {
    return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Obtener fixtures del Mundial 2026 desde API-Football
    const apiRes = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        },
      }
    );

    if (!apiRes.ok) {
      throw new Error(`API error: ${apiRes.status} ${await apiRes.text()}`);
    }

    const apiData = await apiRes.json();
    const fixtures = apiData.response ?? [];

    if (fixtures.length === 0) {
      return new Response(JSON.stringify({ message: 'No fixtures found', total: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Obtener nuestros partidos de la BD
    const { data: ourMatches, error: matchError } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date, status, stage');

    if (matchError) throw matchError;

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 3. Para cada fixture terminado o en vivo, buscar y actualizar nuestro partido
    for (const fixture of fixtures) {
      const fixtureStatus = fixture.fixture?.status?.short;
      // Solo procesar partidos en vivo o terminados
      if (!['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(fixtureStatus)) {
        continue;
      }

      const homeApiName: string = fixture.teams?.home?.name ?? '';
      const awayApiName: string = fixture.teams?.away?.name ?? '';
      const homeGoals: number | null = fixture.goals?.home ?? null;
      const awayGoals: number | null = fixture.goals?.away ?? null;
      const fixtureDate: string = fixture.fixture?.date ?? '';

      if (homeGoals === null || awayGoals === null) continue;

      const homeId = resolveTeamId(homeApiName);
      const awayId = resolveTeamId(awayApiName);

      if (!homeId || !awayId) {
        errors.push(`No se pudo mapear: ${homeApiName} vs ${awayApiName}`);
        continue;
      }

      // Buscar partido coincidente por equipos
      const match = ourMatches?.find(
        (m) => m.home_team_id === homeId && m.away_team_id === awayId
      );

      if (!match) {
        skipped++;
        continue;
      }

      // Determinar status
      const isFinished = ['FT', 'AET', 'PEN'].includes(fixtureStatus);
      const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(fixtureStatus);
      const newStatus = isFinished ? 'finished' : isLive ? 'live' : 'scheduled';

      // No sobreescribir si ya está terminado y los goles no cambiaron
      if (
        match.status === 'finished' &&
        newStatus === 'finished'
      ) {
        skipped++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update({
          home_score: homeGoals,
          away_score: awayGoals,
          status: newStatus,
        })
        .eq('id', match.id);

      if (updateError) {
        errors.push(`Error actualizando ${homeApiName} vs ${awayApiName}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fixtures_from_api: fixtures.length,
        updated,
        skipped,
        errors,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
