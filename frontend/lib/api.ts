import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from cookie or localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        window.location.href = process.env.NEXT_PUBLIC_IDP_URL || 'http://localhost:8080'
      }
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const apiEndpoints = {
  // Projects
  getProjects: () => api.get('/api/projects'),
  getProject: (id: number) => api.get(`/api/projects/${id}`),
  createProject: (data: { name: string; description?: string }) => api.post('/api/projects', data),
  updateProject: (id: number, data: { name?: string; description?: string }) => api.put(`/api/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/api/projects/${id}`),

  // Tasks
  getTasks: () => api.get('/api/tasks'),
  getTask: (id: number) => api.get(`/api/tasks/${id}`),
  createTask: (projectId: number, data: { title: string; assigneeId?: number }) => 
    api.post(`/api/projects/${projectId}/tasks`, data),
  updateTaskStatus: (id: number, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => 
    api.put(`/api/tasks/${id}/status`, { status }),
  updateTaskAssignment: (id: number, assigneeId: number | null) => 
    api.put(`/api/tasks/${id}/assign`, { assigneeId }),
  deleteTask: (id: number) => api.delete(`/api/tasks/${id}`),

  // Admin
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) => 
    api.get('/api/admin/users', { params }),
  getUser: (userId: number) => api.get(`/api/admin/users/${userId}`),
  updateUserRole: (userId: number, role: 'USER' | 'MANAGER' | 'ADMIN') => 
    api.put(`/api/admin/users/${userId}/role`, { role }),
  getAdminStats: () => api.get('/api/admin/stats'),
}

export default api

