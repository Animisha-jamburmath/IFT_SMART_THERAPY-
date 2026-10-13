import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password min 6 chars'); return; }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password, full_name: form.full_name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <img src="/images/ift-logo.svg" alt="IFT" className="w-16 h-16 mx-auto" />
          <h1 className="text-2xl font-bold text-secondary mt-2">{t('register.title')}</h1>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'full_name', icon: FiUser, label: t('register.fullName') },
            { name: 'username', icon: FiUser, label: t('register.username') },
            { name: 'email', icon: FiMail, label: t('register.email'), type: 'email' },
            { name: 'password', icon: FiLock, label: t('register.password'), type: 'password' },
            { name: 'confirmPassword', icon: FiLock, label: t('register.confirmPassword'), type: 'password' },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
              <div className="relative">
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={f.type || 'text'} name={f.name} value={form[f.name]} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? t('common.loading') : <><FiUserPlus size={18} /> {t('register.createAccount')}</>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">{t('register.haveAccount')} </span>
          <Link to="/" className="text-blue-500 font-medium hover:underline">{t('login.signIn')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;