import React from 'react';
import { UserProfile, UserRoleType } from '../types';

interface RoleGateProps {
  requiredRole: UserRoleType;
  userProfile?: UserProfile;
  isAuthenticated: boolean;
  onOpenAuth: (roleType: UserRoleType) => void;
  onBackToAllowedPortal: () => void;
}

const ROLE_INFO: Record<UserRoleType, { title: string; icon: string; desc: string; buttonLabel: string }> = {
  student: {
    title: 'Student Concession Portal',
    icon: 'school',
    desc: 'Access Punjab student subsidized bus passes and active application tracking.',
    buttonLabel: 'Sign In as Student',
  },
  corporate: {
    title: 'Corporate Transit Portal',
    icon: 'business_center',
    desc: 'Company executive passes and employee commuter management.',
    buttonLabel: 'Sign In as Corporate Employee',
  },
  passenger: {
    title: 'Passenger Ticket Portal',
    icon: 'person',
    desc: 'Daily express bus bookings and 24-hour unlimited city passes.',
    buttonLabel: 'Sign In as Passenger',
  },
  college_admin: {
    title: 'College Verification Authority Desk',
    icon: 'account_balance',
    desc: 'Authorized institutional verification for inspecting student enrollment and applying official digital stamps.',
    buttonLabel: 'Sign In as College Admin',
  },
  prtc_admin: {
    title: 'PRTC State Transport Authority',
    icon: 'local_police',
    desc: 'State transit headquarters portal for depot operations, pass sanctions, and college audits.',
    buttonLabel: 'Sign In as PRTC Admin',
  },
};

export const RoleGate: React.FC<RoleGateProps> = ({
  requiredRole,
  userProfile,
  isAuthenticated,
  onOpenAuth,
  onBackToAllowedPortal,
}) => {
  const info = ROLE_INFO[requiredRole] || ROLE_INFO.student;
  const currentRoleName = userProfile?.roleType
    ? userProfile.roleType.replace('_', ' ').toUpperCase()
    : 'GUEST';

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-[#c6c5d4] shadow-2xl overflow-hidden text-center">
        {/* Top Header */}
        <div className="bg-[#000666] text-white p-6 relative">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <span className="material-symbols-outlined text-3xl text-amber-300">lock</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">{info.title}</h2>
          <p className="text-xs text-[#bdc2ff] mt-1">{info.desc}</p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {isAuthenticated && userProfile && userProfile.roleType !== requiredRole ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 flex items-start gap-3">
              <span className="material-symbols-outlined text-lg text-amber-700 shrink-0 mt-0.5">warning</span>
              <div>
                <p className="font-bold">Role Access Restricted</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  You are currently signed in as <strong className="text-black">{userProfile.name}</strong> with role{' '}
                  <span className="font-mono font-bold bg-amber-200 px-1 py-0.5 rounded">{currentRoleName}</span>.
                  This portal is restricted to authorized <span className="font-bold text-[#000666] uppercase">{requiredRole.replace('_', ' ')}</span> accounts.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-left text-xs text-blue-900 flex items-start gap-3">
              <span className="material-symbols-outlined text-lg text-[#000666] shrink-0 mt-0.5">info</span>
              <div>
                <p className="font-bold">Authentication Required</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Please sign in with your authorized credentials to access this dashboard.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onOpenAuth(requiredRole)}
              className="w-full py-3 bg-[#000666] hover:bg-[#1a237e] text-white rounded-xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              {info.buttonLabel}
            </button>

            {isAuthenticated && userProfile && (
              <button
                onClick={onBackToAllowedPortal}
                className="w-full py-2.5 bg-[#f5f3f3] hover:bg-[#eae8e7] text-[#1b1c1c] rounded-xl font-bold text-xs transition border border-[#c6c5d4] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Return to My Dashboard ({userProfile.name})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
