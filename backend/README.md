Justus Backend (Next.js + SQLite)
=================================

Placering: `greenup/backend`

Snabbstart
----------

1) Installera:

```bash
cd greenup/backend
npm install
```

2) Miljövariabel:

Skapa en `.env` i `greenup/backend` med:

```
JWT_SECRET=byt-till-en-lang-hemlig-strang
```

3) Starta dev-server:

```bash
npm run dev
# API: http://localhost:4000
```

API
---

- POST `/api/login`
  - Body: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "token": "..." }` (JWT) vid success, annars 401

Databas
-------

- SQLite-fil skapas i `greenup/backend/data/app.db`
- Tabeller:
  - `users(id, username UNIQUE, password_hash, created_at)`
- En standardanvändare seedas första gången:
  - username: `admin`
  - password: `admin123`

Notiser
-------

- Node runtime används (krävs för filsystem/SQLite).
- Ändra seed-kontot omedelbart för produktion.

Justus Backend (Next.js + SQLite)
=================================

Quickstart
---------

1) Install dependencies:

```bash
cd backend
npm install
```

2) Add env:

Copy `.env.example` to `.env` and set `JWT_SECRET`.

3) Run dev server:

```bash
npm run dev
# API runs at http://localhost:4000
```

API
---

- POST `/api/login`
  - Body: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "token": "..." }` on success, 401 on failure

Database
--------

- SQLite file: `backend/data/app.db`
- Tables:
  - `users(id, username UNIQUE, password_hash, created_at)`
- A default user is seeded on first run:
  - username: `admin`
  - password: `admin123`

Notes
-----

- This backend uses Node runtime (not Edge) to allow filesystem access for SQLite.
- Replace the seeded credentials immediately in production.



