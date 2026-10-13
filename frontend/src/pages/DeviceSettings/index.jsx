import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { FiSave, FiRefreshCw, FiCheckCircle, FiXCircle, FiWifi, FiServer } from 'react-icons/fi';

const DeviceSettings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    mqtt_broker: '',
    mqtt_port: 1883,
    mqtt_username: '',
    mqtt_password: '',
    wifi_ssid: '',
    wifi_password: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setSaveStatus(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveStatus({ type: 'success', message: t('settings.saved') });
      } else {
        setSaveStatus({ type: 'error', message: t('common.error') });
      }
    } catch (e) {
      setSaveStatus({ type: 'error', message: t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const handleTestMqtt = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/settings/test_mqtt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mqtt_broker: settings.mqtt_broker,
          mqtt_port: settings.mqtt_port,
          mqtt_username: settings.mqtt_username,
          mqtt_password: settings.mqtt_password,
        }),
      });
      const data = await res.json();
      setTestStatus(data);
    } catch (e) {
      setTestStatus({ success: false, message: t('settings.testFail') });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">{t('common.loading')}</div>;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('settings.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-50 p-6">
              <h3 className="text-lg font-semibold text-secondary mb-4">{t('settings.deviceConfig')}</h3>

              {saveStatus && (
                <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
                  saveStatus.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {saveStatus.type === 'success' ? <FiCheckCircle /> : <FiXCircle />}
                  {saveStatus.message}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* WiFi Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <FiWifi className="text-primary" /> {t('settings.wifiConfig')}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">{t('settings.ssid')}</label>
                      <input
                        type="text"
                        name="wifi_ssid"
                        value={settings.wifi_ssid}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">{t('settings.password')}</label>
                      <input
                        type="password"
                        name="wifi_password"
                        value={settings.wifi_password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                {/* MQTT Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                    <FiServer className="text-primary" /> {t('settings.mqttConfig')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">{t('settings.broker')}</label>
                      <input
                        type="text"
                        name="mqtt_broker"
                        value={settings.mqtt_broker}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">{t('settings.port')}</label>
                      <input
                        type="number"
                        name="mqtt_port"
                        value={settings.mqtt_port}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">{t('settings.username')}</label>
                      <input
                        type="text"
                        name="mqtt_username"
                        value={settings.mqtt_username}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">{t('settings.password')}</label>
                      <input
                        type="password"
                        name="mqtt_password"
                        value={settings.mqtt_password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <FiSave size={18} />
                    {saving ? t('common.loading') : t('settings.save')}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestMqtt}
                    disabled={testing}
                    className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <FiRefreshCw size={18} className={testing ? 'animate-spin' : ''} />
                    {testing ? t('common.loading') : t('settings.test')}
                  </button>
                  <button
                    type="button"
                    onClick={fetchSettings}
                    className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <FiRefreshCw size={18} /> {t('settings.reload')}
                  </button>
                </div>

                {testStatus && (
                  <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
                    testStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {testStatus.success ? <FiCheckCircle /> : <FiXCircle />}
                    {testStatus.success ? t('settings.testSuccess') : t('settings.testFail')}
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DeviceSettings;