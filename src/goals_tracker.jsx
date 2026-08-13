import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Save, RefreshCw, Moon, Sun, RotateCcw, GripVertical } from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const STATUSES = ['On Track', 'At Risk', 'Off Track', 'Working on it', 'Not started', 'Done', 'Stuck', 'Rolled forward'];

// Color palette for group headers — works in both light and dark modes
const GROUP_PALETTE = [
  { bg: '#fef2f2', text: '#991b1b', darkBg: 'rgba(153,27,27,0.25)', darkText: '#fca5a5' },   // rose
  { bg: '#fff7ed', text: '#9a3412', darkBg: 'rgba(154,52,18,0.25)', darkText: '#fdba74' },   // orange
  { bg: '#fefce8', text: '#854d0e', darkBg: 'rgba(133,77,14,0.25)', darkText: '#fde047' },   // amber
  { bg: '#f0fdf4', text: '#14532d', darkBg: 'rgba(20,83,45,0.25)',  darkText: '#86efac' },   // green
  { bg: '#f0fdfa', text: '#134e4a', darkBg: 'rgba(19,78,74,0.25)',  darkText: '#5eead4' },   // teal
  { bg: '#eff6ff', text: '#1e3a8a', darkBg: 'rgba(30,58,138,0.25)', darkText: '#93c5fd' },   // blue
  { bg: '#f5f3ff', text: '#4c1d95', darkBg: 'rgba(76,29,149,0.25)', darkText: '#c4b5fd' },   // violet
  { bg: '#fdf4ff', text: '#701a75', darkBg: 'rgba(112,26,117,0.25)', darkText: '#e879f9' },  // fuchsia
  { bg: '#fdf2f8', text: '#831843', darkBg: 'rgba(131,24,67,0.25)', darkText: '#f9a8d4' },   // pink
  { bg: '#ecfeff', text: '#164e63', darkBg: 'rgba(22,78,99,0.25)',  darkText: '#67e8f9' },   // cyan
  { bg: '#f0f9ff', text: '#0c4a6e', darkBg: 'rgba(12,74,110,0.25)', darkText: '#7dd3fc' },   // sky
  { bg: '#eef2ff', text: '#312e81', darkBg: 'rgba(49,46,129,0.25)', darkText: '#a5b4fc' },   // indigo
];

const getGroupColor = (group, allGroups) => {
  const idx = allGroups.indexOf(group);
  return GROUP_PALETTE[(idx >= 0 ? idx : allGroups.length) % GROUP_PALETTE.length];
};

// Storage shim: reads/writes to shared Airtable database via serverless API
const storage = {
  get: async (key) => {
    try {
      const res = await fetch(`/api/data?key=${encodeURIComponent(key)}`);
      const json = await res.json();
      return { value: json.value };
    } catch (e) { return { value: null }; }
  },
  set: async (key, value) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
    } catch (e) {}
  },
};

