import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { FiSave, FiRefreshCw, FiCheckCircle, FiXCircle, FiWifi, FiServer } from 'react-icons/fi';
import apiClient from '../../services/api/client';

const DeviceSettings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({ mqtt_broker:'', mqtt_port:1883, mqtt_username:'', mqtt_password:'', wifi_ssid:'', wifi_password:'' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/settings');
      setSettings(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const change = (e) => setSettings({...settings, [e.target.name]: e.target.value});

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/settings', settings);
      setSaveStatus({ type:'success', text: t('settings.saved') });
    } catch { setSaveStatus({ type:'error', text: t('common.error') }); }
    setSaving(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const testConn = async () => {
    setTesting(true);
    try {
      const { data } = await apiClient.post('/settings/test_mqtt', {
        mqtt_broker: settings.mqtt_broker,
        mqtt_port: settings.mqtt_port,
        mqtt_username: settings.mqtt_username,
        mqtt_password: settings.mqtt_password,
      });
      setTestStatus(data);
    } catch { setTestStatus({ success:false, message:'Failed' }); }
    setTesting(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">{t('common.loading')}</div>;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('settings.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-soft border p-6">
            <h3 className="text-lg font-semibold mb-4">{t('settings.deviceConfig')}</h3>
            {saveStatus && <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${saveStatus.type==='success'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{saveStatus.type==='success'?<FiCheckCircle />:<FiXCircle />}{saveStatus.text}</div>}
            <form onSubmit={save} className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium flex items-center gap-2 mb-3"><FiWifi className="text-primary" /> {t('settings.wifiConfig')}</h4>
                <div className="grid gap-3">
                  <div><label className="block text-sm font-medium mb-1">{t('settings.ssid')}</label><input type="text" name="wifi_ssid" value={settings.wifi_ssid} onChange={change} className="w-full px-4 py-2.5 border rounded-xl bg-white" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('settings.password')}</label><input type="password" name="wifi_password" value={settings.wifi_password} onChange={change} className="w-full px-4 py-2.5 border rounded-xl bg-white" /></div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium flex items-center gap-2 mb-3"><FiServer className="text-primary" /> {t('settings.mqttConfig')}</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {[['mqtt_broker','Broker IP','text'],['mqtt_port','Port','number'],['mqtt_username','Username','text'],['mqtt_password','Password','password']].map(([n,l,ty]) => (
                    <div key={n}><label className="block text-sm font-medium mb-1">{l}</label><input type={ty} name={n} value={settings[n]} onChange={change} className="w-full px-4 py-2.5 border rounded-xl bg-white" /></div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"><FiSave /> {saving ? t('common.loading') : t('settings.save')}</button>
                <button type="button" onClick={testConn} disabled={testing} className="border px-6 py-2.5 rounded-xl flex items-center gap-2"><FiRefreshCw className={testing?'animate-spin':''} /> {testing ? 'Testing...' : t('settings.test')}</button>
                <button type="button" onClick={fetchSettings} className="border px-6 py-2.5 rounded-xl flex items-center gap-2"><FiRefreshCw /> {t('settings.reload')}</button>
              </div>
              {testStatus && <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${testStatus.success?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{testStatus.success?<FiCheckCircle />:<FiXCircle />}{testStatus.message}</div>}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DeviceSettings;