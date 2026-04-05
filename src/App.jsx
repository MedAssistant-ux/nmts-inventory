import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import InventoryForm from './components/InventoryForm';
import HistoryView from './components/HistoryView';
import AuditLog from './components/AuditLog';
import { useDailyCount, fetchDayData } from './hooks/useDailyCount';

function App() {
  const [view, setView] = useState('today'); // 'today' | 'history' | 'view-day'
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewDayData, setViewDayData] = useState(null);
  const [viewDayLoading, setViewDayLoading] = useState(false);
  const [auditUnlocked, setAuditUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingAuditAction, setPendingAuditAction] = useState(null); // 'today' or 'view-day'

  function requestAuditAccess(action) {
    if (auditUnlocked) {
      if (action === 'today') setView('audit-today');
      // view-day audit is shown inline
      return;
    }
    setPendingAuditAction(action);
    setPinInput('');
    setPinError(false);
    setShowPinPrompt(true);
  }

  function submitPin() {
    if (pinInput === '1118') {
      setAuditUnlocked(true);
      setShowPinPrompt(false);
      setPinInput('');
      setPinError(false);
      if (pendingAuditAction === 'today') setView('audit-today');
    } else {
      setPinError(true);
    }
  }

  const {
    data, loading, saving, error, usingLocal,
    updateField, updatePartial,
    setCloseBulkFull,
  } = useDailyCount();

  // Load a specific day's data when viewing history
  useEffect(() => {
    if (view === 'view-day' && selectedDate) {
      setViewDayLoading(true);
      fetchDayData(selectedDate).then(dayData => {
        setViewDayData(dayData);
        setViewDayLoading(false);
      }).catch(() => setViewDayLoading(false));
    }
  }, [view, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading today's inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <p className="text-gray-500 text-xs">Check your Supabase URL and anon key in the .env file.</p>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <HistoryView
        onBack={() => setView('today')}
        onViewDay={(date) => {
          setSelectedDate(date);
          setView('view-day');
        }}
      />
    );
  }

  if (view === 'view-day' && selectedDate) {
    return (
      <div className="print:hidden">
        {/* Back bar */}
        <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
          <button onClick={() => setView('history')} className="flex items-center gap-2 text-white hover:text-emerald-300 font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Calendar
          </button>
          <span className="text-slate-300 text-sm">Viewing: <span className="text-white font-semibold">{selectedDate}</span> (read-only)</span>
        </div>

        {viewDayLoading ? (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading {selectedDate}...</p>
            </div>
          </div>
        ) : !viewDayData ? (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">No data found for {selectedDate}.</p>
          </div>
        ) : (
          <>
            <InventoryForm
              data={viewDayData}
              saving={false}
              updateField={() => {}}
              updatePartial={() => {}}
              setCloseBulkFull={() => {}}
              readOnly={true}
            />
            {auditUnlocked && (
              <div className="max-w-7xl mx-auto p-4 md:p-8 pt-0">
                <AuditLog date={selectedDate} />
              </div>
            )}
            {!auditUnlocked && (
              <div className="max-w-7xl mx-auto p-4 md:p-8 pt-0 text-center">
                <button onClick={() => requestAuditAccess('view-day')} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  View Audit Log (PIN Required)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Today's audit log view
  if (view === 'audit-today') {
    const todayDate = data.date || new Date().toISOString().split('T')[0];
    return (
      <div className="print:hidden">
        <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
          <button onClick={() => setView('today')} className="flex items-center gap-2 text-white hover:text-emerald-300 font-semibold transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Form
          </button>
          <span className="text-slate-300 text-sm">Audit Log for: <span className="text-white font-semibold">{todayDate}</span></span>
        </div>
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <AuditLog date={todayDate} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* PIN prompt modal */}
      {showPinPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-1">Audit Log Access</h3>
            <p className="text-gray-500 text-sm mb-4">Enter the access code to view the audit log.</p>
            <input
              type="password"
              value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={e => e.key === 'Enter' && submitPin()}
              placeholder="Enter code"
              autoFocus
              className={`w-full rounded-md shadow-sm p-3 border text-center text-lg tracking-widest font-mono ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:border-emerald-500 focus:ring-emerald-500`}
            />
            {pinError && <p className="text-red-600 text-sm mt-2 text-center">Incorrect code. Try again.</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowPinPrompt(false); setPinInput(''); setPinError(false); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={submitPin} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Local mode banner */}
      {usingLocal && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium print:hidden">
          Running in local mode — data saved to this browser only. Connect Supabase to sync across computers.
        </div>
      )}

      <InventoryForm
        data={data}
        saving={saving}
        updateField={updateField}
        updatePartial={updatePartial}
        setCloseBulkFull={setCloseBulkFull}
        onViewHistory={() => setView('history')}
        onViewAuditLog={() => requestAuditAccess('today')}
      />
    </div>
  );
}

export default App;
