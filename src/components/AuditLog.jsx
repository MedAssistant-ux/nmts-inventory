import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { fetchAuditLog } from '../hooks/useDailyCount';

const FIELD_LABELS = {
  open_time: 'Open Time',
  open_bulk_full: 'Open Full Bottles',
  open_partials: 'Open Partials',
  open_unit_methasoft: 'Open Methasoft',
  open_unit_actual: 'Open Actual',
  open_unit_notes: 'Open Variance Notes',
  open_unit_total_mgs: 'Open Unit Total Mgs',
  open_verified_by_1: 'Open Verified By',
  close_time: 'Close Time',
  close_bulk_full: 'Close Full Bottles',
  close_partials: 'Close Partials',
  close_unit_methasoft: 'Close Methasoft',
  close_unit_actual: 'Close Actual',
  close_unit_notes: 'Close Variance Notes',
  close_unit_total_mgs: 'Close Unit Total Mgs',
  close_verified_by_1: 'Close Verified By',
  dispensed_amount: 'Total Dispensed',
  waste_amount: 'Waste/Spill',
  waste_printed: 'Waste Paper Printed',
  waste_logged: 'Waste Logged',
  pharmacist_pouring: 'Pharmacist Pouring',
  date: 'Date',
  status: 'Status',
};

function formatValue(val) {
  if (val === '' || val === '""' || val === 'null' || val == null) return '(empty)';
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.join(', ');
    if (parsed === true) return 'Yes';
    if (parsed === false) return 'No';
    return String(parsed);
  } catch {
    return val;
  }
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
}

export default function AuditLog({ date }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAuditLog(date).then(data => {
      setEntries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [date]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-slate-700 text-white px-5 py-3 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        <h3 className="font-bold text-lg">Audit Log</h3>
        <span className="text-slate-300 text-sm ml-2">({date})</span>
        <span className="ml-auto text-xs text-slate-400">Read-only &mdash; cannot be edited or deleted</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading audit log...</div>
      ) : entries.length === 0 ? (
        <div className="p-8 text-center text-gray-400">No changes recorded for this date.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-36">Time</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Field</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Old Value</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((e, i) => (
                <tr key={e.id || i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs">{formatTime(e.changed_at)}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{FIELD_LABELS[e.field_name] || e.field_name}</td>
                  <td className="px-4 py-2 text-red-600 font-mono text-xs">{formatValue(e.old_value)}</td>
                  <td className="px-4 py-2 text-emerald-700 font-mono text-xs">{formatValue(e.new_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
