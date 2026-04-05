import React, { useState, useMemo } from 'react';
import { AlertCircle, Printer, CheckCircle, Loader2, FileDown, Calendar, Shield, Calculator } from 'lucide-react';
import BulkSection from './BulkSection';
import UnitDoseSection from './UnitDoseSection';
import VerifierSelect from './VerifierSelect';
import PrintView from './PrintView';
import { calcGrandTotal } from '../utils/validation';

export default function InventoryForm({ data, saving, updateField, updatePartial, setCloseBulkFull, readOnly = false, onViewHistory, onViewAuditLog }) {
  // In read-only mode, make all update functions no-ops
  const _updateField = readOnly ? () => {} : updateField;
  const _updatePartial = readOnly ? () => {} : updatePartial;
  const _setCloseBulkFull = readOnly ? () => {} : setCloseBulkFull;
  const openGrandTotal = calcGrandTotal(data.open_bulk_full, data.open_partials, data.open_unit_total_mgs);
  const closeGrandTotal = calcGrandTotal(data.close_bulk_full, data.close_partials, data.close_unit_total_mgs);

  // Date checks
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const isDateMismatch = data.date && data.date !== today;
  const [dateMismatchDismissed, setDateMismatchDismissed] = useState(false);

  // Clinic hours check (5am - 4pm)
  function isOutsideClinicHours(time) {
    if (!time) return false;
    return time < '05:00' || time > '16:00';
  }
  const openTimeWarning = isOutsideClinicHours(data.open_time);
  const closeTimeWarning = isOutsideClinicHours(data.close_time);

  // Live error collection
  const errors = useMemo(() => {
    const e = [];
    if (openTimeWarning) e.push('Open time is outside clinic hours (5:00 AM - 4:00 PM).');
    if (closeTimeWarning) e.push('Close time is outside clinic hours (5:00 AM - 4:00 PM).');

    // Open required fields (0 not allowed except partials/variance)
    if (data.open_bulk_full === '' || data.open_bulk_full == null) e.push('Open: Full Bottles is required.');
    if (data.open_unit_methasoft === '' || data.open_unit_methasoft == null) e.push('Open: Unit Totals - Methasoft is required.');
    if (data.open_unit_actual === '' || data.open_unit_actual == null) e.push('Open: Unit Totals - Actual is required.');
    if (data.open_unit_total_mgs === '' || data.open_unit_total_mgs == null || Number(data.open_unit_total_mgs) === 0) e.push('Open: Unit Total Mgs is required and cannot be 0.');
    if (!data.open_verified_by_1) e.push('Open: Verified By is required.');

    // Open variance notes
    const openVar = (Number(data.open_unit_actual) || 0) - (Number(data.open_unit_methasoft) || 0);
    if (data.open_unit_methasoft !== '' && data.open_unit_actual !== '' && openVar !== 0 && (!data.open_unit_notes || !data.open_unit_notes.trim())) {
      e.push('Open: Variance notes required when there is a variance.');
    }

    return e;
  }, [data, openTimeWarning, closeTimeWarning]);

  // Close-side errors (only show if user has started filling close)
  const closeStarted = (data.close_bulk_full !== 0 && data.close_bulk_full !== '' && data.close_bulk_full != null) || !!data.close_time;
  const closeErrors = useMemo(() => {
    if (!closeStarted) return [];
    const e = [];
    if (data.close_bulk_full === '' || data.close_bulk_full == null) e.push('Close: Full Bottles is required.');
    if (data.close_unit_methasoft === '' || data.close_unit_methasoft == null) e.push('Close: Unit Totals - Methasoft is required.');
    if (data.close_unit_actual === '' || data.close_unit_actual == null) e.push('Close: Unit Totals - Actual is required.');
    if (data.close_unit_total_mgs === '' || data.close_unit_total_mgs == null || Number(data.close_unit_total_mgs) === 0) e.push('Close: Unit Total Mgs is required and cannot be 0.');
    if (data.dispensed_amount === '' || data.dispensed_amount == null || Number(data.dispensed_amount) === 0) e.push('Close: Total Dispensed is required and cannot be 0.');
    if (!data.close_verified_by_1) e.push('Close: Verified By is required.');
    if (!data.pharmacist_pouring) e.push('Close: Pharmacist still pouring must be answered.');

    const closeVar = (Number(data.close_unit_actual) || 0) - (Number(data.close_unit_methasoft) || 0);
    if (data.close_unit_methasoft !== '' && data.close_unit_actual !== '' && closeVar !== 0 && (!data.close_unit_notes || !data.close_unit_notes.trim())) {
      e.push('Close: Variance notes required when there is a variance.');
    }

    const wasteAmt = Number(data.waste_amount) || 0;
    if (wasteAmt > 0) {
      if (!data.waste_printed) e.push('Close: Confirm printed spill/waste paper.');
      if (!data.waste_logged) e.push('Close: Confirm recorded in logbook.');
    }
    return e;
  }, [data, closeStarted]);

  const allErrors = [...errors, ...closeErrors];

  function handlePrint() {
    if (allErrors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.print();
  }

  function handleSavePDF() {
    if (allErrors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.print(); // browser print dialog allows Save as PDF
  }

  return (
    <>
      <PrintView data={data} openGrandTotal={openGrandTotal} closeGrandTotal={closeGrandTotal} />

      <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800 print:hidden">

        {/* Date mismatch warning */}
        {!readOnly && isDateMismatch && !dateMismatchDismissed && (
          <div className="max-w-7xl mx-auto mb-4 bg-amber-50 border border-amber-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-800 text-sm mb-1">
                  This form is from {data.date} but today is {today}.
                </p>
                <p className="text-amber-700 text-sm mb-3">
                  The open and close counts should be performed on the same day. You can change the date or dismiss this warning.
                </p>
                <button
                  onClick={() => setDateMismatchDismissed(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Errors banner */}
        {!readOnly && allErrors.length > 0 && (
          <div className="max-w-7xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 text-sm mb-1">Please fix the following:</p>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-0.5">
                  {allErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-slate-800 text-white rounded-xl shadow-lg overflow-hidden">
            {/* Title row */}
            <div className="px-5 pt-4 pb-2 text-center">
              <h1 className="text-2xl md:text-3xl font-bold tracking-wider">New Mexico Treatment Services</h1>
              <h2 className="text-lg md:text-xl mt-1 font-light text-slate-300">Safe Inventory Daily Count</h2>
            </div>
            {/* Buttons row */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div>
                {saving ? (
                  <span className="flex items-center gap-1 text-slate-400 text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" /> Saved</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <a href="https://medassistant-ux.github.io/methadone-dose-calculator/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-semibold transition-colors shadow-md text-sm">
                  <Calculator className="w-4 h-4" /> Dose Calculator
                </a>
                {onViewHistory && (
                  <button onClick={onViewHistory} className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 text-white px-3 py-1.5 rounded-md font-semibold transition-colors shadow-md text-sm">
                    <Calendar className="w-4 h-4" /> History
                  </button>
                )}
                {onViewAuditLog && (
                  <button onClick={onViewAuditLog} className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 text-white px-3 py-1.5 rounded-md font-semibold transition-colors shadow-md text-sm">
                    <Shield className="w-4 h-4" /> Audit Log
                  </button>
                )}
                <button onClick={handleSavePDF} className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 text-white px-3 py-1.5 rounded-md font-semibold transition-colors shadow-md text-sm">
                  <FileDown className="w-4 h-4" /> Save PDF
                </button>
                <button onClick={handlePrint} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md font-semibold transition-colors shadow-md text-sm">
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT — gap-12 for more space */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ========= LEFT: OPEN ========= */}
          <div className="rounded-xl shadow-lg overflow-hidden border border-emerald-200">
            <div className="px-5 py-3 flex items-center justify-between bg-emerald-600 text-white">
              <h3 className="text-xl font-bold">OPEN</h3>
              <div className="flex space-x-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase opacity-80">Date</label>
                  <input type="date" value={data.date || ''} onChange={e => _updateField('date', e.target.value)} className="block w-full rounded border-0 bg-white/20 text-white text-sm p-1.5 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase opacity-80">Time</label>
                  <input
                    type="time" value={data.open_time || ''}
                    onChange={e => _updateField('open_time', e.target.value)}
                    className={`block w-full rounded border-0 text-sm p-1.5 ${openTimeWarning ? 'bg-red-300 text-red-900' : 'bg-white/20 text-white'}`}
                  />
                </div>
              </div>
            </div>

            {openTimeWarning && (
              <div className="bg-red-50 px-4 py-2 flex items-center gap-2 border-b border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-700 font-medium">Time is outside clinic hours (5:00 AM - 4:00 PM)</span>
              </div>
            )}

            <div className="p-5 bg-white">
              <BulkSection
                bulkFull={data.open_bulk_full}
                partials={data.open_partials}
                onBulkFullChange={v => _updateField('open_bulk_full', v)}
                onPartialChange={(i, v) => _updatePartial(i, v, false)}
                locked={readOnly}
                accent="emerald"
              />

              <UnitDoseSection
                methasoft={data.open_unit_methasoft}
                actual={data.open_unit_actual}
                notes={data.open_unit_notes}
                unitTotalMgs={data.open_unit_total_mgs}
                onMethasoftChange={v => _updateField('open_unit_methasoft', v)}
                onActualChange={v => _updateField('open_unit_actual', v)}
                onNotesChange={v => _updateField('open_unit_notes', v)}
                onUnitTotalMgsChange={v => _updateField('open_unit_total_mgs', v)}
                locked={readOnly}
                accent="emerald"
              />

              <div className="bg-slate-800 text-white p-4 rounded-lg flex flex-col items-center justify-center mb-5">
                <span className="text-xs font-medium text-slate-300 uppercase tracking-widest mb-1">Bulk Total + Unit Mgs Total</span>
                <span className="text-2xl font-bold">{openGrandTotal.toLocaleString()} Mgs</span>
              </div>

              <VerifierSelect
                label="Verified By"
                value={data.open_verified_by_1}
                onChange={v => _updateField('open_verified_by_1', v)}
                excludeValue=""
                locked={readOnly}
              />
            </div>
          </div>

          {/* ========= RIGHT: CLOSE ========= */}
          <div className="rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-3 flex items-center justify-between bg-slate-700 text-white">
              <h3 className="text-xl font-bold">CLOSE</h3>
              <div className="flex space-x-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase opacity-80">Date</label>
                  <input type="date" value={data.date || ''} onChange={e => _updateField('date', e.target.value)} className="block w-full rounded border-0 bg-white/20 text-white text-sm p-1.5 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase opacity-80">Time</label>
                  <input
                    type="time" value={data.close_time || ''}
                    onChange={e => _updateField('close_time', e.target.value)}
                    className={`block w-full rounded border-0 text-sm p-1.5 ${closeTimeWarning ? 'bg-red-300 text-red-900' : 'bg-white/20 text-white'}`}
                  />
                  {!data.close_time && <span className="text-[10px] opacity-60">Auto-fills when Bulk entered</span>}
                </div>
              </div>
            </div>

            {closeTimeWarning && (
              <div className="bg-red-50 px-4 py-2 flex items-center gap-2 border-b border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-700 font-medium">Time is outside clinic hours (5:00 AM - 4:00 PM)</span>
              </div>
            )}

            <div className="p-5 bg-white">
              <BulkSection
                bulkFull={data.close_bulk_full}
                partials={data.close_partials}
                onBulkFullChange={_setCloseBulkFull}
                onPartialChange={(i, v) => _updatePartial(i, v, true)}
                locked={readOnly}
                accent="slate"
              />

              <UnitDoseSection
                methasoft={data.close_unit_methasoft}
                actual={data.close_unit_actual}
                notes={data.close_unit_notes}
                unitTotalMgs={data.close_unit_total_mgs}
                onMethasoftChange={v => _updateField('close_unit_methasoft', v)}
                onActualChange={v => _updateField('close_unit_actual', v)}
                onNotesChange={v => _updateField('close_unit_notes', v)}
                onUnitTotalMgsChange={v => _updateField('close_unit_total_mgs', v)}
                locked={readOnly}
                accent="slate"
              />

              {/* Dispensed + Waste */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Total Dispensed <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" min="0" value={data.dispensed_amount} onChange={e => _updateField('dispensed_amount', e.target.value === '' ? '' : Number(e.target.value))} className={`w-full rounded-md shadow-sm p-2 border pr-12 ${closeStarted && (data.dispensed_amount === '' || Number(data.dispensed_amount) === 0) ? 'border-red-300' : 'border-gray-300'}`} />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">Mgs</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Waste/Spill</label>
                  <div className="relative mb-2">
                    <input type="number" min="0" value={data.waste_amount} onChange={e => _updateField('waste_amount', e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-md border-gray-300 shadow-sm p-2 border pr-12" />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">Mgs</span>
                  </div>
                  {(Number(data.waste_amount) > 0) && (
                    <div className="space-y-1.5 bg-white p-2 border border-red-200 rounded-md">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={data.waste_printed} onChange={e => _updateField('waste_printed', e.target.checked)} className="h-4 w-4 text-emerald-600 border-gray-300 rounded" />
                        <span className="text-xs text-gray-700">Printed spill/waste paper</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={data.waste_logged} onChange={e => _updateField('waste_logged', e.target.checked)} className="h-4 w-4 text-emerald-600 border-gray-300 rounded" />
                        <span className="text-xs text-gray-700">Recorded in logbook</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-slate-800 text-white p-4 rounded-lg flex flex-col items-center justify-center mb-5">
                <span className="text-xs font-medium text-slate-300 uppercase tracking-widest mb-1">Bulk Total + Unit Mgs Total</span>
                <span className="text-2xl font-bold">{closeGrandTotal.toLocaleString()} Mgs</span>
              </div>

              {/* Pharmacist question */}
              <div className={`p-3 rounded-lg border flex items-center justify-between mb-5 ${!data.pharmacist_pouring && closeStarted ? 'bg-red-50 border-red-200' : 'bg-slate-100 border-slate-200'}`}>
                <span className="font-medium text-gray-700 text-sm">Pharmacist still pouring at close? <span className="text-red-500">*</span></span>
                <div className="flex space-x-4">
                  {['Y', 'N'].map(val => (
                    <label key={val} className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="radio" name="pharmacist" value={val} checked={data.pharmacist_pouring === val} onChange={() => _updateField('pharmacist_pouring', val)} className="h-4 w-4 text-slate-600 border-gray-300" />
                      <span className="font-bold text-sm">{val}</span>
                    </label>
                  ))}
                </div>
              </div>

              {data.pharmacist_pouring === 'Y' && (
                <div className="mb-5 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                  <strong>Note:</strong> See RPh closing count sheet for final numbers.
                </div>
              )}

              <div className="mb-5">
                <VerifierSelect
                  label="Verified By"
                  value={data.close_verified_by_1}
                  onChange={v => _updateField('close_verified_by_1', v)}
                  excludeValue=""
                  locked={readOnly}
                />
              </div>

              {!readOnly && (
                <div className="flex gap-3">
                  <button onClick={handleSavePDF} className="flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-bold transition-colors shadow-md">
                    <FileDown className="w-5 h-5" /> Save PDF
                  </button>
                  <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold transition-colors shadow-md">
                    <Printer className="w-5 h-5" /> Print
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto mt-6 text-center text-xs text-gray-400">
          NMTS Safe Inventory Daily Count &middot; {data.date}
        </div>
      </div>
    </>
  );
}
