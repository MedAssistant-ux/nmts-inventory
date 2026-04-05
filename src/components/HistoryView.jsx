import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react';
import { fetchHistory, fetchDatesWithRecords } from '../hooks/useDailyCount';
import { exportToCSV } from '../utils/exportUtils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function todayLocal() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

export default function HistoryView({ onBack, onViewDay }) {
  const today = todayLocal();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-indexed
  const [recordDates, setRecordDates] = useState(new Set());
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDatesWithRecords(), fetchHistory()])
      .then(([dates, records]) => {
        setRecordDates(new Set(dates));
        setAllRecords(records);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Build calendar grid for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day, date: `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`, isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cells.push({ day: d, date, isCurrentMonth: true });
    }
    // Next month padding
    const remaining = 42 - cells.length; // 6 rows
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, date: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, isCurrentMonth: false });
    }
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function goToToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:hidden">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold">
            <ArrowLeft className="w-5 h-5" /> Back to Today
          </button>
          <button
            onClick={() => exportToCSV(allRecords)}
            disabled={allRecords.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-semibold transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <h2 className="text-xl font-bold">Inventory History</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-lg min-w-[180px] text-center">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={goToToday} className="ml-2 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md transition-colors">
                Today
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase py-2">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, i) => {
                  const hasRecord = recordDates.has(cell.date);
                  const isToday = cell.date === today;
                  const isFuture = cell.date > today;

                  return (
                    <button
                      key={i}
                      onClick={() => hasRecord && onViewDay(cell.date)}
                      disabled={!hasRecord || isFuture}
                      className={`
                        relative h-16 rounded-lg text-sm font-medium transition-all
                        flex flex-col items-center justify-center gap-0.5
                        ${!cell.isCurrentMonth ? 'text-gray-300' : ''}
                        ${cell.isCurrentMonth && !hasRecord && !isFuture ? 'text-gray-400' : ''}
                        ${cell.isCurrentMonth && isFuture ? 'text-gray-300' : ''}
                        ${hasRecord && cell.isCurrentMonth ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer border border-emerald-200 shadow-sm' : ''}
                        ${hasRecord && !cell.isCurrentMonth ? 'bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer border border-gray-200' : ''}
                        ${!hasRecord ? 'cursor-default' : ''}
                        ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}
                      `}
                    >
                      <span className={`${isToday ? 'font-bold text-emerald-700' : ''}`}>{cell.day}</span>
                      {hasRecord && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-4 pt-3 border-t text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Has record — click to view
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded ring-2 ring-emerald-500"></span> Today
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
