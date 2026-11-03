import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PortalRole, StudentApplication, BusTicket, UserProfile, RouteSchedule, UserRoleType } from './types';
import {
  mockColleges,
  mockUserProfile,
  mockSchedules,
} from './data/mockData';
import { getStoredSession, saveStoredSession, getStoredApplications, saveStoredApplications, getStoredTickets, saveStoredTickets, mergeWithInstitutionalApplications } from './utils/storage';
import { api } from './utils/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CentralGateway } from './components/CentralGateway';
import { RoleGate } from './components/RoleGate';
import { StudentDashboard } from './components/StudentDashboard';
import { CorporateDashboard } from './components/CorporateDashboard';
import { PassengerDashboard } from './components/PassengerDashboard';
import { CollegeAdminDashboard } from './components/CollegeAdminDashboard';
import { PrtcAdminDashboard } from './components/PrtcAdminDashboard';
import { ConductorDashboard } from './components/ConductorDashboard';
import { OneDayPassView } from './components/OneDayPassView';
import { AuthModal } from './components/AuthModal';
import { StudentPassApplicationModal } from './components/StudentPassApplicationModal';
import { EditProfileModal } from './components/EditProfileModal';
import { PassQrModal } from './components/PassQrModal';
import { SchedulesModal } from './components/SchedulesModal';
import { WalletDashboard } from './components/WalletDashboard';
import confetti from 'canvas-confetti';

const roleMapping: Record<string, PortalRole> = {
  student: 'student',
  corporate: 'corporate',
  passenger: 'passenger',
  college_admin: 'college_admin',
  prtc_admin: 'prtc_admin',
  conductor: 'conductor',
};

