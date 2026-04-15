import api from './axios'

export const getStudentProgressApi = () => api.get('/student/progress')
export const getStudentProfileApi = () => api.get('/student/profile')

export const updateStudentProfileApi = (payload) => {
  if (payload instanceof FormData) {
    return api.patch('/student/profile', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  return api.patch('/student/profile', payload)
}
