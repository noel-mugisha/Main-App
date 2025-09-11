import axios, { AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from './store';


let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      // If the refresh failed, reject all queued requests.
      prom.reject(error);
    } else {
      // If the refresh succeeded, resolve all queued requests with the new token.
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const createAuthRefreshInterceptor = (axiosInstance: AxiosInstance) => async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return axiosInstance(originalRequest);
        });
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error("No refresh token available. Logging out.");
          useAuthStore.getState().logout();
          return Promise.reject(new Error("No refresh token available."));
        }
        
        console.log("Access token expired. Attempting to refresh...");
        
        
        const refreshApi = axios.create({
          baseURL:  process.env.NEXT_PUBLIC_IDP_URL, // prod
          // baseURL:'http://localhost:8080',  dev
        });

        const { data } = await refreshApi.post('/api/auth/refresh-token', {
          refresh_token: refreshToken
        });
        
        console.log("Token refresh successful.");
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

        if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        }
        
        // Process the queue with the new token.
        processQueue(null, data.access_token);
        
        // Retry the original request with the new token.
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError as Error, null);
        useAuthStore.getState().logout(); // Logout the user if refresh fails.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
};

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use((response) => response, createAuthRefreshInterceptor(api));


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

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) => 
    api.get('/api/admin/users', { params }),
  getUser: (userId: number) => api.get(`/api/admin/users/${userId}`),
  getAdminStats: () => api.get('/api/admin/stats'),
  updateUserRole: (userId: number, role: 'USER' | 'MANAGER' | 'ADMIN') => 
    api.put(`/api/admin/users/${userId}/role`, { role }),
   syncUsers: () => api.get('/api/admin/sync-users'),
};

export default api;