import { apiClient } from './apiClient';

export const getStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

export const getInsights = async () => {
  const response = await apiClient.get('/dashboard/insights');
  return response.data;
};
