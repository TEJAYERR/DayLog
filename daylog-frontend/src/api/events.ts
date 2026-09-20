import { apiRequest } from './client';
export const getEvents = (date: string, onUnauthorized?: () => void) => apiRequest<any[]>(`/api/events?date=${encodeURIComponent(date)}`, {}, onUnauthorized);
export const createEvent = (body: Record<string, unknown>, onUnauthorized?: () => void) => apiRequest<any>('/api/events', { method: 'POST', body: JSON.stringify(body) }, onUnauthorized);
export const deleteEvent = (id: string | number, onUnauthorized?: () => void) => apiRequest<void>(`/api/events/${id}`, { method: 'DELETE' }, onUnauthorized);
export const demoLocation = (body: { placeId: string | number; action: 'ARRIVE' | 'LEAVE' }, onUnauthorized?: () => void) => apiRequest<any>('/api/events/demo-location', { method: 'POST', body: JSON.stringify(body) }, onUnauthorized);