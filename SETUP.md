# Quiniela Mundial 2026 — Guía de Configuración

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la **Project URL** y la **anon public key** (Settings > API)

## 2. Configurar variables de entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Crear base de datos en Supabase

1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Pega todo el contenido de `supabase/schema.sql`
3. Ejecuta el script

Esto crea:
- Tablas: `players`, `groups`, `teams`, `matches`, `predictions`
- Vista: `leaderboard` (puntos acumulados automáticos)
- Trigger: calcula puntos automáticamente al marcar un partido como terminado
- Datos iniciales: 12 grupos, 48 equipos, 104 partidos

## 4. Instalar y ejecutar

```bash
npm install
npm run dev
```

## 5. Primer uso

- El primer jugador en registrarse puede ser administrador
- Para marcar un partido como **administrador**:
  - Por ahora ve directo a Supabase > Table Editor > matches
  - Actualiza `home_score`, `away_score` y `status = 'finished'`
  - El trigger calculará los puntos automáticamente

## Sistema de puntos

| Resultado | Puntos |
|-----------|--------|
| Marcador exacto (ej: predice 2-1 y sale 2-1) | **3 pts** |
| Resultado correcto (ej: predice victoria local) | **1 pt** |
| Resultado incorrecto | **0 pts** |

## Despliegue (Producción)

```bash
npm run build
```

Sube la carpeta `dist/` a Vercel, Netlify, o cualquier hosting estático.

## Notas

- Las predicciones se **bloquean automáticamente** cuando la fecha/hora del partido ha pasado
- Los grupos del Mundial 2026 son los confirmados al momento del sorteo (Dic 2025)
- Algunos equipos están marcados como "TBD" (pendientes de clasificatoria)
- Las fechas pueden ajustarse cuando FIFA confirme el calendario oficial
