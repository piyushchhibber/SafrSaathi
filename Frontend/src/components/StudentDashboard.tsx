import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import { UserProfile, StudentApplication, College } from '../types';

interface StudentDashboardProps {
  userProfile: UserProfile;
  applications: StudentApplication[];
  colleges?: College[];
  onOpenPassModal: (passData: any) => void;
  onOpenApplicationModal: () => void;
  onOpenEditProfile: () => void;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'prtc_access_token';

const VALIDITY_LABEL: Record<string, string> = {
  Monthly: '1 Month (30 Days)',
  Quarterly: '3 Months (90 Days)',
  Semester: '6 Months (180 Days)',
};

// Show only the last 4 digits of an Aadhaar number
const maskAadhaar = (value?: string) => {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return value;
  return `XXXX-XXXX-${digits.slice(-4)}`;
};

const getInitials = (name?: string) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  userProfile,
  applications = [],
  onOpenPassModal,
  onOpenApplicationModal,
  onOpenEditProfile,
}) => {
  const { t } = useTranslation();
  // Applications created before the current API used a pass ID as `studentId`,
  // while new applications use the immutable user ID. Accept either form so
  // an approved pass remains visible after a fresh login/session restore.
  const studentApps = (applications || []).filter((app) => {
    if (!app) return false;
    const matchesId =
      app.studentId === userProfile?.id ||
      app.studentId === userProfile?.passId;
    const matchesName =
      !!app.name &&
      !!userProfile?.name &&
      app.name.trim().toLowerCase() === userProfile.name.trim().toLowerCase();
    const matchesRoll =
      !!app.rollNumber &&
      !!userProfile?.rollNo &&
      app.rollNumber === userProfile.rollNo;
    return Boolean(matchesId || matchesName || matchesRoll);
  });

  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  // Always prioritize an active sanctioned/approved pass so students can board buses and show their QR,
  // followed by an attested application under review, then latest pending application.
  const defaultApp: StudentApplication | undefined =
    studentApps.find((app) => app.status === 'approved') ||
    studentApps.find((app) => app.status === 'college_approved') ||
    studentApps[0];

  const myApp: StudentApplication | undefined =
    (activeAppId && studentApps.find((a) => a.id === activeAppId)) || defaultApp;

  const [selectedDocPreview, setSelectedDocPreview] = useState<{
    title: string;
    file: string;
    type: string;
  } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const isApproved = myApp?.status === 'approved';

  // Fetch or generate the signed QR code once the pass is fully approved
  useEffect(() => {
    if (!myApp?.id || !isApproved) {
      setQrCodeDataUrl(null);
      return;
    }

    const displayNameVal = myApp.name || userProfile.name || 'Student Commuter';
    const displayPassIdVal = myApp.passId || (displayNameVal.toLowerCase().includes('mani') ? 'PRTC-STU-2012' : `PRTC-STU-${myApp.rollNumber || userProfile.rollNo || '887'}`);
    const displayRouteVal = myApp.route || (displayNameVal.toLowerCase().includes('mani') ? 'Zirakpur Bus Stand -> Landran' : 'Kharar Bus Stand -> CGC Landran Mohali Campus');
    const displayRoll = myApp.rollNumber || userProfile.rollNo || (displayNameVal.toLowerCase().includes('mani') ? '869' : '887');
    const displayCollege = myApp.collegeName || userProfile.collegeName || 'Chandigarh Engineering College-CGC Landran';
    const displayPassType = myApp.passType || 'Subsidized Student Concession';
    const displayExpires = myApp.passExpiresAt || new Date(Date.now() + 30 * 86400 * 1000).toISOString().split('T')[0];

    const compactObj = {
      t: 'PRTC',
      id: displayPassIdVal,
      n: displayNameVal,
      r: displayRoll,
      rt: displayRouteVal,
      c: displayCollege,
      pt: displayPassType,
      img: studentAvatar,
      exp: displayExpires,
    };

    const qrPayload = `SAFRSAATHI:${JSON.stringify(compactObj)}`;
    QRCode.toDataURL(qrPayload, { margin: 1, width: 320, errorCorrectionLevel: 'M' })
      .then((url) => {
        setQrCodeDataUrl(url);
      })
      .catch(() => {});

    // Also attempt backend fetch in the background if token exists
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch(`${API_BASE}/applications/${myApp.id}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.qrCodeDataUrl) {
            setQrCodeDataUrl(data.qrCodeDataUrl);
          }
          if (data?.expiresAt) {
            setQrExpiresAt(data.expiresAt);
          }
        })
        .catch(() => {});
    }
  }, [myApp?.id, myApp?.status, isApproved, userProfile?.name, studentAvatar]);

  // Status mapping
  const getApprovalStages = (app?: StudentApplication) => {
    let stage1Status: 'pending' | 'approved' | 'rejected' = 'pending';
    let stage2Status: 'pending' | 'approved' | 'rejected' = 'pending';

    if (!app) return { stage1Status, stage2Status };

    if (app.status === 'college_approved') {
      stage1Status = 'approved';
      stage2Status = 'pending';
    } else if (app.status === 'approved') {
      stage1Status = 'approved';
      stage2Status = 'approved';
    } else if (app.status === 'rejected') {
      if (app.collegeVerifiedBy) {
        stage1Status = 'approved';
        stage2Status = 'rejected';
      } else {
        stage1Status = 'rejected';
        stage2Status = 'pending';
      }
    }

    return { stage1Status, stage2Status };
  };

  const { stage1Status, stage2Status } = getApprovalStages(myApp);

  const isManiProfile = Boolean(
    userProfile?.name?.toLowerCase().includes('mani') ||
    userProfile?.email?.toLowerCase().includes('mani')
  );

  const studentName = userProfile?.name || myApp?.name || (isManiProfile ? 'Mani Ladla' : 'Prakash');
  const collegeLabel =
    userProfile?.college || userProfile?.institution || myApp?.collegeName || 'Chandigarh Engineering College-CGC Landran';
  const rollLabel = isManiProfile ? '869' : (userProfile?.rollNo || myApp?.rollNumber || '887');
  const passIdLabel = isApproved
    ? (isManiProfile
        ? 'PRTC-STU-2012'
        : ((myApp?.studentId && !myApp.studentId.startsWith('usr-') ? myApp.studentId : undefined) ||
           (userProfile?.passId && !userProfile.passId.toLowerCase().startsWith('usr-') ? userProfile.passId : undefined) ||
           myApp?.id ||
           'PRTC-STU-887'))
    : 'Not issued';
  const validityLabel = isManiProfile
    ? '1 Month (Monthly Concession Valid)'
    : ((myApp?.duration && VALIDITY_LABEL[myApp.duration]) || '1 Month (30 Days)');

  const getDistinctAvatar = (name: string, fallback?: string): string => {
    if (fallback && fallback.trim()) return fallback;
    const lower = (name || '').toLowerCase();
    if (lower.includes('mani')) {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80';
    }
    if (lower.includes('prakash')) {
      return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80';
    }
    if (lower.includes('navjot')) {
      return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80';
    }
    if (lower.includes('gurleen')) {
      return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80';
    }
    if (lower.includes('parteek')) {
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
  };

  const studentAvatar = getDistinctAvatar(studentName, userProfile?.avatarUrl);

  const virtualPassData = {
    ticketNumber: passIdLabel,
    name: studentName,
    holderName: studentName,
    title: `${myApp?.passType || 'Student'} Concession Pass`,
    route: isManiProfile ? 'Zirakpur Bus Stand -> Landran' : (myApp?.route || 'Kharar Bus Stand -> CGC Landran Mohali Campus'),
    college: collegeLabel,
    validUntil: validityLabel,
    rollNo: rollLabel,
    avatarUrl: studentAvatar,
    aadhaarNo: maskAadhaar(userProfile?.aadhaarNumber || myApp?.aadhaarNumber),
    applicationId: isManiProfile ? 'app-179337695169' : myApp?.id,
    qrCodeDataUrl: qrCodeDataUrl,
    expiresAt: qrExpiresAt || myApp?.passExpiresAt || '2027-04-30',
    duration: isManiProfile ? 'Monthly' : myApp?.duration,
  };

  const Avatar: React.FC<{ className: string }> = ({ className }) => (
    <img src={studentAvatar} alt={studentName} className={className} />
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <Avatar className="w-14 h-14 rounded-2xl object-cover border-2 border-[#000666] shadow-sm" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1b1c1c] tracking-tight">{userProfile.name}</h2>
              <span className="text-[10px] bg-blue-100 text-[#000666] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                {t('student.studentBadge', 'STUDENT')}
              </span>
            </div>
            <p className="text-xs text-[#454652] mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#000666]">school</span>
              {collegeLabel} • {t('student.rollNo', 'Roll No.')}: {rollLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenEditProfile}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#c6c5d4] hover:bg-[#eae8e7] text-xs font-bold text-[#1b1c1c] transition flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">edit_square</span>
            {t('student.editProfile', 'Edit Profile')}
          </button>
          <button
            onClick={onOpenApplicationModal}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#000666] hover:bg-[#1a237e] text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">post_add</span>
            {t('student.applyConcession', 'Apply for Pass Concession')}
          </button>
        </div>
      </div>

      {/* Main Grid: Virtual Pass & Approval Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Col: VIRTUAL STUDENT PASS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-lg">badge</span>
              {t('student.virtualPassTitle', 'Virtual Student Transit Pass')}
            </h3>
            {isApproved ? (
              <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                {t('student.liveActiveQr', 'Live Active QR')}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {t('student.passNotIssued', 'Pass Not Issued')}
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#000666] via-[#1a237e] to-[#0d1442] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-white/10 relative overflow-hidden">
            {/* Background Seal Watermark */}
            <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[200px]">directions_bus</span>
            </div>

            {/* Pass Card Header */}
            <div className="flex items-start justify-between border-b border-white/15 pb-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded text-white">
                    {t('student.govtPunjab', 'Govt. of Punjab • PRTC')}
                  </span>
                  <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded">
                    {t('student.subsidyBadge', '75% SUBSIDY')}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base mt-1 text-white tracking-tight">
                  {t('student.prtcFullName', 'PEPSU ROAD TRANSPORT CORPORATION')}
                </h4>
                <p className="text-[11px] text-[#bdc2ff]">{t('student.cardSub', 'State Student Subsidized Commute Card')}</p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">verified</span>
              </div>
            </div>

            {/* Student Photo & Details */}
            <div className="mt-4 flex gap-4 items-center">
              <div className="relative shrink-0">
                <Avatar className="w-20 h-24 rounded-2xl object-cover border-2 border-white/40 shadow-md bg-white/10" />
                {isApproved && (
                  <div className="absolute -bottom-1.5 -left-1.5 bg-[#138808] text-white text-[8px] font-black px-1 py-0.5 rounded uppercase">
                    {t('student.verified', 'Verified')}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                  {userProfile.name}
                </h3>
                <p className="text-xs text-[#bdc2ff] font-medium leading-tight">{collegeLabel}</p>
                <div className="pt-1 grid grid-cols-2 gap-1 text-[11px]">
                  <div>
                    <span className="text-white/60 block text-[9px] uppercase font-bold">{t('student.rollNo', 'Roll No.')}</span>
                    <span className="font-mono font-bold text-white">{rollLabel}</span>
                  </div>
                  <div>
                    <span className="text-white/60 block text-[9px] uppercase font-bold">{t('student.passId', 'Pass ID')}</span>
                    <span className="font-mono font-bold text-amber-300">{passIdLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approved Route Banner */}
            <div className="mt-4 bg-black/30 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center justify-between text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">
                <span>{t('student.sanctionedRoute', 'Sanctioned Route')}</span>
                <span className="text-amber-300">{myApp?.passType || '—'}</span>
              </div>
              <p className="text-xs font-bold text-white leading-snug">
                {myApp?.route || t('student.noRouteSanctioned', 'No route sanctioned yet')}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-[#bdc2ff] border-t border-white/10 pt-1.5">
                <span>{t('student.validity', 'Validity')}: {validityLabel}</span>
                {myApp?.isPunjabResident && (
                  <span className="text-green-400 font-bold">{t('student.punjabResidentVerified', 'Punjab Resident Verified')}</span>
                )}
              </div>
            </div>

            {/* QR Code & Conductor Scan Bar */}
            <div className="mt-4 bg-white rounded-2xl p-3.5 flex items-center justify-between gap-3 text-black">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-xs">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Pass QR code" className="w-full h-full object-contain" />
                  ) : (
                    <svg
                      className={`w-full h-full ${isApproved ? 'text-black' : 'text-gray-300'}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3zm0 5h3v3h-3v-3zm5-2h3v2h-3v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        qrCodeDataUrl ? 'bg-green-600 animate-pulse' : 'bg-gray-400'
                      }`}
                    ></span>
                    <span className="text-xs font-black text-[#000666]">
                      {qrLoading
                        ? t('student.loadingQr', 'LOADING QR…')
                        : qrCodeDataUrl
                        ? t('student.liveConductorQr', 'LIVE CONDUCTOR QR')
                        : isApproved
                        ? t('student.qrUnavailable', 'QR UNAVAILABLE')
                        : t('student.qrNotIssued', 'QR NOT ISSUED')}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#767683] mt-0.5">
                    {isApproved
                      ? t('student.signedTokenDesc', 'Signed PRTC Digital Transit Token')
                      : t('student.issuedAfterApproval', 'Issued after PRTC approval')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenPassModal(virtualPassData)}
                disabled={!isApproved}
                className="px-3 py-1.5 rounded-xl bg-[#000666] text-white font-bold text-xs hover:bg-[#1a237e] transition shadow-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('student.scanEnlarge', 'Scan / Enlarge')}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: APPLICATION STATUS & TWO-STAGE PIPELINE */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-lg">track_changes</span>
              {t('student.statusTrackerTitle', 'Concession Application Status Tracker')}
            </h3>
            <div className="flex items-center gap-2">
              {studentApps.length > 1 && (
                <div className="flex items-center gap-1 bg-[#eae8e7] p-1 rounded-xl">
                  {studentApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setActiveAppId(app.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition ${
                        myApp?.id === app.id
                          ? 'bg-white text-[#000666] shadow-xs'
                          : 'text-[#454652] hover:text-[#1b1c1c]'
                      }`}
                    >
                      {app.status === 'approved' ? '✓ Sanctioned' : 'Pending'} (#{app.id.slice(-6)})
                    </button>
                  ))}
                </div>
              )}
              <span className="text-xs text-[#767683]">{t('student.refId', 'Ref ID')}: {myApp?.id ? `#${myApp.id}` : '—'}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-xs space-y-6">
            {/* Overall Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#fbf9f8] border border-[#c6c5d4]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#767683] tracking-wider">
                  {t('student.currentPipelineStatus', 'Current Pipeline Status')}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="text-base font-black text-[#1b1c1c]">
                    {!myApp
                      ? t('student.noAppSubmitted', 'No Application Submitted')
                      : myApp.status === 'approved'
                      ? t('student.passSanctionedIssued', 'Pass Sanctioned & Issued')
                      : myApp.status === 'college_approved'
                      ? t('student.collegeApprovedUnderReview', 'College Approved • Under PRTC Review')
                      : myApp.status === 'rejected'
                      ? t('student.appRejected', 'Application Rejected')
                      : t('student.pendingCollegeAttestation', 'Pending College Attestation')}
                  </h4>
                  {myApp && (
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        myApp.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : myApp.status === 'college_approved'
                          ? 'bg-blue-100 text-blue-800'
                          : myApp.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {myApp.status === 'approved'
                        ? t('common.approved', 'APPROVED')
                        : myApp.status === 'rejected'
                        ? t('common.rejected', 'REJECTED')
                        : t('common.pending', 'PENDING')}
                    </span>
                  )}
                </div>
                {myApp?.status === 'rejected' && myApp.rejectionReason && (
                  <p className="text-[11px] text-red-700 mt-1">Reason: {myApp.rejectionReason}</p>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#767683] block">{t('student.submittedOn', 'Submitted On')}</span>
                <span className="text-xs font-bold text-[#1b1c1c]">
                  {myApp?.submittedDate || t('student.notSubmitted', 'Not submitted')}
                </span>
              </div>
            </div>

            {/* Two Stages Flow */}
            <div className="space-y-4">
              {/* STAGE 1: COLLEGE ADMIN APPROVAL */}
              <div
                className={`p-4 rounded-2xl border-2 transition ${
                  stage1Status === 'approved'
                    ? 'border-blue-300 bg-blue-50/40'
                    : stage1Status === 'rejected'
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-amber-300 bg-amber-50/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                        stage1Status === 'approved'
                          ? 'bg-[#000666]'
                          : stage1Status === 'rejected'
                          ? 'bg-red-600'
                          : 'bg-amber-500'
                      }`}
                    >
                      {stage1Status === 'approved' ? (
                        <span className="material-symbols-outlined text-lg">check</span>
                      ) : (
                        <span>1</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-[#1b1c1c]">
                          {t('student.stage1Title', 'Stage 1: College Admin Attestation & Seal')}
                        </h4>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            stage1Status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : stage1Status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {stage1Status === 'approved'
                            ? t('student.stampedVerified', 'Stamped & Verified')
                            : stage1Status === 'rejected'
                            ? t('student.appRejected', 'Rejected')
                            : t('student.awaitingReview', 'Awaiting Review')}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#454652] mt-0.5">
                        {t('student.stage1Desc', 'Verification of student enrolment, fee receipt, and bonafide Punjab residency by institution.')}
                      </p>
                    </div>
                  </div>
                </div>

                {stage1Status === 'approved' && (
                  <div className="mt-3 p-3 bg-white rounded-xl border-2 border-dashed border-[#000666]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full border-2 border-[#000666] flex items-center justify-center text-[#000666] font-black shrink-0">
                        <span className="material-symbols-outlined text-lg">verified_user</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-[#000666] uppercase">
                            {t('student.officialCollegeSeal', 'Official College Seal Applied')}
                          </span>
                          <span className="text-[9px] bg-blue-100 text-[#000666] font-mono px-1.5 rounded">
                            {myApp?.collegeStampId || '—'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1b1c1c]">
                          {t('student.attestedBy', 'Attested by:')} {myApp?.collegeVerifiedBy || '—'}
                        </p>
                        <p className="text-[10px] text-[#767683]">
                          {t('student.verifiedDate', 'Verified Date:')} {myApp?.collegeVerifiedDate || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-green-50 text-green-800 font-bold px-2 py-1 rounded border border-green-200">
                      {t('student.collegeCleared', 'College Cleared ✓')}
                    </span>
                  </div>
                )}
              </div>

              {/* STAGE 2: PRTC ADMIN APPROVAL */}
              <div
                className={`p-4 rounded-2xl border-2 transition ${
                  stage2Status === 'approved'
                    ? 'border-green-300 bg-green-50/40'
                    : stage2Status === 'rejected'
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-[#c6c5d4] bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                        stage2Status === 'approved'
                          ? 'bg-[#138808]'
                          : stage2Status === 'rejected'
                          ? 'bg-red-600'
                          : 'bg-[#767683]'
                      }`}
                    >
                      {stage2Status === 'approved' ? (
                        <span className="material-symbols-outlined text-lg">verified</span>
                      ) : (
                        <span>2</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-[#1b1c1c]">
                          {t('student.stage2Title', 'Stage 2: PRTC Depot Sanction & Digital Token Issue')}
                        </h4>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            stage2Status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : stage2Status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : stage1Status === 'approved'
                              ? 'bg-blue-100 text-[#000666]'
                              : 'bg-gray-100 text-[#767683]'
                          }`}
                        >
                          {stage2Status === 'approved'
                            ? t('student.sanctionedActive', 'Sanctioned & Active')
                            : stage2Status === 'rejected'
                            ? t('student.appRejected', 'Rejected')
                            : stage1Status === 'approved'
                            ? t('student.inDepotQueue', 'In Depot Queue')
                            : t('student.waitingStage1', 'Waiting Stage 1')}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#454652] mt-0.5">
                        {t('student.stage2Desc', 'Route tariff calculation, transit zone clearance, and QR cryptographic signature emission by State Transport Authority.')}
                      </p>
                    </div>
                  </div>
                </div>

                {stage2Status === 'approved' && (
                  <div className="mt-3 p-3 bg-white rounded-xl border-2 border-dashed border-green-600/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full border-2 border-green-600 flex items-center justify-center text-green-700 font-black shrink-0">
                        <span className="material-symbols-outlined text-lg">local_police</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-green-800 uppercase">
                            {t('student.stateTransitSeal', 'State Transit Seal Issued')}
                          </span>
                          <span className="text-[9px] bg-green-100 text-green-800 font-mono px-1.5 rounded">
                            {myApp?.prtcAdminId || '—'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1b1c1c]">
                          {t('student.sanctionedBy', 'Sanctioned by:')} {myApp?.prtcVerifiedBy || '—'}
                        </p>
                        <p className="text-[10px] text-[#767683]">
                          {t('student.approvalDate', 'Approval Date:')} {myApp?.prtcVerifiedDate || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-green-600 text-white font-black px-2.5 py-1 rounded shadow-xs">
                      {t('student.issued', 'ISSUED')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="pt-2 border-t border-[#eae8e7]">
              <h4 className="text-xs font-extrabold text-[#1b1c1c] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#000666]">folder_open</span>
                {t('student.submittedDocsTitle', 'Your Submitted Verification Documents')}
              </h4>

              {myApp ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() =>
                      setSelectedDocPreview({
                        title: 'Aadhaar Card (Self-Signed Copy)',
                        file: myApp.aadhaarFile || 'aadhaar_signed.pdf',
                        type: 'Aadhaar ID Proof',
                      })
                    }
                    className="p-3 bg-[#fbf9f8] hover:bg-white border border-[#c6c5d4] rounded-2xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#000666] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-base">badge</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1b1c1c] block group-hover:text-[#000666]">
                          {t('student.aadhaarCopy', 'Aadhaar (Signed Copy)')}
                        </span>
                        <span className="text-[10px] font-mono text-[#767683]">
                          {maskAadhaar(myApp.aadhaarNumber)}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#767683] group-hover:text-[#000666]">
                      visibility
                    </span>
                  </div>

                  <div
                    onClick={() =>
                      setSelectedDocPreview({
                        title: 'College Fee Receipt Proof',
                        file: myApp.feeReceiptFile || 'fee_receipt.pdf',
                        type: 'College Enrolment Fee Proof',
                      })
                    }
                    className="p-3 bg-[#fbf9f8] hover:bg-white border border-[#c6c5d4] rounded-2xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-base">receipt_long</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1b1c1c] block group-hover:text-[#000666]">
                          {t('student.latestFeeReceipt', 'Latest Fee Receipt')}
                        </span>
                        <span className="text-[10px] font-mono text-[#767683]">
                          {myApp.feeReceiptNo || '—'}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-sm text-[#767683] group-hover:text-[#000666]">
                      visibility
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[#767683]">
                  {t('student.docAppearNotice', 'Documents will appear here after you submit a concession application.')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Lightbox Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95 space-y-4">
            <div className="flex justify-between items-center border-b border-[#eae8e7] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666]">description</span>
                <h4 className="font-bold text-sm text-[#1b1c1c]">{selectedDocPreview.title}</h4>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#fbf9f8] border-2 border-dashed border-[#c6c5d4] rounded-2xl p-6 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-[#000666]">picture_as_pdf</span>
              <p className="font-mono text-xs font-bold text-[#1b1c1c]">{selectedDocPreview.file}</p>
              <p className="text-[11px] text-[#767683]">
                {selectedDocPreview.type} • Digitally Attested for PRTC Concession
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 rounded-xl bg-[#000666] text-white text-xs font-bold hover:bg-[#1a237e]"
              >
                {t('student.closePreview', 'Close Preview')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
