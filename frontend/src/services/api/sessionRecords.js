import apiClient from './client';

export const getSessionRecords = async (params = {}) => {
  const response = await apiClient.get('/session-records', { params });
  return response.data;
};

export const createSessionRecord = async (data) => {
  const response = await apiClient.post('/session-records', data);
  return response.data;
};

export const getSessionRecord = async (id) => {
  const response = await apiClient.get(`/session-records/${id}`);
  return response.data;
};

export const updateSessionRecord = async (id, data) => {
  const response = await apiClient.put(`/session-records/${id}`, data);
  return response.data;
};

export const deleteSessionRecord = async (id) => {
  await apiClient.delete(`/session-records/${id}`);
};