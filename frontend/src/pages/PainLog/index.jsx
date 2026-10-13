import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { getPatients } from '../../services/api/patients';
import { FiRefreshCw, FiPlus, FiTrash2, FiSmile } from 'react-icons/fi';

const PainLog = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({ pain_before: 5, pain_after: null, session_id: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
        if (data.length > 0) setSelectedPatient(data[0]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    fetchLogs();
  }, [selectedPatient]);

  const fetchLogs = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/pain/${selectedPatient.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setLogs(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/pain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          pain_before: formData.pain_before,
          pain_after: formData.pain_after || null,
          session_id: formData.session_id || null,
        }),
      });
      if (res.ok) {
        setFormData({ pain_before: 5, pain_after: null, session_id: null });
        setAdding(false);
        fetchLogs();
      }
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm(t('common.delete') || 'Delete this pain log?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/pain/${logId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLogs();
    } catch (e) { console.error(e); }
  };

  const total = logs.length;
  const avgBefore = total > 0 ? logs.reduce((s, l) => s + (l.pain_before || 0), 0) / total : 0;
  const avgAfter = total > 0 ? logs.reduce((s, l) => s + (l.pain_after || 0), 0) / total : 0;
  const avgImprovement = total > 0 ? logs.reduce((s, l) => s + ((l.pain_before || 0) - (l.pain_after || 0)), 0) / total : 0;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar /><div className="flex-1 flex flex-col">
        <Topbar title={t('nav.painLog') || 'Pain Log'} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6 flex flex-wrap items-center gap-4">
            <select value={selectedPatient?.id || ''} onChange={(e) => setSelectedPatient(patients.find(p => p.id === parseInt(e.target.value)))} className="border border-gray-200 rounded-xl px-4 py-2 bg-gray-50">
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={fetchLogs} className="ml-auto border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-1">
              <FiRefreshCw size={14} /> {t('common.refresh') || 'Refresh'}
            </button>
            <button onClick={() => setAdding(true)} className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2 rounded-xl hover:shadow-lg flex items-center gap-1">
              <FiPlus size={14} /> {t('common.add') || 'Add Log'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-primary"><p className="text-xs text-gray-400">{t('common.total') || 'Total Logs'}</p><p className="text-2xl font-bold">{total}</p></div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-yellow-400"><p className="text-xs text-gray-400">{t('painLog.avgBefore') || 'Avg Pain Before'}</p><p className="text-2xl font-bold text-yellow-600">{avgBefore.toFixed(1)}</p></div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-green-500"><p className="text-xs text-gray-400">{t('painLog.avgAfter') || 'Avg Pain After'}</p><p className="text-2xl font-bold text-green-600">{avgAfter.toFixed(1)}</p></div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-red-500"><p className="text-xs text-gray-400">{t('painLog.avgImprovement') || 'Avg Improvement'}</p><p className="text-2xl font-bold text-red-600">{avgImprovement > 0 ? '+' : ''}{avgImprovement.toFixed(1)}</p></div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="p-4 border-b border-gray-100"><h3 className="font-semibold flex items-center gap-2"><FiSmile className="text-primary" /> {t('painLog.history') || 'Pain History'} <span className="text-xs text-gray-400 ml-auto">{logs.length} entries</span></h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">{t('painLog.date') || 'Date'}</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">{t('painLog.before') || 'Before'}</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">{t('painLog.after') || 'After'}</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">{t('painLog.improvement') || 'Improvement'}</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">{t('painLog.session') || 'Session'}</th>
                  <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase">{t('common.actions') || 'Actions'}</th>
                </tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="6" className="text-center py-8 text-gray-400">{t('common.loading')}</td></tr>
                  : logs.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-gray-400">{t('painLog.noLogs') || 'No pain logs found'}</td></tr>
                  : logs.map((log) => {
                    const improvement = (log.pain_before || 0) - (log.pain_after || 0);
                    return <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.recorded_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-yellow-600">{log.pain_before}/10</td>
                      <td className="px-4 py-3 font-bold text-green-600">{log.pain_after ?? '—'}</td>
                      <td className="px-4 py-3">{log.pain_after !== null ? <span className={improvement > 0 ? 'text-green-600' : 'text-red-600'}>{improvement > 0 ? '+' : ''}{improvement}</span> : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{log.session_id ? `#${log.session_id}` : '—'}</td>
                      <td className="px-4 py-3"><button onClick={() => handleDelete(log.id)} className="text-gray-400 hover:text-red-500"><FiTrash2 size={16} /></button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal - same as before */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-semibold">{t('painLog.logPain') || 'Log Pain'}</h3><button onClick={() => setAdding(false)} className="text-gray-400">✕</button></div>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{t('painLog.before') || 'Pain Before'} (0–10)</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😊</span>
                  <input type="range" min="0" max="10" value={formData.pain_before} onChange={(e) => setFormData({ ...formData, pain_before: parseInt(e.target.value) })} className="flex-1 accent-primary" />
                  <span className="text-2xl">😰</span>
                </div>
                <div className="text-center mt-1"><span className="font-bold text-2xl text-primary">{formData.pain_before}/10</span></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{t('painLog.after') || 'Pain After'} (optional)</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😊</span>
                  <input type="range" min="0" max="10" value={formData.pain_after ?? 0} onChange={(e) => setFormData({ ...formData, pain_after: parseInt(e.target.value) })} className="flex-1 accent-primary" />
                  <span className="text-2xl">😰</span>
                </div>
                <div className="text-center mt-1"><span className="font-bold text-2xl text-primary">{formData.pain_after ?? '—'}/10</span></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('painLog.session') || 'Session'} (optional)</label>
                <input type="number" placeholder="Session ID" value={formData.session_id || ''} onChange={(e) => setFormData({ ...formData, session_id: parseInt(e.target.value) || null })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setAdding(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50">{t('common.cancel') || 'Cancel'}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-primary to-blue-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg disabled:opacity-50">{submitting ? t('common.loading') : t('common.save') || 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainLog;