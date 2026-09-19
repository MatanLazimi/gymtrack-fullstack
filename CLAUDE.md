# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GymTrack — a personal gym workout tracker. Log exercises, track sets (weight,
reps, and per-exercise quirks like "per side" or "plus additional weight"),
and see your previous performance before logging a new set so you know what
to beat. npm workspaces monorepo: `client/` (React + TypeScript + Vite) and
`server/` (Node + Express + TypeScript + MongoDB/Mongoose).

## Commands

Run from the repo root unless noted:

```bash
npm install                # installs both client and server workspaces
npm run dev:server         # backend on http://localhost:4000
npm run dev:client         # frontend on http://localhost:5173
npm test                   # backend then frontend test suites
npm run lint               # backend (eslint) then frontend (oxlint)
npm run build              # backend build then frontend build
```

MongoDB must be running locally before starting the server or running
backend tests:

```bash
docker run -d --name gymtrack-mongo -p 27017:27017 -v gymtrack-mongo-data:/data/db mongo:7
```

Env files: copy `server/.env.example` → `server/.env` and
`client/.env.example` → `client/.env` (see each `.env.example` for the
variables — `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` on the server;
`VITE_API_URL` on the client).

### Single-test / package-scoped commands

Both packages use Vitest. Run these from inside `client/` or `server/`:

```bash
npx vitest run path/to/File.test.ts        # one file
npx vitest run -t "test name substring"    # by test name
npx tsc --noEmit                           # typecheck only (no build output)
```

Backend tests are **integration tests against a real MongoDB** (via
Supertest + a live connection, not mocked) — the DB from the docker command
above must be reachable. `server/vitest.config.ts` sets
`fileParallelism: false` because test files share one live database and
their fixture cleanup (`Model.deleteMany` in `beforeEach`) would race
otherwise; keep that in mind if adding new backend test files.

Frontend tests run in `jsdom` and mock `fetch` directly (see
`mockFetchSequence`/`mockFetchRouter` helpers at the top of existing
`*.test.tsx` files) rather than hitting a real server.

## Architecture

```text
React (client)  --HTTP/REST-->  Express API (server)  -->  Mongoose  -->  MongoDB
```

### Backend: routes → controllers → services → models

Every resource (`auth`, `exercises`, `routines`, `workouts`) follows the
same layering, found under `server/src/`:

- **`routes/*.ts`** — wires `requireAuth` (all routes are authenticated
  except `/api/auth/*`), `validateBody`/`validateObjectIdParam`
  (`middleware/validate.ts`), and `asyncHandler` around each controller
  function.
- **`controllers/*.ts`** — thin pass-through: pull `userId` via
  `requireUserId(req)`, call the matching service function, shape the JSON
  response.
- **`services/*.ts`** — the only layer that touches Mongoose models
  directly. Every query is scoped by `{ _id, userId }` (or just `userId`)
  so one user can never read/write another's data; a missing/foreign
  document throws `ApiError(404, ...)`, not a leak-revealing 403.
- **`models/*.ts`** — Mongoose schemas built with `InferSchemaType` (no
  hand-written duplicate interfaces). `Workout.exercises[].sets[]` and
  `Routine.exercises[]` are embedded subdocuments (`{ _id: true }`), not
  separate collections — a workout's sets live and die with the workout.
- **`validators/*.ts`** — Zod schemas per resource, applied by the
  `validate.ts` middleware; validation failures become `ApiError(400, ...)`.

Auth: `requireAuth` (`middleware/requireAuth.ts`) reads a JWT from the
`gymtrack_token` httpOnly cookie, verifies it via `authService.verifyToken`,
and sets `req.userId`. There is no separate authorization layer — ownership
is enforced by every service function scoping its query to `userId`.

All errors are `ApiError` instances (`middleware/errorHandler.ts`) caught by
a single `errorHandler` registered last in `app.ts`; 5xx errors are logged,
their messages are not leaked to the client.

### Frontend: pages own their data, API modules are thin wrappers

- **`services/api/*.ts`** — one module per backend resource
  (`workoutApi`, `exerciseApi`, `routineApi`, `authApi`), each a plain
  object of methods calling the shared `apiClient` (`services/api/client.ts`,
  a `fetch` wrapper that sets `credentials: 'include'` and throws
  `ApiError` on non-2xx). No React, no state — pages call these directly.
- **`pages/<Feature>/<Feature>Page.tsx`** — each page fetches its own data
  in a `useEffect`, holds it in local `useState`, and does optimistic
  updates with rollback-on-error for mutations that feel latency-sensitive
  (e.g. reordering exercises, deleting a set: update state immediately,
  revert on request failure). CSS is a co-located `*.module.css` file per
  page; there's no shared component library beyond `components/PlateMark.tsx`
  and `components/ProtectedRoute.tsx`.
- **Auth** is a React Context (`context/AuthContext.tsx` + `hooks/useAuth.ts`):
  on mount it calls `authApi.me()` to hydrate `user` from the session
  cookie; `ProtectedRoute` redirects to `/login` when `user` is null.
  Routes are centralized in `App.tsx`.
- Interface language is Hebrew (RTL); keep new UI text consistent with that.

### Domain model

- **Exercise** — a global, shared catalog (not per-user): `name`,
  `category`, `measurementUnit` (`kg` or `hole`), `active`. Deactivating
  instead of deleting is the norm once an exercise is in use.
- **Routine** — a named, user-owned, reusable list of exercises (no sets).
  Used to pre-populate a new workout; starting a workout from a routine or
  picking exercises freely are both supported and go through the same
  `workoutApi.create`.
- **Workout** — a user-owned session: a `date` plus `exercises[]`, each
  with `exerciseId`/`exerciseName` (denormalized at creation time) and an
  embedded `sets[]` (`value`, `reps`, `hasAdditionalWeight`, `isPerSide`).
  A workout for "today" is editable; any other date opens read-only by
  default with an explicit unlock toggle to edit it — both states render
  through the same editing UI in `WorkoutPage.tsx`, gated by one
  `isEditable` flag, not two separate code paths.
- **Previous performance** (`workoutService.getPreviousPerformance`) looks
  up the most recent other workout containing a given exercise. The client
  matches it to the *specific set position* currently being filled in
  (`previousPerformance.sets[exercise.sets.length]`), not just showing the
  whole list — this is the app's central UX idea: know what weight to load
  for *this* set before you lift it.
