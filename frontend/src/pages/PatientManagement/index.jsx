import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { getPatients, createPatient, updatePatient, deletePatient } from '../../services/api/patients';
import { 
  FiSearch, FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiUser, FiMail, FiPhone, FiRefreshCw 
} from 'react-icons/fi';

const PatientManagement = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    disease: '',
    contact: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Load Patients ─────────────────────────────────────────────
  useEffect(() => {
    loadPatients();
  }, [searchTerm]);

  const loadPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPatients(searchTerm);
      setPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
      setError(error.response?.data?.detail || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // ─── Open Modal ───────────────────────────────────────────────
  const openModal = (patient = null) => {
    setError('');
    setSuccess('');
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        name: patient.name || '',
        age: patient.age || '',
        gender: patient.gender || 'Male',
        disease: patient.disease || '',
        contact: patient.contact || '',
        email: patient.email || '',
      });
    } else {
      setEditingPatient(null);
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        disease: '',
        contact: '',
        email: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setError('');
    setSuccess('');
  };

  // ─── Handle Form Change ──────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Save Patient ─────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        ...formData,
        age: parseInt(formData.age) || 0,
      };

      if (editingPatient) {
        await updatePatient(editingPatient.id, data);
        setSuccess(t('patients.updateSuccess') || 'Patient updated successfully!');
      } else {
        await createPatient(data);
        setSuccess(t('patients.createSuccess') || 'Patient created successfully!');
      }
      
      await loadPatients();
      
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save patient:', error);
      setError(error.response?.data?.detail || 'Failed to save patient');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete Patient ───────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`${t('patients.deleteConfirm') || 'Are you sure you want to delete'} "${name}"?`)) return;
    
    try {
      await deletePatient(id);
      await loadPatients();
      setSuccess(`${name} ${t('patients.deleteSuccess') || 'deleted successfully!'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete patient:', error);
      setError('Failed to delete patient');
      setTimeout(() => setError(''), 3000);
    }
  };

  // ─── Get Disease Color ────────────────────────────────────────
  const getDiseaseColor = (disease) => {
    if (!disease) return 'bg-gray-100 text-gray-700';
    
    const colors = {
      'lumbar': 'bg-blue-100 text-blue-700',
      'cervical': 'bg-purple-100 text-purple-700',
      'osteoarthritis': 'bg-orange-100 text-orange-700',
      'muscle': 'bg-green-100 text-green-700',
      'spondylosis': 'bg-yellow-100 text-yellow-700',
      'disc': 'bg-indigo-100 text-indigo-700',
      'arthritis': 'bg-pink-100 text-pink-700',
      'herniation': 'bg-red-100 text-red-700',
    };
    
    const lower = disease.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (lower.includes(key)) {
        return color;
      }
    }
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={t('patients.title') || 'Patient Management'} />
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* ─── Header ──────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-secondary">{t('patients.title') || 'Patient Management'}</h2>
              <p className="text-sm text-gray-400 mt-1">Manage all patients in the IFT Therapy system</p>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition flex items-center gap-2"
            >
              <FiPlus size={18} /> {t('patients.addPatient') || 'Add Patient'}
            </button>
          </div>

          {/* ─── Success/Error Messages ──────────────────────────── */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <FiCheck size={18} /> {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* ─── Search Bar ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6 border border-gray-50">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('patients.searchPlaceholder') || 'Search by name, disease, or contact...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>

          {/* ─── Stats ───────────────────────────────────────────── */}
          {!loading && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {patients.length} {patients.length === 1 ? 'patient' : 'patients'} found
              </span>
              <button
                onClick={loadPatients}
                className="flex items-center gap-2 text-sm text-primary hover:text-blue-700 transition"
              >
                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          )}

          {/* ─── Patients Table ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">
                      {t('patients.firstName') || 'Patient'}
                    </th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">
                      {t('patients.age') || 'Age'}
                    </th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">
                      {t('patients.gender') || 'Gender'}
                    </th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">
                      {t('patients.disease') || 'Disease'}
                    </th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">
                      {t('patients.contact') || 'Contact'}
                    </th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">
                      {t('patients.email') || 'Email'}
                    </th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">
                      {t('patients.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-gray-400">Loading patients...</p>
                        </div>
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FiUser size={48} className="text-gray-300" />
                          <p className="text-gray-400 font-medium">{t('patients.noPatients') || 'No patients found'}</p>
                          <p className="text-xs text-gray-300">Click "Add Patient" to create your first patient</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    patients.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-400 text-white flex items-center justify-center text-xs font-bold">
                              {p.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-secondary">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.age || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{p.gender}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDiseaseColor(p.disease)}`}>
                            {p.disease || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.contact || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{p.email || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(p)}
                              className="text-gray-400 hover:text-primary transition p-1.5 hover:bg-blue-50 rounded-lg"
                              title={t('patients.edit') || 'Edit'}
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="text-gray-400 hover:text-red-500 transition p-1.5 hover:bg-red-50 rounded-lg"
                              title={t('patients.delete') || 'Delete'}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ─── Modal ───────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-secondary flex items-center gap-2">
                {editingPatient ? (
                  <><FiEdit className="text-primary" /> {t('patients.editTitle') || 'Edit Patient'}</>
                ) : (
                  <><FiPlus className="text-primary" /> {t('patients.addTitle') || 'Add Patient'}</>
                )}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                  <FiCheck /> {success}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {t('patients.name') || 'Full Name'} *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('patients.namePlaceholder') || 'e.g., Rahul Sharma'}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
                      required
                    />
                  </div>
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t('patients.age') || 'Age'}
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder={t('patients.agePlaceholder') || 'e.g., 45'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
                      min="0"
                      max="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t('patients.gender') || 'Gender'}
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Disease */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {t('patients.disease') || 'Disease / Condition'} *
                  </label>
                  <input
                    type="text"
                    name="disease"
                    value={formData.disease}
                    onChange={handleChange}
                    placeholder={t('patients.diseasePlaceholder') || 'e.g., Lumbar Disc Herniation'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
                    required
                  />
                </div>

                {/* Contact & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t('patients.contact') || 'Contact'} *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder={t('patients.contactPlaceholder') || 'e.g., 9876543210'}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t('patients.email') || 'Email'}
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('patients.emailPlaceholder') || 'patient@email.com'}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-100 transition font-medium"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-primary to-blue-600 text-white py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Saving...</>
                    ) : (
                      <><FiCheck size={18} /> {editingPatient ? (t('patients.update') || 'Update') : (t('patients.save') || 'Save')}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;