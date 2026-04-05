-- Run this in your Supabase SQL Editor to create the daily_counts table

create table if not exists daily_counts (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  status text not null default 'morning_open'
    check (status in ('morning_open', 'morning_locked', 'evening_open', 'evening_locked')),

  -- OPEN fields
  open_time text,
  open_bulk_full integer default 0,
  open_partials jsonb default '[0,0,0,0,0]'::jsonb,
  open_unit_methasoft integer,
  open_unit_actual integer,
  open_unit_notes text default '',
  open_unit_total_mgs numeric default 0,
  open_verified_by_1 text default '',
  open_verified_by_2 text default '',

  -- CLOSE fields
  close_time text,
  close_bulk_full integer default 0,
  close_partials jsonb default '[0,0,0,0,0]'::jsonb,
  close_unit_methasoft integer,
  close_unit_actual integer,
  close_unit_notes text default '',
  close_unit_total_mgs numeric default 0,
  close_verified_by_1 text default '',
  close_verified_by_2 text default '',

  -- CLOSE extras
  dispensed_amount numeric default 0,
  waste_amount numeric default 0,
  waste_printed boolean default false,
  waste_logged boolean default false,
  pharmacist_pouring text default '',
  reconciliation_notes text default '',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at on changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger daily_counts_updated_at
  before update on daily_counts
  for each row
  execute function update_updated_at();

-- Allow public access (single clinic, no auth needed)
alter table daily_counts enable row level security;

create policy "Allow all access" on daily_counts
  for all
  using (true)
  with check (true);

-- Audit log table (immutable — insert and read only, no updates or deletes)
create table if not exists audit_log (
  id uuid default gen_random_uuid() primary key,
  daily_count_date date not null,
  field_name text not null,
  old_value text,
  new_value text,
  changed_by text default '',
  changed_at timestamptz default now()
);

alter table audit_log enable row level security;

create policy "insert_only" on audit_log
  for insert with check (true);

create policy "read_only" on audit_log
  for select using (true);
