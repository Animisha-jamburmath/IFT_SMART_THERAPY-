import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { getPatients } from '../../services/api/patients';
import { FiRefreshCw, FiPlus, FiTrash2, FiSmile } from 'react-icons/fi';
import apiClient from '../../services/api/client';

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
    getPatients().then(data => {
      setPatients(data);
      if (data.length > 0) setSelectedPatient(data[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (selectedPatient) fetchLogs(); }, [selectedPatient]);

  const fetchLogs = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/pain/${selectedPatient.id}`);
      setLogs(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      await apiClient.post('/pain', {
        patient_id: selectedPatient.id,
        pain_before: formData.pain_before,
        pain_after: formData.pain_after,
        session_id: formData.session_id,
      });
      setFormData({ pain_before: 5, pain_after: null, session_id: null });
      setAdding(false);
      fetchLogs();
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await apiClient.delete(`/pain/${id}`);
    fetchLogs();
  };

  const total = logs.length;
  const avgBefore = total > 0 ? logs.reduce((s,l) => s+(l.pain_before||0),0)/total : 0;
  const avgAfter = total > 0 ? logs.reduce((s,l) => s+(l.pain_after||0),0)/total : 0;
  const avgImp = total > 0 ? logs.reduce((s,l) => s+((l.pain_before||0)-(l.pain_after||0)),0)/total : 0;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('painLog.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6 flex flex-wrap items-center gap-4">
            <select value={selectedPatient?.id || ''} onChange={(e) => setSelectedPatient(patients.find(p=>p.id===parseInt(e.target.value)))} className="border border-gray-200 rounded-xl px-4 py-2 bg-gray-50">
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={fetchLogs} className="ml-auto border px-4 py-2 rounded-xl flex items-center gap-1"><FiRefreshCw size={14} /> {t('common.refresh')}</button>
            <button onClick={() => setAdding(true)} className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-1"><FiPlus size={14} /> Add Log</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-primary"><p className="text-xs text-gray-400">{t('common.total')}</p><p className="text-2xl font-bold">{total}</p></div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-yellow-400"><p className="text-xs text-gray-400">{t('painLog.avgBefore')}</p><p className="text-2xl font-bold text-yellow-600">{avgBefore.toFixed(1)}</p></div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-green-500"><p className="text-xs text-gray-400">{t('painLog.avgAfter')}</p><p className="text-2xl font-bold text-green-600">{avgAfter.toFixed(1)}</p></div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-red-500"><p className="text-xs text-gray-400">{t('painLog.avgImprovement')}</p><p className="text-2xl font-bold text-red-600">{avgImp > 0 ? '+' : ''}{avgImp.toFixed(1)}</p></div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="p-4 border-b flex items-center"><FiSmile className="text-primary mr-2" /> {t('painLog.history')}</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                {['Date','Before','After','Improvement','Session','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="6" className="text-center py-8">{t('common.loading')}</td></tr>
                : logs.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-gray-400">{t('painLog.noLogs')}</td></tr>
                : logs.map(log => {
                  const imp = (log.pain_before||0) - (log.pain_after||0);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs">{new Date(log.recorded_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-yellow-600">{log.pain_before}/10</td>
                      <td className="px-4 py-3 font-bold text-green-600">{log.pain_after ?? '—'}</td>
                      <td className="px-4 py-3"><span className={imp>0?'text-green-600':imp<0?'text-red-600':''}>{log.pain_after !== null ? (imp>0?'+':'')+imp : '—'}</span></td>
                      <td className="px-4 py-3">{log.session_id ? `#${log.session_id}` : '—'}</td>
                      <td className="px-4 py-3"><button onClick={()=>handleDelete(log.id)} className="text-gray-400 hover:text-red-500"><FiTrash2 size={16}/></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-semibold">{t('painLog.logPain')}</h3><button onClick={()=>setAdding(false)}>✕</button></div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('painLog.before')} (0-10)</label>
                <div className="flex items-center gap-2">
                  <span>😊</span>
                  <input type="range" min="0" max="10" value={formData.pain_before} onChange={(e)=>setFormData({...formData, pain_before:parseInt(e.target.value)})} className="flex-1 accent-primary" />
                  <span>😰</span>
                </div>
                <div className="text-center font-bold text-2xl text-primary">{formData.pain_before}/10</div>
              </div>
              <div>
                <label className="text-sm font-medium">{t('painLog.after')} (optional)</label>
                <input type="range" min="0" max="10" value={formData.pain_after ?? 0} onChange={(e)=>setFormData({...formData, pain_after:parseInt(e.target.value)})} className="w-full accent-primary" />
                <div className="text-center font-bold text-2xl text-primary">{formData.pain_after ?? '—'}/10</div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={()=>setAdding(false)} className="flex-1 border py-2.5 rounded-xl">{t('common.cancel')}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-2.5 rounded-xl disabled:opacity-50">{submitting ? '...' : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainLog;