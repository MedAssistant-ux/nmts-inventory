import React from 'react';
import { calcVariance } from '../utils/validation';

const noScroll = e => e.target.blur();
const noArrows = e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); };

export default function UnitDoseSection({
  methasoft, actual, notes, unitTotalMgs,
  onMethasoftChange, onActualChange, onNotesChange, onUnitTotalMgsChange,
  locked, accent = 'emerald'
}) {
  const variance = calcVariance(methasoft, actual);
  const hasVariance = methasoft !== '' && methasoft != null && actual !== '' && actual != null && variance !== 0;

  const ringClass = accent === 'emerald' ? 'focus:border-emerald-500 focus:ring-emerald-500' : 'focus:border-slate-500 focus:ring-slate-500';

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:mb-3 print:p-2 print:shadow-none">
      <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2 print:text-base print:mb-2 print:pb-1">Unit Dose</h4>

      <div className="grid grid-cols-2 gap-4 mb-4 print:gap-2 print:mb-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Methasoft (#) <span className="text-red-500">*</span></label>
          <input
            type="number" min="0" step="1"
            value={methasoft}
            onChange={e => onMethasoftChange(e.target.value === '' ? '' : Number(e.target.value))}
            onWheel={noScroll} onKeyDown={noArrows}
            disabled={locked}
            className={`mt-1 w-full rounded-md border-gray-300 shadow-sm ${ringClass} p-2 border ${locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} print:p-1 print:text-sm`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Actual (#) <span className="text-red-500">*</span></label>
          <input
            type="number" min="0" step="1"
            value={actual}
            onChange={e => onActualChange(e.target.value === '' ? '' : Number(e.target.value))}
            onWheel={noScroll} onKeyDown={noArrows}
            disabled={locked}
            className={`mt-1 w-full rounded-md border-gray-300 shadow-sm ${ringClass} p-2 border ${locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} print:p-1 print:text-sm`}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4 print:mb-2">
        <label className="w-24 text-sm font-medium text-gray-700 print:text-xs">Variance:</label>
        <input
          type="text" readOnly value={variance}
          className={`flex-1 rounded-md shadow-sm p-2 border font-bold cursor-not-allowed print:p-1 print:text-sm ${
            hasVariance ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        />
      </div>

      {hasVariance && (
        <div className="mb-4 bg-amber-50 p-3 border border-amber-200 rounded-md print:mb-2 print:p-2">
          <label className="block text-sm font-bold text-amber-800 mb-1 print:text-xs">Variance Notes (Required)</label>
          <textarea
            rows="2"
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            disabled={locked}
            placeholder="Explain the variance..."
            className={`w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2 border print:p-1 print:text-sm ${locked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>
      )}

      <div className="flex items-center space-x-4 border-t pt-4 print:pt-2">
        <label className="w-32 text-sm font-medium text-gray-700 print:text-xs print:w-24">Unit Total Mgs: <span className="text-red-500">*</span></label>
        <div className="relative flex-1">
          <input
            type="number" min="0"
            value={unitTotalMgs}
            onChange={e => onUnitTotalMgsChange(e.target.value === '' ? '' : Number(e.target.value))}
            onWheel={noScroll} onKeyDown={noArrows}
            disabled={locked}
            className={`w-full rounded-md border-gray-300 shadow-sm ${ringClass} p-2 border pr-12 ${locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} print:p-1 print:text-sm`}
          />
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm print:text-xs">Mgs</span>
        </div>
      </div>
    </div>
  );
}
