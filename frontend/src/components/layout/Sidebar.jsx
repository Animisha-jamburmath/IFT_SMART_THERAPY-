import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiHome, FiActivity, FiSmile, FiSettings, FiHelpCircle, FiImage, FiUser, FiBarChart2 } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isAdmin = user?.role === 'admin' || user?.role === 'clinician';

  const items = [
    { icon: FiHome, label: t('nav.dashboard'), path: '/dashboard' },
    ...(isAdmin ? [{ icon: FiUser, label: t('nav.patients'), path: '/patients' }] : []),
    ...(isAdmin ? [{ icon: FiBarChart2, label: t('nav.sessions'), path: '/sessions' }] : []),
    { icon: FiSmile, label: t('nav.painLog'), path: '/pain-log' },
    { icon: FaRobot, label: t('nav.aiCoach'), path: '/ai' },
    { icon: FiImage, label: t('nav.imaging'), path: '/imaging' },
    { icon: FiSettings, label: t('nav.settings'), path: '/settings' },
    { icon: FiHelpCircle, label: t('nav.help'), path: '/help' },
  ];

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-soft">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-md">I</div>
        <div>
          <span className="text-xl font-bold text-secondary">IFT</span>
          <span className="text-xl font-light text-gray-400">THERAPY</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                active ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-secondary'
              }`}
            >
              <item.icon size={20} className={active ? 'text-primary' : 'text-gray-400'} />
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-8 rounded-full bg-primary"></span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">{isAdmin ? '👨‍⚕️ Clinician Mode' : '🧘 Patient Mode'}</p>
          <p className="text-[10px] text-gray-400 mt-1">made by EEE dept, JNNCE</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;