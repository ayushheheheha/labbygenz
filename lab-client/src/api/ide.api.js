import api from './axios'

export const getIdeByCourseApi = (slug) => api.get(`/courses/${slug}/ide-problems`)
export const getIdeProblemApi = (id) => api.get(`/ide-problems/${id}`)
export const runIdeProblemApi = (id, payload) => api.post(`/ide-problems/${id}/run`, payload)
export const submitIdeProblemApi = (id, payload) => api.post(`/ide-problems/${id}/submit`, payload)
export const myIdeSubmissionsApi = (id) => api.get(`/ide-problems/${id}/my-submissions`)
