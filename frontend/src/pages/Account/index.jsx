import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { FiUser, FiMail, FiCalendar, FiShield, FiSave, FiEdit2, FiGlobe } from 'react-icons/fi';

const Account = () => {
  const { user } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        setEditing(false);
        // Refresh user data
        const userData = await res.json();
        // Update context if needed
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('account.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-secondary">{t('account.profile')}</h3>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-primary hover:text-blue-700 flex items-center gap-2 text-sm"
                >
                  <FiEdit2 size={16} />
                  {editing ? t('account.cancel') : t('account.editProfile')}
                </button>
              </div>

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                  ✅ {t('common.success')}
                </div>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('account.fullName')}</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    {editing ? (
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary bg-gray-50"
                      />
                    ) : (
                      <div className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-gray-700">
                        {user?.full_name || '—'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('account.username')}</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-gray-500">
                      {user?.username}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('account.email')}</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary bg-gray-50"
                      />
                    ) : (
                      <div className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-gray-700">
                        {user?.email || '—'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('account.role')}</label>
                  <div className="relative">
                    <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-gray-500 capitalize">
                      {user?.role || 'User'}
                    </div>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('account.language')}</label>
                  <div className="relative">
                    <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={currentLanguage}
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary bg-gray-50"
                    >
                      <option value="en">{t('account.english')}</option>
                      <option value="kn">{t('account.kannada')}</option>
                    </select>
                  </div>
                </div>

                {/* Member Since */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('account.memberSince')}</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-gray-500">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition font-medium"
                    >
                      {t('account.cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-primary to-blue-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : <><FiSave size={18} /> {t('account.save')}</>}
                    </button>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { window.location.href = '/' }}
                  className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl font-medium hover:bg-red-100 transition"
                >
                  {t('account.logout')}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Account;