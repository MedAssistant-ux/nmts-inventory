import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isConfigured } from '../supabaseClient';

const DEFAULT_DATA = {
  status: 'morning_open',
  open_time: '',
  open_bulk_full: 0,
  open_partials: [0, 0, 0, 0, 0],
  open_unit_methasoft: '',
  open_unit_actual: '',
  open_unit_notes: '',
  open_unit_total_mgs: '',
  open_verified_by_1: '',
  open_verified_by_2: '',
  close_time: '',
  close_bulk_full: 0,
  close_partials: [0, 0, 0, 0, 0],
  close_unit_methasoft: '',
  close_unit_actual: '',
  close_unit_notes: '',
  close_unit_total_mgs: '',
  close_verified_by_1: '',
  close_verified_by_2: '',
  dispensed_amount: '',
  waste_amount: '',
  waste_printed: false,
  waste_logged: false,
  pharmacist_pouring: '',
};

// Fields that are integer/numeric in Postgres — empty string must become null
const NUMERIC_FIELDS = new Set([
  'open_bulk_full', 'open_unit_methasoft', 'open_unit_actual', 'open_unit_total_mgs',
  'close_bulk_full', 'close_unit_methasoft', 'close_unit_actual', 'close_unit_total_mgs',
  'dispensed_amount', 'waste_amount',
]);

function sanitizeForDb(obj) {
  const clean = { ...obj };
  for (const key of Object.keys(clean)) {
    // Numeric fields: empty string / undefined → null
    if (NUMERIC_FIELDS.has(key) && (clean[key] === '' || clean[key] === undefined)) {
      clean[key] = null;
    }
  }
  // Partials arrays: ensure all elements are numbers, not empty strings
  if (clean.open_partials) {
    clean.open_partials = clean.open_partials.map(v => (v === '' || v == null) ? 0 : Number(v));
  }
  if (clean.close_partials) {
    clean.close_partials = clean.close_partials.map(v => (v === '' || v == null) ? 0 : Number(v));
  }
  return clean;
}