const getStatusColor = (status) => {
  const map = {
    'On Track': 'bg-blue-100 text-blue-800',
    'Done': 'bg-green-100 text-green-800',
    'Rolled forward': 'bg-yellow-100 text-yellow-800',
    'At Risk': 'bg-orange-100 text-orange-800',
    'Working on it': 'bg-purple-100 text-purple-800',
    'Not started': 'bg-gray-100 text-gray-800',
    'Off Track': 'bg-orange-200 text-orange-900',
    'Stuck': 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-slate-100 text-slate-800';
};

const getCurrentQuarter = () => {
  const m = new Date().getMonth();
  if (m < 3) return 'Q1';
  if (m < 6) return 'Q2';
  if (m < 9) return 'Q3';
  return 'Q4';
};

// ─── SubitemRow ────────────────────────────────────────────────────────────────
const SubitemRow = ({ item, onUpdate, darkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(item);
  useEffect(() => { setFormData(item); }, [item]);

  const inp = `w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`;
  const halfInp = `px-2 py-1 border rounded text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`;

  if (isEditing) return (
    <div className={`p-3 rounded border ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
      <div className="space-y-2">
        <input className={inp} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Sub-item title" />
        <div className="grid grid-cols-2 gap-2">
          <input className={halfInp} value={formData.owner || ''} onChange={e => setFormData({ ...formData, owner: e.target.value })} placeholder="Owner" />
          <select className={halfInp} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <input type="date" className={inp} value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
        <textarea className={inp} value={formData.completionCriteria || ''} onChange={e => setFormData({ ...formData, completionCriteria: e.target.value })} rows="2" placeholder="Completion criteria" />
        <div className="flex gap-2">
          <button onClick={() => { onUpdate(formData); setIsEditing(false); }} className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"><Save size={14} /> Save</button>
          <button onClick={() => { setFormData(item); setIsEditing(false); }} className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-3 rounded text-sm ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Owner: {item.owner || '—'}</p>
          <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
            <span className={`px-2 py-1 rounded ${getStatusColor(item.status)}`}>{item.status || 'TBD'}</span>
            {item.dueDate && <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Due: {item.dueDate}</span>}
          </div>
          {item.completionCriteria && <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.completionCriteria}</p>}
        </div>
        <button onClick={() => setIsEditing(true)} className={`flex-shrink-0 px-2 py-1 text-xs rounded font-medium ${darkMode ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-600 hover:bg-blue-50'}`}>Edit</button>
      </div>
    </div>
  );
};

// ─── GoalRow ───────────────────────────────────────────────────────────────────
const GoalRow = ({ goal, onEditGoal, onDeleteGoal, darkMode, ALL_DRIS, TEAMS }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSubitems, setExpandedSubitems] = useState(false);
  const [formData, setFormData] = useState(goal);
  const [showAddSubitem, setShowAddSubitem] = useState(false);
  const [newSubitem, setNewSubitem] = useState({ title: '', owner: '', status: 'Not started', dueDate: '', completionCriteria: '' });

  const q = goal.quarter || 'Q2';
  const inp = (extra = '') => `${extra} px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`;
  const subInp = `px-2 py-1 border rounded text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`;

  const handleSubitemUpdate = (updatedItem) => {
    const newSubitems = (goal.subitems || []).map(s => s.id === updatedItem.id ? updatedItem : s);
    onEditGoal({ subitems: newSubitems });
  };

  const handleAddSubitem = () => {
    if (!newSubitem.title) return;
    const added = { ...newSubitem, id: `sub_${Date.now()}` };
    onEditGoal({ subitems: [...(goal.subitems || []), added] });
    setNewSubitem({ title: '', owner: '', status: 'Not started', dueDate: '', completionCriteria: '' });
    setShowAddSubitem(false);
    setExpandedSubitems(true);
  };

  if (isEditing) return (
    <div className={`px-6 py-4 ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
      <div className="space-y-4">
        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inp('w-full')} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>DRI</label>
            <input list={`dri-list-${goal.id}`} value={formData.dri || ''} onChange={e => setFormData({ ...formData, dri: e.target.value })} className={inp()} placeholder="Type or select…" />
            <datalist id={`dri-list-${goal.id}`}>
              {(ALL_DRIS || []).map(d => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Team</label>
            <select value={formData.team || ''} onChange={e => setFormData({ ...formData, team: e.target.value })} className={inp()}>
              {(TEAMS || []).filter(t => t !== 'CSM & DCS').map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className={inp()} />
          <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={inp()}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={formData.quarter || 'Q2'} onChange={e => setFormData({ ...formData, quarter: e.target.value })} className={inp()}>
            {QUARTERS.map(q => <option key={q}>{q}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input placeholder={`${formData.quarter || 'Q2'} Baseline`} value={formData.baseline} onChange={e => setFormData({ ...formData, baseline: e.target.value })} className={inp()} />
          <input placeholder={`${formData.quarter || 'Q2'} Target`} value={formData.target} onChange={e => setFormData({ ...formData, target: e.target.value })} className={inp()} />
          <input placeholder="Actual" value={formData.actual} onChange={e => setFormData({ ...formData, actual: e.target.value })} className={inp()} />
        </div>
        <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inp('w-full')} rows="3" placeholder="Notes" />
        <div className="flex gap-2">
          <button onClick={() => { onEditGoal(formData); setIsEditing(false); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><Save size={16} /> Save</button>
          <button onClick={() => setIsEditing(false)} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-300 text-slate-800 hover:bg-slate-400'}`}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`px-6 py-4 transition ${darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{goal.title}</h3>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>DRI: {goal.dri || '—'} • Team: {goal.team || '—'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{q}</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(goal.status)}`}>{goal.status}</span>
          <button onClick={() => setIsEditing(true)} className={`px-3 py-1 text-sm rounded ${darkMode ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-600 hover:bg-blue-50'}`}>Edit</button>
          <button onClick={onDeleteGoal} className={`px-3 py-1 text-sm rounded ${darkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'}`}>Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
        <div><p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Due Date</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{goal.dueDate || '—'}</p></div>
        <div><p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{q} Baseline</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{goal.baseline || '—'}</p></div>
        <div><p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{q} Target</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{goal.target || '—'}</p></div>
        <div><p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Actual</p><p className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{goal.actual || '—'}</p></div>
      </div>

      {goal.notes && (
        <div className={`mt-3 p-3 rounded text-sm ${darkMode ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
          <p className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Notes</p>
          {goal.notes}
        </div>
      )}

      {/* Subitems */}
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          {goal.subitems && goal.subitems.length > 0 ? (
            <button onClick={() => setExpandedSubitems(!expandedSubitems)} className={`flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>
              <ChevronDown size={16} className={`transition-transform ${expandedSubitems ? 'rotate-180' : ''}`} />
              Sub-items ({goal.subitems.length})
            </button>
          ) : (
            <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No sub-items</span>
          )}
          {!showAddSubitem && (
            <button onClick={() => setShowAddSubitem(true)} className={`flex items-center gap-1 text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
              <Plus size={14} /> Add Sub-item
            </button>
          )}
        </div>

        {expandedSubitems && goal.subitems && goal.subitems.length > 0 && (
          <div className={`mt-2 space-y-2 pl-4 border-l-2 ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>
            {goal.subitems.map(item => (
              <SubitemRow key={item.id} item={item} onUpdate={handleSubitemUpdate} darkMode={darkMode} />
            ))}
          </div>
        )}

        {showAddSubitem && (
          <div className={`mt-2 p-3 rounded border ${darkMode ? 'bg-slate-900/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>New Sub-item</p>
            <div className="space-y-2">
              <input placeholder="Sub-item title" value={newSubitem.title} onChange={e => setNewSubitem({ ...newSubitem, title: e.target.value })} className={`w-full ${subInp}`} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Owner" value={newSubitem.owner} onChange={e => setNewSubitem({ ...newSubitem, owner: e.target.value })} className={subInp} />
                <select value={newSubitem.status} onChange={e => setNewSubitem({ ...newSubitem, status: e.target.value })} className={subInp}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <input type="date" value={newSubitem.dueDate} onChange={e => setNewSubitem({ ...newSubitem, dueDate: e.target.value })} className={`w-full ${subInp}`} />
              <textarea placeholder="Completion criteria" value={newSubitem.completionCriteria} onChange={e => setNewSubitem({ ...newSubitem, completionCriteria: e.target.value })} className={`w-full ${subInp}`} rows="2" />
              <div className="flex gap-2">
                <button onClick={handleAddSubitem} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium">Add</button>
                <button onClick={() => { setShowAddSubitem(false); setNewSubitem({ title: '', owner: '', status: 'Not started', dueDate: '', completionCriteria: '' }); }} className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── LoginView ─────────────────────────────────────────────────────────────────
const LoginView = ({ TEAMS, onLogin, darkMode }) => (
  <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
    <div className="w-full max-w-md">
      <div className={`rounded-lg shadow-lg p-8 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Goals Tracker</h1>
        <p className={`mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Select your team to get started</p>
        <div className="space-y-3">
          <button onClick={() => onLogin('Admin')} className={`w-full px-4 py-3 text-left rounded-lg border-2 transition font-medium ${darkMode ? 'border-slate-600 hover:border-red-500 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:border-red-400 hover:bg-red-50 text-slate-700'}`}>📋 Admin (View All)</button>
          <div className={`border-t my-4 ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}></div>
          {TEAMS.map(team => (
            <button key={team} onClick={() => onLogin(team)} className={`w-full px-4 py-3 text-left rounded-lg border-2 transition font-medium ${darkMode ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700'}`}>{team}</button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── DashboardView ─────────────────────────────────────────────────────────────
const DashboardView = ({ currentUser, goals, groupedGoals, expandedGroups, toggleGroup, allExpanded, onExpandAll, onCollapseAll, filterTeam, setFilterTeam, statusFilter, setStatusFilter, groupFilter, setGroupFilter, driFilter, setDriFilter, quarterFilter, setQuarterFilter, showFilters, setShowFilters, darkMode, setDarkMode, refreshing, onRefresh, GOAL_GROUPS, ALL_DRIS, TEAMS, onAddGoal, onEditGoal, onDeleteGoal, onDeleteGroup, onUndo, canUndo, onReorderGroups, onReorderGoals, allGroups, onLogout }) => {
  const [draggingGroup, setDraggingGroup] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [draggingGoalId, setDraggingGoalId] = useState(null);
  const [dragOverGoalId, setDragOverGoalId] = useState(null);

  const toggleStatusFilter = (s) => setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleGroupFilter = (g) => setGroupFilter(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const toggleDriFilter = (d) => setDriFilter(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleQuarterFilter = (q) => setQuarterFilter(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);
  const clearAllFilters = () => { setStatusFilter([]); setGroupFilter([]); setDriFilter([]); setQuarterFilter([]); };
  const activeFilterCount = statusFilter.length + groupFilter.length + driFilter.length + quarterFilter.length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      {/* Header */}
      <div className={`border-b sticky top-0 z-50 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Goals Tracker</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Logged in as <span className="font-semibold">{currentUser}</span></p>
          </div>
          <div className="flex items-center gap-4">
            {currentUser !== 'Admin' && currentUser !== 'CSM & DCS' && (
              <label className={`flex items-center gap-2 text-sm cursor-pointer ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <input type="checkbox" checked={filterTeam} onChange={e => setFilterTeam(e.target.checked)} className="w-4 h-4 rounded" />My team only
              </label>
            )}
            <button onClick={onRefresh} disabled={refreshing} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}><RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /></button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={onUndo} disabled={!canUndo} title="Undo last change" className={`p-2 rounded-lg transition ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''} ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}><RotateCcw size={18} /></button>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded-lg transition font-medium ${hasActiveFilters ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700')}`}>
              {hasActiveFilters ? `Filters (${activeFilterCount})` : 'Filters'}
            </button>
            <button onClick={onAddGoal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"><Plus size={18} /> New Goal</button>
            <button onClick={onLogout} className={`px-4 py-2 rounded-lg transition ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}>Log out</button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className={`max-w-7xl mx-auto px-6 py-4 border-t ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
            {/* Quarter filter row */}
            <div className="mb-5">
              <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Quarter</p>
              <div className="flex gap-2">
                {QUARTERS.map(q => (
                  <button key={q} onClick={() => toggleQuarterFilter(q)} className={`px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition ${quarterFilter.includes(q) ? 'bg-blue-600 border-blue-600 text-white' : (darkMode ? 'border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600')}`}>{q}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Status */}
              <div>
                <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Status</p>
                <div className="space-y-2">
                  {STATUSES.map(status => (
                    <label key={status} className={`flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-white'}`}>
                      <input type="checkbox" checked={statusFilter.includes(status)} onChange={() => toggleStatusFilter(status)} className="w-4 h-4 rounded" />{status}
                    </label>
                  ))}
                </div>
              </div>

              {/* Goal Group */}
              <div>
                <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Goal Group</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {GOAL_GROUPS.map(group => (
                    <label key={group} className={`flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-white'}`}>
                      <input type="checkbox" checked={groupFilter.includes(group)} onChange={() => toggleGroupFilter(group)} className="w-4 h-4 rounded" />{group}
                    </label>
                  ))}
                </div>
              </div>

              {/* DRI */}
              <div>
                <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>DRI</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <label className={`flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-white'}`}>
                    <input type="checkbox" checked={driFilter.includes('Blank')} onChange={() => toggleDriFilter('Blank')} className="w-4 h-4 rounded" /><span className="italic">Blank (No DRI)</span>
                  </label>
                  {ALL_DRIS.map(dri => (
                    <label key={dri} className={`flex items-center gap-2 text-sm cursor-pointer px-2 py-1 rounded ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-white'}`}>
                      <input type="checkbox" checked={driFilter.includes(dri)} onChange={() => toggleDriFilter(dri)} className="w-4 h-4 rounded" />{dri}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-between mt-4 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{goals.length} goal{goals.length !== 1 ? 's' : ''} shown</span>
              {hasActiveFilters && <button onClick={clearAllFilters} className="text-sm text-blue-500 hover:text-blue-400 font-medium">Clear all filters</button>}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {goals.length === 0 ? (
          <div className={`text-center py-12 rounded-lg border-2 border-dashed ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`}>
            <p className={`mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>No goals match your filters</p>
            <button onClick={clearAllFilters} className="text-blue-500 hover:text-blue-400 font-medium">Clear all filters</button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={allExpanded ? onCollapseAll : onExpandAll} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
            <div className="space-y-4">
              {groupedGoals.map(([group, groupGoals]) => {
                const groupColor = getGroupColor(group, allGroups || GOAL_GROUPS);
                const isGroupDragging = draggingGroup === group;
                const isGroupDragOver = dragOverGroup === group && draggingGroup !== group;
                return (
                  <div key={group} className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                    style={{ opacity: isGroupDragging ? 0.5 : 1 }}>
                    {/* Group header — draggable */}
                    <div
                      className="flex items-center"
                      draggable
                      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDraggingGroup(group); }}
                      onDragEnd={() => { setDraggingGroup(null); setDragOverGroup(null); }}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverGroup(group); }}
                      onDrop={e => { e.preventDefault(); e.stopPropagation(); if (draggingGroup && draggingGroup !== group) onReorderGroups(draggingGroup, group); setDraggingGroup(null); setDragOverGroup(null); }}
                      style={{
                        backgroundColor: darkMode ? groupColor.darkBg : groupColor.bg,
                        outline: isGroupDragOver ? '2px solid #3b82f6' : 'none',
                        outlineOffset: '-2px',
                      }}
                    >
                      <div className="pl-3 pr-1 py-4 flex items-center cursor-grab" style={{ color: darkMode ? groupColor.darkText : groupColor.text, opacity: 0.6 }}>
                        <GripVertical size={16} />
                      </div>
                      <button onClick={() => toggleGroup(group)} className="flex-1 px-3 py-4 flex items-center justify-between transition">
                        <h2 className="text-lg font-semibold" style={{ color: darkMode ? groupColor.darkText : groupColor.text }}>{group}</h2>
                        <ChevronDown size={20} className={`transition-transform ${expandedGroups[group] ? 'rotate-180' : ''}`} style={{ color: darkMode ? groupColor.darkText : groupColor.text, opacity: 0.7 }} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete all ${groupGoals.length} goal${groupGoals.length !== 1 ? 's' : ''} in "${group}"? This cannot be undone.`)) onDeleteGroup(group); }}
                        className={`px-4 py-4 text-sm font-medium transition ${darkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-400 hover:bg-red-50'}`}
                        title="Delete group"
                      >Delete</button>
                    </div>
                    {expandedGroups[group] && (
                      <div className={`border-t divide-y ${darkMode ? 'border-slate-700 divide-slate-700' : 'border-slate-200 divide-slate-200'}`}>
                        {groupGoals.map(goal => {
                          const gid = String(goal.id);
                          const isGoalDragging = draggingGoalId === gid;
                          const isGoalDragOver = dragOverGoalId === gid && draggingGoalId !== gid;
                          return (
                            <div
                              key={goal.id}
                              draggable
                              onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDraggingGoalId(gid); }}
                              onDragEnd={() => { setDraggingGoalId(null); setDragOverGoalId(null); }}
                              onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverGoalId(gid); }}
                              onDrop={e => { e.preventDefault(); e.stopPropagation(); if (draggingGoalId && draggingGoalId !== gid) onReorderGoals(draggingGoalId, gid); setDraggingGoalId(null); setDragOverGoalId(null); }}
                              style={{
                                opacity: isGoalDragging ? 0.4 : 1,
                                outline: isGoalDragOver ? '2px solid #3b82f6' : 'none',
                                outlineOffset: '-2px',
                              }}
                            >
                              <GoalRow goal={goal} onEditGoal={data => onEditGoal(goal.id, data)} onDeleteGoal={() => onDeleteGoal(goal.id)} darkMode={darkMode} ALL_DRIS={ALL_DRIS} TEAMS={TEAMS} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── FormView ──────────────────────────────────────────────────────────────────
const FormView = ({ TEAMS, GOAL_GROUPS, ALL_DRIS, onSubmit, onBack, darkMode, onAddCategory }) => {
  const defaultQ = getCurrentQuarter();
  const [formData, setFormData] = useState({ title: '', group: GOAL_GROUPS[0], dri: '', team: TEAMS[0], status: 'On Track', dueDate: '', baseline: '', target: '', actual: '', notes: '', quarter: defaultQ, subitems: [] });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [subitems, setSubitems] = useState([]);
  const [showSubitemForm, setShowSubitemForm] = useState(false);
  const [currentSubitem, setCurrentSubitem] = useState({ title: '', owner: '', status: 'Not started', dueDate: '', completionCriteria: '' });

  const inp = `w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`;

  const handleAddSubitem = () => {
    if (!currentSubitem.title) return;
    setSubitems([...subitems, { ...currentSubitem, id: `temp_${Date.now()}` }]);
    setCurrentSubitem({ title: '', owner: '', status: 'Not started', dueDate: '', completionCriteria: '' });
    setShowSubitemForm(false);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) { alert('Please enter a goal title.'); return; }
    const finalData = { ...formData, subitems };
    if (showNewCategory && newCategory) { finalData.group = newCategory; if (onAddCategory) onAddCategory(newCategory); }
    onSubmit(finalData);
  };

  const q = formData.quarter || defaultQ;

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 text-blue-500 hover:text-blue-400 font-medium">← Back</button>
        <div className={`rounded-lg shadow-lg p-8 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Add New Goal</h1>
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Goal Title *</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inp} />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Goal Group *</label>
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <select required value={formData.group} onChange={e => setFormData({ ...formData, group: e.target.value })} className={`flex-1 px-4 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
                    {GOAL_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowNewCategory(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">+ New</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name..." className={`flex-1 px-4 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`} />
                  <button type="button" onClick={() => { setShowNewCategory(false); setNewCategory(''); }} className={`px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>Cancel</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>DRI</label>
                <input list="dri-list-form" value={formData.dri} onChange={e => setFormData({ ...formData, dri: e.target.value })} className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`} placeholder="Type or select…" />
                <datalist id="dri-list-form">
                  {ALL_DRIS.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Team *</label>
                <select required value={formData.team} onChange={e => setFormData({ ...formData, team: e.target.value })} className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
                  {TEAMS.filter(t => t !== 'CSM & DCS').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Status *</label>
                <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Quarter *</label>
                <select required value={formData.quarter} onChange={e => setFormData({ ...formData, quarter: e.target.value })} className={`w-full px-4 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
                  {QUARTERS.map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Due Date</label>
              <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className={inp} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{q} Baseline</label>
                <input type="text" value={formData.baseline} onChange={e => setFormData({ ...formData, baseline: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{q} Target</label>
                <input type="text" value={formData.target} onChange={e => setFormData({ ...formData, target: e.target.value })} className={inp} />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Actual</label>
                <input type="text" value={formData.actual} onChange={e => setFormData({ ...formData, actual: e.target.value })} className={inp} />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inp} rows="4" />
            </div>

            {/* Sub-items */}
            <div className={`border-t pt-6 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <label className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sub-items (optional)</label>
                {!showSubitemForm && (
                  <button type="button" onClick={() => setShowSubitemForm(true)} className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-400 font-medium"><Plus size={16} /> Add Sub-item</button>
                )}
              </div>
              {subitems.length > 0 && (
                <div className="space-y-2 mb-4">
                  {subitems.map(item => (
                    <div key={item.id} className={`p-3 rounded text-sm flex items-start justify-between ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                      <div className="flex-1">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Owner: {item.owner || '—'} • Status: {item.status}</p>
                      </div>
                      <button type="button" onClick={() => setSubitems(subitems.filter(s => s.id !== item.id))} className="text-red-500 hover:text-red-400 text-xs font-medium">Remove</button>
                    </div>
                  ))}
                </div>
              )}
              {showSubitemForm && (
                <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                  <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>New Sub-item</p>
                  <div className="space-y-3">
                    <input type="text" placeholder="Sub-item title" value={currentSubitem.title} onChange={e => setCurrentSubitem({ ...currentSubitem, title: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Owner" value={currentSubitem.owner} onChange={e => setCurrentSubitem({ ...currentSubitem, owner: e.target.value })} className={`px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`} />
                      <select value={currentSubitem.status} onChange={e => setCurrentSubitem({ ...currentSubitem, status: e.target.value })} className={`px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <input type="date" value={currentSubitem.dueDate} onChange={e => setCurrentSubitem({ ...currentSubitem, dueDate: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`} />
                    <textarea placeholder="Completion criteria" value={currentSubitem.completionCriteria} onChange={e => setCurrentSubitem({ ...currentSubitem, completionCriteria: e.target.value })} className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300'}`} rows="2" />
                    <div className="flex gap-2">
                      <button type="button" onClick={handleAddSubitem} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Add Sub-item</button>
                      <button type="button" onClick={() => setShowSubitemForm(false)} className={`px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={handleSubmit} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Create Goal</button>
              <button type="button" onClick={onBack} className={`flex-1 px-6 py-3 rounded-lg font-semibold ${darkMode ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const GoalsTracker = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [goals, setGoals] = useState([]);
  const [filterTeam, setFilterTeam] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [statusFilter, setStatusFilter] = useState([]);
  const [groupFilter, setGroupFilter] = useState([]);
  const [driFilter, setDriFilter] = useState([]);
  const [quarterFilter, setQuarterFilter] = useState([getCurrentQuarter()]);
  const [showFilters, setShowFilters] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [groupOrder, setGroupOrder] = useState([]);
  const historyRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  const TEAMS = ['Professional Services', 'Product', 'Support', 'Renewals', 'Strategy & Ops', 'CSM', 'DCS', 'CSM & DCS'];
  const GOAL_GROUPS = ['Big 6: Frictionless Product Experience', 'Big 6: Customer Effort Reduction', 'Big 6: Critical Path to ROI', 'BU: Market Pods', 'Functional: AI Enablement & Productivity', 'Functional: Que Adoption', 'Functional: DCS', 'Functional: Renewals', 'Functional: Strategy & Operations', 'Functional: Global Support', 'Functional: Professional Services', 'Functional: OC Services'];
  const ALL_DRIS = ["Alana Nolan", "Amy LaPorta", "Ankan Jain", "Anthony Cruz", "CSM Leadership", "Chris Parkes", "Chris Parkes, Kimberly O'Donnell", "Clare C, Liz R", "Courtney", "Courtney Hauser", "Doug Swensen", "James Rischar", "Kari Ardalan", "Kartik Yegneshwar", "Kellie Capote", "Kelsey Rossbach", "Kristi Lewison, Amit Motwani", "Liz Ragland", "Mango", "Mango/Product", "Matt Canzoneri", "Megan Dodds", "Patrick Nash", "Patrick Nash / Courtney Hauser", "Saber Singh", "Sabrina", "Stephanie Sell", "Stephen Minto", "Torvic Vardamis"];

  const getDefaultGoals = () => {
    const q2Goals = [
      { id: 1, quarter: 'Q2', title: "Customer Love % Shipped (by BU)", group: "Big 6: Frictionless Product Experience", dri: "Mango", team: "Product", status: "Working on it", dueDate: "2026-06-30", baseline: "90%", target: "90%", actual: "", notes: "", subitems: [] },
      { id: 2, quarter: 'Q2', title: "Customer Effort Score", group: "Big 6: Frictionless Product Experience", dri: "Kellie Capote", team: "Strategy & Ops", status: "On Track", dueDate: "2026-06-30", baseline: "4", target: "4", actual: "", notes: "", subitems: [] },
      { id: 3, quarter: 'Q2', title: "Key Functionality Enhancements by Product", group: "Big 6: Frictionless Product Experience", dri: "Mango/Product", team: "Product", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "", actual: "", notes: "", subitems: [
        { id: "3-1", quarter: 'Q2', title: "CG: International giving configuration", owner: "Lily Ickow", status: "Not started", dueDate: "2026-06-30", completionCriteria: "Reconfiguring international giving in response to early customer feedback, preempting larger issues when implemented on broader scale across customer base" },
        { id: "3-2", quarter: 'Q2', title: "CG: Launch streamlined Review workflows", owner: "Matthew Bostwick", status: "On Track", dueDate: "2026-05-29", completionCriteria: "Simplifying workflows improvs usability and reduces support burden on customer admins" },
        { id: "3-3", quarter: 'Q2', title: "Apricot: Interface enhancements", owner: "Tully Moorhead", status: "Rolled forward", dueDate: "2026-06-30", completionCriteria: "Responsive to long-time, high volume customer requests" },
        { id: "3-4", quarter: 'Q2', title: "EA: Contact record de-duplication", owner: "Russ Jenkins", status: "At Risk", dueDate: "2026-06-16", completionCriteria: "Addresses a key pain point within data management" },
        { id: "3-5", quarter: 'Q2', title: "NFG: Automated journeys", owner: "Russ Jenkins", status: "Rolled forward", dueDate: "2026-06-30", completionCriteria: "Closes a competitive gap and responds to frequent customer request" },
        { id: "3-6", quarter: 'Q2', title: "DD: Magic login", owner: "Kasey Cuppoletti", status: "On Track", dueDate: "2026-04-30", completionCriteria: "Fast follow to login with one-time code for DD mobile app (adopted by >80% of users)" },
        { id: "3-7", quarter: 'Q2', title: "OC: Tap for iOS", owner: "Kasey Cuppoletti", status: "On Track", dueDate: "2026-06-30", completionCriteria: "Drives usage-based revenue while improving the overall guest experience at in-person events with faster payments and donations; frequent customer request" },
      ]},
      { id: 4, quarter: 'Q2', title: "Support queue: Roll out CSAT Follow Up process for negative responses", group: "Big 6: Customer Effort Reduction", dri: "Doug Swensen", team: "Support", status: "On Track", dueDate: "2026-06-30", baseline: "85%", target: "86%", actual: "", notes: "target CSAT for Support Queue", subitems: [] },
      { id: 5, quarter: 'Q2', title: "CX queue: Simplify intake form, improve categorization/routing, AI agents in the loop", group: "Big 6: Customer Effort Reduction", dri: "Matt Canzoneri", team: "Strategy & Ops", status: "On Track", dueDate: "2026-06-30", baseline: "68", target: "40", actual: "", notes: "target CSAT for CX Queue", subitems: [] },
      { id: 6, quarter: 'Q2', title: "Cross-training & shadowing- manage offshore team onboarding without increasing AHT", group: "Big 6: Customer Effort Reduction", dri: "Doug Swensen", team: "Support", status: "On Track", dueDate: "2026-06-30", baseline: "80.1", target: "79", actual: "", notes: "AHT- Support (combined across all products except Deed, OC, CC (?) )", subitems: [] },
      { id: 7, quarter: 'Q2', title: "Deploy Maven across all products to reduce tickets in Support queue", group: "Big 6: Customer Effort Reduction", dri: "Doug Swensen", team: "Support", status: "On Track", dueDate: "2026-06-30", baseline: "9.6%", target: "26%", actual: "", notes: "% ticket reduction- Support.  Initiate deflection for products w/o chat or email. Expand scope of deflection for chatbot users (add email deflection)", subitems: [] },
      { id: 8, quarter: 'Q2', title: "Deploy Maven & other self-service (?) options to reduce tickets in CX queue", group: "Big 6: Customer Effort Reduction", dri: "Matt Canzoneri", team: "Strategy & Ops", status: "On Track", dueDate: "2026-06-30", baseline: "Baseline", target: "Baseline", actual: "", notes: "% ticket reduction- CX Queue", subitems: [] },
      { id: 9, quarter: 'Q2', title: "Gold: Success Plan Coverage", group: "Big 6: Critical Path to ROI", dri: "CSM Leadership", team: "CSM", status: "At Risk", dueDate: "2026-06-30", baseline: "", target: "80%", actual: "", notes: "", subitems: [] },
      { id: 10, quarter: 'Q2', title: "Silver: Success Plan Coverage", group: "Big 6: Critical Path to ROI", dri: "CSM Leadership", team: "CSM", status: "At Risk", dueDate: "2026-06-30", baseline: "", target: "60%", actual: "", notes: "", subitems: [] },
      { id: 11, quarter: 'Q2', title: "Gold & Silver: Executive Sponsor Program", group: "Big 6: Critical Path to ROI", dri: "Courtney", team: "CSM", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "", actual: "", notes: "", subitems: [
        { id: "11-1", quarter: 'Q2', title: "Critical Path Gold Account Sponsors Assigned and Enabled", owner: "Courtney Hauser", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "11-2", quarter: 'Q2', title: "Critical Path Silver Account Sponsors Assigned and Enabled", owner: "Courtney Hauser", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "11-3", quarter: 'Q2', title: "Exec Sponsor initial outreach", owner: "Courtney Hauser", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "11-4", quarter: 'Q2', title: "Bronze: AI Automated CSM CTAs and risk playbooks", owner: "Courtney H, Matt C", status: "Rolled forward", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "11-5", quarter: 'Q2', title: "Bronze & Iron: NFG Automated ROI", owner: "Matt Canzoneri", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
      ]},
      { id: 12, quarter: 'Q2', title: "FS: Improve NFG Onboarding On-Time Graduation", group: "BU: Market Pods", dri: "Clare C, Liz R", team: "CSM", status: "Working on it", dueDate: "2026-06-30", baseline: "55%", target: "65%", actual: "", notes: "", subitems: [
        { id: "12-1", quarter: 'Q2', title: "Operationalize 1:1 onboarding process as new baseline", owner: "Clare Connor", status: "Working on it", dueDate: "", completionCriteria: "" },
        { id: "12-2", quarter: 'Q2', title: "Fully incorporate Que into onboarding process", owner: "Russ Jenkins", status: "Working on it", dueDate: "", completionCriteria: "" },
        { id: "12-3", quarter: 'Q2', title: "Exit Q with plan to pilot 30-day onboarding experience in Q3", owner: "Liz Ragland", status: "Working on it", dueDate: "", completionCriteria: "" },
        { id: "12-4", quarter: 'Q2', title: "FS: NFG ROI - Deliver Fundraising Actionable Insights", owner: "Liz R, Liisa F", status: "Working on it", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "12-5", quarter: 'Q2', title: "CSR: Deed Migration Targets", owner: "Octavia Gibson", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "12-6", quarter: 'Q2', title: "CSR: Life Sciences Success Plans", owner: "Octavia Gibson", status: "Not started", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "12-7", quarter: 'Q2', title: "CM: Impact Hub - Orgs with Data Standards", owner: "Sabrina", status: "Working on it", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "12-8", quarter: 'Q2', title: "Design and Execute Digital CS adoption plan for Impact Hub and Data Standards (targeting Gold/Silver Ent accounts)", owner: "Sabrina, Courtney", status: "Working on it", dueDate: "", completionCriteria: "" },
      ]},
      { id: 13, quarter: 'Q2', title: "QBR/EBR avg prep time per account", group: "Functional: AI Enablement & Productivity", dri: "Matt Canzoneri", team: "Strategy & Ops", status: "Working on it", dueDate: "2026-06-30", baseline: "4 hr", target: "1.5 hr (EA)", actual: "", notes: "", subitems: [] },
      { id: 14, quarter: 'Q2', title: "PS Technical Services- hrs per account implementation (CSR)", group: "Functional: AI Enablement & Productivity", dri: "Chris Parkes", team: "Professional Services", status: "Working on it", dueDate: "2026-06-30", baseline: "124 hr", target: "", actual: "", notes: "EOY 100 hr (20% reduction) north star", subitems: [] },
      { id: 15, quarter: 'Q2', title: "(TBD actions aimed at ticket reduction- Support Queue)", group: "Functional: AI Enablement & Productivity", dri: "Doug Swensen", team: "Support", status: "On Track", dueDate: "2026-06-30", baseline: "10.4%", target: "26%", actual: "", notes: "ticket reduction in Support queue", subitems: [] },
      { id: 16, quarter: 'Q2', title: "TBD actions aimed at ticket reduction- CX Queue)", group: "Functional: AI Enablement & Productivity", dri: "Matt Canzoneri", team: "Strategy & Ops", status: "On Track", dueDate: "2026-06-30", baseline: "Baseline", target: "Baseline", actual: "", notes: "ticket reduction in CX queue", subitems: [] },
      { id: 17, quarter: 'Q2', title: "Maven CoPilot response accuracy", group: "Functional: AI Enablement & Productivity", dri: "Matt Canzoneri", team: "Strategy & Ops", status: "Working on it", dueDate: "2026-06-30", baseline: "-", target: "90%", actual: "", notes: "", subitems: [] },
      { id: 18, quarter: 'Q2', title: "% of CS org using Claude in weekly workflows", group: "Functional: AI Enablement & Productivity", dri: "Matt Canzoneri", team: "Strategy & Ops", status: "Working on it", dueDate: "2026-06-30", baseline: "-", target: "70%", actual: "", notes: "", subitems: [] },
      { id: 19, quarter: 'Q2', title: "CS aggregate AI Adoption score (Pulse Survey)", group: "Functional: AI Enablement & Productivity", dri: "Matt Canzoneri", team: "Strategy & Ops", status: "Working on it", dueDate: "2026-06-30", baseline: "7.6", target: "7.8", actual: "", notes: "Corporate EOY target: 7.9", subitems: [] },
      { id: 20, quarter: 'Q2', title: "Renewal rep capacity increase (via reduction in time required per digital touch renewal)", group: "Functional: AI Enablement & Productivity", dri: "Patrick Nash", team: "Renewals", status: "Not started", dueDate: "2026-06-30", baseline: "8%", target: "18%", actual: "", notes: "", subitems: [] },
      { id: 21, quarter: 'Q2', title: "PS | Implement n8n pilot project- welcome emails", group: "Functional: AI Enablement & Productivity", dri: "Torvic Vardamis", team: "Professional Services", status: "Working on it", dueDate: "2026-06-30", baseline: "", target: "Pilot Complete", actual: "", notes: "Implement N8N for automating welcome emails as a pilot project", subitems: [] },
      { id: 22, quarter: 'Q2', title: "CS contributions to attainment of PQA milestones", group: "Functional: Que Adoption", dri: "Courtney Hauser", team: "CSM", status: "Working on it", dueDate: "2026-06-30", baseline: "-", target: "TBD", actual: "", notes: "", subitems: [] },
      { id: 23, quarter: 'Q2', title: "Gold: CSM calls w/documented Que touchpoint", group: "Functional: Que Adoption", dri: "Anthony Cruz", team: "CSM", status: "At Risk", dueDate: "2026-06-30", baseline: "-", target: "100%", actual: "", notes: "% of EA Gold CSM calls w/documented Que touchpoint", subitems: [] },
      { id: 24, quarter: 'Q2', title: "Silver: CSM calls w/documented Que touchpoint", group: "Functional: Que Adoption", dri: "Anthony Cruz", team: "CSM", status: "At Risk", dueDate: "2026-06-30", baseline: "-", target: "70%", actual: "", notes: "% of EA Silver CSM calls w/documented Que touchpoint", subitems: [] },
      { id: 25, quarter: 'Q2', title: "Bronze: CSM calls w/documented Que touchpoint", group: "Functional: Que Adoption", dri: "Anthony Cruz", team: "CSM", status: "At Risk", dueDate: "2026-06-30", baseline: "-", target: "50%", actual: "", notes: "% of EA Bronze CSM calls w/documented Que touchpoint", subitems: [] },
      { id: 26, quarter: 'Q2', title: "EA Role-based Personalization Campaigns for Que", group: "Functional: Que Adoption", dri: "Liz Ragland", team: "DCS", status: "Not started", dueDate: "2026-06-30", baseline: "", target: ">80% enrollment", actual: "", notes: "", subitems: [] },
      { id: 27, quarter: 'Q2', title: "EA accounts attending a 1:M Que event (Skills Lab, etc)", group: "Functional: Que Adoption", dri: "Liz Ragland", team: "DCS", status: "On Track", dueDate: "2026-06-30", baseline: "150", target: "195", actual: "", notes: "", subitems: [] },
      { id: 28, quarter: 'Q2', title: "NFG accounts attending a 1:M Que event (Skills Lab, etc)", group: "Functional: Que Adoption", dri: "Liz Ragland", team: "DCS", status: "On Track", dueDate: "2026-06-30", baseline: "208", target: "268", actual: "", notes: "", subitems: [] },
      { id: 29, quarter: 'Q2', title: "Placeholder: Apricot Que Skills TAC (dependent on general release)", group: "Functional: Que Adoption", dri: "Sabrina", team: "DCS", status: "Rolled forward", dueDate: "", baseline: "", target: "25% of attendees use at least one Que skill within 7 days of the event", actual: "", notes: "", subitems: [] },
      { id: 30, quarter: 'Q2', title: "NFG Bonterra Central Activation", group: "Functional: DCS", dri: "Liz Ragland", team: "DCS", status: "At Risk", dueDate: "2026-06-30", baseline: "", target: "1600 Active Users", actual: "", notes: "10% of users active in community", subitems: [] },
      { id: 31, quarter: 'Q2', title: "Apricot Bonterra Central Activation", group: "Functional: DCS", dri: "Sabrina", team: "DCS", status: "At Risk", dueDate: "2026-06-30", baseline: "", target: "4100 Active Users", actual: "", notes: "10% of users active in community", subitems: [] },
      { id: 32, quarter: 'Q2', title: "Apricot Digital Onboarding Journey Adoption", group: "Functional: DCS", dri: "Sabrina", team: "DCS", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "Baseline Feature Activation Rate of enrolled vs. non-enrolled customers", actual: "", notes: "Baseline Feature Activation Rate of enrolled vs. non-enrolled customers", subitems: [] },
      { id: 33, quarter: 'Q2', title: "Drive High CAB Session Attendance", group: "Functional: DCS", dri: "Megan Dodds", team: "DCS", status: "At Risk", dueDate: "2026-06-30", baseline: "", target: "75% attendance", actual: "", notes: "", subitems: [] },
      { id: 34, quarter: 'Q2', title: "OneCause Renewal Centralization", group: "Functional: Renewals", dri: "Patrick Nash", team: "Renewals", status: "At Risk", dueDate: "2026-06-30", baseline: "0%", target: "100%", actual: "", notes: "Learn and start all OneCause renewals 120 days + from June 30th onward", subitems: [] },
      { id: 35, quarter: 'Q2', title: "RENA Enhancements (NFG)", group: "Functional: Renewals", dri: "Stephanie Sell", team: "Renewals", status: "On Track", dueDate: "2026-06-30", baseline: "NFG Renewals Kickoff", target: "Finalize 40% of renewals started", actual: "", notes: "Improve RENA's capabilities to allow for more scale within the team", subitems: [] },
      { id: 36, quarter: 'Q2', title: "Forecast Design", group: "Functional: Renewals", dri: "Patrick Nash", team: "Renewals", status: "Working on it", dueDate: "2026-05-29", baseline: "0%", target: "100%", actual: "", notes: "Design a scalable framework for forecasting future and in quarter renewals.", subitems: [] },
      { id: 37, quarter: 'Q2', title: "Deed Top 25 Framework", group: "Functional: Renewals", dri: "Patrick Nash", team: "Renewals", status: "Not started", dueDate: "2026-04-30", baseline: "0 customers", target: "25 customers", actual: "", notes: "Framework for coordinated effort into managing the top 25 Deed customers", subitems: [] },
      { id: 38, quarter: 'Q2', title: "Ballmer Save Play Expansion", group: "Functional: Renewals", dri: "Patrick Nash", team: "Renewals", status: "On Track", dueDate: "2026-05-15", baseline: "40% of Revenue", target: "70% of revenue", actual: "", notes: "Create better ways to save clients that are leaving after the conclusion of the ballmer program grant, improving GRR in the CM BU.", subitems: [] },
      { id: 39, quarter: 'Q2', title: "Renewal Operating System", group: "Functional: Renewals", dri: "Patrick Nash / Courtney Hauser", team: "Renewals", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "100%", actual: "", notes: "", subitems: [
        { id: "39-1", quarter: 'Q2', title: "Critical Path account plans", owner: "Courtney Hauser", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "39-2", quarter: 'Q2', title: "Critical Path red/yellow mitigation plans", owner: "Courtney Hauser", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "39-3", quarter: 'Q2', title: "Forecasting meeting participation & operating rhythm", owner: "Patrick Nash", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "39-4", quarter: 'Q2', title: "Automate \"Retention Forecasting & Reporting\" tool", owner: "Patrick Nash", status: "Not started", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "39-5", quarter: 'Q2', title: "Establish retention reporting cadence", owner: "Patrick Nash", status: "Not started", dueDate: "2026-06-30", completionCriteria: "" },
      ]},
      { id: 40, quarter: 'Q2', title: "Support Ops", group: "Functional: Strategy & Operations", dri: "Matt Canzoneri", team: "Strategy & Ops", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "", actual: "", notes: "", subitems: [
        { id: "40-1", quarter: 'Q2', title: "Zendesk Migration Complete (Tier 1 Apricot, ETO, Penelope, NFG, GG, Grantmaker, Impact Hub, NPO Hub)", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-2", quarter: 'Q2', title: "Copilot for Internal Agents + End User Chat Widget Live", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-3", quarter: 'Q2', title: "QA Audit AI (Launched for Tier 1 Teams in Zendesk + Contact Center)", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-4", quarter: 'Q2', title: "PS Ops", owner: "Carmen Gattis", status: "Working on it", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "40-5", quarter: 'Q2', title: "Replace Certinia-Jira Connector with n8n", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-6", quarter: 'Q2', title: "Introduce Time-Tracking by Task", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-7", quarter: 'Q2', title: "Certinia Project Creation Automation (CM + FS ASC SKUs)", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-8", quarter: 'Q2', title: "Project Health Dashboard", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-9", quarter: 'Q2', title: "Pipeline Forecasting & Capacity Model", owner: "", status: "Rolled forward", dueDate: "", completionCriteria: "" },
        { id: "40-10", quarter: 'Q2', title: "Data Migration Automation (Internal for CG & others; Flatfile for EA self service)", owner: "", status: "At Risk", dueDate: "", completionCriteria: "" },
        { id: "40-11", quarter: 'Q2', title: "CSM Ops", owner: "Matt Canzoneri", status: "On Track", dueDate: "2026-06-30", completionCriteria: "" },
        { id: "40-12", quarter: 'Q2', title: "Automate EA EBRs via Matik", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-13", quarter: 'Q2', title: "Score Modernization (inc. Maturity, Que Skills + Product Data Reliance)", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-14", quarter: 'Q2', title: "Success Plan Improvements (Knowledge Transfers) + VO Reporting", owner: "", status: "Working on it", dueDate: "", completionCriteria: "" },
        { id: "40-15", quarter: 'Q2', title: "VoC", owner: "Liisa Fetig", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-16", quarter: 'Q2', title: "Claude Agent for VoC Categorization & Routing", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-17", quarter: 'Q2', title: "Launch CES Survey & Track in VoC DB", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-18", quarter: 'Q2', title: "Launch In-App Renewals Notifications (NFG)", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-19", quarter: 'Q2', title: "Increase VoC Follow Up Rate by CSM & Product", owner: "", status: "At Risk", dueDate: "", completionCriteria: "" },
        { id: "40-20", quarter: 'Q2', title: "Enablement", owner: "Laryssa Oberther", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-21", quarter: 'Q2', title: "AI Agent for Enablement Leave-Behind Creation", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
        { id: "40-22", quarter: 'Q2', title: "Async Enablement Rollout w/Quizzes", owner: "", status: "On Track", dueDate: "", completionCriteria: "" },
      ]},
      { id: 41, quarter: 'Q2', title: "Maintain industry gold standard adherence to Payments SLA", group: "Functional: Global Support", dri: "Doug Swensen", team: "Support", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "93%", actual: "", notes: "% of tasks completed within SLAs", subitems: [] },
      { id: 42, quarter: 'Q2', title: "Update & refine Support SLA after ZenDesk migration", group: "Functional: Global Support", dri: "Doug Swensen", team: "Support", status: "On Track", dueDate: "2026-06-30", baseline: "72.72%", target: "80%", actual: "", notes: "% of tasks completed within SLAs", subitems: [] },
      { id: 43, quarter: 'Q2', title: "Prioritize case deflection & globalization to lower per-ticket costs", group: "Functional: Global Support", dri: "Doug Swensen", team: "Support", status: "At Risk", dueDate: "2026-06-30", baseline: "$22.41", target: "$21.03", actual: "", notes: "baseline slightly subject to change pending inputs from Finance", subitems: [] },
      { id: 44, quarter: 'Q2', title: "CSAT Follow-up Process", group: "Functional: Global Support", dri: "Doug Swensen", team: "Support", status: "On Track", dueDate: "2026-06-30", baseline: "-", target: "95%", actual: "", notes: "Personalized follow-up with customers on every negative CSAT. Success measure - CSAT", subitems: [] },
      { id: 45, quarter: 'Q2', title: "Align Org Structure to BUs", group: "Functional: Global Support", dri: "Doug Swensen", team: "Support", status: "At Risk", dueDate: "2026-06-30", baseline: "", target: "", actual: "", notes: "", subitems: [] },
      { id: 46, quarter: 'Q2', title: "Automation & Tooling | Automate On-Hold Projects + CSAT Tracking", group: "Functional: Professional Services", dri: "Amy LaPorta", team: "Professional Services", status: "On Track", dueDate: "2026-06-30", baseline: "On-Hold: 100% manual (~1.5–2 hrs/wk). CSAT: ~2–3 survey responses/month.", target: "On-Hold: 0% manual workflow tracking by EOQ. CSAT: ≥10 responses/month via automated distribution and follow-up.", actual: "", notes: "", subitems: [] },
      { id: 47, quarter: 'Q2', title: "Bookings/Margin | CSR success services premier tier improvements", group: "Functional: Professional Services", dri: "Chris Parkes, Kimberly O'Donnell", team: "Professional Services", status: "Working on it", dueDate: "2026-06-30", baseline: "", target: ">25%", actual: "", notes: "", subitems: [] },
      { id: 48, quarter: 'Q2', title: "Bookings/Margin | CM/FS: Increase Bookings/Margin - Launch revised packages for Value Added Services", group: "Functional: Professional Services", dri: "Saber Singh", team: "Professional Services", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "Packages Launched & Teams Enabled", actual: "", notes: "", subitems: [] },
      { id: 49, quarter: 'Q2', title: "Bookings/Margin | Remove Friction Points/Improve Margins", group: "Functional: Professional Services", dri: "Chris Parkes", team: "Professional Services", status: "Working on it", dueDate: "2026-06-30", baseline: "", target: ">10%", actual: "", notes: "", subitems: [] },
      { id: 50, quarter: 'Q2', title: "Bookings/Margin | Formalize Good / Better / Best F&E Onboarding Packages", group: "Functional: Professional Services", dri: "Amy LaPorta", team: "Professional Services", status: "At Risk", dueDate: "2026-06-30", baseline: "N/A — no tiered packaging exists today", target: "Finalized, margin-aligned Good/Better/Best service packages ready for Sales and Solutions use", actual: "", notes: "", subitems: [] },
      { id: 51, quarter: 'Q2', title: "Delivery Stds | Data Readiness Acceleration Pilot (F&E Market Pod Initiative)", group: "Functional: Professional Services", dri: "Amy LaPorta", team: "Professional Services", status: "Stuck", dueDate: "2026-06-30", baseline: "~67–93 days avg time-to-mapping; no pre-kickoff data readiness process exists; ~39% hour overruns on conversion projects", target: "Pilot with ≥3 clients; reduce time-to-mapping by 50% (from ~67–93 days to ≤30 days)", actual: "", notes: "", subitems: [] },
      { id: 52, quarter: 'Q2', title: "Reporting & Insights | Enterprise Project Health Dashboard — Operationalized for PS & CX", group: "Functional: Professional Services", dri: "Kelsey Rossbach", team: "Professional Services", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "≥90% of active NRR implementation projects with current health status", actual: "", notes: "", subitems: [] },
      { id: 53, quarter: 'Q2', title: "Cust Success & Handoffs | Improve Implementation → Success Services Handoff", group: "Functional: Professional Services", dri: "Amy LaPorta", team: "Professional Services", status: "On Track", dueDate: "2026-06-30", baseline: "N/A — no formalized handoff process exists", target: "Standardized handoff process defined and implemented for F&E clients", actual: "", notes: "", subitems: [] },
      { id: 54, quarter: 'Q2', title: "CVI & Coalitions Success", group: "Functional: Professional Services", dri: "Kristi Lewison, Amit Motwani", team: "Professional Services", status: "On Track", dueDate: "2026-06-30", baseline: "Baltimore implementation launched; KPI framework and baseline metrics established", target: "8 cities meet readiness criteria; ≥90% implementation success rate within 30–45 days", actual: "", notes: "", subitems: [] },
      { id: 55, quarter: 'Q2', title: "Fundraising Goal Achievement", group: "Functional: OC Services", dri: "James Rischar", team: "OneCause Services", status: "On Track", dueDate: "2026-06-30", baseline: "29%", target: "33%", actual: "", notes: "On track above 33% target", subitems: [] },
      { id: 56, quarter: 'Q2', title: "Deploy \"Memorable Impact\" leave-behind marketing item at events", group: "Functional: OC Services", dri: "Alana Nolan", team: "OneCause Services", status: "Done", dueDate: "2026-06-30", baseline: "2 events", target: "25 events", actual: "", notes: "Sent 30 items to customers in April/May", subitems: [] },
      { id: 57, quarter: 'Q2', title: "Integrate DD/OC Services for onboarding", group: "Functional: OC Services", dri: "James Rischar", team: "OneCause Services", status: "On Track", dueDate: "2026-05-29", baseline: "0 customers' onboarding", target: "2 customers' onboarding", actual: "", notes: "", subitems: [] },
      { id: 58, quarter: 'Q2', title: "Initiate AI pilot for OC Support", group: "Functional: OC Services", dri: "James Rischar", team: "OneCause Services", status: "On Track", dueDate: "2026-06-30", baseline: "", target: "5 customer events", actual: "", notes: "", subitems: [] },
      { id: 59, quarter: 'Q2', title: "Pilot Zoom scheduler for DD Support team", group: "Functional: OC Services", dri: "Stephen Minto", team: "OneCause Services", status: "On Track", dueDate: "2026-05-29", baseline: "", target: "5 enterprise customers", actual: "", notes: "", subitems: [] },
    ];

    // Generate Q3 duplicates: same structure, cleared metrics, status reset
    // OC Services is now part of Professional Services — no Q3 group needed
    const q3Goals = q2Goals.filter(goal => goal.group !== 'Functional: OC Services').map(goal => ({
      ...goal,
      id: `q3_${goal.id}`,
      quarter: 'Q3',
      status: 'Not started',
      baseline: '',
      target: '',
      actual: '',
      notes: '',
      dueDate: '',
      subitems: (goal.subitems || []).map(sub => ({
        ...sub,
        id: `q3_${sub.id}`,
        quarter: 'Q3',
        status: 'Not started',
        dueDate: '',
        // preserve completionCriteria — it defines what "done" looks like
      })),
    }));

    return [...q2Goals, ...q3Goals];
  };

  // Storage: try v3 first, migrate from v2 if needed
  useEffect(() => {
    const load = async () => {
      try {
        const r3 = await storage.get('goals_tracker_data_v3');
        if (r3?.value) { setGoals(JSON.parse(r3.value)); return; }

        // Migrate from v2
        const r2 = await storage.get('goals_tracker_data_v2');
        if (r2?.value) {
          const v2 = JSON.parse(r2.value);
          const migratedQ2 = v2.map(g => ({
            ...g,
            quarter: g.quarter || 'Q2',
            subitems: (g.subitems || []).map(s => ({ ...s, quarter: s.quarter || 'Q2' })),
          }));
          const q3Goals = migratedQ2.filter(goal => goal.group !== 'Functional: OC Services').map(goal => ({
            ...goal,
            id: `q3_${goal.id}`,
            quarter: 'Q3',
            status: 'Not started',
            baseline: '',
            target: '',
            actual: '',
            notes: '',
            dueDate: '',
            subitems: (goal.subitems || []).map(sub => ({ ...sub, id: `q3_${sub.id}`, quarter: 'Q3', status: 'Not started', dueDate: '' })),
          }));
          setGoals([...migratedQ2, ...q3Goals]);
        } else {
          setGoals(getDefaultGoals());
        }
      } catch (e) { setGoals(getDefaultGoals()); }
    };
    load();

    const loadDark = async () => { try { const r = await storage.get('goals_tracker_dark_mode'); if (r?.value) setDarkMode(JSON.parse(r.value)); } catch (e) {} };
    const loadCats = async () => { try { const r = await storage.get('goals_tracker_custom_categories'); if (r?.value) setCustomCategories(JSON.parse(r.value)); } catch (e) {} };
    const loadOrder = async () => { try { const r = await storage.get('goals_tracker_group_order'); if (r?.value) setGroupOrder(JSON.parse(r.value)); } catch (e) {} };
    loadDark();
    loadCats();
    loadOrder();
  }, []);

  useEffect(() => {
    const save = async () => { try { if (goals.length > 0) await storage.set('goals_tracker_data_v3', JSON.stringify(goals)); } catch (e) {} };
    save();
  }, [goals]);

  useEffect(() => {
    const save = async () => { try { await storage.set('goals_tracker_dark_mode', JSON.stringify(darkMode)); } catch (e) {} };
    save();
  }, [darkMode]);

  useEffect(() => {
    const save = async () => { try { await storage.set('goals_tracker_custom_categories', JSON.stringify(customCategories)); } catch (e) {} };
    save();
  }, [customCategories]);

  useEffect(() => {
    const save = async () => { try { if (groupOrder.length > 0) await storage.set('goals_tracker_group_order', JSON.stringify(groupOrder)); } catch (e) {} };
    save();
  }, [groupOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { const r = await storage.get('goals_tracker_data_v3'); if (r?.value) setGoals(JSON.parse(r.value)); } catch (e) {}
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAddCategory = (cat) => { if (cat && !customCategories.includes(cat)) setCustomCategories([...customCategories, cat]); };
  const allGoalGroups = [...GOAL_GROUPS, ...customCategories];

  // ── Undo ──────────────────────────────────────────────────────────────────────
  const pushHistory = (current) => {
    historyRef.current = [...historyRef.current.slice(-19), JSON.parse(JSON.stringify(current))];
    setCanUndo(true);
  };
  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setCanUndo(historyRef.current.length > 0);
    setGoals(prev);
  };

  // ── Group/goal ordering ───────────────────────────────────────────────────────
  const getEffectiveGroupOrder = () => {
    if (groupOrder.length === 0) return allGoalGroups;
    const ordered = groupOrder.filter(g => allGoalGroups.includes(g));
    const remaining = allGoalGroups.filter(g => !ordered.includes(g));
    return [...ordered, ...remaining];
  };
  const reorderGroups = (fromGroup, toGroup) => {
    const effective = getEffectiveGroupOrder();
    const fromIdx = effective.indexOf(fromGroup);
    const toIdx = effective.indexOf(toGroup);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const newOrder = [...effective];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, fromGroup);
    setGroupOrder(newOrder);
  };
  const reorderGoals = (fromId, toId) => {
    setGoals(prev => {
      const fromIdx = prev.findIndex(g => String(g.id) === String(fromId));
      const toIdx = prev.findIndex(g => String(g.id) === String(toId));
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const handleLogin = (user) => { setCurrentUser(user); setView('dashboard'); setFilterTeam(true); setQuarterFilter([getCurrentQuarter()]); };
  const handleAddGoal = (formData) => { pushHistory(goals); setGoals([...goals, { id: Date.now(), ...formData, subitems: formData.subitems || [] }]); setView('dashboard'); };
  const handleUpdateGoal = (id, updatedData) => { pushHistory(goals); setGoals(goals.map(g => g.id === id ? { ...g, ...updatedData } : g)); };
  const handleDeleteGoal = (id) => { pushHistory(goals); setGoals(goals.filter(g => g.id !== id)); };
  const handleDeleteGroup = (group) => { pushHistory(goals); setGoals(goals.filter(g => g.group !== group)); };

  const getVisibleGoals = () => {
    let visible = goals;
    if (currentUser !== 'Admin') {
      if (currentUser === 'CSM & DCS') visible = visible.filter(g => g.team === 'CSM' || g.team === 'DCS');
      else if (filterTeam) visible = visible.filter(g => g.team === currentUser);
    }
    if (statusFilter.length > 0) visible = visible.filter(g => statusFilter.includes(g.status));
    if (groupFilter.length > 0) visible = visible.filter(g => groupFilter.includes(g.group));
    if (driFilter.length > 0) visible = visible.filter(g => driFilter.includes('Blank') ? (!g.dri || driFilter.includes(g.dri)) : driFilter.includes(g.dri));
    if (quarterFilter.length > 0) visible = visible.filter(g => quarterFilter.includes(g.quarter || 'Q2'));
    return visible;
  };

  const groupedGoals = () => {
    const visible = getVisibleGoals();
    const ordered = getEffectiveGroupOrder();
    const grouped = {};
    ordered.forEach(group => { grouped[group] = visible.filter(g => g.group === group); });
    return Object.entries(grouped).filter(([, gs]) => gs.length > 0);
  };

  const toggleGroup = (group) => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));

  const handleExpandAll = () => {
    const all = {};
    groupedGoals().forEach(([g]) => { all[g] = true; });
    setExpandedGroups(all);
  };

  const handleCollapseAll = () => setExpandedGroups({});

  const allExpanded = () => {
    const vg = groupedGoals();
    return vg.length > 0 && vg.every(([g]) => expandedGroups[g]);
  };

  if (view === 'login') return <LoginView TEAMS={TEAMS} onLogin={handleLogin} darkMode={darkMode} />;
  if (view === 'form') return <FormView TEAMS={TEAMS} GOAL_GROUPS={allGoalGroups} ALL_DRIS={ALL_DRIS} onSubmit={handleAddGoal} onAddCategory={handleAddCategory} onBack={() => setView('dashboard')} darkMode={darkMode} />;

  return (
    <DashboardView
      currentUser={currentUser}
      goals={getVisibleGoals()}
      groupedGoals={groupedGoals()}
      expandedGroups={expandedGroups}
      toggleGroup={toggleGroup}
      allExpanded={allExpanded()}
      onExpandAll={handleExpandAll}
      onCollapseAll={handleCollapseAll}
      filterTeam={filterTeam}
      setFilterTeam={setFilterTeam}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      groupFilter={groupFilter}
      setGroupFilter={setGroupFilter}
      driFilter={driFilter}
      setDriFilter={setDriFilter}
      quarterFilter={quarterFilter}
      setQuarterFilter={setQuarterFilter}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      GOAL_GROUPS={allGoalGroups}
      ALL_DRIS={ALL_DRIS}
      TEAMS={TEAMS}
      onAddGoal={() => setView('form')}
      onEditGoal={handleUpdateGoal}
      onDeleteGoal={handleDeleteGoal}
      onDeleteGroup={handleDeleteGroup}
      onUndo={handleUndo}
      canUndo={canUndo}
      onReorderGroups={reorderGroups}
      onReorderGoals={reorderGoals}
      allGroups={allGoalGroups}
      onLogout={() => { setCurrentUser(null); setView('login'); setStatusFilter([]); setGroupFilter([]); setDriFilter([]); setQuarterFilter([]); }}
    />
  );
};

export default GoalsTracker;
