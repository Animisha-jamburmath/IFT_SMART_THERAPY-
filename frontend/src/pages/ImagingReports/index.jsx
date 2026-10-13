import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import {
  FiFileText, FiImage, FiCamera, FiUpload, FiSend, FiCheckCircle,
  FiRefreshCw, FiTrash2, FiEye
} from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

const ImagingReports = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('report');

  const [formData, setFormData] = useState({
    studentName: '',
    class: '',
    rollNo: '',
    date: new Date().toISOString().split('T')[0],
    painType: 'Acute',
    painSubType: 'Acute < 100 Hz',
    painDuration: '2 min',
    painRadiating: 'Radiating',
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    patientOccupation: '',
  });

  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [recommendation, setRecommendation] = useState(null);
  const [sending, setSending] = useState(false);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setImages([...images, ...newImages]);
    if (newImages.length > 0) setSelectedImage(newImages[0]);
  };

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
    if (selectedImage?.id === id) {
      setSelectedImage(images.length > 1 ? images.find(img => img.id !== id) : null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert(t('common.error'));
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const newImage = {
          id: Date.now(),
          file,
          name: `capture-${Date.now()}.jpg`,
          url: URL.createObjectURL(blob),
          type: 'image/jpeg',
        };
        setImages([...images, newImage]);
        setSelectedImage(newImage);
        stopCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const runAIAnalysis = () => {
    if (!selectedImage) {
      alert(t('imaging.noImage'));
      return;
    }
    setIsAnalyzing(true);
    setAiResult(null);
    setTimeout(() => {
      const mockResult = {
        modality: selectedImage.name.includes('MRI') ? 'MRI' : 'X-Ray',
        region: 'Lumbar Spine',
        findings: 'Mild disc degeneration at L4-L5. No acute fracture.',
        confidence: 92.4,
        abnormalities: ['Disc bulging', 'Mild osteoarthritis'],
        recommendation: 'Continue physical therapy. Consider IFT at 4-6 kHz for pain management.'
      };
      setAiResult(mockResult);
      setIsAnalyzing(false);
      generateRecommendation(mockResult);
    }, 2000);
  };

  const generateRecommendation = (aiAnalysis) => {
    const { painType, painSubType, painRadiating } = formData;
    let freq = 4000;
    let intensity = 35;
    let duration = 600;
    let explanation = '';

    if (painType === 'Acute') {
      freq = 4000;
      intensity = 35;
      explanation = t('imaging.acuteExplanation');
    } else if (painType === 'Chronic') {
      freq = 8000;
      intensity = 45;
      explanation = t('imaging.chronicExplanation');
    }

    if (painSubType.includes('100')) freq = 4000;
    else if (painSubType.includes('150')) freq = 6000;
    else if (painSubType.includes('250')) freq = 10000;

    if (painRadiating === 'Radiating') {
      freq += 1000;
      explanation += ' ' + t('imaging.radiatingExplanation');
    }

    if (aiAnalysis?.findings?.toLowerCase().includes('disc')) {
      freq += 500;
      intensity += 5;
      explanation += ' ' + t('imaging.discExplanation');
    }

    freq = Math.min(freq, 40000);
    intensity = Math.min(intensity, 80);

    setRecommendation({ frequency: freq, intensity, duration, explanation });
  };

  const sendToDevice = () => {
    if (!recommendation) return;
    setSending(true);
    const mqtt = require('../../services/mqtt/client').default;
    mqtt.sendTherapyParams(
      recommendation.frequency,
      recommendation.intensity,
      recommendation.duration,
      formData.painType + ' Pain'
    );
    alert(t('imaging.sendSuccess'));
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('imaging.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'report'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiFileText className="inline mr-2" /> {t('imaging.report')}
            </button>
            <button
              onClick={() => setActiveTab('imaging')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'imaging'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiImage className="inline mr-2" /> {t('imaging.imaging')}
            </button>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* TAB 1: REPORT FORM */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'report' && (
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-secondary mb-4">{t('imaging.report')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 border-b border-gray-200 pb-2 mb-2">
                  <h4 className="font-medium text-primary">{t('imaging.studentInfo')}</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.name')}</label>
                  <input name="studentName" value={formData.studentName} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.class')}</label>
                  <input name="class" value={formData.class} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.rollNo')}</label>
                  <input name="rollNo" value={formData.rollNo} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.date')}</label>
                  <input type="date" name="date" value={formData.date} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>

                <div className="md:col-span-2 border-b border-gray-200 pb-2 mb-2">
                  <h4 className="font-medium text-primary">{t('imaging.painAssessment')}</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.painType')}</label>
                  <select name="painType" value={formData.painType} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Acute">{t('imaging.acute')}</option>
                    <option value="Chronic">{t('imaging.chronic')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.painSubType')}</label>
                  <select name="painSubType" value={formData.painSubType} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Acute < 100 Hz">Acute &lt; 100 Hz</option>
                    <option value="Subacute < 150 Hz">Subacute &lt; 150 Hz</option>
                    <option value="Chronic < 250 Hz">Chronic &lt; 250 Hz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.duration')}</label>
                  <select name="painDuration" value={formData.painDuration} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg">
                    <option value="2 min">2 min</option>
                    <option value="5 min">5 min</option>
                    <option value="10 min">10 min</option>
                    <option value="15 min">15 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.radiating')}</label>
                  <select name="painRadiating" value={formData.painRadiating} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Radiating">Radiating</option>
                    <option value="Non-radiating">Non-radiating</option>
                  </select>
                </div>

                <div className="md:col-span-2 border-b border-gray-200 pb-2 mb-2">
                  <h4 className="font-medium text-primary">{t('imaging.patientDemographics')}</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.patientName')}</label>
                  <input name="patientName" value={formData.patientName} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.patientAge')}</label>
                  <input type="number" name="patientAge" value={formData.patientAge} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.patientGender')}</label>
                  <select name="patientGender" value={formData.patientGender} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('imaging.occupation')}</label>
                  <input name="patientOccupation" value={formData.patientOccupation} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => alert(t('imaging.saveSuccess'))}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  {t('imaging.saveReport')}
                </button>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* TAB 2: IMAGING & AI */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'imaging' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold text-secondary flex items-center gap-2 mb-3">
                    <FiUpload /> {t('imaging.uploadImage')}
                  </h3>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary cursor-pointer transition"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiImage className="mx-auto text-gray-400" size={48} />
                    <p className="text-sm text-gray-500 mt-2">{t('imaging.dropHere')}</p>
                    <p className="text-xs text-gray-400">JPEG, PNG, DICOM</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <button
                    onClick={startCamera}
                    className="w-full mt-3 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    <FiCamera /> {t('imaging.takePhoto')}
                  </button>
                  {images.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Uploaded ({images.length})</p>
                      <ul className="space-y-1 max-h-40 overflow-y-auto">
                        {images.map(img => (
                          <li
                            key={img.id}
                            className={`flex items-center justify-between p-1 rounded cursor-pointer ${selectedImage?.id === img.id ? 'bg-primary/10' : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedImage(img)}
                          >
                            <span className="text-xs truncate max-w-[120px]">{img.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} className="text-red-500"><FiTrash2 size={14} /></button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold text-secondary flex items-center gap-2 mb-3">
                    <FaRobot /> {t('imaging.aiAnalysis')}
                  </h3>
                  <button
                    onClick={runAIAnalysis}
                    disabled={!selectedImage || isAnalyzing}
                    className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      !selectedImage || isAnalyzing
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-blue-700'
                    }`}
                  >
                    {isAnalyzing ? <><FiRefreshCw className="animate-spin" /> {t('imaging.analyzing')}</> : t('imaging.runAi')}
                  </button>
                  {aiResult && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                      <p className="font-medium text-green-700"><FiCheckCircle className="inline mr-1" /> {t('common.success')}</p>
                      <p className="text-gray-600">{aiResult.confidence}% confidence</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {cameraActive && (
                  <div className="bg-white rounded-xl shadow-soft p-6 border-2 border-primary">
                    <h3 className="font-semibold text-secondary flex items-center gap-2"><FiCamera /> {t('imaging.takePhoto')}</h3>
                    <video ref={videoRef} className="w-full max-h-72 rounded-lg bg-black" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-3 mt-3">
                      <button onClick={capturePhoto} className="flex-1 bg-success text-white py-2 rounded-lg hover:bg-green-700">Capture</button>
                      <button onClick={stopCamera} className="flex-1 bg-danger text-white py-2 rounded-lg hover:bg-red-700">Stop</button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="font-semibold text-secondary flex items-center gap-2 mb-3">
                    <FiEye /> {t('imaging.imagePreview')}
                  </h3>
                  {selectedImage ? (
                    <img src={selectedImage.url} alt={selectedImage.name} className="w-full max-h-72 object-contain rounded-lg" />
                  ) : (
                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">{t('imaging.noImage')}</div>
                  )}
                </div>

                {aiResult && (
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <h3 className="font-semibold text-secondary flex items-center gap-2 mb-3">
                      <FaRobot /> {t('imaging.aiFindings')}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">{t('imaging.modality')}:</span> {aiResult.modality}</div>
                      <div><span className="font-medium">{t('imaging.findings')}:</span> {aiResult.findings}</div>
                      <div><span className="font-medium">{t('imaging.abnormalities')}:</span> {aiResult.abnormalities.join(', ')}</div>
                      <div className="p-2 bg-blue-50 rounded"><span className="font-medium">{t('imaging.recommendation')}:</span> {aiResult.recommendation}</div>
                    </div>
                  </div>
                )}

                {recommendation && (
                  <div className="bg-white rounded-xl shadow-soft p-6 border-l-4 border-success">
                    <h3 className="font-semibold text-secondary flex items-center gap-2 mb-3">
                      <FiSend /> {t('imaging.therapyRecommendation')}
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-xs text-gray-500">{t('dashboard.frequency')}</p>
                        <p className="text-xl font-bold text-primary">{recommendation.frequency} Hz</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="text-xs text-gray-500">{t('dashboard.intensity')}</p>
                        <p className="text-xl font-bold text-success">{recommendation.intensity}%</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded">
                        <p className="text-xs text-gray-500">{t('sessions.duration')}</p>
                        <p className="text-xl font-bold text-warning">{Math.round(recommendation.duration/60)} min</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">{recommendation.explanation}</p>
                    <button
                      onClick={sendToDevice}
                      disabled={sending}
                      className={`w-full mt-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                        sending ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-success text-white hover:bg-green-700'
                      }`}
                    >
                      {sending ? <><FiRefreshCw className="animate-spin" /> {t('common.loading')}</> : <><FiSend /> {t('imaging.sendToDevice')}</>}
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