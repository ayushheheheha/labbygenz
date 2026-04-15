import api from './axios'

export const getQuizApi = (id) => api.get(`/quizzes/${id}`)
export const getLeaderboardApi = (id) => api.get(`/quizzes/${id}/leaderboard`)
