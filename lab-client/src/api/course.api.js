import api from './axios'

export const getCoursesApi = () => api.get('/courses')
export const getCourseBySlugApi = (slug) => api.get(`/courses/${slug}`)
export const getCourseWeeksApi = (slug) => api.get(`/courses/${slug}/weeks`)
export const getWeekQuizzesApi = (slug, weekNumber) => api.get(`/courses/${slug}/weeks/${weekNumber}/quizzes`)
export const getExamPrepApi = (slug) => api.get(`/courses/${slug}/exam-prep`)
