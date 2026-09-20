import { apiRequest } from './client';
export const getPlaces = (onUnauthorized?: () => void) => apiRequest<any[]>('/api/places', {}, onUnauthorized);
export const createPlace = (body: Record<string, unknown>, onUnauthorized?: () => void) => apiRequest<any>('/api/places', { method: 'POST', body: JSON.stringify(body) }, onUnauthorized);
export const deletePlace = (id: string | number, onUnauthorized?: () => void) => apiRequest<void>(`/api/places/${id}`, { method: 'DELETE' }, onUnauthorized);