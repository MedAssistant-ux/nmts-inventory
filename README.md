# NMTS Safe Inventory Daily Count

A web-based inventory tracking system for New Mexico Treatment Services LLC, replacing the paper-based daily methadone inventory count form.

## Features

- **Daily Inventory Form** — OPEN (morning) and CLOSE (evening) counts for methadone liquid bulk bottles, partial bottles, and unit doses
- **Auto-Save** — All changes save automatically to the cloud (Supabase) within 1 second
- **Cross-Computer Access** — Start on one computer, finish on another
- **Calendar History** — Browse past inventory sheets by date
- **Immutable Audit Log** — Every field change permanently recorded. Cannot be edited or deleted.
- **Print Layout** — Professional paper form with business letterhead
- **CSV Backup** — Export all records as a spreadsheet
- **Dose Calculator** — Quick link to the patient methadone dose calculator
- **Validation** — Clinic hours, required fields, partial bottle limits, variance notes

## Quick Start

```bash
npm install
cp .env.example .env   # Add your Supabase credentials
npm run dev
```

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor
3. Copy your Project URL and anon key to `.env`

## Tech Stack

React 18 + Vite + Tailwind CSS v4 + Supabase + GitHub Pages

---

New Mexico Treatment Services LLC | 1227 N Railroad Ave, Suite C, Espanola, NM 87532 | (505) 747-8187
