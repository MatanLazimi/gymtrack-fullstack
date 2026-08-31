# GymTrack

A personal gym workout tracker. Log exercises, track sets (weight, reps, and
per-exercise measurement quirks like "per side" or "plus additional weight"),
and see your previous performance before you start a new set — so you always
know what to beat.

## Status

🚧 Early bootstrap — Authentication, Exercise Library, and Workout tracking
are being built incrementally. See open [Issues](../../issues) for progress.

## Features (MVP)

- Email + password authentication
- Dynamic exercise library (no hardcoded exercise list)
- Create a workout, add exercises from the library, log sets
- Supports decimal weights, "additional weight" and "per side" flags, and
  alternate measurement units (e.g. `kg`, `hole`)
- View previous performance for an exercise before logging a new set
- Workout history
- View Mode by default; explicit Edit Mode to change data

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (local) |
| API | REST / JSON |
| Auth | Email/password, JWT |
| Testing | Vitest, Supertest, Testing Library |
| CI | GitHub Actions |

## Architecture

```text
React (client)
   │  HTTP / REST
Express API (server)
   │
Business Logic / Validation
   │
MongoDB
```

Backend layers: `routes → controllers → services → models`, with
`validators` and `middleware` cutting across. Sets are embedded inside
Workout documents (no separate Set collection).

## Project Structure

```text
gymtrack/
├── client/     React + TypeScript + Vite frontend
├── server/     Node + Express + TypeScript backend
└── .github/    CI workflows
```

## Local Setup

### Prerequisites

- Node.js 20+
- MongoDB running locally (see below)

### MongoDB (local)

Run MongoDB locally via Docker:

```bash
docker run -d --name gymtrack-mongo -p 27017:27017 -v gymtrack-mongo-data:/data/db mongo:7
```

Or point `MONGODB_URI` at any local MongoDB instance you already have running.

### Install

```bash
npm install
```

This installs both `client` and `server` workspaces.

### Environment Variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Server (`server/.env`):

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default `4000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens — required, no default, change for any real deployment |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS |

Client (`client/.env`):

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (default `http://localhost:4000/api`) |

### Run the server

```bash
npm run dev:server
```

### Run the client

```bash
npm run dev:client
```

Client runs on `http://localhost:5173`, server on `http://localhost:4000`.

## Tests

```bash
npm test
```

Runs backend (Vitest + Supertest) and frontend (Vitest + Testing Library)
test suites.

## Build

```bash
npm run build
```

## Git Workflow

```text
Issue → Branch → Implementation → Tests → Commit → Pull Request → CI → Review → Merge → Release
```

Conventional Commits are used throughout (`feat`, `fix`, `test`, `chore`, `ci`).

## CI

GitHub Actions runs on every pull request and push to `main`:

- **Backend:** `npm ci`, lint, test (against a MongoDB service container)
- **Frontend:** `npm ci`, lint, test, build

A pull request cannot merge with a failing CI run.

## Deployment

Not yet deployed. The project runs fully locally (local MongoDB) through the
MVP milestone; production hosting will be added in a separate phase once the
MVP is complete and released.