export default function App() {
  const { t } = useTranslation();
  const [currentRole, setCurrentRole] = useState<PortalRole>('gateway');
  const [colleges, setColleges] = useState(mockColleges);
  const [schedules, setSchedules] = useState(mockSchedules);
  const [applications, setApplications] = useState<StudentApplication[]>(() => getStoredApplications());
  const [tickets, setTickets] = useState<BusTicket[]>(() => getStoredTickets());
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(localStorage.getItem('prtc_access_token')));

  // Modals
  const [activePassData, setActivePassData] = useState<any | null>(null);
  const [isSchedulesOpen, setIsSchedulesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRoleTarget, setAuthRoleTarget] = useState<UserRoleType>('student');
  const [isStudentAppModalOpen, setIsStudentAppModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Refresh server-authoritative applications and tickets
  const loadUserData = () => {
    api.listApplications()
      .then((serverApps) => {
        if (serverApps && serverApps.length > 0) {
          const merged = mergeWithInstitutionalApplications(serverApps);
          setApplications(merged);
          saveStoredApplications(merged);
        }
      })
      .catch((err) => console.warn('Could not load applications from server; using cached/demo applications', err));

    api.listTickets()
      .then((serverTickets) => {
        if (serverTickets && serverTickets.length > 0) {
          setTickets(serverTickets);
          saveStoredTickets(serverTickets);
        }
      })
      .catch((err) => console.warn('Could not load tickets from server; using cached/demo tickets', err));
  };

  // Bootstrap public schedules & colleges + Restore verified server session
  useEffect(() => {
    api.bootstrap()
      .then((data) => {
        if (data.colleges?.length) setColleges(data.colleges);
        if (data.schedules?.length) setSchedules(data.schedules);
        if (data.applications?.length) {
          const merged = mergeWithInstitutionalApplications(data.applications);
          setApplications(merged);
          saveStoredApplications(merged);
        }
        if (data.tickets?.length) {
          setTickets(data.tickets);
          saveStoredTickets(data.tickets);
        }
      })
      .catch((err) => console.warn('Backend unavailable; using bundled demo data.', err));

    loadUserData();

    const token = localStorage.getItem('prtc_access_token');
    const storedSession = getStoredSession();
    if (storedSession?.profile) {
      setUserProfile(storedSession.profile);
      setIsAuthenticated(true);
      const userRole = storedSession.profile.roleType || 'gateway';
      setCurrentRole(roleMapping[userRole] || 'gateway');
    }

    if (token) {
      api.me()
        .then((res) => {
          if (res?.profile) {
            setUserProfile(res.profile);
            setIsAuthenticated(true);
            const userRole = res.profile.roleType || 'gateway';
            setCurrentRole(roleMapping[userRole] || 'gateway');
            saveStoredSession(res.profile, userRole);
            loadUserData();
          }
        })
        .catch((err) => {
          console.warn('Session check note:', err?.message || err);
          if (err?.message && err.message.includes('401')) {
            localStorage.removeItem('prtc_access_token');
            localStorage.removeItem('prtc_active_session_v2');
            setIsAuthenticated(false);
            setCurrentRole('gateway');
          }
        });
    } else if (!storedSession?.profile) {
      setIsAuthenticated(false);
      setCurrentRole('gateway');
    }
  }, []);

  // Handle Authentication Completion
  const handleAuthSuccess = (profile: UserProfile, targetRole: UserRoleType) => {
    setUserProfile(profile);
    setIsAuthenticated(true);
    saveStoredSession(profile, targetRole);
    setIsAuthModalOpen(false);
    setCurrentRole(roleMapping[targetRole] || 'gateway');
    loadUserData();
    confetti({ particleCount: 70, spread: 60 });
  };

  // Sign out / Logout
  const handleLogout = () => {
    localStorage.removeItem('prtc_access_token');
    localStorage.removeItem('prtc_active_session_v2');
    setIsAuthenticated(false);
    setUserProfile(mockUserProfile);
    setApplications(getStoredApplications());
    setTickets(getStoredTickets());
    setCurrentRole('gateway');
  };

  const handleOpenAuth = (roleType: UserRoleType = 'student') => {
    setAuthRoleTarget(roleType);
    setIsAuthModalOpen(true);
  };

  // Application Updates (Approved by College or PRTC)
  const handleUpdateApplication = (updatedApp: StudentApplication) => {
    setApplications((prev) => {
      let found = false;
      const updated = prev.map((a) => {
        const isMatch =
          a.id === updatedApp.id ||
          (a.studentId && updatedApp.studentId && a.studentId === updatedApp.studentId) ||
          (a.rollNumber && updatedApp.rollNumber && a.rollNumber.trim().toLowerCase() === updatedApp.rollNumber.trim().toLowerCase() && a.name && updatedApp.name && a.name.trim().toLowerCase() === updatedApp.name.trim().toLowerCase());
        if (isMatch) {
          found = true;
          return { ...a, ...updatedApp };
        }
        return a;
      });
      const finalApps = found ? updated : [updatedApp, ...prev];
      saveStoredApplications(finalApps);
      return finalApps;
    });
    api.updateApplication(updatedApp)
      .then((saved) => {
        if (saved && saved.id) {
          setApplications((prev) => {
            let found = false;
            const updated = prev.map((a) => {
              const isMatch =
                a.id === saved.id ||
                (a.studentId && saved.studentId && a.studentId === saved.studentId) ||
                (a.rollNumber && saved.rollNumber && a.rollNumber.trim().toLowerCase() === saved.rollNumber.trim().toLowerCase() && a.name && saved.name && a.name.trim().toLowerCase() === saved.name.trim().toLowerCase());
              if (isMatch) {
                found = true;
                return { ...a, ...saved };
              }
              return a;
            });
            const finalApps = found ? updated : [saved, ...prev];
            saveStoredApplications(finalApps);
            return finalApps;
          });
        }
      })
      .catch((err) => console.warn(`Could not sync to backend: ${err.message}`));
  };

  const handleNewStudentApplication = (newApp: StudentApplication) => {
    setApplications((prev) => {
      const updated = [newApp, ...prev.filter((a) => a.id !== newApp.id)];
      saveStoredApplications(updated);
      return updated;
    });
    api.createApplication(newApp)
      .then((saved) => {
        setApplications((prev) => {
          const updated = [saved, ...prev.filter((a) => a.id !== saved.id)];
          saveStoredApplications(updated);
          return updated;
        });
      })
      .catch((err) => console.warn(`Could not sync application to backend: ${err.message}`));
  };

  // Handle Profile Update Persistence
  const handleSaveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    api.updateProfile(updated).catch((err) => console.error('Failed to persist profile update', err));
    const activeSession = getStoredSession();
    if (activeSession) {
      saveStoredSession(updated, activeSession.role);
    }
  };

  // Direct Ticket Booking for Passengers (using verified server route)
  const handleDirectTicketBooking = () => {
    const newTicket: BusTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `PRTC-PB-${Math.floor(10000 + Math.random() * 90000)}`,
      title: 'Chandigarh -> Patiala HVAC Direct Ticket',
      type: 'single',
      route: 'Chandigarh ISBT 43 -> Patiala Bus Stand',
      timestamp: 'Just now',
      amount: 110.0,
      status: 'active',
      validUntil: 'Valid for next 6 Hours',
    };
    api.createTicket(newTicket, userProfile.passId)
      .then((savedTicket) => {
        const ticketToDisplay = savedTicket || newTicket;
        setTickets((prev) => [ticketToDisplay, ...prev.filter((t) => t.id !== ticketToDisplay.id)]);
        confetti({ particleCount: 60, spread: 60 });
        setActivePassData({
          ticketNumber: ticketToDisplay.ticketNumber,
          holderName: userProfile.name,
          title: ticketToDisplay.title,
          passType: 'Direct Ticket',
          route: ticketToDisplay.route,
          validUntil: 'Active for next 6 hours',
          college: 'Pepsu Road Transport Corporation',
          avatarUrl: userProfile.avatarUrl,
        });
      })
      .catch((err) => {
        console.error('Failed to persist ticket on server', err);
        alert(err?.message || 'Failed to book ticket with the server.');
      });
  };

  // Central Gateway Schedule Booking - Redirects to Normal Passenger Login
  const handleBookFromSchedule = (schedule: RouteSchedule) => {
    setIsSchedulesOpen(false);
    handleOpenAuth('passenger');
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-[#1b1c1c] flex flex-col font-sans selection:bg-[#bdc2ff] selection:text-[#000666]">
      {/* Top Main Navigation */}
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        onOpenAuth={handleOpenAuth}
        onOpenSchedules={() => setIsSchedulesOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onLogout={handleLogout}
      />

      {/* Screen Mode Quick Switcher Bar on Top (Sub-header) */}
      <div className="w-full bg-[#eae8e7] border-b border-[#c6c5d4] pt-16 px-4 md:px-8 py-2.5">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#000666] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">dashboard</span>
              {t('quickSwitch.selectRolePortal', 'Select Role Portal:')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'gateway', label: t('quickSwitch.gateway', 'Central Gateway') },
                { id: 'student', label: t('quickSwitch.student', '1. Student Dashboard') },
                { id: 'corporate', label: t('quickSwitch.corporate', '2. For Corporates') },
                { id: 'passenger', label: t('quickSwitch.passenger', '3. Normal Passenger') },
                { id: 'college_admin', label: t('quickSwitch.college_admin', '4. College Admin') },
                { id: 'prtc_admin', label: t('quickSwitch.prtc_admin', '5. PRTC Admin') },
                { id: 'conductor', label: '6. Conductor' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'gateway') {
                      setCurrentRole('gateway');
                      return;
                    }
                    const reqRole = tab.id as UserRoleType;
                    if (!isAuthenticated || userProfile.roleType !== reqRole) {
                      handleOpenAuth(reqRole);
                    } else {
                      setCurrentRole(tab.id as PortalRole);
                    }
                  }}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    currentRole === tab.id
                      ? 'bg-[#000666] text-white shadow-xs'
                      : 'bg-white text-[#454652] hover:bg-[#f0eded] border border-[#c6c5d4]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAuth()}
              className="bg-white border border-[#c6c5d4] hover:bg-[#000666] hover:text-white px-2.5 py-1 rounded-lg text-[11px] text-[#000666] font-bold transition flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">key</span>
              {t('quickSwitch.loginDemo', 'Login Demo Switch')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Screen Container */}
      <div className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-6 flex flex-col">
        {/* 1. CENTRAL GATEWAY */}
        {currentRole === 'gateway' && (
          <CentralGateway
            onOpenAuth={handleOpenAuth}
            onOpenSchedules={() => setIsSchedulesOpen(true)}
            currentRoleType={isAuthenticated ? userProfile?.roleType : undefined}
            onNavigateToRole={(role) => setCurrentRole(roleMapping[role] || 'gateway')}
          />
        )}

        {/* 2. STUDENT DASHBOARD */}
        {currentRole === 'student' && (
          !isAuthenticated || userProfile.roleType !== 'student' ? (
            <RoleGate
              requiredRole="student"
              userProfile={userProfile}
              isAuthenticated={isAuthenticated}
              onOpenAuth={handleOpenAuth}
              onBackToAllowedPortal={() => setCurrentRole(roleMapping[userProfile.roleType] || 'gateway')}
            />
          ) : (
            <StudentDashboard
              userProfile={userProfile}
              applications={applications}
              colleges={colleges}
              onOpenPassModal={(passData) => setActivePassData(passData)}
              onOpenApplicationModal={() => setIsStudentAppModalOpen(true)}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onOpenWallet={() => setIsWalletOpen(true)}
            />
          )
        )}

        {/* 3. CORPORATE DASHBOARD */}
        {currentRole === 'corporate' && (
          !isAuthenticated || userProfile.roleType !== 'corporate' ? (
            <RoleGate
              requiredRole="corporate"
              userProfile={userProfile}
              isAuthenticated={isAuthenticated}
              onOpenAuth={handleOpenAuth}
              onBackToAllowedPortal={() => setCurrentRole(roleMapping[userProfile.roleType] || 'gateway')}
            />
          ) : (
            <CorporateDashboard
              userProfile={userProfile}
              onOpenPassModal={(passData) => setActivePassData(passData)}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onOpenWallet={() => setIsWalletOpen(true)}
            />
          )
        )}

        {/* 4. PASSENGER DASHBOARD */}
        {currentRole === 'passenger' && (
          !isAuthenticated || userProfile.roleType !== 'passenger' ? (
            <RoleGate
              requiredRole="passenger"
              userProfile={userProfile}
              isAuthenticated={isAuthenticated}
              onOpenAuth={handleOpenAuth}
              onBackToAllowedPortal={() => setCurrentRole(roleMapping[userProfile.roleType] || 'gateway')}
            />
          ) : (
            <PassengerDashboard
              userProfile={userProfile}
              tickets={tickets}
              onUpdateUserProfile={setUserProfile}
              onNavigateRole={(role) => setCurrentRole(role)}
              onOpenTicketModal={(t) =>
                setActivePassData({
                  ticketNumber: t.ticketNumber,
                  holderName: userProfile.name,
                  title: t.title,
                  route: t.route,
                  validUntil: t.validUntil || 'Active',
                  college: 'PRTC Punjab State Transport',
                  avatarUrl: userProfile.avatarUrl,
                })
              }
              onBuyDirectTicket={handleDirectTicketBooking}
              onOpenWallet={() => setIsWalletOpen(true)}
            />
          )
        )}

        {/* 5. COLLEGE ADMIN DASHBOARD */}
        {currentRole === 'college_admin' && (
          !isAuthenticated || userProfile.roleType !== 'college_admin' ? (
            <RoleGate
              requiredRole="college_admin"
              userProfile={userProfile}
              isAuthenticated={isAuthenticated}
              onOpenAuth={handleOpenAuth}
              onBackToAllowedPortal={() => setCurrentRole(roleMapping[userProfile.roleType] || 'gateway')}
            />
          ) : (
            <CollegeAdminDashboard
              userProfile={userProfile}
              colleges={colleges}
              applications={applications}
              onUpdateApplication={handleUpdateApplication}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onOpenWallet={() => setIsWalletOpen(true)}
            />
          )
        )}

        {/* 6. PRTC ADMIN DASHBOARD */}
        {currentRole === 'prtc_admin' && (
          !isAuthenticated || userProfile.roleType !== 'prtc_admin' ? (
            <RoleGate
              requiredRole="prtc_admin"
              userProfile={userProfile}
              isAuthenticated={isAuthenticated}
              onOpenAuth={handleOpenAuth}
              onBackToAllowedPortal={() => setCurrentRole(roleMapping[userProfile.roleType] || 'gateway')}
            />
          ) : (
            <PrtcAdminDashboard
              userProfile={userProfile}
              colleges={colleges}
              applications={applications}
              onUpdateApplication={handleUpdateApplication}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onOpenPassModal={(passData) => setActivePassData(passData)}
            />
          )
        )}

        {currentRole === 'conductor' && (
          !isAuthenticated || userProfile.roleType !== 'conductor' ? (
            <RoleGate requiredRole="conductor" userProfile={userProfile} isAuthenticated={isAuthenticated} onOpenAuth={handleOpenAuth} onBackToAllowedPortal={() => setCurrentRole(roleMapping[userProfile.roleType] || 'gateway')} />
          ) : (
            <ConductorDashboard userProfile={userProfile} />
          )
        )}

        {/* 7. ONE DAY PASS VIEW */}
        {currentRole === 'one_day_pass' && (
          <OneDayPassView
            onIssuePass={(pass) => setActivePassData(pass)}
          />
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* 5-Role Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        colleges={colleges}
        initialRoleType={authRoleTarget}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Student Concession Application Modal */}
      <StudentPassApplicationModal
        isOpen={isStudentAppModalOpen}
        onClose={() => setIsStudentAppModalOpen(false)}
        userProfile={userProfile}
        colleges={colleges}
        onSubmitApplication={handleNewStudentApplication}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        userProfile={userProfile}
        colleges={colleges}
        onSaveProfile={handleSaveProfile}
      />

      {/* Pass & Ticket QR Modal */}
      {activePassData && (
        <PassQrModal
          passData={activePassData}
          onClose={() => setActivePassData(null)}
        />
      )}

      {/* Schedules Modal */}
      {isSchedulesOpen && (
        <SchedulesModal
          schedules={schedules}
          onClose={() => setIsSchedulesOpen(false)}
          onBookRoute={handleBookFromSchedule}
        />
      )}

      {/* Wallet Dashboard Modal */}
      {isWalletOpen && (
        <WalletDashboard
          userProfile={userProfile}
          onClose={() => {
            setIsWalletOpen(false);
            loadUserData();
          }}
        />
      )}
    </div>
  );
}
