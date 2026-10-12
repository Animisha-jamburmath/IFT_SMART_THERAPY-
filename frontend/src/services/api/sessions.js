import apiClient from './client';

export const getSessions = async (params = {}) => {
  const response = await apiClient.get('/sessions', { params });
  return response.data;
};

export const createSession = async (data) => {
  const response = await apiClient.post('/sessions', data);
  return response.data;
};

export const getSession = async (id) => {
  const response = await apiClient.get(`/sessions/${id}`);
  return response.data;
};

export const updateSession = async (id, data) => {
  const response = await apiClient.put(`/sessions/${id}`, data);
  return response.data;
};

export const deleteSession = async (id) => {
  await apiClient.delete(`/sessions/${id}`);
};