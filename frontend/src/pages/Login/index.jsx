import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiLock, FiArrowRight, FiHeart } from 'react-icons/fi';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch { setError('Invalid username or password'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
              <FiHeart className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">{t('app.title')}</h1>
            <p className="text-sm text-gray-400 mt-1">{t('app.subtitle')}</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('login.username')}</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder={t('login.usernamePlaceholder')} required disabled={loading} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder={t('login.passwordPlaceholder')} required disabled={loading} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? t('common.loading') : <>{t('login.signIn')} <FiArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('login.noAccount')} <Link to="/register" className="text-blue-500 font-medium hover:underline">{t('login.createAccount')}</Link>
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">{t('login.footer')}</p>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400">{t('login.demo')}</div>
      </div>
    </div>
  );
};

export default Login;