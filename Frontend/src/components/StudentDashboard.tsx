import React, { useState } from 'react';
import { UserProfile, StudentApplication, College } from '../types';
import { mockStudentApplications } from '../data/mockData';

interface StudentDashboardProps {
  userProfile: UserProfile;
  applications: StudentApplication[];
  colleges: College[];
  onOpenPassModal: (passData: any) => void;
  onOpenApplicationModal: () => void;
  onOpenEditProfile: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  userProfile,
  applications = [],
  colleges = [],
  onOpenPassModal,
  onOpenApplicationModal,
  onOpenEditProfile,
}) => {
  // Find current student's latest application
  const myApp = (applications || []).find(
    (app) =>
      (app?.name && userProfile?.name && app.name.toLowerCase() === userProfile.name.toLowerCase()) ||
      (app?.studentId && userProfile?.passId && app.studentId === userProfile.passId)
  ) || (applications && applications[0]) || mockStudentApplications[0];

  const [selectedDocPreview, setSelectedDocPreview] = useState<{ title: string; file: string; type: string } | null>(null);

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

  const virtualPassData = {
    ticketNumber: userProfile?.passId || myApp?.studentId || 'PRTC-STU-9942',
    holderName: userProfile?.name || myApp?.name || 'Navjot Singh Dhillon',
    title: `${myApp?.passType || 'Student AC'} Concession Pass`,
    route: myApp?.route || 'Patiala Central Bus Stand -> Thapar Campus Nabha Road',
    college: userProfile?.college || userProfile?.institution || myApp?.collegeName || 'Thapar Institute of Engg. & Technology',
    validUntil: '3 Months Active (Quarterly Pass)',
    rollNo: userProfile?.rollNo || myApp?.rollNumber || '102203418',
    avatarUrl: userProfile?.avatarUrl,
    aadhaarNo: userProfile?.aadhaarNumber || myApp?.aadhaarNumber || '7842-XXXX-4821',
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#000666] shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1b1c1c] tracking-tight">{userProfile.name}</h2>
              <span className="text-[10px] bg-blue-100 text-[#000666] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                STUDENT
              </span>
            </div>
            <p className="text-xs text-[#454652] mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#000666]">school</span>
              {userProfile.college || userProfile.institution || 'Punjab Engineering College'} • Roll No: {userProfile.rollNo || '102203418'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenEditProfile}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#c6c5d4] hover:bg-[#eae8e7] text-xs font-bold text-[#1b1c1c] transition flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">edit_square</span>
            Edit Profile
          </button>
          <button
            onClick={onOpenApplicationModal}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#000666] hover:bg-[#1a237e] text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">post_add</span>
            Apply for Pass Concession
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
              Virtual Student Transit Pass
            </h3>
            <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
              Live Active QR
            </span>
          </div>

          {/* Authentic Government Student Pass Graphic Card */}
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
                    Govt. of Punjab • PRTC
                  </span>
                  <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded">
                    75% SUBSIDY
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base mt-1 text-white tracking-tight">
                  PEPSU ROAD TRANSPORT CORPORATION
                </h4>
                <p className="text-[11px] text-[#bdc2ff]">State Student Subsidized Commute Card</p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">verified</span>
              </div>
            </div>

            {/* Student Photo & Details */}
            <div className="mt-4 flex gap-4 items-center">
              <div className="relative shrink-0">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-20 h-24 rounded-2xl object-cover border-2 border-white/40 shadow-md bg-white/10"
                />
                <div className="absolute -bottom-1.5 -left-1.5 bg-[#138808] text-white text-[8px] font-black px-1 py-0.5 rounded uppercase">
                  Verified
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                  {userProfile.name}
                </h3>
                <p className="text-xs text-[#bdc2ff] font-medium leading-tight">
                  {userProfile.college || userProfile.institution || 'Thapar Institute of Engg. & Technology'}
                </p>
                <div className="pt-1 grid grid-cols-2 gap-1 text-[11px]">
                  <div>
                    <span className="text-white/60 block text-[9px] uppercase font-bold">Roll No.</span>
                    <span className="font-mono font-bold text-white">{userProfile.rollNo || '102203418'}</span>
                  </div>
                  <div>
                    <span className="text-white/60 block text-[9px] uppercase font-bold">Pass ID</span>
                    <span className="font-mono font-bold text-amber-300">{userProfile.passId || 'PRTC-STU-9942'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approved Route Banner */}
            <div className="mt-4 bg-black/30 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center justify-between text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">
                <span>Sanctioned Route</span>
                <span className="text-amber-300">{myApp?.passType || 'Student AC Service'}</span>
              </div>
              <p className="text-xs font-bold text-white leading-snug">
                {myApp?.route || 'Patiala Central Bus Stand -> Thapar Campus Nabha Road'}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-[#bdc2ff] border-t border-white/10 pt-1.5">
                <span>Validity: 3 Months (90 Days)</span>
                <span className="text-green-400 font-bold">Punjab Resident Verified</span>
              </div>
            </div>

            {/* Dynamic QR Code & Conductor Scan Bar */}
            <div className="mt-4 bg-white rounded-2xl p-3.5 flex items-center justify-between gap-3 text-black">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-xs">
                  {/* Generated QR Matrix Graphic */}
                  <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3zm0 5h3v3h-3v-3zm5-2h3v2h-3v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                    <span className="text-xs font-black text-[#000666]">LIVE CONDUCTOR QR</span>
                  </div>
                  <p className="text-[10px] text-[#767683] mt-0.5">Encrypted PRTC Digital Transit Token</p>
                </div>
              </div>

              <button
                onClick={() => onOpenPassModal(virtualPassData)}
                className="px-3 py-1.5 rounded-xl bg-[#000666] text-white font-bold text-xs hover:bg-[#1a237e] transition shadow-xs shrink-0"
              >
                Scan / Enlarge
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: APPLICATION STATUS & TWO-STAGE PIPELINE */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-lg">track_changes</span>
              Concession Application Status Tracker
            </h3>
            <span className="text-xs text-[#767683]">Ref ID: #{myApp?.id || 'APP-2024'}</span>
          </div>

          {/* Two-Stage Approval Tracker Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-xs space-y-6">
            {/* Overall Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#fbf9f8] border border-[#c6c5d4]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#767683] tracking-wider">Current Pipeline Status</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="text-base font-black text-[#1b1c1c]">
                    {myApp.status === 'approved'
                      ? 'Pass Sanctioned & Disbursed'
                      : myApp.status === 'college_approved'
                      ? 'College Approved • Under PRTC Review'
                      : myApp.status === 'rejected'
                      ? 'Application Rejected'
                      : 'Pending College Attestation'}
                  </h4>
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
                    {myApp.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#767683] block">Submitted On</span>
                <span className="text-xs font-bold text-[#1b1c1c]">{myApp.submittedDate}</span>
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
                          Stage 1: College Admin Attestation & Seal
                        </h4>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            stage1Status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {stage1Status === 'approved' ? 'Stamped & Verified' : 'Awaiting Review'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#454652] mt-0.5">
                        Verification of student enrolment, fee receipt, and bonafide Punjab residency by institution.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visible Virtual College Stamp if approved */}
                {stage1Status === 'approved' && (
                  <div className="mt-3 p-3 bg-white rounded-xl border-2 border-dashed border-[#000666]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full border-2 border-[#000666] flex items-center justify-center text-[#000666] font-black shrink-0">
                        <span className="material-symbols-outlined text-lg">verified_user</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-[#000666] uppercase">
                            Official College Seal Applied
                          </span>
                          <span className="text-[9px] bg-blue-100 text-[#000666] font-mono px-1.5 rounded">
                            {myApp.collegeStampId || 'TIET-SEAL-9921'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1b1c1c]">
                          Attested by: {myApp.collegeVerifiedBy || 'DR. R. SINGLA (DEAN SW)'}
                        </p>
                        <p className="text-[10px] text-[#767683]">Verified Date: {myApp.collegeVerifiedDate || '26 Aug 2026'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-green-50 text-green-800 font-bold px-2 py-1 rounded border border-green-200">
                      College Cleared ✓
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
                          Stage 2: PRTC Depot Sanction & Digital Token Issue
                        </h4>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            stage2Status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : stage1Status === 'approved'
                              ? 'bg-blue-100 text-[#000666]'
                              : 'bg-gray-100 text-[#767683]'
                          }`}
                        >
                          {stage2Status === 'approved'
                            ? 'Sanctioned & Active'
                            : stage1Status === 'approved'
                            ? 'In Depot Queue'
                            : 'Waiting Stage 1'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#454652] mt-0.5">
                        Route tariff calculation, transit zone clearance, and QR cryptographic signature emission by State Transport Authority.
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
                            State Transit Seal Issued
                          </span>
                          <span className="text-[9px] bg-green-100 text-green-800 font-mono px-1.5 rounded">
                            {myApp.prtcAdminId || 'PRTC-DEPOT-04'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1b1c1c]">
                          Sanctioned by: {myApp.prtcVerifiedBy || 'GURMUKH SINGH (CHIEF DEPOT OFFICER)'}
                        </p>
                        <p className="text-[10px] text-[#767683]">Approval Date: {myApp.prtcVerifiedDate || '28 Aug 2026'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-green-600 text-white font-black px-2.5 py-1 rounded shadow-xs">
                      100% ISSUED
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Documents Drawer / Quick View for Student */}
            <div className="pt-2 border-t border-[#eae8e7]">
              <h4 className="text-xs font-extrabold text-[#1b1c1c] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#000666]">folder_open</span>
                Your Submitted Verification Documents
              </h4>
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
                        Aadhaar (Signed Copy)
                      </span>
                      <span className="text-[10px] font-mono text-[#767683]">{myApp.aadhaarNumber || '7842-XXXX-4821'}</span>
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
                        Latest Fee Receipt
                      </span>
                      <span className="text-[10px] font-mono text-[#767683]">{myApp.feeReceiptNo || 'TIET-REC-2026'}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-sm text-[#767683] group-hover:text-[#000666]">
                    visibility
                  </span>
                </div>
              </div>
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
              <p className="text-[11px] text-[#767683]">{selectedDocPreview.type} • Digitally Attested for PRTC Concession</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 rounded-xl bg-[#000666] text-white text-xs font-bold hover:bg-[#1a237e]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
