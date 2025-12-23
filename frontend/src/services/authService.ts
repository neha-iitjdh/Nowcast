import api from './api';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User, ApiResponse } from '../types';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
  return response.data.data!;
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
  return response.data.data!;
}

export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data!;
}

export async function updateProfile(data: { bio?: string; avatar?: string | null }): Promise<User> {
  const response = await api.patch<ApiResponse<User>>('/auth/me', data);
  return response.data.data!;
}

export async function getUserByUsername(username: string): Promise<User> {
  const response = await api.get<ApiResponse<User>>(`/auth/users/${username}`);
  return response.data.data!;
}
