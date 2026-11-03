import { StudentApplication, BusTicket, UserProfile } from '../types';
import { mockStudentApplications, mockRecentTickets, mockUserProfile } from '../data/mockData';

const APPS_STORAGE_KEY = 'prtc_student_applications_v2';
const TICKETS_STORAGE_KEY = 'prtc_transit_tickets_v2';
const USERS_STORAGE_KEY = 'prtc_registered_users_v2';
const SESSION_STORAGE_KEY = 'prtc_active_session_v2';

// 1. Applications Database with Institutional Guarantee
export function mergeWithInstitutionalApplications(incomingApps: StudentApplication[] = []): StudentApplication[] {
  const map = new Map<string, StudentApplication>();

  const getStatusRank = (status?: string): number => {
    if (status === 'approved') return 3;
    if (status === 'college_approved' || status === 'rejected') return 2;
    return 1; // pending or unspecified
  };

  const mergeTwo = (base: StudentApplication, inc: StudentApplication): StudentApplication => {
    const baseRank = getStatusRank(base.status);
    const incRank = getStatusRank(inc.status);
    const effectiveStatus = incRank >= baseRank ? (inc.status || base.status) : base.status;

    return {
      ...base,
      ...inc,
      id: base.id || inc.id,
      status: effectiveStatus,
      collegeStampId: inc.collegeStampId || base.collegeStampId,
      collegeVerifiedBy: inc.collegeVerifiedBy || base.collegeVerifiedBy,
      collegeVerifiedDate: inc.collegeVerifiedDate || base.collegeVerifiedDate,
      collegeStampName: inc.collegeStampName || base.collegeStampName,
      prtcVerifiedBy: inc.prtcVerifiedBy || base.prtcVerifiedBy,
      prtcVerifiedDate: inc.prtcVerifiedDate || base.prtcVerifiedDate,
      prtcAdminId: inc.prtcAdminId || base.prtcAdminId,
      passId: inc.passId || base.passId,
      studentId: inc.studentId || base.studentId,
    };
  };

  const findMatchingKey = (app: StudentApplication): string | null => {
    if (app.id && map.has(app.id)) return app.id;
    for (const [k, v] of map.entries()) {
      const studentIdMatch = app.studentId && v.studentId && app.studentId === v.studentId;
      const rollMatch = app.rollNumber && v.rollNumber && app.rollNumber.trim().toLowerCase() === v.rollNumber.trim().toLowerCase();
      const nameMatch = app.name && v.name && app.name.trim().toLowerCase() === v.name.trim().toLowerCase();
      if (studentIdMatch || (nameMatch && rollMatch)) {
        return k;
      }
    }
    return null;
  };

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
          if (app && (app.id || app.name)) {
            const matchedKey = findMatchingKey(app);
            if (matchedKey) {
              map.set(matchedKey, mergeTwo(map.get(matchedKey)!, app));
            } else {
              const newId = app.id || `app-${Date.now()}`;
              map.set(newId, { ...app, id: newId });
            }
          }
        }
      }
    }
  } catch {}

  // 3. Overlay incoming applications (e.g. from backend or active session)
  for (const app of incomingApps) {
    if (app && (app.id || app.name)) {
      const matchedKey = findMatchingKey(app);
      if (matchedKey) {
        map.set(matchedKey, mergeTwo(map.get(matchedKey)!, app));
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
  companyName?: string;
  passId?: string;
  corporateId?: string;
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
