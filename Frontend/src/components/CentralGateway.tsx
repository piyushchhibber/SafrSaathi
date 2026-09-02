import React from 'react';
import { UserRoleType } from '../types';
import { SafrSaathiLogo } from './SafrSaathiLogo';

interface CentralGatewayProps {
  onOpenAuth: (roleType: UserRoleType) => void;
  onOpenSchedules: () => void;
}

export const CentralGateway: React.FC<CentralGatewayProps> = ({ onOpenAuth, onOpenSchedules }) => {
  const loginRoles: {
    id: UserRoleType;
    title: string;
    subheading: string;
    icon: string;
    description: string;
    buttonText: string;
    accentColor: string;
    tag: string;
    isOutline?: boolean;
    isDarkSecondary?: boolean;
  }[] = [
    {
      id: 'student',
      title: 'Student Portal',
      subheading: 'Concession Pass (75% Subsidy)',
      icon: 'school',
      description:
        'Sign up with Punjab Aadhaar, college roll no. & fee receipt. Access virtual pass & live application status.',
      buttonText: 'Student Sign In / Sign Up',
      accentColor: '#FF9933', // Saffron
      tag: 'Punjab Residents Only',
    },
    {
      id: 'corporate',
      title: 'For Corporates',
      subheading: 'Employee Commute Passes',
      icon: 'business_center',
      description:
        'Company sign-in & onboarding. Buy monthly executive passes, roster employee passes & access corporate billing.',
      buttonText: 'Corporate Sign In / Sign Up',
      accentColor: '#1a237e', // Indigo
      tag: 'Bulk Transit',
    },
    {
      id: 'passenger',
      title: 'Normal Passengers',
      subheading: 'Daily Direct & One Day Tickets',
      icon: 'person',
      description:
        'Simple passenger sign-in & sign-up. Buy direct point-to-point tickets or 24-hour unlimited city passes.',
      buttonText: 'Passenger Sign In / Sign Up',
      accentColor: '#138808', // Punjab Green
      tag: 'General Public',
    },
    {
      id: 'college_admin',
      title: 'College Admin',
      subheading: 'Institutional Verification Desk',
      icon: 'account_balance',
      description:
        'Sign in with your College Name. Review student applications, inspect fee receipts & apply official virtual college stamp.',
      buttonText: 'College Admin Sign In',
      accentColor: '#df8017',
      tag: 'Institutional Portal',
      isOutline: true,
    },
    {
      id: 'prtc_admin',
      title: 'PRTC Admin',
      subheading: 'State Transport Depot Authority',
      icon: 'admin_panel_settings',
      description:
        'Sign in with your Unique Admin ID. Inspect college-stamped passes, drill into Punjab colleges & issue state transit tokens.',
      buttonText: 'PRTC Admin Sign In',
      accentColor: '#000666',
      tag: 'Depot Headquarters',
      isDarkSecondary: true,
    },
  ];

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in">
      {/* Hero Section */}
      <section className="w-full relative rounded-3xl overflow-hidden mt-2 mb-8 min-h-[360px] md:h-[380px] flex items-center justify-center text-center bg-[#000666] text-white shadow-xl border border-[#c6c5d4]/40">
        {/* Background Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&auto=format&fit=crop&q=80')`,
          }}
        />
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000666] via-[#000666]/75 to-transparent" />

        {/* Content */}
        <div className="relative z-10 px-6 max-w-3xl flex flex-col items-center">
          <div className="mb-3">
            <SafrSaathiLogo variant="badge" size="sm" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide text-[#bdc2ff] mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            PUNJAB STATE TRANSIT & CONCESSION PORTAL
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 tracking-tight leading-tight">
            SafrSaathi Transit Portal
          </h1>

          <p className="text-sm sm:text-base text-[#bdc2ff] max-w-2xl mb-6 leading-relaxed font-normal">
            Unified digital ecosystem for Student Concession Passes with College Stamps, Corporate Transit Programs, PRTC Depot Governance, and General Commuters.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('student')}
              className="bg-[#FF9933] text-black font-extrabold px-6 py-3 rounded-xl hover:bg-[#e68a2e] shadow-lg transition flex items-center gap-2 text-xs sm:text-sm"
            >
              <span className="material-symbols-outlined text-lg">school</span>
              Student Pass Sign Up / Login
            </button>
            <button
              onClick={onOpenSchedules}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 text-xs sm:text-sm"
            >
              <span className="material-symbols-outlined text-lg">schedule</span>
              Transit Schedules & Depots
            </button>
          </div>
        </div>
      </section>

      {/* 5 Distinct Login Portals Header */}
      <section className="w-full mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#c6c5d4] pb-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#000666]"></span>
              <h2 className="text-2xl md:text-3xl font-black text-[#000666] tracking-tight">
                Select Your Login Portal
              </h2>
            </div>
            <p className="text-[#454652] text-xs sm:text-sm mt-1">
              Choose your role below to access dedicated dashboards, virtual passes, or approval systems.
            </p>
          </div>
          <div className="text-xs text-[#767683] font-semibold mt-2 sm:mt-0 flex items-center gap-1.5 bg-[#f0eded] px-3 py-1.5 rounded-full border border-[#c6c5d4]">
            <span className="material-symbols-outlined text-sm text-[#000666]">verified_user</span>
            Govt. of Punjab 5-Role Access Control
          </div>
        </div>

        {/* 5 Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {loginRoles.map((role) => (
            <div
              key={role.id}
              onClick={() => onOpenAuth(role.id)}
              className={`rounded-3xl border transition-all duration-300 p-5 flex flex-col items-center text-center relative overflow-hidden group cursor-pointer hover:-translate-y-1.5 shadow-xs hover:shadow-xl ${
                role.isDarkSecondary
                  ? 'bg-[#f5f3f3] border-[#c6c5d4]'
                  : 'bg-white border-[#c6c5d4]'
              }`}
            >
              {/* Dynamic Top Accent Bar */}
              <div
                className="absolute top-0 left-0 w-full h-2 transition-all duration-300 group-hover:h-3"
                style={{ backgroundColor: role.accentColor }}
              />

              {/* Tag */}
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#454652] bg-[#f0eded] px-2.5 py-0.5 rounded-full mb-3 mt-1">
                {role.tag}
              </span>

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-xs"
                style={{
                  backgroundColor: role.isDarkSecondary ? '#e4e2e1' : '#f0eded',
                  color: '#000666',
                }}
              >
                <span className="material-symbols-outlined text-3xl">{role.icon}</span>
              </div>

              {/* Title & Subheading */}
              <h3 className="text-base font-extrabold text-[#1b1c1c] group-hover:text-[#000666] transition">
                {role.title}
              </h3>
              <p className="text-[11px] font-semibold text-[#000666] mb-2 leading-tight">
                {role.subheading}
              </p>

              {/* Description */}
              <p className="text-xs text-[#454652] leading-relaxed mb-5 flex-grow">
                {role.description}
              </p>

              {/* Action Button */}
              <button
                type="button"
                className={`w-full py-2.5 px-3 text-xs font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 ${
                  role.isOutline
                    ? 'border-2 border-[#000666] text-[#000666] hover:bg-[#000666] hover:text-white'
                    : role.isDarkSecondary
                    ? 'bg-[#000666] text-white hover:bg-[#1a237e]'
                    : 'bg-[#1a237e] text-white hover:bg-[#000666]'
                }`}
              >
                <span>{role.buttonText}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Verified Institutional Highlights Strip */}
      <section className="w-full bg-[#f0eded] border border-[#c6c5d4] rounded-3xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#c6c5d4] flex items-center justify-center text-[#000666] shrink-0 font-bold">
              <span className="material-symbols-outlined text-xl">school</span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#1b1c1c]">Punjab Student Concessions</h4>
              <p className="text-xs text-[#454652] mt-0.5">
                Mandatory Punjab residency validation via Aadhaar & live college registrar digital stamping.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#c6c5d4] flex items-center justify-center text-[#000666] shrink-0 font-bold">
              <span className="material-symbols-outlined text-xl">corporate_fare</span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#1b1c1c]">Corporate Mobility Solutions</h4>
              <p className="text-xs text-[#454652] mt-0.5">
                Dedicated employer portal for purchasing bulk monthly executive passes for IT parks & industrial hubs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#c6c5d4] flex items-center justify-center text-[#000666] shrink-0 font-bold">
              <span className="material-symbols-outlined text-xl">verified_user</span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-[#1b1c1c]">PRTC State Administration</h4>
              <p className="text-xs text-[#454652] mt-0.5">
                Direct depot nodal control, college roster oversight, and encrypted conductor QR pass issuance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
