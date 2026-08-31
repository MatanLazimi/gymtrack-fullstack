import type { AuthUser, Credentials } from '../../types/auth';
import { apiClient } from './client';

interface AuthResponse {
  user: AuthUser;
}

export const authApi = {
  register: (credentials: Credentials) => apiClient.post<AuthResponse>('/auth/register', credentials),
  login: (credentials: Credentials) => apiClient.post<AuthResponse>('/auth/login', credentials),
  logout: () => apiClient.post<void>('/auth/logout'),
  me: () => apiClient.get<AuthResponse>('/auth/me'),
};
