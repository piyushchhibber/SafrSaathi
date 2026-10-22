import React, { useState, useEffect } from 'react';
import { PortalRole, StudentApplication, BusTicket, UserProfile, RouteSchedule, UserRoleType } from './types';
import {
  mockColleges,
  mockUserProfile,
  mockSchedules,
} from './data/mockData';
import { getStoredSession, saveStoredSession } from './utils/storage';
import { api } from './utils/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CentralGateway } from './components/CentralGateway';
import { StudentDashboard } from './components/StudentDashboard';
import { CorporateDashboard } from './components/CorporateDashboard';
import { PassengerDashboard } from './components/PassengerDashboard';
import { CollegeAdminDashboard } from './components/CollegeAdminDashboard';
import { PrtcAdminDashboard } from './components/PrtcAdminDashboard';
import { OneDayPassView } from './components/OneDayPassView';
import { AuthModal } from './components/AuthModal';
import { StudentPassApplicationModal } from './components/StudentPassApplicationModal';
import { EditProfileModal } from './components/EditProfileModal';
import { PassQrModal } from './components/PassQrModal';
import { SchedulesModal } from './components/SchedulesModal';
import confetti from 'canvas-confetti';

const roleMapping: Record<string, PortalRole> = {
  student: 'student',
  corporate: 'corporate',
  passenger: 'passenger',
  college_admin: 'college_admin',
  prtc_admin: 'prtc_admin',
};

export default function App() {
  const [currentRole, setCurrentRole] = useState<PortalRole>('gateway');
  const [colleges, setColleges] = useState(mockColleges);
  const [schedules, setSchedules] = useState(mockSchedules);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [tickets, setTickets] = useState<BusTicket[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);

  // Modals
  const [activePassData, setActivePassData] = useState<any | null>(null);
  const [isSchedulesOpen, setIsSchedulesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRoleTarget, setAuthRoleTarget] = useState<UserRoleType>('student');
  const [isStudentAppModalOpen, setIsStudentAppModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Refresh server-authoritative applications and tickets
  const loadUserData = () => {
    api.listApplications()
      .then((serverApps) => {
        if (serverApps) setApplications(serverApps);
      })
      .catch((err) => console.warn('Could not load applications from server', err));

    api.listTickets()
      .then((serverTickets) => {
        if (serverTickets) setTickets(serverTickets);
      })
      .catch((err) => console.warn('Could not load tickets from server', err));
  };

  // Bootstrap public schedules & colleges + Restore verified server session
  useEffect(() => {
    api.bootstrap()
      .then((data) => {
        if (data.colleges?.length) setColleges(data.colleges);
        if (data.schedules?.length) setSchedules(data.schedules);
      })
      .catch((err) => console.warn('Backend unavailable; using bundled demo data.', err));

    const token = localStorage.getItem('prtc_access_token');
    if (token) {
      api.me()
        .then((res) => {
          if (res?.profile) {
            setUserProfile(res.profile);
            const userRole = res.profile.roleType || 'gateway';
            setCurrentRole(roleMapping[userRole] || 'gateway');
            saveStoredSession(res.profile, userRole);
            loadUserData();
          }
        })
        .catch((err) => {
          console.warn('Session expired or invalid token:', err);
          localStorage.removeItem('prtc_access_token');
          localStorage.removeItem('prtc_active_session_v2');
          setCurrentRole('gateway');
        });
    } else {
      setCurrentRole('gateway');
    }
  }, []);

  // Handle Authentication Completion
  const handleAuthSuccess = (profile: UserProfile, targetRole: UserRoleType) => {
    setUserProfile(profile);
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
    setUserProfile(mockUserProfile);
    setApplications([]);
    setTickets([]);
    setCurrentRole('gateway');
  };

  const handleOpenAuth = (roleType: UserRoleType = 'student') => {
    setAuthRoleTarget(roleType);
    setIsAuthModalOpen(true);
  };

  // Application Updates (Approved by College or PRTC)
  const handleUpdateApplication = (updatedApp: StudentApplication) => {
    setApplications((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
    api.updateApplication(updatedApp)
      .then((saved) => {
        setApplications((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
      })
      .catch((err) => console.warn(`Could not sync to backend: ${err.message}`));
  };

  const handleNewStudentApplication = (newApp: StudentApplication) => {
    setApplications((prev) => [newApp, ...prev.filter((a) => a.id !== newApp.id)]);
    api.createApplication(newApp)
      .then((saved) => {
        setApplications((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
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
        onOpenAuth={handleOpenAuth}
        onOpenSchedules={() => setIsSchedulesOpen(true)}
        onLogout={handleLogout}
      />

      {/* Screen Mode Quick Switcher Bar on Top (Sub-header) */}
      <div className="w-full bg-[#eae8e7] border-b border-[#c6c5d4] pt-16 px-4 md:px-8 py-2.5">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#000666] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">dashboard</span>
              Select Role Portal:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'gateway', label: 'Central Gateway' },
                { id: 'student', label: '1. Student Dashboard' },
                { id: 'corporate', label: '2. For Corporates' },
                { id: 'passenger', label: '3. Normal Passenger' },
                { id: 'college_admin', label: '4. College Admin' },
                { id: 'prtc_admin', label: '5. PRTC Admin' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentRole(tab.id as PortalRole)}
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
              Login Dialog
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
          />
        )}

        {/* 2. STUDENT DASHBOARD */}
        {currentRole === 'student' && (
          <StudentDashboard
            userProfile={userProfile}
            applications={applications}
            colleges={colleges}
            onOpenPassModal={(passData) => setActivePassData(passData)}
            onOpenApplicationModal={() => setIsStudentAppModalOpen(true)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
          />
        )}

        {/* 3. CORPORATE DASHBOARD */}
        {currentRole === 'corporate' && (
          <CorporateDashboard
            userProfile={userProfile}
            onOpenPassModal={(passData) => setActivePassData(passData)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
          />
        )}

        {/* 4. PASSENGER DASHBOARD */}
        {currentRole === 'passenger' && (
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
          />
        )}

        {/* 5. COLLEGE ADMIN DASHBOARD */}
        {currentRole === 'college_admin' && (
          <CollegeAdminDashboard
            userProfile={userProfile}
            colleges={colleges}
            applications={applications}
            onUpdateApplication={handleUpdateApplication}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
          />
        )}

        {/* 6. PRTC ADMIN DASHBOARD */}
        {currentRole === 'prtc_admin' && (
          <PrtcAdminDashboard
            userProfile={userProfile}
            colleges={colleges}
            applications={applications}
            onUpdateApplication={handleUpdateApplication}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenPassModal={(passData) => setActivePassData(passData)}
          />
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
    </div>
  );
}
