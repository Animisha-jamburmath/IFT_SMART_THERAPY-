import apiClient from './client';
import { saveToken, removeToken } from '../storage/token';

export const login = async (username, password) => {
  const form = new FormData();
  form.append('username', username);
  form.append('password', password);
  const res = await apiClient.post('/auth/login', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  saveToken(res.data.access_token);
  return res.data;
};

export const logout = () => removeToken();
export const getCurrentUser = async () => (await apiClient.get('/auth/me')).data;