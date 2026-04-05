import React from 'react';
import { calcBulkTotal, calcVariance } from '../utils/validation';

export default function PrintView({ data, openGrandTotal, closeGrandTotal }) {
  const openBulkMgs = (Number(data.open_bulk_full) || 0) * 10000;
  const closeBulkMgs = (Number(data.close_bulk_full) || 0) * 10000;
  const openBulkTotal = calcBulkTotal(data.open_bulk_full, data.open_partials);
  const closeBulkTotal = calcBulkTotal(data.close_bulk_full, data.close_partials);
  const openVariance = calcVariance(data.open_unit_methasoft, data.open_unit_actual);
  const closeVariance = calcVariance(data.close_unit_methasoft, data.close_unit_actual);
  const op = data.open_partials || [0,0,0,0,0];
  const cp = data.close_partials || [0,0,0,0,0];

  const fmt = (v) => v != null && v !== '' ? Number(v).toLocaleString() : '';

  const cellBase = "border border-gray-800 px-2 py-[3px]";
  const headerCell = `${cellBase} font-semibold`;
  const totalRow = "bg-gray-200";

  return (
    <div className="hidden print:block text-[10.5px] leading-snug text-black" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* ===== LETTERHEAD ===== */}
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-1">
        <div>
          <div className="text-[15px] font-bold tracking-wide text-gray-900">New Mexico Treatment Services LLC</div>
          <div className="text-[9px] tracking-widest text-gray-500 uppercase">Hope Begins Here</div>
        </div>
        <div className="text-right text-[9px] text-gray-600 leading-relaxed">
          <div>1227 N Railroad Ave, Suite C</div>
          <div>Espanola, NM 87532</div>
          <div>(505) 747-8187</div>
        </div>
      </div>

      {/* ===== FORM TITLE ===== */}
      <div className="text-center py-1.5 mb-2">
        <div className="text-[13px] font-bold tracking-wide">Safe Inventory Daily Count</div>
      </div>

      {/* ===== TWO-COLUMN BODY ===== */}
      <div className="flex gap-4">

        {/* ====== LEFT: OPEN ====== */}
        <div className="flex-1 border border-gray-800 rounded-sm overflow-hidden">

          {/* Section header */}
          <div className="bg-gray-800 text-white px-3 py-1.5 flex justify-between items-center">
            <span className="font-bold text-xs tracking-wider">OPEN</span>
            <div className="flex gap-4 text-[9.5px]">
              <span>Date: <span className="font-semibold">{data.date}</span></span>
              <span>Time: <span className="font-semibold">{data.open_time}</span></span>
            </div>
          </div>

          <div className="p-2.5">
            {/* Methadone Liquid */}
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Methadone Liquid</div>
            <table className="w-full border-collapse mb-2.5">
              <thead>
                <tr className="bg-gray-100">
                  <th className={`${cellBase} text-left text-[9px] w-[45%]`}>Item</th>
                  <th className={`${cellBase} text-center text-[9px] w-[20%]`}>#</th>
                  <th className={`${cellBase} text-right text-[9px] w-[35%]`}>Mgs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={headerCell}>Bulk Total (full bottles)</td>
                  <td className={`${cellBase} text-center font-semibold`}>{fmt(data.open_bulk_full)}</td>
                  <td className={`${cellBase} text-right`}>{fmt(openBulkMgs)}</td>
                </tr>
                {[1,2,3,4,5].map((n, i) => (
                  <tr key={n}>
                    <td className={`${cellBase} pl-5 text-gray-700`}>Partial {n}</td>
                    <td className={cellBase}></td>
                    <td className={`${cellBase} text-right`}>{op[i] ? fmt(op[i]) : ''}</td>
                  </tr>
                ))}
                <tr className={totalRow}>
                  <td className={`${cellBase} font-bold`} colSpan="2">Bulk Total</td>
                  <td className={`${cellBase} text-right font-bold`}>{fmt(openBulkTotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* Unit Dose */}
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Unit Dose</div>
            <table className="w-full border-collapse mb-2.5">
              <tbody>
                <tr>
                  <td className={`${cellBase} w-[65%]`}>Unit Totals — Methasoft</td>
                  <td className={`${cellBase} text-right font-semibold`}>{fmt(data.open_unit_methasoft)}</td>
                </tr>
                <tr>
                  <td className={cellBase}>Unit Totals — Actual</td>
                  <td className={`${cellBase} text-right font-semibold`}>{fmt(data.open_unit_actual)}</td>
                </tr>
                <tr className={openVariance !== 0 ? 'bg-amber-50' : ''}>
                  <td className={cellBase}>Variance</td>
                  <td className={`${cellBase} text-right font-bold`}>{openVariance !== 0 ? openVariance : '0'}</td>
                </tr>
                <tr>
                  <td className={cellBase}>Unit Total Mgs</td>
                  <td className={`${cellBase} text-right font-semibold`}>{fmt(data.open_unit_total_mgs)}</td>
                </tr>
              </tbody>
            </table>

            {openVariance !== 0 && data.open_unit_notes && (
              <div className="mb-2 p-1.5 bg-gray-50 border border-gray-300 rounded text-[9px]">
                <span className="font-bold">Variance Notes:</span> {data.open_unit_notes}
              </div>
            )}

            {/* Grand Total */}
            <div className="bg-gray-800 text-white px-3 py-2 rounded flex justify-between items-center mb-3">
              <span className="text-[9px] font-medium uppercase tracking-wider">Bulk + Unit Total</span>
              <span className="text-sm font-bold">{fmt(openGrandTotal)} Mgs</span>
            </div>

            {/* Verified By */}
            <div className="flex items-end gap-2 mt-2">
              <span className="font-bold text-[10px]">Verified By:</span>
              <span className="flex-1 border-b border-black pb-0.5 text-[10px] min-h-[14px]">{data.open_verified_by_1 || ''}</span>
            </div>
          </div>
        </div>

        {/* ====== RIGHT: CLOSE ====== */}
        <div className="flex-1 border border-gray-800 rounded-sm overflow-hidden">

          {/* Section header */}
          <div className="bg-gray-800 text-white px-3 py-1.5 flex justify-between items-center">
            <span className="font-bold text-xs tracking-wider">CLOSE</span>
            <div className="flex gap-4 text-[9.5px]">
              <span>Date: <span className="font-semibold">{data.date}</span></span>
              <span>Time: <span className="font-semibold">{data.close_time}</span></span>
            </div>
          </div>

          <div className="p-2.5">
            {/* Methadone Liquid */}
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Methadone Liquid</div>
            <table className="w-full border-collapse mb-2.5">
              <thead>
                <tr className="bg-gray-100">
                  <th className={`${cellBase} text-left text-[9px] w-[45%]`}>Item</th>
                  <th className={`${cellBase} text-center text-[9px] w-[20%]`}>#</th>
                  <th className={`${cellBase} text-right text-[9px] w-[35%]`}>Mgs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={headerCell}>Bulk Total (full bottles)</td>
                  <td className={`${cellBase} text-center font-semibold`}>{fmt(data.close_bulk_full)}</td>
                  <td className={`${cellBase} text-right`}>{fmt(closeBulkMgs)}</td>
                </tr>
                {[1,2,3,4,5].map((n, i) => (
                  <tr key={n}>
                    <td className={`${cellBase} pl-5 text-gray-700`}>Partial {n}</td>
                    <td className={cellBase}></td>
                    <td className={`${cellBase} text-right`}>{cp[i] ? fmt(cp[i]) : ''}</td>
                  </tr>
                ))}
                <tr className={totalRow}>
                  <td className={`${cellBase} font-bold`} colSpan="2">Bulk Total</td>
                  <td className={`${cellBase} text-right font-bold`}>{fmt(closeBulkTotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* Unit Dose */}
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Unit Dose</div>
            <table className="w-full border-collapse mb-2.5">
              <tbody>
                <tr>
                  <td className={`${cellBase} w-[65%]`}>Unit Totals — Methasoft</td>
                  <td className={`${cellBase} text-right font-semibold`}>{fmt(data.close_unit_methasoft)}</td>
                </tr>
                <tr>
                  <td className={cellBase}>Unit Totals — Actual</td>
                  <td className={`${cellBase} text-right font-semibold`}>{fmt(data.close_unit_actual)}</td>
                </tr>
                <tr className={closeVariance !== 0 ? 'bg-amber-50' : ''}>
                  <td className={cellBase}>Variance</td>
                  <td className={`${cellBase} text-right font-bold`}>{closeVariance !== 0 ? closeVariance : '0'}</td>
                </tr>
                <tr>
                  <td className={cellBase}>Unit Total Mgs</td>
                  <td className={`${cellBase} text-right font-semibold`}>{fmt(data.close_unit_total_mgs)}</td>
                </tr>
              </tbody>
            </table>

            {closeVariance !== 0 && data.close_unit_notes && (
              <div className="mb-2 p-1.5 bg-gray-50 border border-gray-300 rounded text-[9px]">
                <span className="font-bold">Variance Notes:</span> {data.close_unit_notes}
              </div>
            )}

            {/* Dispensed & Waste */}
            <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">Dispensed & Waste</div>
            <table className="w-full border-collapse mb-2.5">
              <tbody>
                <tr>
                  <td className={`${cellBase} w-[65%]`}>Total Amount Dispensed</td>
                  <td className={`${cellBase} text-right font-semibold`}>{fmt(data.dispensed_amount)}</td>
                </tr>
                <tr>
                  <td className={cellBase}>Total Waste/Spills</td>
                  <td className={`${cellBase} text-right font-semibold`}>{fmt(data.waste_amount)}</td>
                </tr>
              </tbody>
            </table>

            {Number(data.waste_amount) > 0 && (
              <div className="mb-2 text-[9px] flex gap-4">
                <span>{data.waste_printed ? '[X]' : '[ ]'} Printed spill/waste paper</span>
                <span>{data.waste_logged ? '[X]' : '[ ]'} Recorded in logbook</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="bg-gray-800 text-white px-3 py-2 rounded flex justify-between items-center mb-2">
              <span className="text-[9px] font-medium uppercase tracking-wider">Bulk + Unit Total</span>
              <span className="text-sm font-bold">{fmt(closeGrandTotal)} Mgs</span>
            </div>

            {/* Pharmacist */}
            <div className="flex items-center justify-between mb-3 text-[9.5px] border border-gray-400 rounded px-2 py-1">
              <span className="font-semibold">At close, is the Pharmacist still pouring?</span>
              <div className="flex gap-3 font-bold">
                <span className={data.pharmacist_pouring === 'Y' ? 'underline' : 'text-gray-400'}>Y</span>
                <span className={data.pharmacist_pouring === 'N' ? 'underline' : 'text-gray-400'}>N</span>
              </div>
            </div>

            {/* Verified By */}
            <div className="flex items-end gap-2 mt-1">
              <span className="font-bold text-[10px]">Verified By:</span>
              <span className="flex-1 border-b border-black pb-0.5 text-[10px] min-h-[14px]">{data.close_verified_by_1 || ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PREPARED BY ===== */}
      <div className="mt-5 pt-3 border-t border-gray-400">
        <div className="flex items-end gap-8">
          <div className="flex items-end gap-2 flex-1">
            <span className="font-bold text-[10px] whitespace-nowrap">Prepared By:</span>
            <span className="flex-1 border-b border-black min-h-[16px]"></span>
          </div>
          <div className="flex items-end gap-2 w-[180px]">
            <span className="font-bold text-[10px]">Date:</span>
            <span className="flex-1 border-b border-black min-h-[16px] text-[10px] pl-1">{data.date}</span>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-3 pt-1.5 border-t border-gray-300 flex justify-between text-[8px] text-gray-400">
        <span>New Mexico Treatment Services LLC &mdash; Safe Inventory Daily Count</span>
        <span>{data.date}</span>
      </div>
    </div>
  );
}
