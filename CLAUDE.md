# CLAUDE.md — AI Developer Context

## Project Overview
NMTS Safe Inventory Daily Count — a React web app for tracking daily methadone inventory at New Mexico Treatment Services LLC (single clinic in Espanola, NM). Replaces a paper form. Nurses fill OPEN counts at start of day and CLOSE counts at end of day, potentially from different computers.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- **Backend**: Supabase (PostgreSQL) — free tier
- **State**: React hooks with debounced auto-save (1-second delay)
- **Persistence**: Supabase primary, localStorage fallback when Supabase not configured
- **Deployment**: GitHub Pages (static build, Supabase handles backend)

## Architecture

### Data Flow
```
User types → setData (React state) → pendingChanges ref accumulates →
  1-second debounce timer → flushPendingChanges() →
    Supabase .update() + audit_log .insert()
    OR localStorage save (fallback mode)
```

### Key Design Decisions
- **No authentication** — single clinic, trusted network. Supabase RLS allows all access.
- **Audit log is immutable** — RLS only permits INSERT + SELECT (no UPDATE/DELETE). Cannot be tampered with from the client.
- **One record per day** — `daily_counts.date` has a UNIQUE constraint. App loads or creates today's record on mount.
- **Debounce accumulates changes** — `pendingChanges` ref collects all field changes, then flushes them all in one Supabase `.update()` call. Prevents dropped saves from rapid typing.
- **sanitizeForDb()** — converts empty strings to `null` for numeric columns, and cleans partials arrays before sending to Postgres.
- **todayString()** uses local date math (not `toISOString()`) to avoid UTC midnight issues in MST timezone.
- **Custom verifier names** — stored in localStorage under key `nmts_custom_verifiers`. Persists across sessions.

## Database Schema

### `daily_counts` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| date | date | UNIQUE — one per day |
| status | text | `morning_open` (default) |
| open_time, close_time | text | HH:MM format |
| open_bulk_full, close_bulk_full | integer | Number of full bottles |
| open_partials, close_partials | jsonb | Array of 5 numbers [mg values] |
| open_unit_methasoft, open_unit_actual | integer | Unit dose counts |
| open_unit_notes, close_unit_notes | text | Variance explanation |
| open_unit_total_mgs, close_unit_total_mgs | numeric | Manual entry |
| open_verified_by_1, close_verified_by_1 | text | Verifier name |
| dispensed_amount, waste_amount | numeric | Close-side only |
| waste_printed, waste_logged | boolean | Waste compliance checks |
| pharmacist_pouring | text | 'Y' or 'N' |
| created_at, updated_at | timestamptz | Auto-managed |

### `audit_log` table (IMMUTABLE)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| daily_count_date | date | Which day's record was changed |
| field_name | text | e.g. 'open_bulk_full' |
| old_value | text | JSON-stringified previous value |
| new_value | text | JSON-stringified new value |
| changed_by | text | Currently empty (no auth) |
| changed_at | timestamptz | Auto timestamp |

RLS: INSERT + SELECT only. No UPDATE or DELETE policies exist.

## File Structure
```
src/
  main.jsx              — React entry point
  App.jsx               — View routing (today / history / view-day / audit-today)
  supabaseClient.js     — Supabase init, exports `supabase` and `isConfigured`
  index.css             — Tailwind import + print styles
  hooks/
    useDailyCount.js    — Core data hook: load, save, audit, fetch functions
  components/
    InventoryForm.jsx   — Main form (OPEN + CLOSE), accepts readOnly prop
    BulkSection.jsx     — Bulk bottles + partials (reused for open/close)
    UnitDoseSection.jsx — Unit dose counts + variance (reused for open/close)
    VerifierSelect.jsx  — Dropdown with custom name support (localStorage)
    PrintView.jsx       — Print-only layout matching original paper form
    HistoryView.jsx     — Calendar-based date picker for browsing past records
    AuditLog.jsx        — Read-only audit trail table for a given date
  utils/
    validation.js       — Calculations, field validation, verifier list
    exportUtils.js      — CSV export with proper escaping
```

## Important Patterns

### Adding a new field
1. Add to `DEFAULT_DATA` in `useDailyCount.js`
2. If numeric (integer/numeric in Postgres), add to `NUMERIC_FIELDS` set
3. Add column to Supabase via SQL: `ALTER TABLE daily_counts ADD COLUMN field_name type;`
4. Add to `InventoryForm.jsx` UI
5. Add to `PrintView.jsx` for print layout
6. Add to `exportUtils.js` CSV export
7. Add human-readable label to `FIELD_LABELS` in `AuditLog.jsx`

### Error validation
Live errors are computed in `useMemo` in `InventoryForm.jsx`. Two groups:
- `errors` — always shown (open-side + clinic hours)
- `closeErrors` — only shown when `closeStarted` is true

### Print layout
Screen UI is hidden on print (`print:hidden`). `PrintView.jsx` renders a separate table-based layout (`hidden print:block`) that matches the original paper form. Uses `@page { size: landscape }`.

## Commands
```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

## Environment Variables
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
Without these, the app falls back to localStorage mode (data stays in one browser).

## Common Tasks

### Deploy to GitHub Pages
Push to `main` — GitHub Actions builds and deploys automatically.

### Reset a day's data
Delete the row in Supabase: `DELETE FROM daily_counts WHERE date = '2026-04-05';`
Audit log entries for that date remain (immutable).

### Add a new verifier
Users can add names via the "+" button next to the Verified By dropdown. Names are stored in localStorage key `nmts_custom_verifiers`. To add defaults, edit `VERIFIERS` array in `src/utils/validation.js`.
