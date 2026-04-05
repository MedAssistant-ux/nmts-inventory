import { calcBulkTotal, calcGrandTotal } from './validation';

// Safely format a value for CSV — quote strings, handle null/undefined
function csvVal(v) {
  if (v == null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  const str = String(v);
  // Quote if contains comma, newline, or double-quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(records) {
  const headers = [
    'Date', 'Status',
    'Open Time', 'Open Full Bottles', 'Open Bulk Mgs', 'Open Partial 1', 'Open Partial 2',
    'Open Partial 3', 'Open Partial 4', 'Open Partial 5', 'Open Bulk Total',
    'Open Methasoft', 'Open Actual', 'Open Variance', 'Open Unit Notes',
    'Open Unit Total Mgs', 'Open Grand Total', 'Open Verified By',
    'Close Time', 'Close Full Bottles', 'Close Bulk Mgs', 'Close Partial 1', 'Close Partial 2',
    'Close Partial 3', 'Close Partial 4', 'Close Partial 5', 'Close Bulk Total',
    'Close Methasoft', 'Close Actual', 'Close Variance', 'Close Unit Notes',
    'Close Unit Total Mgs', 'Close Grand Total',
    'Dispensed', 'Waste/Spill', 'Waste Printed', 'Waste Logged',
    'Pharmacist Pouring', 'Close Verified By',
  ];

  const rows = records.map(r => {
    const op = r.open_partials || [0,0,0,0,0];
    const cp = r.close_partials || [0,0,0,0,0];
    const openBulk = calcBulkTotal(r.open_bulk_full, op);
    const closeBulk = calcBulkTotal(r.close_bulk_full, cp);
    const openGrand = calcGrandTotal(r.open_bulk_full, op, r.open_unit_total_mgs);
    const closeGrand = calcGrandTotal(r.close_bulk_full, cp, r.close_unit_total_mgs);
    const openVar = (Number(r.open_unit_actual) || 0) - (Number(r.open_unit_methasoft) || 0);
    const closeVar = (Number(r.close_unit_actual) || 0) - (Number(r.close_unit_methasoft) || 0);

    return [
      r.date, r.status,
      r.open_time, r.open_bulk_full, (Number(r.open_bulk_full)||0)*10000,
      op[0], op[1], op[2], op[3], op[4], openBulk,
      r.open_unit_methasoft, r.open_unit_actual, openVar, r.open_unit_notes,
      r.open_unit_total_mgs, openGrand, r.open_verified_by_1,
      r.close_time, r.close_bulk_full, (Number(r.close_bulk_full)||0)*10000,
      cp[0], cp[1], cp[2], cp[3], cp[4], closeBulk,
      r.close_unit_methasoft, r.close_unit_actual, closeVar, r.close_unit_notes,
      r.close_unit_total_mgs, closeGrand,
      r.dispensed_amount, r.waste_amount, r.waste_printed, r.waste_logged,
      r.pharmacist_pouring, r.close_verified_by_1,
    ].map(csvVal);
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  a.download = `inventory_backup_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
