import React from 'react';
import { calcBulkTotal } from '../utils/validation';

const noScroll = e => e.target.blur();
const noArrows = e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); };

export default function BulkSection({ bulkFull, partials, onBulkFullChange, onPartialChange, locked, accent = 'emerald' }) {
  const bulkMgs = (Number(bulkFull) || 0) * 10000;
  const bulkTotal = calcBulkTotal(bulkFull, partials);

  const ringClass = accent === 'emerald' ? 'focus:border-emerald-500 focus:ring-emerald-500' : 'focus:border-slate-500 focus:ring-slate-500';
  const totalBg = accent === 'emerald' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-200 border-slate-300';
  const totalText = accent === 'emerald' ? 'text-emerald-900' : 'text-slate-900';
  const totalLabel = accent === 'emerald' ? 'text-emerald-800' : 'text-slate-800';

  function handlePartialChange(idx, rawValue) {
    const value = rawValue === '' ? '' : Number(rawValue);
    if (value !== '' && value > 15000) return; // max 15000 per partial
    onPartialChange(idx, value);
  }

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Methadone Liquid - Bulk</h4>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Bottles (#) <span className="text-red-500">*</span></label>
          <input
            type="number" min="0" step="1"
            value={bulkFull}
            onChange={e => onBulkFullChange(e.target.value === '' ? '' : Number(e.target.value))}
            onWheel={noScroll} onKeyDown={noArrows}
            disabled={locked}
            className={`mt-1 w-full rounded-md border-gray-300 shadow-sm ${ringClass} p-2 border ${locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${bulkFull === '' || bulkFull === 0 ? '' : ''}`}
          />
          {(bulkFull === '' || bulkFull == null) && (
            <p className="text-red-500 text-xs mt-1">Required</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Mgs (# x 10,000)</label>
          <input
            type="text" readOnly
            value={bulkMgs.toLocaleString()}
            className="mt-1 w-full rounded-md border-gray-200 bg-gray-100 shadow-sm text-gray-600 p-2 border cursor-not-allowed font-semibold"
          />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {[1, 2, 3, 4, 5].map((num, idx) => {
          const val = partials[idx];
          const isOver = val !== '' && val != null && Number(val) > 15000;
          return (
            <div key={num} className="flex items-center space-x-3">
              <label className="w-20 text-sm text-gray-600 text-right">Partial {num}:</label>
              <div className="relative flex-1">
                <input
                  type="number" min="0" max="15000"
                  value={val}
                  onChange={e => handlePartialChange(idx, e.target.value)}
                  onWheel={noScroll} onKeyDown={noArrows}
                  disabled={locked}
                  className={`w-full rounded-md shadow-sm ${ringClass} p-2 border pr-12 ${locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${isOver ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-sm">Mgs</span>
              </div>
              {isOver && <span className="text-red-500 text-xs">Max 15,000</span>}
            </div>
          );
        })}
      </div>

      <div className={`${totalBg} p-3 rounded-md flex justify-between items-center border`}>
        <span className={`font-bold ${totalLabel}`}>Total Bulk Mgs:</span>
        <span className={`text-xl font-bold ${totalText}`}>{bulkTotal.toLocaleString()} Mgs</span>
      </div>
    </div>
  );
}
