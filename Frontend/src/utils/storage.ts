import { StudentApplication, BusTicket, UserProfile } from '../types';
import { mockStudentApplications, mockRecentTickets, mockUserProfile } from '../data/mockData';

const APPS_STORAGE_KEY = 'prtc_student_applications_v2';
const TICKETS_STORAGE_KEY = 'prtc_transit_tickets_v2';
const USERS_STORAGE_KEY = 'prtc_registered_users_v2';
const SESSION_STORAGE_KEY = 'prtc_active_session_v2';

// 1. Applications Database
export function getStoredApplications(fallback: StudentApplication[] = mockStudentApplications): StudentApplication[] {
  try {
    const raw = localStorage.getItem(APPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load applications from localStorage', e);
  }
  return fallback;
}

export function saveStoredApplications(apps: StudentApplication[]): void {
  try {
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save applications to localStorage', e);
  }
}

// 2. Tickets Database
export function getStoredTickets(fallback: BusTicket[] = mockRecentTickets): BusTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load tickets from localStorage', e);
  }
  return fallback;
}

export function saveStoredTickets(tickets: BusTicket[]): void {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed to save tickets to localStorage', e);
  }
}

// 3. Registered Users & Sign-ins Database
export interface RegisteredUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleType: string;
  institution?: string;
  registeredAt: string;
  lastLoginAt: string;
  avatarUrl?: string;
  aadhaarNumber?: string;
}

export function getStoredUsers(): RegisteredUserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load users from localStorage', e);
  }

  // Default seed users
  return [
    {
      id: 'usr-student-01',
      name: 'Navjot Singh Dhillon',
      email: 'navjot.dhillon@thapar.edu',
      phone: '+91 98145 67210',
      roleType: 'student',
      institution: 'Thapar Institute of Engg. & Technology',
      registeredAt: '15 Aug 2026',
      lastLoginAt: 'Today',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-corp-01',
      name: 'Simranjeet Kaur',
      email: 'simran.kaur@infosys.com',
      phone: '+91 98722 34109',
      roleType: 'corporate',
      institution: 'Infosys Mohali IT Development Center',
      registeredAt: '18 Aug 2026',
      lastLoginAt: 'Today',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-pass-01',
      name: 'Priya Sharma',
      email: 'priya.sharma22@gmail.com',
      phone: '+91 98881 23456',
      roleType: 'passenger',
      institution: 'Punjab State Transit Commuter',
      registeredAt: '20 Aug 2026',
      lastLoginAt: 'Today',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-college-01',
      name: 'Dr. S. Kapoor',
      email: 'deansw@pec.edu.in',
      phone: '+91 98150 99881',
      roleType: 'college_admin',
      institution: 'Punjab Engineering College (PEC)',
      registeredAt: '01 Aug 2026',
      lastLoginAt: 'Today',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-prtc-01',
      name: 'S. Gurmukh Singh',
      email: 'g.singh@prtc.punjab.gov.in',
      phone: '+91 98140 11223',
      roleType: 'prtc_admin',
      institution: 'Pepsu Road Transport Corporation (Patiala HQ)',
      registeredAt: '01 Jan 2026',
      lastLoginAt: 'Today',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
  ];
}

export function saveUserRecord(profile: UserProfile): void {
  try {
    const existing = getStoredUsers();
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const matchIdx = existing.findIndex(
      (u) =>
        (profile.email && u.email.toLowerCase() === profile.email.toLowerCase()) ||
        (profile.phone && u.phone === profile.phone) ||
        (profile.passId && u.id === profile.passId)
    );

    const record: RegisteredUserRecord = {
      id: profile.passId || (profile as any).adminId || `usr-${Date.now()}`,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      roleType: profile.roleType,
      institution: profile.college || profile.companyName || profile.institution,
      registeredAt: matchIdx >= 0 ? existing[matchIdx].registeredAt : nowStr,
      lastLoginAt: 'Just now',
      avatarUrl: profile.avatarUrl,
      aadhaarNumber: profile.aadhaarNumber,
    };

    if (matchIdx >= 0) {
      existing[matchIdx] = record;
    } else {
      existing.unshift(record);
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save user record', e);
  }
}

// 4. Active Session
export function getStoredSession(): { profile: UserProfile; role: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load session from localStorage', e);
  }
  return null;
}

export function saveStoredSession(profile: UserProfile, role: string): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ profile, role }));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}
