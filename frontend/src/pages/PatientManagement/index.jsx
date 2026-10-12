import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { getPatients, createPatient, updatePatient, deletePatient } from '../../services/api/patients';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiUser, FiMail, FiPhone, FiRefreshCw } from 'react-icons/fi';

const PatientManagement = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', age:'', gender:'Male', disease:'', contact:'', email:'' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { load(); }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPatients(search);
      setPatients(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const open = (p = null) => {
    setError(''); setSuccess('');
    if (p) { setEditing(p); setForm({ name:p.name||'', age:p.age||'', gender:p.gender||'Male', disease:p.disease||'', contact:p.contact||'', email:p.email||'' }); }
    else { setEditing(null); setForm({ name:'', age:'', gender:'Male', disease:'', contact:'', email:'' }); }
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const payload = { ...form, age: parseInt(form.age) || 0 };
      if (editing) await updatePatient(editing.id, payload);
      else await createPatient(payload);
      setSuccess('✅ Saved!');
      await load();
      setTimeout(close, 1000);
    } catch (err) { setError(err.response?.data?.detail || 'Failed'); } finally { setSubmitting(false); }
  };

  const close = () => { setShowModal(false); setEditing(null); setError(''); setSuccess(''); };

  const del = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await deletePatient(id);
    setSuccess('✅ Deleted'); await load(); setTimeout(()=>setSuccess(''),2000);
  };

  const diseaseColor = (d) => {
    if (!d) return 'bg-gray-100 text-gray-700';
    const low = d.toLowerCase();
    if (low.includes('lumbar')) return 'bg-blue-100 text-blue-700';
    if (low.includes('cervical')) return 'bg-purple-100 text-purple-700';
    if (low.includes('osteo')) return 'bg-orange-100 text-orange-700';
    if (low.includes('muscle')) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('patients.title')} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-secondary">{t('patients.title')}</h2>
              <p className="text-sm text-gray-400 mt-1">Manage all patients</p>
            </div>
            <button onClick={() => open()} className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:shadow-lg">
              <FiPlus size={18} /> {t('patients.addPatient')}
            </button>
          </div>

          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2"><FiCheck />{success}</div>}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">⚠️ {error}</div>}

          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6 border border-gray-50">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('patients.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary bg-gray-50"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Patient','Age','Gender','Disease','Contact','Email','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="7" className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                  ) : patients.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12"><FiUser size={48} className="text-gray-300 mx-auto" /><p className="text-gray-400 mt-2">{t('patients.noPatients')}</p></td></tr>
                  ) : patients.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-400 text-white flex items-center justify-center text-xs font-bold">
                            {p.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.age || '—'}</td>
                      <td className="px-4 py-3">{p.gender}</td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs ${diseaseColor(p.disease)}`}>{p.disease}</span></td>
                      <td className="px-4 py-3">{p.contact}</td>
                      <td className="px-4 py-3">{p.email || '—'}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => open(p)} className="text-gray-400 hover:text-primary p-1.5 hover:bg-blue-50 rounded-lg"><FiEdit size={16} /></button>
                        <button onClick={() => del(p.id, p.name)} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg"><FiTrash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {editing ? <FiEdit className="text-primary" /> : <FiPlus className="text-primary" />}
                {editing ? t('patients.editTitle') : t('patients.addTitle')}
              </h3>
              <button onClick={close}><FiX size={24} /></button>
            </div>
            <form onSubmit={save} className="px-6 py-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠️ {error}</div>}
              {success && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">✅ {success}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('patients.name')} *</label>
                <input value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('patients.age')}</label>
                  <input type="number" value={form.age} onChange={(e) => setForm({...form, age:e.target.value})} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('patients.gender')}</label>
                  <select value={form.gender} onChange={(e) => setForm({...form, gender:e.target.value})} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t('patients.disease')} *</label>
                <input value={form.disease} onChange={(e) => setForm({...form, disease:e.target.value})} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('patients.contact')} *</label>
                  <input value={form.contact} onChange={(e) => setForm({...form, contact:e.target.value})} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t('patients.email')}</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={close} className="flex-1 border py-2.5 rounded-xl">{t('common.cancel')}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium disabled:opacity-50">
                  {submitting ? t('common.loading') : <><FiCheck className="inline" /> {editing ? t('patients.update') : t('patients.save')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;