import axios from 'axios';
import { useAuthStore } from './store';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error("No refresh token available. Logging out.");
          useAuthStore.getState().logout();
          return Promise.reject(new Error("No refresh token available."));
        }
        
        console.log("Access token expired. Attempting to refresh...");
        
        // Create a separate, clean axios instance specifically for the token refresh call
        const refreshApi = axios.create({
          baseURL: process.env.IDP_BASE_URL || 'http://localhost:8080',
        });

        // Make the POST request to the IdP's refresh endpoint
        const { data } = await refreshApi.post('/api/auth/refresh-token', {
          refresh_token: refreshToken
        });
        
        console.log("Token refresh successful.");
        // Store both the new access token and the new refresh token
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Update the default Authorization header for all subsequent `api` calls
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        // Update the Authorization header of the original request that failed
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;

        // Process any requests that were queued while the token was refreshing
        processQueue(null, data.access_token);
        
        // Retry the original request with the new token
        return api(originalRequest);

      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError as Error, null);
        useAuthStore.getState().logout(); // If refresh fails, log the user out
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// The apiEndpoints export remains the same
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
};

export default api;