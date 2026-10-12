import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import wsService from '../../services/websocket/client';
import { FiFileText, FiImage, FiCamera, FiUpload, FiSend, FiCheckCircle, FiRefreshCw, FiTrash2, FiEye, FiAlertCircle } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

const ImagingReports = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState('report');
  const [form, setForm] = useState({
    studentName:'', class:'', rollNo:'', date: new Date().toISOString().split('T')[0],
    painType:'Acute', painSubType:'Acute < 100 Hz', painDuration:'2 min',
    painRadiating:'Radiating', patientName:'', patientAge:'', patientGender:'Male', patientOccupation:'',
  });
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [camera, setCamera] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const upload = (e) => {
    const files = Array.from(e.target.files);
    const newImgs = files.map(f => ({ id: Date.now()+Math.random(), file:f, name:f.name, url: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...newImgs]);
    if (newImgs.length > 0) setSelected(newImgs[0]);
  };

  const remove = (id) => {
    setImages(imgs => imgs.filter(i => i.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }});
      setCamera(true);
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch { alert('Camera denied'); }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const c = canvasRef.current, v = videoRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type:'image/jpeg' });
      const img = { id: Date.now(), file, name:file.name, url: URL.createObjectURL(blob) };
      setImages(p => [...p, img]); setSelected(img); stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setCamera(false);
    }
  };

  const runAI = async () => {
    if (!selected) { alert('Upload an image first'); return; }
    setAnalyzing(true); setAiResult(null); setSendStatus(null);
    try {
      const token = localStorage.getItem('access_token');
      const fd = new FormData();
      fd.append('file', selected.file);
      fd.append('patient_id', '1');
      fd.append('modality', 'MRI');

      let res = await fetch('http://localhost:8000/api/segmentation/analyze', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (res.status === 404) {
        res = await fetch('http://localhost:8000/api/imaging/analyze', {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
      }
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();

      const formatted = {
        modality: data.modality || 'MRI',
        findings: data.findings || 'Analysis complete',
        confidence: data.confidence || 0,
        predicted_class: data.predicted_class || 'unknown',
        abnormalities: data.abnormalities || [],
        recommendation: data.recommendation || '',
        top3: data.top3_predictions || [],
        therapy: data.therapy_recommendation || { frequency:4000, intensity:35, duration:600, disease:'General' },
      };
      setAiResult(formatted);
      setRecommendation({ ...formatted.therapy, explanation: formatted.findings });
    } catch (err) {
      alert('AI failed: ' + err.message);
    } finally { setAnalyzing(false); }
  };

  const sendToDevice = () => {
    if (!recommendation) { alert('Run AI first'); return; }
    if (!wsService.isConnected()) {
      setSendStatus({ type:'error', text:'❌ Not connected' });
      setTimeout(() => setSendStatus(null), 3000);
      return;
    }
    setSending(true);
    const disease = form.patientName ? `${form.painType} - ${form.patientName}` : `${form.painType} Pain`;
    const ok = wsService.sendTherapyParams(recommendation.frequency, recommendation.intensity, recommendation.duration, disease);
    setSendStatus(ok ? { type:'success', text:'✅ Sent! Confirm on device.' } : { type:'error', text:'❌ Failed' });
    setTimeout(() => setSendStatus(null), 5000);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('imaging.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setTab('report')} className={`px-4 py-2 rounded-lg font-medium ${tab==='report'?'bg-primary text-white':'bg-white text-gray-600'}`}><FiFileText className="inline mr-2" /> {t('imaging.report')}</button>
            <button onClick={() => setTab('imaging')} className={`px-4 py-2 rounded-lg font-medium ${tab==='imaging'?'bg-primary text-white':'bg-white text-gray-600'}`}><FiImage className="inline mr-2" /> {t('imaging.imaging')}</button>
          </div>

          {tab === 'report' && (
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold mb-4">{t('imaging.report')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 border-b pb-2"><h4 className="font-medium text-primary">{t('imaging.studentInfo')}</h4></div>
                {['studentName','class','rollNo'].map(n => (
                  <div key={n}>
                    <label className="block text-sm font-medium">{t('imaging.'+n)}</label>
                    <input name={n} value={form[n]} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium">{t('imaging.date')}</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2 border-b pb-2"><h4 className="font-medium text-primary">{t('imaging.painAssessment')}</h4></div>
                <div>
                  <label className="block text-sm font-medium">{t('imaging.painType')}</label>
                  <select name="painType" value={form.painType} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"><option>Acute</option><option>Chronic</option></select>
                </div>
                <div>
                  <label className="block text-sm font-medium">{t('imaging.painSubType')}</label>
                  <select name="painSubType" value={form.painSubType} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                    <option>Acute &lt; 100 Hz</option><option>Subacute &lt; 150 Hz</option><option>Chronic &lt; 250 Hz</option>
                  </select>
                </div>
                <div className="md:col-span-2 border-b pb-2"><h4 className="font-medium text-primary">{t('imaging.patientDemographics')}</h4></div>
                <div><label className="block text-sm font-medium">{t('imaging.patientName')}</label><input name="patientName" value={form.patientName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium">{t('imaging.patientAge')}</label><input type="number" name="patientAge" value={form.patientAge} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium">{t('imaging.patientGender')}</label><select name="patientGender" value={form.patientGender} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg"><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div><label className="block text-sm font-medium">{t('imaging.occupation')}</label><input name="patientOccupation" value={form.patientOccupation} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <button onClick={() => alert('Saved')} className="mt-4 bg-primary text-white px-6 py-2 rounded-lg">{t('imaging.saveReport')}</button>
            </div>
          )}

          {tab === 'imaging' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><FiUpload /> {t('imaging.uploadImage')}</h3>
                  <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary">
                    <FiImage className="mx-auto text-gray-400" size={48} />
                    <p className="text-sm text-gray-500 mt-2">{t('imaging.dropHere')}</p>
                    <input ref={fileRef} type="file" accept="image/*" multiple onChange={upload} className="hidden" />
                  </div>
                  <button onClick={startCamera} className="w-full mt-3 bg-gray-100 py-2 rounded-lg flex items-center justify-center gap-2"><FiCamera /> {t('imaging.takePhoto')}</button>
                  {images.length > 0 && (
                    <ul className="mt-4 space-y-1">
                      {images.map(i => (
                        <li key={i.id} onClick={() => setSelected(i)} className={`flex justify-between items-center p-1 rounded cursor-pointer ${selected?.id===i.id?'bg-primary/10':'hover:bg-gray-50'}`}>
                          <span className="text-xs truncate max-w-[120px]">{i.name}</span>
                          <button onClick={(e)=>{e.stopPropagation(); remove(i.id);}} className="text-red-500"><FiTrash2 size={14} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><FaRobot /> {t('imaging.aiAnalysis')}</h3>
                  <button onClick={runAI} disabled={!selected || analyzing} className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${!selected||analyzing?'bg-gray-200':'bg-primary text-white'}`}>
                    {analyzing ? <><FiRefreshCw className="animate-spin" /> {t('imaging.analyzing')}</> : t('imaging.runAi')}
                  </button>
                  {aiResult && <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm"><FiCheckCircle className="text-green-600 inline mr-1" />{aiResult.confidence}% confidence</div>}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {camera && (
                  <div className="bg-white rounded-xl shadow-soft p-6 border-2 border-primary">
                    <h3 className="font-semibold mb-2"><FiCamera /> Camera</h3>
                    <video ref={videoRef} className="w-full max-h-72 rounded bg-black" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-3 mt-3">
                      <button onClick={capture} className="flex-1 bg-success text-white py-2 rounded-lg">Capture</button>
                      <button onClick={stopCamera} className="flex-1 bg-danger text-white py-2 rounded-lg">Stop</button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold mb-3"><FiEye /> {t('imaging.imagePreview')}</h3>
                  {selected ? <img src={selected.url} alt={selected.name} className="w-full max-h-72 object-contain rounded-lg" /> : <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">{t('imaging.noImage')}</div>}
                </div>

                {aiResult && (
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <h3 className="font-semibold mb-3"><FaRobot /> {t('imaging.aiFindings')}</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>{t('imaging.modality')}:</strong> {aiResult.modality}</div>
                      <div><strong>{t('imaging.findings')}:</strong> {aiResult.findings}</div>
                      <div><strong>{t('imaging.abnormalities')}:</strong> {aiResult.abnormalities.join(', ') || 'None'}</div>
                      {aiResult.top3.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="font-medium mb-1">Top 3:</p>
                          {aiResult.top3.map((p,i) => <div key={i} className="flex justify-between text-xs"><span>{p.class}</span><span>{p.confidence}%</span></div>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {recommendation && (
                  <div className="bg-white rounded-xl shadow-soft p-6 border-l-4 border-success">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><FiSend /> {t('imaging.therapyRecommendation')}</h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-blue-50 rounded"><p className="text-xs text-gray-500">Frequency</p><p className="text-xl font-bold text-primary">{recommendation.frequency} Hz</p></div>
                      <div className="p-2 bg-green-50 rounded"><p className="text-xs text-gray-500">Intensity</p><p className="text-xl font-bold text-success">{recommendation.intensity}%</p></div>
                      <div className="p-2 bg-orange-50 rounded"><p className="text-xs text-gray-500">Duration</p><p className="text-xl font-bold text-warning">{Math.round(recommendation.duration/60)} min</p></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">{recommendation.explanation}</p>
                    {sendStatus && <div className={`mt-3 p-2 rounded-lg text-sm ${sendStatus.type==='success'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{sendStatus.text}</div>}
                    <button onClick={sendToDevice} disabled={sending} className={`w-full mt-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${sending?'bg-gray-300':'bg-success text-white'}`}>
                      {sending ? <><FiRefreshCw className="animate-spin" /> Sending...</> : <><FiSend /> {t('imaging.sendToDevice')}</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ImagingReports;