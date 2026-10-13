import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMQTT } from '../../hooks/useMQTT';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { 
  FiClock, FiActivity, FiSmile, FiSend, FiUser, FiZap, 
  FiArrowUp, FiArrowDown, FiRefreshCw 
} from 'react-icons/fi';
import { FaRobot, FaHeartbeat } from 'react-icons/fa';

const BEAT_FREQ_GAP = 100;  // Must match ESP32 firmware

const Dashboard = () => {
  const { t } = useTranslation();
  
  // ─── MQTT Subscriptions ──────────────────────────────────────
  const { data: telemetry, connected: mqttConnected, sendTherapyParams, sendFeedback, sendControl } = useMQTT('ift/telemetry', {
    state: 3,
    frequency_hz: 4000,
    intensity_pct: 35,
    ch1_current_ma: 0,
    ch2_current_ma: 0,
    ch1_rms_ma: 0,
    ch2_rms_ma: 0,
    session_elapsed: 0,
    session_total: 600,
    ai_decision: 1,
    estop: false,
    fault: false,
    ch1_enabled: true,
    ch2_enabled: true,
  });

  const { data: status } = useMQTT('ift/status', { status: 'ready' });
  const { data: aiDecision } = useMQTT('ift/ai_decision', { decision: 'MAINTAIN', class: 1 });

  // ─── Local State ──────────────────────────────────────────────
  const [painLevel, setPainLevel] = useState(5);
  const [sendingPain, setSendingPain] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [manualFreq, setManualFreq] = useState(4000);
  const [manualIntensity, setManualIntensity] = useState(35);
  const [sessionDuration, setSessionDuration] = useState(600);
  const [disease, setDisease] = useState('Lumbar Disc Herniation');
  const [sendingParams, setSendingParams] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // ─── Compute Values ───────────────────────────────────────────
  const isReady = telemetry?.state === 3;
  const isRunning = telemetry?.state === 4;
  const progress = telemetry?.session_total
    ? ((telemetry.session_elapsed || 0) / telemetry.session_total * 100)
    : 0;

  const remain = telemetry?.session_total - (telemetry?.session_elapsed || 0);
  const minutes = Math.floor(Math.max(0, remain) / 60);
  const seconds = Math.floor(Math.max(0, remain) % 60);
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  // Compute CH2 frequency (CH1 + BEAT)
  const ch2Frequency = manualFreq + BEAT_FREQ_GAP;

  const aiLabels = ['REDUCE', 'MAINTAIN', 'INCREASE', 'ABNORMAL'];
  const aiColors = ['#F2994A', '#27AE60', '#2D9CDB', '#EB5757'];
  const aiLabel = aiDecision?.decision || aiLabels[telemetry?.ai_decision || 1] || 'MAINTAIN';
  const aiClass = aiDecision?.class !== undefined ? aiDecision.class : telemetry?.ai_decision || 1;

  // ─── Send Parameters ─────────────────────────────────────────
  const sendManualParams = () => {
    if (!mqttConnected) {
      setFeedbackMessage({ type: 'error', text: '⚠️ MQTT not connected' });
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    setSendingParams(true);
    const success = sendTherapyParams(manualFreq, manualIntensity, sessionDuration, disease);
    
    if (success) {
      setFeedbackMessage({ 
        type: 'success', 
        text: '✅ Parameters sent! Confirm on device (Press START)' 
      });
      setSessionStarted(true);
    } else {
      setFeedbackMessage({ type: 'error', text: '❌ Failed to send' });
    }
    
    setTimeout(() => setFeedbackMessage(null), 5000);
    setSendingParams(false);
  };

  const sendPainFeedback = async () => {
    setSendingPain(true);
    try {
      sendFeedback(painLevel, null);
      setFeedbackMessage({ type: 'success', text: '✅ Pain logged!' });
      setTimeout(() => setFeedbackMessage(null), 2000);
    } catch {
      setFeedbackMessage({ type: 'error', text: '❌ Failed' });
    }
    setSendingPain(false);
  };

  const quickAdjust = (type, amount) => {
    if (type === 'freq') {
      const newVal = Math.min(Math.max(manualFreq + amount, 100), 40000);
      setManualFreq(newVal);
      if (isRunning) sendControl('frequency', newVal);
    } else if (type === 'intensity') {
      const newVal = Math.min(Math.max(manualIntensity + amount, 0), 100);
      setManualIntensity(newVal);
      if (isRunning) sendControl('intensity', newVal);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('dashboard.title')} mqttConnected={mqttConnected} />
        <main className="flex-1 p-6 overflow-y-auto">
          
          {feedbackMessage && (
            <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
              feedbackMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {feedbackMessage.text}
            </div>
          )}

          {/* ─── Channel Status ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6 flex flex-wrap items-center gap-4 border border-gray-50">
            <span className="font-medium text-gray-700">🔌 Channels:</span>
            <span className={`text-sm ${telemetry?.ch1_enabled ? 'text-green-600' : 'text-gray-400'}`}>
              CH1 {telemetry?.ch1_enabled ? '✅' : '❌'}
            </span>
            <span className={`text-sm ${telemetry?.ch2_enabled ? 'text-green-600' : 'text-gray-400'}`}>
              CH2 {telemetry?.ch2_enabled ? '✅' : '❌'}
            </span>
            <span className={`ml-auto text-sm ${mqttConnected ? 'text-green-600' : 'text-red-500'}`}>
              {mqttConnected ? '🔗 MQTT Connected' : '🔗 MQTT Disconnected'}
            </span>
            <span className="text-sm text-gray-500">
              {status?.status === 'running' ? '🟢 Running' : 
               status?.status === 'ready' ? '🔵 Ready' : 
               status?.status === 'emergency' ? '🔴 Emergency' : '⚪ Idle'}
            </span>
          </div>

          {/* ─── Session Progress ────────────────────────────────── */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-soft p-6 mb-6">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
                <FiClock className="text-primary" /> {t('dashboard.sessionProgress')}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isRunning ? 'bg-green-100 text-green-700' : 
                isReady ? 'bg-blue-100 text-blue-700' : 
                'bg-gray-100 text-gray-500'
              }`}>
                {isRunning ? '🟢 Running' : isReady ? '🔵 Ready' : '⚪ Inactive'}
              </span>
            </div>
            <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(progress, 100)}%` }} 
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{Math.round(progress)}% complete</span>
              <span className="font-mono font-medium">{timeStr} remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-50">
                <h3 className="font-semibold text-secondary flex items-center gap-2 mb-4">
                  <FiZap className="text-primary" /> {t('dashboard.currentTherapy')}
                </h3>

                {/* ─── Dual Channel Display ──────────────────────── */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* CH1 */}
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-3 border border-cyan-200">
                    <p className="text-xs text-cyan-700 font-medium">CH1 (Base)</p>
                    <p className="text-xl font-bold text-cyan-600">
                      {telemetry?.frequency_hz?.toLocaleString() || 0} Hz
                    </p>
                    <p className="text-xs text-cyan-500">
                      {telemetry?.ch1_current_ma?.toFixed(2) || '0.00'} mA
                    </p>
                  </div>
                  {/* CH2 */}
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-3 border border-pink-200">
                    <p className="text-xs text-pink-700 font-medium">CH2 (Beat)</p>
                    <p className="text-xl font-bold text-pink-600">
                      {((telemetry?.frequency_hz || 0) + BEAT_FREQ_GAP).toLocaleString()} Hz
                    </p>
                    <p className="text-xs text-pink-500">
                      {telemetry?.ch2_current_ma?.toFixed(2) || '0.00'} mA
                    </p>
                  </div>
                  {/* Intensity */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 text-center col-span-2">
                    <p className="text-xs text-gray-500">{t('dashboard.intensity')}</p>
                    <p className="text-2xl font-bold text-success">
                      {telemetry?.intensity_pct || 0}%
                    </p>
                  </div>
                </div>

                {/* ─── Beat Info ─────────────────────────────────── */}
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-3 text-center">
                  <p className="text-xs text-yellow-700">
                    <strong>Beat Frequency:</strong> {BEAT_FREQ_GAP} Hz (Interferential)
                  </p>
                </div>

                {/* ─── Manual Controls ───────────────────────────── */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-600 mb-3">Manual Adjustment</p>
                  
                  {/* Frequency */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">
                        CH1 Frequency: <span className="font-bold text-primary">{manualFreq} Hz</span>
                      </label>
                      <div className="flex gap-1">
                        <button onClick={() => quickAdjust('freq', -1000)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                          <FiArrowDown size={14} />
                        </button>
                        <button onClick={() => quickAdjust('freq', 1000)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                          <FiArrowUp size={14} />
                        </button>
                      </div>
                    </div>
                    <input type="range" min="100" max="40000" step="100" value={manualFreq}
                      onChange={(e) => setManualFreq(parseInt(e.target.value))}
                      className="w-full accent-primary" />
                    <p className="text-xs text-pink-500 mt-1">
                      → CH2 will be: {ch2Frequency} Hz
                    </p>
                  </div>

                  {/* Intensity */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">
                        Intensity: <span className="font-bold text-success">{manualIntensity}%</span>
                      </label>
                      <div className="flex gap-1">
                        <button onClick={() => quickAdjust('intensity', -5)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                          <FiArrowDown size={14} />
                        </button>
                        <button onClick={() => quickAdjust('intensity', 5)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                          <FiArrowUp size={14} />
                        </button>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={manualIntensity}
                      onChange={(e) => setManualIntensity(parseInt(e.target.value))}
                      className="w-full accent-success" />
                  </div>

                  {/* Duration */}
                  <div className="mb-3">
                    <label className="text-sm text-gray-500 block mb-1">
                      Duration: <span className="font-bold text-purple-600">{sessionDuration / 60} min</span>
                    </label>
                    <select value={sessionDuration} onChange={(e) => setSessionDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary bg-gray-50">
                      <option value="300">5 min</option>
                      <option value="600">10 min</option>
                      <option value="900">15 min</option>
                      <option value="1200">20 min</option>
                      <option value="1800">30 min</option>
                    </select>
                  </div>

                  {/* Disease */}
                  <div className="mb-3">
                    <label className="text-sm text-gray-500 block mb-1">Disease / Condition</label>
                    <input type="text" value={disease} onChange={(e) => setDisease(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50" />
                  </div>
                </div>

                <button
                  onClick={sendManualParams}
                  disabled={!mqttConnected || sendingParams}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                    mqttConnected && !sendingParams
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {sendingParams ? <><FiRefreshCw className="animate-spin" /> Sending...</> : <><FiSend size={18} /> Send to Device</>}
                </button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  ⚠️ Device will show a popup. Press START on device to confirm.
                </p>

                {/* AI Decision */}
                <div className="mt-4 p-3 rounded-xl bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm text-gray-500">🤖 AI:</span>
                  <span className="font-bold text-lg" style={{ color: aiColors[aiClass] || '#2D9CDB' }}>
                    {aiLabel}
                  </span>
                  <span className="text-xs text-gray-400">85%</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-50">
                <h3 className="font-semibold text-secondary flex items-center gap-2 mb-4">
                  <FiSmile className="text-accent" /> How's your pain?
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">😊</span>
                  <input type="range" min="0" max="10" value={painLevel} 
                    onChange={(e) => setPainLevel(parseInt(e.target.value))} className="flex-1 accent-primary" />
                  <span className="text-2xl">😰</span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-2xl text-primary">{painLevel}/10</span>
                </div>
                <button onClick={sendPainFeedback} disabled={sendingPain}
                  className="w-full mt-3 bg-gradient-to-r from-primary to-blue-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg disabled:opacity-50">
                  {sendingPain ? 'Sending...' : <><FiSend className="inline mr-2" /> Log Pain</>}
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-soft p-4">
                <div className="flex items-center gap-2 text-primary">
                  <FaRobot size={18} />
                  <span className="font-semibold text-sm">AI Coach</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {aiClass === 2 ? '📈 Try increasing intensity slightly.'
                  : aiClass === 0 ? '📉 Consider reducing intensity.'
                  : aiClass === 3 ? '⚠️ Abnormal pattern detected.'
                  : '✨ You\'re doing great!'}
                </p>
              </div>

              {/* Quick Presets */}
              <div className="bg-white rounded-2xl shadow-soft p-4 border border-gray-50">
                <p className="text-xs text-gray-500 mb-2">Quick Presets:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { f: 4000, i: 35 },
                    { f: 6000, i: 40 },
                    { f: 8000, i: 50 },
                    { f: 10000, i: 30 },
                  ].map((p, idx) => (
                    <button key={idx}
                      onClick={() => { setManualFreq(p.f); setManualIntensity(p.i); }}
                      className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                      {p.f/1000}kHz / {p.i}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Fault Indicators */}
              {telemetry?.fault && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-red-700 font-medium">⚠️ Fault Detected!</p>
                </div>
              )}
              {telemetry?.estop && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <p className="text-orange-700 font-medium">⛔ Emergency Stop!</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;