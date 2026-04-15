import api from './axios'

export const getIdeByCourseApi = (slug) => api.get(`/courses/${slug}/ide-problems`)
export const getIdeProblemApi = (id, params) => api.get(`/ide-problems/${id}`, { params })
export const runIdeProblemApi = (id, payload) => api.post(`/ide-problems/${id}/run`, payload)
export const submitIdeProblemApi = (id, payload) => api.post(`/ide-problems/${id}/submit`, payload)
export const myIdeSubmissionsApi = (id) => api.get(`/ide-problems/${id}/my-submissions`)
export const runCodePlaygroundApi = (payload) => api.post('/code/playground/run', payload)
