# Interview Made Easy — Session 1 Changelog (2026-10-14)

Goal of this session: a working, secure, demonstrable core platform —
auth, adaptive quiz, vocal arena, durable progress — reusing the existing
Supabase + Express + Gemini/Groq architecture.

## What changed

### Backend (`backend/`)
- **Fixed critical bug**: `/api/dynamic-questions/adaptive-quiz` was defined
  *after* `module.exports = router`, so the route 404'd and the entire
  adaptive quiz flow was dead. Export moved to end of file.
- **Added authentication**: new `middleware/auth.js` verifies the Supabase
  access token sent as `Authorization: Bearer <jwt>` against the Supabase
  auth service (`supabase.auth.getUser`). Verified identity is attached to
  `req.user`; client-supplied user IDs are never trusted.
- **Protected all AI/resume/question routes** with `requireAuth` in
  `server.js` (unauthenticated requests now get 401 — verified by tests).
- **server.js** now reads `ALLOWED_ORIGINS` from env (comma-separated),
  exports the Express app for testing, and only binds a port when run
  directly. Added `GET /api/health` liveness probe.
- **Removed dead/obsolete files** (verified unreferenced):
  - `seeder.js` (MongoDB + missing `models/Question` — app never used Mongo)
  - `config/db.js` (empty file)
  - `routes/avatarRoutes.js` (HeyGen avatar proxy — was never mounted in
    server.js and no frontend code calls it; HeyGen therefore removed)
  - `routes/questionRoutes.js` (never mounted; returned hardcoded mocks)
- **Dependencies cleaned**: removed unused `@google/genai`, `bcryptjs`,
  `jsonwebtoken`, `pdf2json`, `edge-tts-universal` stayed (TTS uses it);
  added `@supabase/supabase-js` for JWT verification.
- **Added tests**: `test/smoke.test.js` (node:test, zero extra deps) —
  11 tests covering liveness, 401 on every protected route, and a
  regression test for the adaptive-quiz route bug. `npm test` → 11/11 pass.
- **`.env.example` standardized**: only vars the code actually reads —
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`,
  `ALLOWED_ORIGINS`, `PORT`, `NODE_ENV`. MongoDB/HeyGen entries removed.
- **New `supabase-schema.sql`**: run this once in the Supabase SQL Editor.
  Creates `quiz_sessions`, `interview_sessions`, `profiles` with Row Level
  Security (users can only read/write their own rows), a profile-creation
  trigger, and helpful indexes.

### Frontend (`frontend/`)
- **New `src/config/supabaseClient.js`**: single shared Supabase client
  (mock fallback preserved for credential-less demo mode).
- **New `src/config/apiClient.js`**: axios instance that attaches the
  Supabase access token to every backend request and routes 401 responses
  to a global handler.
- **App.jsx**:
  - All backend calls now go through the authenticated `apiClient`.
  - Deleted ~240 lines of dead client-side Gemini fetchers (empty API key,
    zero call sites — all AI now flows through the backend; no key can
    reach the browser).
  - Removed dead `handlePurchaseCredits` (called a nonexistent payments
    endpoint) and `loadingPayment` state.
  - **Session-expiry handling**: global 401 handler signs out cleanly and
    returns to the auth screen (only for signed-in users; guests stay and
    see per-view guidance instead).
  - **Durable history persistence**: completed quizzes insert into
    `quiz_sessions`; concluded interviews (with the AI feedback report)
    insert into `interview_sessions` — RLS-scoped to the signed-in user.
  - **Dashboard "Recent Activity"**: last 5 quiz sessions + last 5
    interview sessions loaded from Supabase (signed-in users only).
  - **New Plans & Pricing view** (sidebar entry): honest Free vs Premium
    comparison, buttons disabled with "Payments Coming Soon" — no fake
    payment success, no card fields, no simulated entitlement.
  - **Vocal Arena speech fallback**: mic errors (`not-allowed`,
    `no microphone`, `network`) now surface an actionable amber banner;
    unsupported browsers see a ⌨️ glyph + "type your answers" guidance;
    typing fallback already existed and is unchanged.
- **QuizEngine.jsx**: uses `apiClient`; 401-aware error messages; reports a
  structured session summary on completion so history can be persisted.
- **Removed orphaned components** (verified zero imports): `AiChatConsole.jsx`,
  `AnalyticsDashboard.jsx` (hardcoded demo email + nonexistent endpoint),
  `StudyMaterials.jsx`, `Sidebar.jsx`, `AnimeWrapper.jsx`, `lucide-mock.jsx`,
  `config/apiConfig.js`.

## Verification performed
- Backend: `npm test` → 11/11 pass. Live server: `GET /api/health` 200;
  unauthenticated `POST /api/dynamic-questions/generate-quiz` → 401.
- Frontend: `npm run build` succeeds (only pre-existing chunk-size warning).
  ESLint clean on new files.
- Browser smoke (Vite dev + backend): auth gate renders (Google/email/guest);
  guest → onboarding → dashboard works; quiz start as guest shows the
  friendly "sign in to use AI quiz engine" message (401 handled, no kick-out);
  Vocal Arena mode picker + Concept Mastery topics render; Pricing view
  renders with disabled CTAs; console shows no unexpected errors.

## What you MUST configure (blocked on credentials — see SETUP below)
1. **Supabase project**: create/verify a project, enable **Google** provider
   (OAuth client ID/secret from Google Cloud Console), add redirect URL
   `https://<project-ref>.supabase.co/auth/v1/callback` + allow
   `http://localhost:5173` in Supabase Auth URL configuration.
