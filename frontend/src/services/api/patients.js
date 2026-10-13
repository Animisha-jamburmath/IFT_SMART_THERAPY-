import apiClient from './client';

export const getPatients = async (search = '', skip = 0, limit = 100) =>
  (await apiClient.get('/patients', { params: { search, skip, limit } })).data;

export const createPatient = async (data) => (await apiClient.post('/patients', data)).data;
export const updatePatient = async (id, data) => (await apiClient.put(`/patients/${id}`, data)).data;
export const deletePatient = async (id) => { await apiClient.delete(`/patients/${id}`); };