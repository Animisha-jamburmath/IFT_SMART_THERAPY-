import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeviceSocket } from '../../hooks/useDeviceSocket';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { FiClock, FiActivity, FiSmile, FiSend, FiZap, FiArrowUp, FiArrowDown, FiRefreshCw } from 'react-icons/fi';
import { FaRobot, FaHeartbeat } from 'react-icons/fa';
import { getPatients } from '../../services/api/patients';

const BEAT_FREQ_GAP = 100;

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: telemetry, connected: wsConnected, sendTherapyParams, sendFeedback, sendControl } = useDeviceSocket('telemetry', {
    state: 3, frequency_hz: 4000, intensity_pct: 35,
    ch1_current_ma: 0, ch2_current_ma: 0,
    session_elapsed: 0, session_total: 600,
    ai_decision: 1, estop: false, fault: false,
    ch1_enabled: true, ch2_enabled: true,
  });

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [painLevel, setPainLevel] = useState(5);
  const [sendingPain, setSendingPain] = useState(false);
  const [manualFreq, setManualFreq] = useState(4000);
  const [manualIntensity, setManualIntensity] = useState(35);
  const [sessionDuration, setSessionDuration] = useState(600);
  const [disease, setDisease] = useState('Lumbar Disc Herniation');
  const [sendingParams, setSendingParams] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    getPatients().then(data => {
      setPatients(data);
      if (data.length > 0) setSelectedPatient(data[0]);
    }).catch(console.error);
  }, []);

  const isReady = telemetry?.state === 3;
  const isRunning = telemetry?.state === 4;
  const progress = telemetry?.session_total ? ((telemetry.session_elapsed || 0) / telemetry.session_total * 100) : 0;
  const remain = Math.max(0, (telemetry?.session_total || 0) - (telemetry?.session_elapsed || 0));
  const timeStr = `${Math.floor(remain/60)}:${String(Math.floor(remain%60)).padStart(2,'0')}`;
  const ch2Frequency = manualFreq + BEAT_FREQ_GAP;

  const aiLabels = ['REDUCE', 'MAINTAIN', 'INCREASE', 'ABNORMAL'];
  const aiColors = ['#F2994A', '#27AE60', '#2D9CDB', '#EB5757'];
  const aiClass = telemetry?.ai_decision || 1;

  const sendParams = () => {
    if (!wsConnected) {
      setFeedbackMsg({ type: 'error', text: '⚠️ Not connected' });
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }
    setSendingParams(true);
    const ok = sendTherapyParams(manualFreq, manualIntensity, sessionDuration, disease);
    setFeedbackMsg(ok
      ? { type: 'success', text: '✅ Sent! Confirm on device (press START)' }
      : { type: 'error', text: '❌ Send failed' });
    setTimeout(() => setFeedbackMsg(null), 5000);
    setSendingParams(false);
  };

  const sendPain = () => {
    setSendingPain(true);
    sendFeedback(painLevel, null);
    setFeedbackMsg({ type: 'success', text: '✅ Pain logged!' });
    setTimeout(() => setFeedbackMsg(null), 2000);
    setSendingPain(false);
  };

  const adjust = (type, amount) => {
    if (type === 'freq') {
      const v = Math.min(Math.max(manualFreq + amount, 100), 40000);
      setManualFreq(v);
      if (isRunning) sendControl('frequency', v);
    } else {
      const v = Math.min(Math.max(manualIntensity + amount, 0), 100);
      setManualIntensity(v);
      if (isRunning) sendControl('intensity', v);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('dashboard.title')} mqttConnected={wsConnected} />
        <main className="flex-1 p-6 overflow-y-auto">
          {feedbackMsg && (
            <div className={`mb-4 p-3 rounded-xl ${
              feedbackMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>{feedbackMsg.text}</div>
          )}

          {/* Patient selector */}
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6 flex flex-wrap items-center gap-4 border border-gray-50">
            <span className="font-medium text-gray-700">Patient:</span>
            <select
              value={selectedPatient?.id || ''}
              onChange={(e) => setSelectedPatient(patients.find(p => p.id === parseInt(e.target.value)))}
              className="border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
            >
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {selectedPatient && (
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Age: {selectedPatient.age || '—'}</span>
                <span>{selectedPatient.gender}</span>
                <span className="text-primary">{selectedPatient.disease}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-soft p-6 mb-6">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2"><FiClock className="text-primary" /> {t('dashboard.sessionProgress')}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isRunning ? 'bg-green-100 text-green-700' : isReady ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>{isRunning ? '🟢 Running' : isReady ? '🔵 Ready' : '⚪ Inactive'}</span>
            </div>
            <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all" style={{ width: `${Math.min(progress,100)}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{Math.round(progress)}% complete</span>
              <span className="font-mono">{timeStr} remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-50">
                <h3 className="font-semibold flex items-center gap-2 mb-4"><FiZap className="text-primary" /> {t('dashboard.currentTherapy')}</h3>

                {/* Dual channel display */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-3 border border-cyan-200">
                    <p className="text-xs text-cyan-700 font-medium">CH1 (Base)</p>
                    <p className="text-xl font-bold text-cyan-600">{telemetry?.frequency_hz?.toLocaleString() || 0} Hz</p>
                    <p className="text-xs text-cyan-500">{telemetry?.ch1_current_ma?.toFixed(2) || '0.00'} mA</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-3 border border-pink-200">
                    <p className="text-xs text-pink-700 font-medium">CH2 (Beat)</p>
                    <p className="text-xl font-bold text-pink-600">{((telemetry?.frequency_hz || 0) + BEAT_FREQ_GAP).toLocaleString()} Hz</p>
                    <p className="text-xs text-pink-500">{telemetry?.ch2_current_ma?.toFixed(2) || '0.00'} mA</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 text-center col-span-2">
                    <p className="text-xs text-gray-500">{t('dashboard.intensity')}</p>
                    <p className="text-2xl font-bold text-success">{telemetry?.intensity_pct || 0}%</p>
                  </div>
                </div>

                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-3 text-center text-xs text-yellow-700">
                  <strong>Beat Frequency:</strong> {BEAT_FREQ_GAP} Hz (Interferential)
                </div>

                {/* Controls */}
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">CH1: <strong className="text-primary">{manualFreq} Hz</strong></label>
                      <div className="flex gap-1">
                        <button onClick={() => adjust('freq', -1000)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><FiArrowDown size={14} /></button>
                        <button onClick={() => adjust('freq', 1000)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><FiArrowUp size={14} /></button>
                      </div>
                    </div>
                    <input type="range" min="100" max="40000" step="100" value={manualFreq} onChange={(e) => setManualFreq(parseInt(e.target.value))} className="w-full accent-primary" />
                    <p className="text-xs text-pink-500 mt-1">→ CH2: {ch2Frequency} Hz</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">Intensity: <strong className="text-success">{manualIntensity}%</strong></label>
                      <div className="flex gap-1">
                        <button onClick={() => adjust('intensity', -5)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><FiArrowDown size={14} /></button>
                        <button onClick={() => adjust('intensity', 5)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><FiArrowUp size={14} /></button>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={manualIntensity} onChange={(e) => setManualIntensity(parseInt(e.target.value))} className="w-full accent-success" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Duration: {sessionDuration/60} min</label>
                    <select value={sessionDuration} onChange={(e) => setSessionDuration(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50">
                      {[5,10,15,20,30].map(m => <option key={m} value={m*60}>{m} min</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Disease</label>
                    <input type="text" value={disease} onChange={(e) => setDisease(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50" />
                  </div>
                </div>

                <button
                  onClick={sendParams}
                  disabled={!wsConnected || sendingParams}
                  className={`w-full mt-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                    wsConnected && !sendingParams ? 'bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {sendingParams ? <><FiRefreshCw className="animate-spin" /> Sending...</> : <><FiSend /> {t('dashboard.startTherapy')}</>}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">⚠️ Confirm on device popup (press START)</p>

                <div className="mt-4 p-3 rounded-xl bg-gray-50 flex items-center justify-between">
                  <span className="text-sm text-gray-500">🤖 AI:</span>
                  <span className="font-bold text-lg" style={{ color: aiColors[aiClass] }}>{aiLabels[aiClass]}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-50">
                <h3 className="font-semibold flex items-center gap-2 mb-4"><FiSmile className="text-accent" /> {t('dashboard.painLevel')}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">😊</span>
                  <input type="range" min="0" max="10" value={painLevel} onChange={(e) => setPainLevel(parseInt(e.target.value))} className="flex-1 accent-primary" />
                  <span className="text-2xl">😰</span>
                </div>
                <div className="text-center mb-3"><span className="font-bold text-2xl text-primary">{painLevel}/10</span></div>
                <button onClick={sendPain} disabled={sendingPain} className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-2.5 rounded-xl font-medium disabled:opacity-50">
                  {sendingPain ? 'Sending...' : <><FiSend className="inline mr-2" /> {t('dashboard.logPain')}</>}
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-soft p-4">
                <div className="flex items-center gap-2 text-primary mb-1"><FaRobot size={18} /><span className="font-semibold text-sm">{t('dashboard.aiCoachSays')}</span></div>
                <p className="text-sm text-gray-700">
                  {aiClass === 2 ? '📈 Try increasing intensity slightly.' : aiClass === 0 ? '📉 Consider reducing intensity.' : aiClass === 3 ? '⚠️ Abnormal detected.' : '✨ Great job!'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;