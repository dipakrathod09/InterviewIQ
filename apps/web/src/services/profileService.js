import { apiClient } from './apiClient';

export const getProfile = async () => {
  const response = await apiClient.get('/profile');
  return response.data;
};

export const uploadResumePdf = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await apiClient.post('/profile/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitResume = async (rawText) => {
  const response = await apiClient.post('/profile/resume', { rawText });
  return response.data;
};

export const submitJobDescription = async (rawText) => {
  const response = await apiClient.post('/profile/job-description', { rawText });
  return response.data;
};

export const getMatchAnalysis = async () => {
  const response = await apiClient.get('/profile/match');
  return response.data;
};
