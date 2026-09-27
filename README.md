# InterviewIQ

A full-stack MERN interview preparation platform that uses Google Gemini AI to generate personalized interview questions, evaluate answers, and provide structured coaching feedback.

## Features

- **JWT Authentication** — Register, login, token-based session management with ownership authorization on every resource
- **PDF Resume Parsing** — Upload a PDF resume; text is extracted server-side and stored for AI analysis
- **Resume Intelligence** — AI extracts skills, experience, education, projects, strengths, and improvement suggestions
- **Job Description Analysis** — Paste any JD; AI identifies required skills, responsibilities, and keywords
- **Resume ↔ JD Match Analysis** — AI scores how well your resume matches a given JD and surfaces skill gaps
- **Interview Modes**
  - **Normal** — Role/type/difficulty/stack configured interview
  - **Focused Practice** — All questions target a single topic
  - **Adaptive Practice** — Questions weighted toward historically weak topics
  - **Personalized** — Questions generated from combined resume + JD + match + past performance context
- **Configurable Question Count** — Select 3, 5, or 10 questions per session
- **Structured AI Evaluation** — Each answer is scored (0–10) with technical accuracy, completeness, communication, depth, strengths, gaps, and a model answer
- **Analytics Dashboard** — Score trends, topic performance chart, per-mode and per-difficulty breakdowns
- **AI Coach Insights** — Personalized coaching summary, focus areas, recommended next step
- **"Practice This Topic" Flow** — Click a weak focus area on the dashboard to launch a pre-filled Focused Practice session
- **Provider-Agnostic AI Layer** — Swap between Gemini and Mock providers via environment variable (no code changes)
- **Production Hardening** — Helmet, CORS allowlist, rate limiting (general, auth, AI), AI daily usage cap, JWT secret validation

## Screenshots

![InterviewIQ dashboard on desktop](docs/screenshots/dashboard-desktop.png)

[View the mobile dashboard](docs/screenshots/dashboard-mobile.png)

## Architecture

```
Browser (React + Vite)
    ↓  HTTPS  (VITE_API_URL)
Express API (Node.js)
    ├── JWT Auth Middleware
    ├── Zod Input Validation
    ├── Rate Limiting
    ├── AI Provider (Gemini | Mock)
    │     └── Prompt → Provider → Parser → Zod Schema
    └── MongoDB (Mongoose)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Recharts, Tailwind CSS v4 |
| Backend | Node.js, Express 5, Mongoose, Zod, Helmet, express-rate-limit |
| Database | MongoDB (local dev) / MongoDB Atlas (production) |
| AI | Google Gemini via `@google/genai` SDK |
| Auth | bcryptjs, jsonwebtoken |
| PDF parsing | pdfjs-dist |
| Testing | Vitest, Supertest |
| Tooling | npm workspaces, Vite, oxlint |

## Local Setup

### Prerequisites
- Node.js 20+
- MongoDB running locally (`mongodb://localhost:27017`)
- A Google AI Studio API key (or use `AI_PROVIDER=mock` to skip)

### Install

```bash
git clone <repo-url>
cd InterviewIQ
npm install
```

### Configure backend

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set JWT_SECRET and optionally GEMINI_API_KEY
```

### Run development servers

```bash
# Both concurrently
npm run dev

# Or separately
npm run dev:api     # API on :5000
npm run dev:web     # Vite dev server on :5173
```

The Vite dev server proxies `/api` requests to `localhost:5000` automatically.

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` \| `production` \| `test` |
| `PORT` | No | Default `5000` |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Min 32 chars, non-placeholder in production |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `CLIENT_URL` | Yes | Comma-separated allowed CORS origins |
| `AI_PROVIDER` | No | `gemini` (default) or `mock` |
| `GEMINI_API_KEY` | If Gemini | Google AI Studio key |
| `GEMINI_MODEL` | No | Default `gemini-2.0-flash-lite` |
| `API_RATE_LIMIT_MAX` | No | Default `100` per 15 min window |
| `AUTH_RATE_LIMIT_MAX` | No | Default `10` per 15 min |
| `AI_RATE_LIMIT_MAX` | No | Default `15` per 15 min |
| `AI_DAILY_REQUEST_LIMIT` | No | Default `50` per day |

### Frontend (`apps/web/.env.local` — production only)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full backend URL, e.g. `https://your-api.onrender.com/api` |

> In development, leave `VITE_API_URL` unset. The Vite proxy handles `/api` automatically.

## Running Tests

```bash
npm test --workspace=apps/api
```

- **7 test files** discovered
- **112 tests** covering P0-A (security), P0-B (flow integrity), P0-C (PDF), P0-D (personalized loop), P1 (hardening), P2 (portfolio features)
- Requires local MongoDB on `127.0.0.1:27017`
- Uses `AI_PROVIDER=mock` automatically (set in `.env.test`)

## Production Build

```bash
npm run build --workspace=apps/web
# Output: apps/web/dist/
```

## AI Provider Configuration

InterviewIQ has a provider-agnostic AI layer. Switch providers by setting `AI_PROVIDER`:

```bash
# Use Google Gemini (production)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key

# Use Mock provider (testing/development without API key)
AI_PROVIDER=mock
```

The Mock provider returns deterministic, realistic responses and is used exclusively in all automated tests. No AI API key is required for running tests.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Authenticate |
| GET | `/api/auth/me` | Current user |
| GET | `/api/profile` | Full profile |
| POST | `/api/profile/resume` | Analyze resume text |
| POST | `/api/profile/resume/upload` | Upload PDF resume |
| POST | `/api/profile/job-description` | Analyze job description |
| GET | `/api/profile/match` | Run resume ↔ JD match |
| POST | `/api/sessions` | Create interview session |
| GET | `/api/sessions` | List sessions |
| GET | `/api/sessions/:id` | Get session |
| POST | `/api/sessions/:id/generate` | Generate questions |
| POST | `/api/sessions/:id/answer` | Submit + evaluate answer |
| PATCH | `/api/sessions/:id/complete` | Complete session |
| GET | `/api/dashboard/stats` | Performance statistics |
| GET | `/api/dashboard/insights` | AI coaching insights |
| GET | `/api/health` | Health check |

## Security Highlights

- All interview session routes require JWT authentication
- Every session read/write validates `userId` ownership — cross-user access returns 404
- Input validated with Zod before any database write
- Server-owned fields (`status`, `overallScore`, `questions`, `evaluation`) are stripped from client payloads
- Passwords hashed with bcryptjs (10 salt rounds); `passwordHash` never returned in any response
- Insecure JWT secrets rejected at startup in production
- Helmet sets security headers on every response
- Rate limiting: general (100/15min), auth (10/15min), AI endpoints (15/15min)
- Prompt injection boundary added to all Gemini prompts that include user data

## Known Limitations

- Single Gemini model — no fallback if Google AI is unavailable
- No email verification on registration
- No password reset flow
- Resume PDF must be text-based (scanned/image PDFs will produce empty extraction)
- Free-tier Gemini quota limits apply; no automatic retry on quota errors
- No persistent file storage — PDFs are processed in-memory and only the extracted text is stored