2. **Run `backend/supabase-schema.sql`** in the Supabase SQL Editor.
3. **Backend `.env`** (copy `backend/.env.example`): `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`.
4. **Frontend `.env.local`** (copy `frontend/.env.example`):
   `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Known defects / remaining work — Session 2 (prioritized)
1. **P0 — End-to-end auth test with real Supabase**: Google OAuth redirect
   flow and email sign-in were not tested against a live project (no
   credentials in this environment). Test: sign in → dashboard → quiz →
   sign out; then sign in on a second browser and confirm history appears.
2. **P0 — Run `supabase-schema.sql` and verify RLS**: confirm a second test
   account cannot read the first account's `quiz_sessions` rows.
3. **P1 — Rate-limit by user, not just IP**: current limiter is per-IP;
   behind NAT this punishes shared networks. Use the verified `req.user.id`.
4. **P1 — Free-tier daily limits** advertised on the Pricing page (5 quizzes
   / 3 interviews per day) are not enforced yet — enforce in backend using
   `quiz_sessions`/`interview_sessions` counts.
5. **P2 — Onboarding/profiles table**: profile fields live in
   `user_metadata`; optionally migrate to a `profiles` table for querying.
6. **P2 — Deploy**: backend needs a host (Render/Railway/Fly); update
   `ALLOWED_ORIGINS` + frontend `VITE_API_BASE_URL`; frontend on Vercel.
7. **P2 — Bundle size**: 796 kB JS chunk — code-split the study-data blob
   out of App.jsx.
8. **P3 — heyGen avatar**: if the animated-avatar feature is ever revived,
   it needs a new backend route (old one removed) and a HeyGen key.
9. **P3 — `AiChatConsoleView` duplicate logic**: the interview console
   lives inline in App.jsx (~1.5k lines); extract to a component when
   touching it next.

## Session 2 addendum (2026-10-20) — Adaptive Quiz `model_not_found` fix

**Root cause**: `/api/dynamic-questions/adaptive-quiz` hardcoded
`llama-3.3-70b-versatile`. Groq moved that model (and `llama-3.1-8b-instant`)
off the Free/Developer plans on 2026-08-16, so every call from a normal
account returned `404 model_not_found`.

**Fix** (source: https://console.groq.com/docs/models,
https://console.groq.com/docs/structured-outputs, https://console.groq.com/docs/reasoning):
- Model is now resolved from **`GROQ_MODEL_ID`**, defaulting to
  **`openai/gpt-oss-120b`** — a production model on the Developer plan that
  supports JSON output.
- Request parameters updated for the reasoning model: `max_completion_tokens`
  (2048, instead of the deprecated `max_tokens`), `temperature: 0.6`
  (Groq's recommended 0.5–0.7 range), `reasoning_effort: 'low'` only on models
  Groq documents as accepting it, plus a 20s timeout / 1 retry so the quiz UI
  never hangs past the frontend's 60s axios timeout.
- New `backend/lib/groqQuestionModel.js`: model resolution, request building,
  reasoning-tag stripping, and error classification (credentials / model /
  rate limit / outage / malformed output) with **secret redaction** — raw
  provider errors and keys are never echoed to clients; logs are redacted.
- Frontend (`QuizEngine.jsx`) now shows the backend's safe message for
  non-401 failures instead of a generic string; 401 messaging unchanged.
- New `backend/test/adaptiveQuiz.test.js`: 18 tests covering model resolution,
  outbound request parameters (regression: retired ID must not return), error
  classification/redaction, and the real handler against a local mock Groq
  server (no network, no real key).

**Render**: no new required variable — only the existing `GROQ_API_KEY`.
Optional: `GROQ_MODEL_ID=openai/gpt-oss-120b` (the built-in default).

**Known remaining gap (deliberately out of scope here)**:
`backend/routes/aiRoutes.js:69` still hardcodes `llama-3.3-70b-versatile` for
`POST /api/ai/interview-chat` (Vocal Arena), so it will fail the same way on
Render until it is switched to `openai/gpt-oss-120b`.

**Checks**: `npm test` → 29/29 pass; `npm run build` (frontend) → success.
