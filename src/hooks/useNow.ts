import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import type { Match } from '../types';

// Actualiza "now" automáticamente:
// - Cada 30 segundos normalmente
// - En el momento EXACTO que inicia cada partido visible
export function useNow(matches?: Match[]) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Tick cada 30 segundos para mantener el tiempo actualizado
    const interval = setInterval(() => setNow(new Date()), 30_000);

    // Timers precisos para el momento exacto de inicio de cada partido
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (matches) {
      matches.forEach(match => {
        const matchDate = parseISO(match.match_date);
        const msUntilStart = matchDate.getTime() - Date.now();
        // Solo si el partido empieza en las próximas 24h
        if (msUntilStart > 0 && msUntilStart < 24 * 60 * 60 * 1000) {
          const t = setTimeout(() => setNow(new Date()), msUntilStart + 500);
          timeouts.push(t);
        }
      });
    }

    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, [matches?.length]);

  return now;
}
