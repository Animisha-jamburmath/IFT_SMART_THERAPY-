import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { FiWifi, FiWifiOff, FiGlobe, FiChevronDown, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';

const Topbar = ({ title, mqttConnected = true }) => {
  const { user, logout } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [showLang, setShowLang] = useState(false);
  const [showUser, setShowUser] = useState(false);

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between border-b border-gray-200">
      <h2 className="text-xl font-semibold text-secondary">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          {mqttConnected ? <><FiWifi className="text-green-500" /> <span className="text-gray-600">{t('dashboard.mqttConnected')}</span></> :
            <><FiWifiOff className="text-red-500" /> <span className="text-gray-600">{t('dashboard.mqttDisconnected')}</span></>}
        </div>
        <div className="relative">
          <button onClick={() => setShowLang(!showLang)} className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm hover:bg-gray-200">
            <FiGlobe size={16} />
            <span>{currentLanguage === 'en' ? 'EN' : 'ಕನ್ನಡ'}</span>
            <FiChevronDown size={14} />
          </button>
          {showLang && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <button onClick={() => { changeLanguage('en'); setShowLang(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">🇬🇧 English</button>
              <button onClick={() => { changeLanguage('kn'); setShowLang(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">🇮🇳 ಕನ್ನಡ</button>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setShowUser(!showUser)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium hidden md:block">{user?.full_name || user?.username}</span>
            <FiChevronDown size={14} />
          </button>
          {showUser && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium">{user?.full_name || user?.username}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <Link to="/account" onClick={() => setShowUser(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"><FiUser size={16} /> {t('account.profile')}</Link>
              <Link to="/settings" onClick={() => setShowUser(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"><FiSettings size={16} /> {t('nav.settings')}</Link>
              <button onClick={() => { logout(); window.location.href = '/'; }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full border-t border-gray-100">
                <FiLogOut size={16} /> {t('account.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;