import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { getSessionRecords } from '../../services/api/sessionRecords';
import { FiEye, FiClock, FiRefreshCw, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const TherapySessions = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getSessionRecords();
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch session records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const stats = {
    total: records.length,
    completed: records.filter(r => r.completed_normally).length,
    emergency: records.filter(r => !r.completed_normally && r.outcome !== 'Little').length,
    avgImprovement: records.length > 0 
      ? records.reduce((acc, r) => acc + (r.improvement || 0), 0) / records.length 
      : 0,
  };

  const formatDuration = (sec) => {
    if (!sec) return '0m 0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (record) => {
    if (record.completed_normally) {
      return { bg: 'bg-green-100', text: 'text-green-700', icon: <FaCheckCircle className="text-green-500" />, label: t('sessions.completedStatus') };
    }
    if (record.outcome === 'Little') {
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <FaExclamationTriangle className="text-yellow-500" />, label: t('sessions.interrupted') };
    }
    return { bg: 'bg-red-100', text: 'text-red-700', icon: <FaExclamationTriangle className="text-red-500" />, label: t('sessions.emergency') };
  };

  const getOutcomeBadge = (outcome) => {
    if (!outcome) return <span className="text-gray-400">—</span>;
    const colors = {
      'Significant': 'text-green-600',
      'Moderate': 'text-yellow-600',
      'Little': 'text-gray-500',
    };
    return <span className={`font-medium ${colors[outcome] || 'text-gray-500'}`}>{outcome}</span>;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('sessions.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-primary">
              <p className="text-xs text-gray-400">{t('sessions.total')}</p>
              <p className="text-2xl font-bold text-secondary">{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-400">{t('sessions.completed')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-red-500">
              <p className="text-xs text-gray-400">{t('sessions.emergency')}</p>
              <p className="text-2xl font-bold text-red-600">{stats.emergency}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-soft p-4 border-l-4 border-purple-500">
              <p className="text-xs text-gray-400">{t('sessions.avgImprovement')}</p>
              <p className="text-2xl font-bold text-purple-600">{stats.avgImprovement.toFixed(1)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">{records.length} {t('sessions.title')}</span>
            <button onClick={fetchRecords} className="flex items-center gap-2 text-sm text-primary hover:text-blue-700 transition">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {t('common.refresh')}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{t('sessions.patient')}</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{t('sessions.frequency')}</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{t('sessions.intensity')}</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{t('sessions.duration')}</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{t('sessions.pain')}</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{t('sessions.outcome')}</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{t('sessions.status')}</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div><p className="text-gray-400 mt-2">{t('common.loading')}</p></td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-12"><FiClock size={48} className="text-gray-300 mx-auto" /><p className="text-gray-400 font-medium mt-2">{t('sessions.noSessions')}</p></td></tr>
                  ) : (
                    records.map((r) => {
                      const statusInfo = getStatusBadge(r);
                      const improvement = (r.pain_before || 0) - (r.pain_after || 0);
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-secondary">{r.patient_name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-gray-600">{r.frequency_hz} Hz</td>
                          <td className="px-4 py-3 text-gray-600">{r.intensity_pct}%</td>
                          <td className="px-4 py-3 text-gray-600">{formatDuration(r.elapsed_sec)}</td>
                          <td className="px-4 py-3">{r.pain_before !== null && r.pain_after !== null ? `${r.pain_before} → ${r.pain_after}` : '—'}</td>
                          <td className="px-4 py-3">{getOutcomeBadge(r.outcome)}</td>
                          <td className="px-4 py-3"><span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>{statusInfo.icon}{statusInfo.label}</span></td>
                          <td className="px-4 py-3"><button onClick={() => { setSelectedRecord(r); setShowDetails(true); }} className="text-gray-400 hover:text-primary transition"><FiEye size={16} /></button></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showDetails && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold flex items-center gap-2">{t('sessions.details')}</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><p className="text-xs text-gray-400">{t('sessions.patient')}</p><p className="font-medium">{selectedRecord.patient_name || 'Unknown'}</p></div>
                <div><p className="text-xs text-gray-400">{t('patients.disease')}</p><p className="font-medium">{selectedRecord.disease || '—'}</p></div>
                <div><p className="text-xs text-gray-400">{t('imaging.date')}</p><p className="font-medium">{formatDate(selectedRecord.ended_at)}</p></div>
                <div><p className="text-xs text-gray-400">{t('sessions.status')}</p><p className="font-medium">{selectedRecord.completed_normally ? '✅ ' + t('sessions.completedStatus') : '⚠️ ' + t('sessions.interrupted')}</p></div>
              </div>
              <h4 className="font-semibold mb-2">{t('sessions.therapyParams')}</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-center"><p className="text-xs text-gray-400">{t('sessions.frequency')}</p><p className="text-lg font-bold text-primary">{selectedRecord.frequency_hz} Hz</p></div>
                <div className="p-3 bg-green-50 rounded-xl text-center"><p className="text-xs text-gray-400">{t('sessions.intensity')}</p><p className="text-lg font-bold text-success">{selectedRecord.intensity_pct}%</p></div>
                <div className="p-3 bg-purple-50 rounded-xl text-center"><p className="text-xs text-gray-400">{t('sessions.duration')}</p><p className="text-lg font-bold text-purple-600">{formatDuration(selectedRecord.elapsed_sec)}</p></div>
              </div>
              <h4 className="font-semibold mb-2">{t('sessions.painAssessment')}</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg text-center"><p className="text-xs text-gray-400">{t('sessions.before')}</p><p className="text-xl font-bold text-red-600">{selectedRecord.pain_before ?? '—'}/10</p></div>
                <div className="p-2 bg-green-50 rounded-lg text-center"><p className="text-xs text-gray-400">{t('sessions.after')}</p><p className="text-xl font-bold text-green-600">{selectedRecord.pain_after ?? '—'}/10</p></div>
                <div className="p-2 bg-blue-50 rounded-lg text-center"><p className="text-xs text-gray-400">{t('sessions.improvement')}</p><p className="text-xl font-bold text-primary">{selectedRecord.improvement ?? '—'}</p></div>
              </div>
              {selectedRecord.ai_decisions && selectedRecord.ai_decisions.length > 0 && (
                <>
                  <h4 className="font-semibold mb-2">{t('sessions.aiDecisions')}</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedRecord.ai_decisions.slice(0, 10).map((d, i) => {
                      const labels = ['REDUCE', 'MAINTAIN', 'INCREASE', 'ABNORMAL'];
                      const colors = ['#F2994A', '#27AE60', '#2D9CDB', '#EB5757'];
                      const idx = d || 1;
                      return <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${colors[idx] || '#gray'}20`, color: colors[idx] || '#gray' }}>{labels[idx] || 'UNKNOWN'}</span>;
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowDetails(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition">{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapySessions;