import apiClient from './client';
import { saveToken, removeToken } from '../storage/token';

export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  const response = await apiClient.post('/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const { access_token } = response.data;
  saveToken(access_token);
  return response.data;
};

export const logout = () => {
  removeToken();
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};