import { StudentApplication, BusTicket, UserProfile } from '../types';
import { mockStudentApplications, mockRecentTickets, mockUserProfile } from '../data/mockData';

const APPS_STORAGE_KEY = 'prtc_student_applications_v2';
const TICKETS_STORAGE_KEY = 'prtc_transit_tickets_v2';
const USERS_STORAGE_KEY = 'prtc_registered_users_v2';
const SESSION_STORAGE_KEY = 'prtc_active_session_v2';

// 1. Applications Database with Institutional Guarantee
export function mergeWithInstitutionalApplications(incomingApps: StudentApplication[] = []): StudentApplication[] {
  const map = new Map<string, StudentApplication>();

  // 1. Always seed with official institutional student applications
  for (const app of mockStudentApplications) {
    if (app && app.id) {
      map.set(app.id, { ...app });
    }
  }

  // 2. Overlay any previously saved local storage updates
  try {
    const raw = localStorage.getItem(APPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const app of parsed) {
          if (app && app.id) {
            // Check if matches an existing institutional app by name/roll to avoid duplicated student records
            let matchedKey = map.has(app.id) ? app.id : null;
            if (!matchedKey) {
              for (const [k, v] of map.entries()) {
                const nameMatch = v.name && app.name && v.name.trim().toLowerCase() === app.name.trim().toLowerCase();
                const rollMatch = v.rollNumber && app.rollNumber && v.rollNumber === app.rollNumber;
                if (nameMatch || rollMatch) {
                  matchedKey = k;
                  break;
                }
              }
            }
            if (matchedKey) {
              map.set(matchedKey, { ...map.get(matchedKey), ...app, id: matchedKey });
            } else {
              map.set(app.id, app);
            }
          }
        }
      }
    }
  } catch {}

  // 3. Overlay incoming applications (e.g. from backend or active session)
  for (const app of incomingApps) {
    if (app && (app.id || app.name)) {
      let matchedKey = app.id && map.has(app.id) ? app.id : null;
      if (!matchedKey) {
        for (const [k, v] of map.entries()) {
          const nameMatch = v.name && app.name && v.name.trim().toLowerCase() === app.name.trim().toLowerCase();
          const rollMatch = v.rollNumber && app.rollNumber && v.rollNumber === app.rollNumber;
          if (nameMatch || rollMatch) {
            matchedKey = k;
            break;
          }
        }
      }

      if (matchedKey) {
        map.set(matchedKey, { ...map.get(matchedKey), ...app, id: matchedKey });
      } else {
        const newId = app.id || `app-${Date.now()}`;
        map.set(newId, { ...app, id: newId });
      }
    }
  }

  return Array.from(map.values());
}

export function getStoredApplications(): StudentApplication[] {
  return mergeWithInstitutionalApplications();
}

export function saveStoredApplications(apps: StudentApplication[]): void {
  try {
    const merged = mergeWithInstitutionalApplications(apps);
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(merged));
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
      phone: '+91 98722 44100',
      roleType: 'corporate',
      institution: 'Infosys Limited (Mohali Development Centre)',
      registeredAt: '10 Aug 2026',
      lastLoginAt: 'Yesterday',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-pass-01',
      name: 'Rajinder Kumar',
      email: 'rajinder.kumar@gmail.com',
      phone: '+91 98881 22334',
      roleType: 'passenger',
      registeredAt: '20 Aug 2026',
      lastLoginAt: 'Today',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
  ];
}

export function saveStoredUsers(users: RegisteredUserRecord[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage', e);
  }
}

// 4. Active Authenticated Session
export interface StoredSession {
  profile: UserProfile;
  role: string;
  savedAt: string;
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse session from localStorage', e);
  }
  return null;
}

export function saveStoredSession(profile: UserProfile, role: string): void {
  try {
    const session: StoredSession = {
      profile,
      role,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear session from localStorage', e);
  }
}
