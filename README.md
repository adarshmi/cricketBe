# Live Cricket Score

Web application for **live cricket score updates**: ball-by-ball data from an umpire panel, scoreboard derived from balls, and real-time viewer updates via WebSocket.

## Tech stack

- **Frontend**: React (Vite), Socket.io client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MySQL (ball table as single source of truth)

## Docs (high-level)

| Doc | Description |
|-----|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Text-based architecture diagram and data flow |
| [docs/DATABASE_SCHEMA.sql](docs/DATABASE_SCHEMA.sql) | MySQL schema (match, player, match_player, ball, player_score, innings, team) |
| [docs/API_DESIGN.md](docs/API_DESIGN.md) | REST API design |
| [docs/SOCKET_EVENTS.md](docs/SOCKET_EVENTS.md) | Socket.io event flow |
| [docs/REACT_STRUCTURE.md](docs/REACT_STRUCTURE.md) | React component structure and data flow |
| [docs/SAMPLE_BALL_CONTROLLER_SERVICE.md](docs/SAMPLE_BALL_CONTROLLER_SERVICE.md) | Sample add-ball controller and service |
| [docs/API_COLLATION.md](docs/API_COLLATION.md) | API collation (all endpoints in one place) |

**Swagger (interactive API docs)**: After starting the backend, open `http://localhost:3001/api-docs`. OpenAPI JSON: `http://localhost:3001/api-docs.json`.

## Quick start

### 1. Database

Create the database (tables are created automatically on first backend start if they don’t exist):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cricket_live;"
```

Optional: seed data (teams, players, a sample match with squad):

```bash
mysql -u root -p cricket_live < scripts/seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # required: set MYSQL_USER and MYSQL_PASSWORD (and MYSQL_HOST if not localhost)
npm install            # required: installs bcryptjs, jsonwebtoken, etc.
npm run dev
```

**If the app crashes with `Cannot find module 'bcryptjs'`:** run `npm install` in the `backend` folder and start again.

Runs on `http://localhost:3001` (API + Socket.io). **API docs**: http://localhost:3001/api-docs  
If you see "Access denied for user 'root'@'localhost'", ensure `backend/.env` exists (copy from `.env.example`) and has `MYSQL_USER` and `MYSQL_PASSWORD` set. Set `JWT_SECRET` in `.env` for umpire login (see below).

**Umpire login:** Create match, add balls, and add players require an umpire account. Use **Umpire login** / **Sign up** on the frontend, or `POST /api/auth/register` and `POST /api/auth/login`. Include `Authorization: Bearer <token>` for protected APIs.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`; proxy forwards `/api` and `/socket.io` to the backend.

### 4. Use the app

1. Open **Matches** → pick a match.
2. **Umpire**: Add balls (striker, non-striker, bowler, runs, extras, wicket). Use **Undo last ball** to remove the last delivery.
3. **Scoreboard**: Open in another tab/window; it updates live without refresh when the umpire adds or undoes a ball.

## Features

- **Player scoreboard**: Runs, balls, fours, sixes, strike rate — all derived from ball-by-ball data.
- **Umpire panel**: Per-ball inputs (runs 0–6, extras, wicket type + player out, striker/non-striker/bowler); mandatory **Undo last ball**.
- **Viewer scoreboard**: Live updates via Socket.io (`SCOREBOARD_UPDATE`); no page refresh.
- **Cricket rules**: Wides/no-balls not legal deliveries; strike rotation on odd runs and end of over; wicket replaces striker with next batsman.

## Production (Netlify / Vercel + backend)

- **Frontend** (Netlify or **Vercel**):  
  Set build env var **`VITE_API_BASE`** to your backend origin (no trailing slash), e.g. `https://your-api.onrender.com`.  
  Then all API and Socket.io requests go to that backend. Leave empty for local dev (proxy).  
  **Vercel:** See [docs/DEPLOYMENT_VERCEL.md](docs/DEPLOYMENT_VERCEL.md) for step-by-step (use **Root Directory** `frontend` and add `VITE_API_BASE`).

- **Backend**:  
  Set **`CORS_ORIGIN`** in `.env` to your frontend URL (e.g. `https://your-app.vercel.app` or Netlify URL), so the browser allows requests.  
  The backend cannot run on Vercel (it uses Socket.io and a long-running server); use **Render**, **Railway**, or **Fly.io** — see [docs/DEPLOYMENT_VERCEL.md](docs/DEPLOYMENT_VERCEL.md).

## Project layout

```
cricket/
├── backend/                 # Node + Express + Socket.io
│   ├── src/
│   │   ├── config/          # DB pool
│   │   ├── controllers/     # match, ball, scoreboard, player
│   │   ├── services/        # ballService, scoreboardService, matchService
│   │   ├── routes/          # matchRoutes, playerRoutes
│   │   ├── sockets/         # socketHandler (emit, join_match)
│   │   └── index.js
│   └── package.json
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── api/             # REST client
│   │   ├── socket/          # useMatchSocket
│   │   ├── components/      # Layout, ScoreboardView, BallForm
│   │   ├── pages/           # Home, MatchSelect, UmpirePanel, Scoreboard
│   │   └── App.jsx
│   └── package.json
├── docs/                    # Architecture, schema, API, socket, React structure
├── scripts/                 # seed.sql
└── README.md
```

## Environment

**Local:** Copy `.env.example` to `.env` in `backend/` and `frontend/` (frontend can leave vars empty for dev).

**Production:** Use the production example files as templates and set values in your host’s dashboard (do not commit `.env` or `.env.production`):

- **Frontend:** [frontend/.env.production.example](frontend/.env.production.example) — set `VITE_API_BASE` to your backend URL (e.g. in Netlify env vars).
- **Backend:** [backend/.env.production.example](backend/.env.production.example) — set `CORS_ORIGIN`, `JWT_SECRET`, and MySQL credentials on Render/Heroku/etc.

**Backend** (`.env`):

- `PORT` — default 3001
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- `JWT_SECRET`, `JWT_EXPIRES_IN` — for umpire auth
- `CORS_ORIGIN` — frontend origin for CORS and Socket.io (required in production)

## License

MIT.
