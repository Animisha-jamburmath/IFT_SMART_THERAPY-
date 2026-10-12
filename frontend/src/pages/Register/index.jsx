import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', full_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      setSuccess(true);
      try {
        await login(formData.username, formData.password);
        navigate('/dashboard');
      } catch {
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-secondary">{t('register.title')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('register.subtitle')}</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">✅ {t('register.success')}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'full_name', label: t('register.fullName'), icon: FiUser, type: 'text' },
            { name: 'username', label: t('register.username'), icon: FiUser, type: 'text' },
            { name: 'email', label: t('register.email'), icon: FiMail, type: 'email' },
            { name: 'password', label: t('register.password'), icon: FiLock, type: 'password' },
            { name: 'confirmPassword', label: t('register.confirmPassword'), icon: FiLock, type: 'password' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
              <div className="relative">
                <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? t('common.loading') : <><FiUserPlus size={18} /> {t('register.createAccount')}</>}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">{t('register.haveAccount')} <Link to="/" className="text-blue-500 font-medium hover:underline">{t('login.signIn')}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;