// Use local date to avoid UTC midnight issues (clinic is in NM / MST)
function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function currentTimeString() {
  const now = new Date();
  return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

// --- localStorage fallback ---

function localKey(date) {
  return `nmts_daily_${date}`;
}

function loadLocal(date) {
  try {
    const raw = localStorage.getItem(localKey(date));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocal(date, data) {
  try {
    localStorage.setItem(localKey(date), JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadAllLocal() {
  const records = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('nmts_daily_')) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        if (parsed && parsed.date) records.push(parsed);
      } catch { /* skip corrupted entries */ }
    }
  }
  return records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

// -----------------------------------------------------------------

export function useDailyCount() {
  const [data, setData] = useState({ ...DEFAULT_DATA });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [usingLocal, setUsingLocal] = useState(false);

  // Accumulate pending changes so rapid edits don't drop fields
  const pendingChanges = useRef({});
  const saveTimer = useRef(null);
  const recordIdRef = useRef(null);

  // Keep recordId ref in sync
  useEffect(() => { recordIdRef.current = recordId; }, [recordId]);

  useEffect(() => { loadToday(); }, []);

  async function loadToday() {
    setLoading(true);
    setError(null);
    const today = todayString();

    if (!isConfigured) {
      setUsingLocal(true);
      const existing = loadLocal(today);
      if (existing) {
        setData(existing);
      } else {
        const newData = { ...DEFAULT_DATA, date: today, open_time: currentTimeString() };
        saveLocal(today, newData);
        setData(newData);
      }
      setLoading(false);
      return;
    }

    try {
      const { data: rows, error: fetchError } = await supabase
        .from('daily_counts')
        .select('*')
        .eq('date', today)
        .limit(1);

      if (fetchError) throw fetchError;

      if (rows && rows.length > 0) {
        const row = rows[0];
        setRecordId(row.id);
        const loaded = {
          ...DEFAULT_DATA,
          ...row,
          open_partials: row.open_partials || [0,0,0,0,0],
          close_partials: row.close_partials || [0,0,0,0,0],
        };
        lastSavedData.current = { ...loaded };
        setData(loaded);
      } else {
        // Insert new record — use ignoreDuplicates to avoid overwriting if race condition
        const time = currentTimeString();
        const newRecord = sanitizeForDb({ ...DEFAULT_DATA, date: today, open_time: time });
        const { data: inserted, error: insertError } = await supabase
          .from('daily_counts')
          .upsert(newRecord, { onConflict: 'date', ignoreDuplicates: true })
          .select()
          .single();

        if (insertError) {
          // If upsert returned nothing (ignoreDuplicates), fetch the existing row
          const { data: existing, error: fetchErr2 } = await supabase
            .from('daily_counts')
            .select('*')
            .eq('date', today)
            .single();
          if (fetchErr2) throw fetchErr2;
          setRecordId(existing.id);
          const loaded = {
            ...DEFAULT_DATA,
            ...existing,
            open_partials: existing.open_partials || [0,0,0,0,0],
            close_partials: existing.close_partials || [0,0,0,0,0],
          };
          lastSavedData.current = { ...loaded };
          setData(loaded);
        } else {
          setRecordId(inserted.id);
          const loaded = { ...DEFAULT_DATA, ...inserted, open_partials: [0,0,0,0,0], close_partials: [0,0,0,0,0] };
          lastSavedData.current = { ...loaded };
          setData(loaded);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Track last saved state for audit diffing
  const lastSavedData = useRef(null);

  // Log changes to audit_log table (insert-only, immutable)
  async function logAuditChanges(date, changes, previousData) {
    if (!isConfigured || !previousData) return;
    const entries = [];
    for (const [field, newVal] of Object.entries(changes)) {
      const oldVal = previousData[field];
      const oldStr = oldVal == null ? '' : JSON.stringify(oldVal);
      const newStr = newVal == null ? '' : JSON.stringify(newVal);
      if (oldStr !== newStr) {
        entries.push({
          daily_count_date: date,
          field_name: field,
          old_value: oldStr,
          new_value: newStr,
          changed_by: '',
        });
      }
    }
    if (entries.length > 0) {
      try {
        await supabase.from('audit_log').insert(entries);
      } catch { /* audit logging is best-effort */ }
    }
  }

  // Flush all accumulated pending changes to Supabase or localStorage
  async function flushPendingChanges(latestData) {
    const changes = { ...pendingChanges.current };
    pendingChanges.current = {};

    if (Object.keys(changes).length === 0) return;

    setSaving(true);
    try {
      if (!isConfigured) {
        saveLocal(latestData.date, latestData);
      } else if (recordIdRef.current) {
        // Log audit before saving
        await logAuditChanges(latestData.date, changes, lastSavedData.current);

        const { error: updateError } = await supabase
          .from('daily_counts')
          .update(sanitizeForDb(changes))
          .eq('id', recordIdRef.current);
        if (updateError) throw updateError;

        // Update last saved snapshot
        lastSavedData.current = { ...lastSavedData.current, ...changes };
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function scheduleSave(latestData) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flushPendingChanges(latestData), 1000);
  }

  function updateField(field, value) {
    setData(prev => {
      const next = { ...prev, [field]: value };
      pendingChanges.current[field] = value;
      scheduleSave(next);
      return next;
    });
  }

  function updatePartial(index, value, isClose = false) {
    const field = isClose ? 'close_partials' : 'open_partials';
    setData(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      const next = { ...prev, [field]: arr };
      pendingChanges.current[field] = arr;
      scheduleSave(next);
      return next;
    });
  }

  function setCloseBulkFull(value) {
    setData(prev => {
      const updates = { close_bulk_full: value };
      if (!prev.close_time && value !== '' && value !== 0 && value != null) {
        updates.close_time = currentTimeString();
      }
      const next = { ...prev, ...updates };
      Object.assign(pendingChanges.current, updates);
      scheduleSave(next);
      return next;
    });
  }

  return {
    data,
    loading,
    saving,
    error,
    usingLocal,
    updateField,
    updatePartial,
    setCloseBulkFull,
    loadToday,
  };
}

export async function fetchDayData(date) {
  if (!isConfigured) {
    return loadLocal(date) || null;
  }
  const { data, error } = await supabase
    .from('daily_counts')
    .select('*')
    .eq('date', date)
    .single();
  if (error) return null;
  return data;
}

export async function fetchAuditLog(date) {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('daily_count_date', date)
    .order('changed_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchDatesWithRecords() {
  if (!isConfigured) {
    return loadAllLocal().map(r => r.date);
  }
  const { data, error } = await supabase
    .from('daily_counts')
    .select('date')
    .order('date', { ascending: false })
    .limit(365);
  if (error) return [];
  return (data || []).map(r => r.date);
}

export async function fetchHistory() {
  if (!isConfigured) {
    return loadAllLocal();
  }
  const { data, error } = await supabase
    .from('daily_counts')
    .select('*')
    .order('date', { ascending: false })
    .limit(90);

  if (error) throw error;
  return data || [];
}
