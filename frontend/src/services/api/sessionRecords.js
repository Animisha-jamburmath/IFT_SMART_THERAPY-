import apiClient from './client';

export const getSessionRecords = async (params = {}) =>
  (await apiClient.get('/session-records', { params })).data;
export const createSessionRecord = async (data) =>
  (await apiClient.post('/session-records', data)).data;