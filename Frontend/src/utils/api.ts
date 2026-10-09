import { BusTicket, College, RouteSchedule, StudentApplication, UserProfile, UserRoleType } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'prtc_access_token';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail || message;
    } catch {}
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

export interface PassQr {
  applicationId: string;
  token: string;
  qrCodeDataUrl: string;
  expiresAt: string;
}

export interface PassVerification {
  valid: boolean;
  holderName: string;
  rollNumber: string;
  route: string;
  passType: string;
  avatarUrl?: string;
  verifiedBy: string;
}

export const api = {
  bootstrap: () => request<BootstrapData>('/bootstrap'),
  authenticateProfile: (profile: UserProfile, password: string, mode: 'login' | 'register') =>
    request<{ profile: UserProfile; accessToken: string }>('/auth/profile', {
      method: 'POST',
      body: JSON.stringify({ profile, password, mode }),
    }),
  authenticateGoogle: (credential: string, roleType: UserRoleType, profile: Partial<UserProfile> = {}) =>
    request<{ profile: UserProfile; accessToken: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, roleType, profile }),
    }),
  updateProfile: (profile: UserProfile) =>
    request<UserProfile>(`/users/${encodeURIComponent(profile.passId)}`, {
      method: 'PUT',
      body: JSON.stringify({ data: profile }),
    }),

  // Applications (real data, scoped to the logged-in role by the backend)
  listApplications: () => request<StudentApplication[]>('/applications'),
  createApplication: (application: StudentApplication) =>
    request<StudentApplication>('/applications', {
      method: 'POST',
      body: JSON.stringify({ data: application }),
    }),
  updateApplication: (application: StudentApplication) =>
    request<StudentApplication>(`/applications/${encodeURIComponent(application.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ data: application }),
    }),
  passQr: (applicationId: string) =>
    request<PassQr>(`/applications/${encodeURIComponent(applicationId)}/qr`),

  verifyPass: (token: string) =>
    request<PassVerification>('/passes/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  createTicket: (ticket: BusTicket, ownerPassId?: string) =>
    request<BusTicket>('/tickets', {
      method: 'POST',
      body: JSON.stringify({ data: { ...ticket, ownerPassId } }),
    }),
};