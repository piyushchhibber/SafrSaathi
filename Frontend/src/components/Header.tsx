import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PortalRole, UserProfile, UserRoleType } from '../types';
import { SafrSaathiLogo } from './SafrSaathiLogo';

interface HeaderProps {
  currentRole: PortalRole;
  setCurrentRole: (role: PortalRole) => void;
  userProfile: UserProfile;
  isAuthenticated?: boolean;
  onOpenAuth: (roleType?: UserRoleType) => void;
  onOpenSchedules: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  userProfile,
  isAuthenticated = false,
  onOpenAuth,
  onOpenSchedules,
  onLogout,
}) => {
  const { t, i18n } = useTranslation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const roleOptions: { key: PortalRole; label: string; icon: string; desc: string; badge?: string }[] = [
    { key: 'gateway', label: t('nav.roles.gateway', 'Central Gateway'), icon: 'apps', desc: t('nav.roles.gatewayDesc', '5-Role selection hub') },
    { key: 'student', label: t('nav.roles.student', 'Student Dashboard'), icon: 'school', desc: t('nav.roles.studentDesc', 'Virtual pass & concession status'), badge: 'Student' },
    { key: 'corporate', label: t('nav.roles.corporate', 'Corporate Dashboard'), icon: 'business', desc: t('nav.roles.corporateDesc', 'Monthly passes & employee roster'), badge: 'Corporate' },
    { key: 'passenger', label: t('nav.roles.passenger', 'Passenger Dashboard'), icon: 'person', desc: t('nav.roles.passengerDesc', 'Direct & 1-day tickets'), badge: 'Passenger' },
    { key: 'college_admin', label: t('nav.roles.college_admin', 'College Admin Desk'), icon: 'account_balance', desc: t('nav.roles.collegeAdminDesc', 'Student reviews & college stamp'), badge: 'College' },
    { key: 'prtc_admin', label: t('nav.roles.prtc_admin', 'PRTC Admin Portal'), icon: 'local_police', desc: t('nav.roles.prtcAdminDesc', 'College lists & depot sanctions'), badge: 'PRTC HQ' },
    { key: 'conductor', label: 'Crew Scanner', icon: 'qr_code_scanner', desc: 'Verify a passenger pass on board', badge: 'Crew' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-[#fbf9f8]/95 backdrop-blur-md border-b border-[#c6c5d4] transition-all">
      {/* Brand logo and primary text */}
      <div className="flex items-center gap-3 md:gap-6">
        <button
          onClick={() => setCurrentRole('gateway')}
          className="flex items-center text-left focus:outline-none group cursor-pointer hover:opacity-95 transition"
        >
          <SafrSaathiLogo size="sm" variant="horizontal" />
        </button>

        {/* Desktop Quick Nav */}
        <nav className="hidden lg:flex items-center gap-5 ml-4 text-xs text-[#454652] font-bold">
          <button
            onClick={onOpenSchedules}
            className="hover:text-[#000666] transition flex items-center gap-1 focus:outline-none"
          >
            <span className="material-symbols-outlined text-sm">schedule</span>
            {t('nav.timings', 'Bus Timings & Depots')}
          </button>
          <button
            onClick={() => onOpenAuth('student')}
            className="hover:text-[#000666] transition flex items-center gap-1 focus:outline-none"
          >
            <span className="material-symbols-outlined text-sm">school</span>
            {t('nav.student', 'Student Concession')}
          </button>
          <button
            onClick={() => onOpenAuth('corporate')}
            className="hover:text-[#000666] transition flex items-center gap-1 focus:outline-none"
          >
            <span className="material-symbols-outlined text-sm">business</span>
            {t('nav.corporate', 'Corporate Passes')}
          </button>
        </nav>
      </div>

      {/* Right Controls & Role Switcher */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Switch Portal Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#000666] bg-white border border-[#c6c5d4] px-3 py-1.5 rounded-xl hover:bg-[#f5f3f3] shadow-xs transition"
          >
            <span className="material-symbols-outlined text-sm text-[#000666]">sync_alt</span>
            <span className="hidden sm:inline">{t('nav.roleView', 'Role View')}:</span>
            <span className="font-extrabold text-[#000666]">
              {isAuthenticated && userProfile.roleType
                ? roleOptions.find((r) => r.key === (userProfile.roleType as PortalRole))?.badge || 'Logged In'
                : 'Portals'}
            </span>
            <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#c6c5d4] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-1.5 border-b border-[#eae8e7] text-[10px] font-black text-[#767683] uppercase tracking-wider">
                Select Active Dashboard (5 Logins)
              </div>
              <div className="py-1">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setRoleMenuOpen(false);
                      if (opt.key === 'gateway') {
                        setCurrentRole('gateway');
                        return;
                      }
                      const reqRole = opt.key as UserRoleType;
                      if (!isAuthenticated || userProfile.roleType !== reqRole) {
                        onOpenAuth(reqRole);
                      } else {
                        setCurrentRole(opt.key);
                      }
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 hover:bg-[#f5f3f3] transition ${
                      currentRole === opt.key ? 'bg-blue-50 font-bold text-[#000666]' : 'text-[#1b1c1c]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg text-[#000666] mt-0.5">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-extrabold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {opt.badge && (
                          <span className="text-[9px] bg-gray-100 text-[#454652] px-1.5 py-0.2 rounded font-bold">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#767683] font-normal">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher - Prominent & Comfortable Size */}
        <div className="flex items-center gap-1.5 bg-white border-2 border-[#000666]/30 hover:border-[#000666] rounded-xl px-3 py-1.5 shadow-xs transition group">
          <span className="material-symbols-outlined text-base text-[#000666] group-hover:scale-110 transition-transform">translate</span>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="text-xs sm:text-sm font-extrabold text-[#1b1c1c] bg-transparent focus:outline-none cursor-pointer py-0.5 pr-1 tracking-tight"
            aria-label="Select Language"
          >
            <option value="en" className="py-2.5 text-sm font-bold text-gray-900 bg-white">English</option>
            <option value="pa" className="py-2.5 text-sm font-bold text-gray-900 bg-white">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="hi" className="py-2.5 text-sm font-bold text-gray-900 bg-white">हिन्दी (Hindi)</option>
          </select>
        </div>

        {/* Login / Switch Account Button */}
        <button
          onClick={() => onOpenAuth()}
          className="px-3.5 py-1.5 rounded-xl bg-[#000666] hover:bg-[#1a237e] text-white text-xs font-extrabold transition shadow-xs flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">login</span>
          <span className="hidden sm:inline">{t('nav.signIn', 'Sign In / Switch')}</span>
        </button>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-xl bg-[#eae8e7] border border-[#c6c5d4] shadow-xs overflow-hidden flex items-center justify-center hover:opacity-90 transition focus:outline-none"
          >
            <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#c6c5d4] p-4 z-50 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-[#eae8e7]">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#c6c5d4]"
                />
                <div>
                  <div className="font-extrabold text-sm text-[#1b1c1c]">{userProfile.name}</div>
                  <div className="text-[10px] font-mono text-[#767683]">{userProfile.passId || userProfile.adminId || 'PRTC-USER'}</div>
                  <div className="text-[9px] text-[#000666] font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 w-fit mt-0.5">
                    {userProfile.roleTitle}
                  </div>
                </div>
              </div>
              <div className="py-2 text-xs text-[#454652] space-y-1">
                <div className="truncate">
                  <span className="font-bold text-[#1b1c1c]">Email:</span> {userProfile.email}
                </div>
                <div>
                  <span className="font-bold text-[#1b1c1c]">Phone:</span> {userProfile.phone}
                </div>
              </div>
              <div className="pt-2 border-t border-[#eae8e7] space-y-1.5">
                <button
                  onClick={() => {
                    onOpenAuth();
                    setProfileOpen(false);
                  }}
                  className="w-full text-center py-2 text-xs font-extrabold bg-[#000666] text-white rounded-xl hover:bg-[#1a237e]"
                >
                  Switch Role Login
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setProfileOpen(false);
                    }}
                    className="w-full text-center py-2 text-xs font-extrabold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl transition"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
