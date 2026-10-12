import apiClient from './client';

export const getPatients = async (search = '', skip = 0, limit = 100) => {
  const response = await apiClient.get('/patients', {
    params: { search, skip, limit },
  });
  return response.data;
};

export const getPatient = async (id) => {
  const response = await apiClient.get(`/patients/${id}`);
  return response.data;
};

export const createPatient = async (data) => {
  const response = await apiClient.post('/patients', data);
  return response.data;
};

export const updatePatient = async (id, data) => {
  const response = await apiClient.put(`/patients/${id}`, data);
  return response.data;
};

export const deletePatient = async (id) => {
  await apiClient.delete(`/patients/${id}`);
};