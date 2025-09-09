import axios, { AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from './store';

// ===================================================================
// == Reusable Token Refresh Logic
// ===================================================================

// A flag to prevent multiple token refresh requests from firing simultaneously.
let isRefreshing = false;
// A queue to hold requests that failed with a 401 error while the token is being refreshed.
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

/**
 * Processes the queue of failed requests after a token refresh attempt.
 * @param error An error object if the refresh failed, otherwise null.
 * @param token The new access token if the refresh was successful.
 */
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

/**
 * Creates a reusable Axios interceptor to handle 401 Unauthorized errors.
 * When a 401 is received, it attempts to refresh the access token and then retries the original request.
 * @param axiosInstance The specific Axios instance to attach the interceptor to.
 */
const createAuthRefreshInterceptor = (axiosInstance: AxiosInstance) => async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
        return Promise.reject(error);
    }

    // Intercept only 401 errors. The `_retry` flag prevents an infinite loop for the same request.
    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue this request.
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
        
        // Create a temporary, clean axios instance specifically for the refresh call.
        // This avoids the new request being caught by the same interceptor.
        const refreshApi = axios.create({
          baseURL:  process.env.NEXT_PUBLIC_IDP_URL || 'http://localhost:8080',
        });

        const { data } = await refreshApi.post('/api/auth/refresh-token', {
          refresh_token: refreshToken
        });
        
        console.log("Token refresh successful.");
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Update the default headers for subsequent requests.
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        // Update the header of the original failed request.
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


// ===================================================================
// == Main Axios Instance for Your Application Backend
// ===================================================================
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// This is the primary axios instance that should be used for all calls
// to your main application's backend (the Node.js server).
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: Attaches the JWT access token to every outgoing request.
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

// Response Interceptor: Applies the token refresh logic to handle expired tokens automatically.
api.interceptors.response.use((response) => response, createAuthRefreshInterceptor(api));


// ===================================================================
// == Centralized API Endpoints
// ===================================================================

// This object provides a clean, reusable interface for all API calls in the application.
export const apiEndpoints = {
  // --- Projects (via Main App Backend) ---
  getProjects: () => api.get('/api/projects'),
  getProject: (id: number) => api.get(`/api/projects/${id}`),
  createProject: (data: { name: string; description?: string }) => api.post('/api/projects', data),
  updateProject: (id: number, data: { name?: string; description?: string }) => api.put(`/api/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/api/projects/${id}`),

  // --- Tasks (via Main App Backend) ---
  getTasks: () => api.get('/api/tasks'),
  getTask: (id: number) => api.get(`/api/tasks/${id}`),
  createTask: (projectId: number, data: { title: string; assigneeId?: number }) => 
    api.post(`/api/projects/${projectId}/tasks`, data),
  updateTaskStatus: (id: number, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => 
    api.put(`/api/tasks/${id}/status`, { status }),
  updateTaskAssignment: (id: number, assigneeId: number | null) => 
    api.put(`/api/tasks/${id}/assign`, { assigneeId }),
  deleteTask: (id: number) => api.delete(`/api/tasks/${id}`),

  // --- Admin (via Main App Backend) ---
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) => 
    api.get('/api/admin/users', { params }),
  getUser: (userId: number) => api.get(`/api/admin/users/${userId}`),
  getAdminStats: () => api.get('/api/admin/stats'),

  // --- Admin Role Update (via Main App Backend PROXY) ---
  // CORRECTED: This now uses the main 'api' instance to call your backend's proxy endpoint.
  // Your backend will then forward this request to the IdP and update its own database,
  // keeping everything in sync.
  updateUserRole: (userId: number, role: 'USER' | 'MANAGER' | 'ADMIN') => 
    api.put(`/api/admin/users/${userId}/role`, { role }),
};

export default api;