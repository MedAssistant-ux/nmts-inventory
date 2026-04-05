import React, { useState, useEffect } from 'react';
import { VERIFIERS } from '../utils/validation';
import { Plus } from 'lucide-react';

const CUSTOM_VERIFIERS_KEY = 'nmts_custom_verifiers';

function loadCustomVerifiers() {
  try {
    const raw = localStorage.getItem(CUSTOM_VERIFIERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomVerifiers(list) {
  localStorage.setItem(CUSTOM_VERIFIERS_KEY, JSON.stringify(list));
}

export default function VerifierSelect({ label, value, onChange, excludeValue, locked }) {
  const [customNames, setCustomNames] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setCustomNames(loadCustomVerifiers());
  }, []);

  const allNames = [...VERIFIERS, ...customNames].filter(name => name !== excludeValue);

  function handleAddName() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (VERIFIERS.includes(trimmed) || customNames.includes(trimmed)) return;
    const updated = [...customNames, trimmed];
    setCustomNames(updated);
    saveCustomVerifiers(updated);
    onChange(trimmed);
    setNewName('');
    setShowAddForm(false);
  }

  return (
    <div className="flex flex-col">
      <label className="text-sm font-bold text-gray-600 uppercase mb-2">{label} <span className="text-red-500">*</span></label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={locked}
          className={`block flex-1 pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md shadow-sm border bg-white ${!value ? 'border-red-300' : ''} ${locked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
        >
          <option value="">-- Select Name --</option>
          {allNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {!locked && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
            title="Add new person"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
      {!value && (
        <p className="text-red-500 text-xs mt-1">Required</p>
      )}
      {showAddForm && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddName()}
            placeholder="Full name..."
            className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border text-sm focus:border-emerald-500 focus:ring-emerald-500"
            autoFocus
          />
          <button
            onClick={handleAddName}
            disabled={!newName.trim()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-md text-sm font-medium transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAddForm(false); setNewName(''); }}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
