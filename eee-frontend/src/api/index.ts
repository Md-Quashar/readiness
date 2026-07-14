import axios from 'axios';
import type { AuthResponse, Question, Response as UserResponse, AssessmentAnswer, Section, Scope } from '../types';

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
