import api from './axios'

export const getAdminStatsApi = () => api.get('/admin/stats')
export const getAdminCoursesApi = () => api.get('/admin/courses')
export const createAdminCourseApi = (payload) => api.post('/admin/courses', payload)
export const updateAdminCourseApi = (id, payload) => api.put(`/admin/courses/${id}`, payload)
export const toggleAdminCourseApi = (id) => api.patch(`/admin/courses/${id}/toggle`)

export const getAdminQuizzesApi = () => api.get('/admin/quizzes')
export const createAdminQuizApi = (payload) => api.post('/admin/quizzes', payload)
export const getAdminQuizApi = (id) => api.get(`/admin/quizzes/${id}`)
export const updateAdminQuizApi = (id, payload) => api.put(`/admin/quizzes/${id}`, payload)
export const deleteAdminQuizApi = (id) => api.delete(`/admin/quizzes/${id}`)

export const getAdminIdeProblemsApi = () => api.get('/admin/ide-problems')
export const createAdminIdeProblemApi = (payload) => api.post('/admin/ide-problems', payload)
