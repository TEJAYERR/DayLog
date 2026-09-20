import { apiRequest } from './client';
export type AuthResponse = { token?: string; jwt?: string; name?: string; user?: { name?: string; email?: string } };
export const login = (body: { email: string; password: string }) => apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
export const register = (body: { name: string; email: string; password: string }) => apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
export const logout = () => apiRequest<void>('/api/auth/logout', { method: 'POST' });