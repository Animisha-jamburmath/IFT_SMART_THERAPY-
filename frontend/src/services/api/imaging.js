import apiClient from './client';

export const analyzeImage = async (patientId, file, modality = 'MRI') => {
  const formData = new FormData();
  formData.append('patient_id', patientId);
  formData.append('modality', modality);
  formData.append('file', file);

  const response = await apiClient.post('/segmentation/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getImagingHistory = async (patientId) => {
  const response = await apiClient.get(`/imaging/${patientId}`);
  return response.data;
};