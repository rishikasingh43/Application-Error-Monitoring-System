## Application Error Monitoring System

A complete, functional web application for **recording, storing, monitoring, categorizing, and analyzing application errors**. It helps developers understand application issues, identify recurring errors, and make troubleshooting easier.

> **Note on architecture:** the original brief suggested Python/Flask + SQLite. This implementation uses the **same real-SQL approach** but runs entirely in the browser, so it works as a live, previewable web app. The database is **PGlite** — a real PostgreSQL engine compiled to WebAssembly, persisted to IndexedDB. Every insert, filter, and analytics query is genuine SQL executed by Postgres, not hardcoded data.

---

### Features

- **Dashboard**
  - Total number of logged errors
  - Counts of `INFO`, `WARNING`, and `ERROR` logs
  - Recent error activity feed
  - A pie chart of errors by category (powered by Recharts)

- **Error Logging**
  - Add new error records via a modal form
  - Each record stores: error message, severity level, application/module name, timestamp, and description
  - A unique ID is auto-generated for every record

- **Error Categorization**
  - Three levels: `INFO`, `WARNING`, `ERROR`
  - Clear color-coded badges and icons for each category (sky / amber / rose)

- **Error Management**
  - All records shown in a clean, responsive table
  - Search by message or application name
  - Filter by error type (level) and date range
  - View full details of any individual record in a modal
  - Delete records (with inline confirmation)

- **Database Integration**
  - Real SQL via PGlite (in-browser Postgres)
  - Parameterized queries for insert, retrieve, filter, and analyze
  - Indexed columns for level, application, timestamp, and message
  - Data persists across reloads (IndexedDB)

- **Reports & Analytics**
  - Most frequently occurring errors (ranked, with occurrence counts)
  - Error counts by category (with percentage distribution bars)
  - Errors-by-application bar chart
  - Recurring error messages grouped automatically

- **Sample Data**
  - 12 clearly-labeled sample error records are seeded on first run so the dashboard is populated immediately. You can add your own records on top of these at any time.

---

### Technologies Used

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Frontend     | React 18 + TypeScript                               |
| Build tool   | Vite                                                 |
| Styling      | Tailwind CSS                                         |
| Charts       | Recharts                                             |
| Icons        | lucide-react                                         |
| Database     | PGlite (real Postgres compiled to WASM)              |
| Tests        | Vitest                                               |

---

### Project Structure

```
.
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite + React + PGlite config
├── tailwind.config.js      # Tailwind theme
├── postcss.config.js
├── tsconfig.json
├── src/
│   ├── main.tsx            # React bootstrap
│   ├── App.tsx             # App shell, tabs, state
│   ├── db.ts               # PGlite database layer (all SQL)
│   ├── types.ts            # Shared TypeScript types
│   ├── utils.ts            # Date + badge helpers
│   ├── Dashboard.tsx       # Dashboard view (stats, chart, activity)
│   ├── ErrorTable.tsx      # Records table with search/filter/pagination
│   ├── Reports.tsx         # Analytics view (top errors, charts)
│   ├── LogFormModal.tsx    # Add-new-error modal form
│   ├── ErrorDetailModal.tsx# Single-record detail modal
│   ├── db.test.ts          # Vitest test cases for the DB layer
│   └── index.css           # Tailwind + base styles
├── public/
│   └── favicon.svg
├── requirements.txt        # Python-style dependency list (reference)
└── README.md
```

---

### Installation & Running Locally

You need **Node.js 18+** installed.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open the URL shown in the terminal (default: http://localhost:3000).

### Production Build

```bash
npm run build      # type-check + build to dist/
npm run preview    # preview the production build
```

### Run Tests

```bash
npm test
```

The test suite (`src/db.test.ts`) verifies:

1. Inserting a record and retrieving it by ID
2. Rejecting an invalid severity level (CHECK constraint)
3. Filtering records by level
4. Searching records by application name
5. Dashboard stats are non-negative
6. Deleting a record removes it from the database

---

### Database Schema

```sql
CREATE TABLE error_logs (
  id          TEXT PRIMARY KEY,
  message     TEXT NOT NULL,
  level       TEXT NOT NULL CHECK (level IN ('INFO','WARNING','ERROR')),
  application TEXT NOT NULL,
  module      TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  timestamp   TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Indexes on `level`, `application`, `timestamp`, and `message` speed up filtering and search.

### Key SQL Queries

- **Insert:** `INSERT INTO error_logs (...) VALUES ($1,...,$8) RETURNING ...`
- **Filter/search:** `WHERE (message ILIKE ... OR application ILIKE ...) AND level = ... AND timestamp >= ... AND timestamp <= ...`
- **Stats:** `count(*) FILTER (WHERE level = 'INFO')` etc.
- **Top errors:** `GROUP BY message, level ORDER BY count(*) DESC`
- **By application:** `GROUP BY application` with `FILTER (WHERE level = 'ERROR')`

All queries use parameterized placeholders (`$1`, `$2`, …) to prevent SQL injection.

---

### How the "Real Database" Works

PGlite is a genuine PostgreSQL 15 build compiled to WebAssembly and packaged by Electric SQL. When the app loads, it creates an IndexedDB-backed Postgres instance in your browser and runs the schema DDL against it. From that point on, every read and write is executed as real SQL by the Postgres engine — the same `INSERT`, `SELECT`, `GROUP BY`, `FILTER`, and `CHECK` semantics you'd get from server-side Postgres or SQLite. Data survives page reloads because it is stored in IndexedDB.

---

### Usage

1. **Dashboard** — view totals, the category pie chart, and recent activity. Click any recent item to see its details.
2. **Error Records** — browse, search, filter, and page through all records. Click the eye icon to view details, or the trash icon to delete.
3. **Reports** — see the most frequent errors, the errors-by-application bar chart, and the category distribution.
4. **Log Error** (top-right button) — fill in the form to add your own error record. It is saved to the database and appears immediately across all views.

---

### License

MIT — free to use for learning and projects.
