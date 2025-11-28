# Baian Admin Dashboard

Speaker dashboard for managing live translation sessions.

## Stack

- React 18 + TypeScript + Vite
- TailwindCSS v4
- Supabase Auth
- LiveKit for real-time audio
- React Router + Zustand

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```
   VITE_SUPABASE_URL=https://rcgorjyuolmbdxybnklq.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_URL=https://baian-server.zubeyrbarre.workers.dev
   VITE_LIVEKIT_URL=wss://translator-staging-tuoqkhtd.livekit.cloud
   ```

3. Run dev server:
   ```bash
   npm run dev
   ```

## Deployment

Deploy to Cloudflare Workers (Static Assets):

```bash
npm run deploy  # builds then deploys
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Login (Google OAuth + Email) |
| `/onboarding` | First-time profile setup |
| `/dashboard` | Start/stop sessions, mic controls |
| `/history` | Past sessions list |
| `/history/:id` | Session detail + transcripts |
| `/settings` | Edit profile & languages |

## Auth Flow

1. User signs in via Supabase (Google or Email)
2. App checks `GET /api/users/me`
3. If 404 → redirect to `/onboarding`
4. If profile exists → redirect to `/dashboard`

## API

All API calls go to `VITE_API_URL` with `Authorization: Bearer <supabase_jwt>`.

See [baian-server](../baian-server) for endpoint documentation.

