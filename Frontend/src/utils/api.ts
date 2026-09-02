import { BusTicket, College, RouteSchedule, StudentApplication, UserProfile } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try { const body = await res.json(); message = body.detail || message; } catch {}
    throw new Error(message);
  }
  return res.json();
}

export interface BootstrapData {
  colleges: College[];
  applications: StudentApplication[];
  tickets: BusTicket[];
  schedules: RouteSchedule[];
}

export const api = {
  bootstrap: () => request<BootstrapData>('/bootstrap'),
  authenticateProfile: (profile: UserProfile, password: string, mode: 'login' | 'register') =>
    request<{ profile: UserProfile; accessToken: string }>('/auth/profile', {
      method: 'POST', body: JSON.stringify({ profile, password, mode }),
    }),
  updateProfile: (profile: UserProfile) => request<UserProfile>(`/users/${encodeURIComponent(profile.passId)}`, {
    method: 'PUT', body: JSON.stringify({ data: profile }),
  }),
  createApplication: (application: StudentApplication) => request<StudentApplication>('/applications', {
    method: 'POST', body: JSON.stringify({ data: application }),
  }),
  updateApplication: (application: StudentApplication) => request<StudentApplication>(`/applications/${encodeURIComponent(application.id)}`, {
    method: 'PUT', body: JSON.stringify({ data: application }),
  }),
  createTicket: (ticket: BusTicket, ownerPassId?: string) => request<BusTicket>('/tickets', {
    method: 'POST', body: JSON.stringify({ data: { ...ticket, ownerPassId } }),
  }),
};
