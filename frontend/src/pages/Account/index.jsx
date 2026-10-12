import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { FiUser, FiMail, FiShield, FiGlobe, FiLogOut } from 'react-icons/fi';

const Account = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name:'', email:'' });

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name || '', email: user.email || '' });
  }, [user]);

  const save = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch('http://localhost:8000/api/auth/update', {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setEditing(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('account.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-soft border p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{t('account.profile')}</h3>
              <button onClick={() => editing ? save() : setEditing(true)} className="text-primary text-sm">{editing ? t('account.save') : t('account.editProfile')}</button>
            </div>

            <div className="space-y-4">
              {[
                { icon: FiUser, label: t('account.fullName'), key:'full_name' },
                { icon: FiUser, label: t('account.username'), value: user?.username, disabled: true },
                { icon: FiMail, label: t('account.email'), key:'email' },
                { icon: FiShield, label: t('account.role'), value: user?.role, disabled: true },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
                  <div className="relative">
                    <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    {editing && f.key ? (
                      <input type="text" value={form[f.key]} onChange={(e)=>setForm({...form, [f.key]:e.target.value})} className="w-full pl-10 pr-4 py-2.5 border rounded-xl bg-gray-50" />
                    ) : (
                      <div className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${f.disabled ? 'bg-gray-100 text-gray-500' : 'bg-gray-50'}`}>{f.value || user?.[f.key] || '—'}</div>
                    )}
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('account.language')}</label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select value={currentLanguage} onChange={(e)=>changeLanguage(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl bg-gray-50">
                    <option value="en">{t('account.english')}</option>
                    <option value="kn">{t('account.kannada')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button onClick={() => { logout(); window.location.href='/'; }} className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl font-medium hover:bg-red-100 flex items-center justify-center gap-2">
                <FiLogOut /> {t('account.logout')}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Account;