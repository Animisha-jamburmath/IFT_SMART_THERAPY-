import apiClient from './client';

export const uploadImage = async (formData) =>
  (await apiClient.post('/imaging/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data;

export const analyzeImage = async (formData) =>
  (await apiClient.post('/segmentation/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data;