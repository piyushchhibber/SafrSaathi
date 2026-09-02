import React, { useState, useEffect } from 'react';
import { PortalRole, StudentApplication, BusTicket, UserProfile, RouteSchedule, UserRoleType } from './types';
import {
  mockColleges,
  mockStudentApplications,
  mockRecentTickets,
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

export default function App() {
  const [currentRole, setCurrentRole] = useState<PortalRole>('gateway');
  const [colleges, setColleges] = useState(mockColleges);
  const [schedules, setSchedules] = useState(mockSchedules);
  const [applications, setApplications] = useState<StudentApplication[]>(mockStudentApplications);
  const [tickets, setTickets] = useState<BusTicket[]>(mockRecentTickets);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const savedSession = getStoredSession();
    return savedSession?.profile || mockUserProfile;
  });

  // Modals
  const [activePassData, setActivePassData] = useState<any | null>(null);
  const [isSchedulesOpen, setIsSchedulesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRoleTarget, setAuthRoleTarget] = useState<UserRoleType>('student');
  const [isStudentAppModalOpen, setIsStudentAppModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Load persisted backend state. Mock data remains as an offline fallback.
  useEffect(() => {
    api.bootstrap()
      .then((data) => {
        if (data.colleges?.length) setColleges(data.colleges);
        if (data.applications?.length) setApplications(data.applications);
        if (data.tickets?.length) setTickets(data.tickets);
        if (data.schedules?.length) setSchedules(data.schedules);
      })
      .catch((err) => console.warn('Backend unavailable; using bundled demo data.', err));
  }, []);

  // Handle Authentication Completion
  const handleAuthSuccess = (profile: UserProfile, targetRole: UserRoleType) => {
    setUserProfile(profile);
    saveStoredSession(profile, targetRole);
    setIsAuthModalOpen(false);

    // Map role type to dashboard view
    const roleMapping: Record<UserRoleType, PortalRole> = {
      student: 'student',
      corporate: 'corporate',
      passenger: 'passenger',
      college_admin: 'college_admin',
      prtc_admin: 'prtc_admin',
    };

    setCurrentRole(roleMapping[targetRole] || 'gateway');
    confetti({ particleCount: 70, spread: 60 });
  };

  const handleOpenAuth = (roleType: UserRoleType = 'student') => {
    setAuthRoleTarget(roleType);
    setIsAuthModalOpen(true);
  };

  // Application Updates (Approved by College or PRTC)
  const handleUpdateApplication = (updatedApp: StudentApplication) => {
    setApplications((prev) => {
      return prev.map((app) => (app.id === updatedApp.id ? updatedApp : app));
    });
    api.updateApplication(updatedApp).catch((err) => console.error('Failed to persist application update', err));
  };

  const handleNewStudentApplication = (newApp: StudentApplication) => {
    setApplications((prev) => {
      return [newApp, ...prev];
    });
    api.createApplication(newApp).catch((err) => console.error('Failed to persist new application', err));
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

  // Direct Ticket Booking for Passengers
  const handleDirectTicketBooking = () => {
    const newTicket: BusTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `PRTC-PB-${Math.floor(10000 + Math.random() * 90000)}`,
      title: 'Patiala Express HVAC Direct Ticket',
      type: 'single',
      route: 'ISBT Sector 43 Chandigarh -> Patiala Bus Stand',
      timestamp: 'Just now',
      amount: 65.0,
      status: 'active',
      validUntil: 'Valid for next 6 Hours',
    };
    setTickets((prev) => {
      return [newTicket, ...prev];
    });
    api.createTicket(newTicket, userProfile.passId).catch((err) => console.error('Failed to persist ticket', err));
    confetti({ particleCount: 60, spread: 60 });
    setActivePassData({
      ticketNumber: newTicket.ticketNumber,
      holderName: userProfile.name,
      title: newTicket.title,
      passType: 'Direct Ticket',
      route: newTicket.route,
      validUntil: 'Active for next 6 hours',
      college: 'Pepsu Road Transport Corporation',
      avatarUrl: userProfile.avatarUrl,
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
