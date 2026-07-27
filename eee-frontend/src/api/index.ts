import axios from 'axios';
import type { AuthResponse, Question, Response as UserResponse, AssessmentAnswer, Section, Scope, ActivityLog } from '../types';

// Dynamically resolve the backend host so other devices on the same
// network can reach the API via the host machine's IP address.
const BASE_URL = `${window.location.protocol}//${window.location.hostname}`;

const api = axios.create({ baseURL: BASE_URL });

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor to handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check if error is 401 Unauthorized, and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Attempt to get a new access token
          const { data } = await axios.post<{ access: string }>(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          // Save new access token
          localStorage.setItem('access_token', data.access);
          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh token is expired/invalid, clear local storage and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post<AuthResponse>('/auth/register/', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login/', data),

  getProfile: () => api.get('/auth/profile/'),

  getAllUsers: () => api.get('/auth/get-user/'),

  resetPassword: (data: { email: string; new_password: string }) =>
    api.post('/auth/reset-password/', data),

  getActivityLogs: () => api.get<ActivityLog[]>('/auth/activity-logs/'),
};

// ── Questions ─────────────────────────────────────────────────────────────
export const questionsAPI = {
  getActive: () => api.get<Question[]>('/questions/active/'),

  getAll: () => api.get<Question[]>('/questions/all/'),

  create: (data: Partial<Question> | Partial<Question>[]) =>
    api.post('/questions/create/', data),

  update: (data: Partial<Question> & { id: number }) =>
    api.put('/questions/update/', data),

  toggleActive: (id: number) =>
    api.patch(`/questions/${id}/toggle-active/`),

};

// ── Responses ─────────────────────────────────────────────────────────────
export const responsesAPI = {
  submitSingle: (data: AssessmentAnswer) =>
    api.post<UserResponse>('/responses/single-response/', data),

  submitBulk: (data: AssessmentAnswer[]) =>
    api.post<UserResponse[]>('/responses/bulk-response/', data),

  getUserResponses: (userId: number) =>
    api.get<UserResponse[]>(`/responses/${userId}/get-response`),

  getMyResponses: () =>
    api.get<UserResponse[]>('/responses/my-responses/'),

  getTotalResponses: () => api.get('/responses/total-response-count/'),

  deleteUserResponses: (userId: number) =>
    api.delete(`/responses/${userId}/delete-response/`),

  // Admin: get all responses (using the base list endpoint)
  getAllResponses: () => api.get<UserResponse[]>('/responses/'),
};

// ── Sections ──────────────────────────────────────────────────────────────
export const sectionsAPI = {
  getAll: () => api.get<{ sections: Section[] }>('/questions/sections/get/'),
  create: (name: string) => api.post('/questions/sections/create/', { sectionName: name }),
  update: (id: number, name: string) => api.put(`/questions/sections/update/?id=${id}`, { sectionName: name }),
  delete: (id: number) => api.delete(`/questions/sections/delete/?id=${id}`),
};

// ── Scopes ────────────────────────────────────────────────────────────────
export const scopesAPI = {
  getAll: () => api.get<{ scopes: Scope[] }>('/questions/scopes/get/'),
  create: (name: string) => api.post('/questions/scopes/create/', { scope: name }),
  update: (id: number, name: string) => api.put(`/questions/scopes/update/?id=${id}`, { scope: name }),
  delete: (id: number) => api.delete(`/questions/scopes/delete/?id=${id}`),
};

export default api;
