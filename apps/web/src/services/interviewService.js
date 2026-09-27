import { apiClient } from './apiClient';

export const createSession = async (sessionData) => {
  const response = await apiClient.post('/sessions', sessionData);
  return response.data;
};

export const getSessions = async () => {
  const response = await apiClient.get('/sessions');
  return response.data;
};

export const getSession = async (id) => {
  const response = await apiClient.get(`/sessions/${id}`);
  return response.data;
};

export const generateQuestions = async (id) => {
  const response = await apiClient.post(`/sessions/${id}/generate`);
  return response.data;
};

export const submitAnswer = async (id, questionId, answerText) => {
  const response = await apiClient.post(`/sessions/${id}/answer`, { questionId, answerText });
  return response.data;
};

export const completeSession = async (id) => {
  const response = await apiClient.patch(`/sessions/${id}/complete`);
  return response.data;
};
