import api from './axios'

export const startAttemptApi = (quizId) => api.post(`/quizzes/${quizId}/attempts`)
export const submitAttemptApi = (attemptId, payload) => api.post(`/attempts/${attemptId}/submit`, payload)
export const getAttemptResultApi = (attemptId) => api.get(`/attempts/${attemptId}/result`)
