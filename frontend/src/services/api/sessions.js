import apiClient from './client';
export const getSessions = async (params = {}) => (await apiClient.get('/sessions', { params })).data;