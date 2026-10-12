import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { useSessionRecords } from '../../hooks/useSessionRecords';
import { FiEye, FiClock, FiRefreshCw } from 'react-icons/fi';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const TherapySessions = () => {
  const { t } = useTranslation();
  const { records, loading, refresh } = useSessionRecords();
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);

  const stats = {
    total: records.length,
    completed: records.filter(r => r.completed_normally).length,
    emergency: records.filter(r => !r.completed_normally).length,
    avg: records.length > 0 ? records.reduce((a,r) => a + (r.improvement||0),0)/records.length : 0,
  };

  const fmtDur = (s) => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('sessions.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { l: t('sessions.total'), v: stats.total, c: 'border-primary text-secondary' },
              { l: t('sessions.completed'), v: stats.completed, c: 'border-green-500 text-green-600' },
              { l: t('sessions.emergency'), v: stats.emergency, c: 'border-red-500 text-red-600' },
              { l: t('sessions.avgImprovement'), v: stats.avg.toFixed(1), c: 'border-purple-500 text-purple-600' },
            ].map((s,i) => (
              <div key={i} className={`bg-white rounded-2xl shadow-soft p-4 border-l-4 ${s.c.split(' ')[0]}`}>
                <p className="text-xs text-gray-400">{s.l}</p>
                <p className={`text-2xl font-bold ${s.c.split(' ')[1]}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">{records.length} sessions</span>
            <button onClick={refresh} className="flex items-center gap-2 text-sm text-primary"><FiRefreshCw size={16} className={loading?'animate-spin':''} /> Refresh</button>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Patient','Frequency','Intensity','Duration','Pain','Outcome','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? <tr><td colSpan="8" className="py-12 text-center"><FiClock className="mx-auto text-gray-300" size={48}/></td></tr>
                  : records.length === 0 ? <tr><td colSpan="8" className="py-12 text-center text-gray-400">{t('sessions.noSessions')}</td></tr>
                  : records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.patient_name || 'Unknown'}</td>
                      <td className="px-4 py-3">{r.frequency_hz} Hz</td>
                      <td className="px-4 py-3">{r.intensity_pct}%</td>
                      <td className="px-4 py-3">{fmtDur(r.elapsed_sec)}</td>
                      <td className="px-4 py-3">{r.pain_before != null && r.pain_after != null ? `${r.pain_before}→${r.pain_after}` : '—'}</td>
                      <td className="px-4 py-3">{r.outcome || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          r.completed_normally ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {r.completed_normally ? <FaCheckCircle /> : <FaExclamationTriangle />}
                          {r.completed_normally ? 'Completed' : 'Emergency'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => {setSelected(r); setShow(true);}} className="text-gray-400 hover:text-primary"><FiEye size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {show && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Session Details</h3>
              <button onClick={() => setShow(false)}>✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-400 text-xs">Patient</p><p className="font-medium">{selected.patient_name}</p></div>
                <div><p className="text-gray-400 text-xs">Disease</p><p className="font-medium">{selected.disease || '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Date</p><p className="font-medium">{fmtDate(selected.ended_at)}</p></div>
                <div><p className="text-gray-400 text-xs">Status</p><p className="font-medium">{selected.completed_normally ? '✅ Completed' : '⚠️ Interrupted'}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl text-center"><p className="text-xs text-gray-500">Frequency</p><p className="text-lg font-bold text-primary">{selected.frequency_hz} Hz</p></div>
                <div className="p-3 bg-green-50 rounded-xl text-center"><p className="text-xs text-gray-500">Intensity</p><p className="text-lg font-bold text-success">{selected.intensity_pct}%</p></div>
                <div className="p-3 bg-purple-50 rounded-xl text-center"><p className="text-xs text-gray-500">Duration</p><p className="text-lg font-bold text-purple-600">{fmtDur(selected.elapsed_sec)}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2 bg-red-50 rounded-lg text-center"><p className="text-xs text-gray-500">Before</p><p className="text-xl font-bold text-red-600">{selected.pain_before ?? '—'}/10</p></div>
                <div className="p-2 bg-green-50 rounded-lg text-center"><p className="text-xs text-gray-500">After</p><p className="text-xl font-bold text-green-600">{selected.pain_after ?? '—'}/10</p></div>
                <div className="p-2 bg-blue-50 rounded-lg text-center"><p className="text-xs text-gray-500">Improvement</p><p className="text-xl font-bold text-primary">{selected.improvement ?? '—'}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapySessions;