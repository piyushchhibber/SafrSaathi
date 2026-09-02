import React, { useState } from 'react';
import { UserProfile, College, StudentApplication } from '../types';
import { DocumentViewerModal, DocumentInfo } from './DocumentViewerModal';
import confetti from 'canvas-confetti';

interface PrtcAdminDashboardProps {
  userProfile: UserProfile;
  colleges: College[];
  applications: StudentApplication[];
  onUpdateApplication: (app: StudentApplication) => void;
  onOpenEditProfile: () => void;
  onOpenPassModal: (passData: any) => void;
}

export const PrtcAdminDashboard: React.FC<PrtcAdminDashboardProps> = ({
  userProfile,
  colleges,
  applications,
  onUpdateApplication,
  onOpenEditProfile,
  onOpenPassModal,
}) => {
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'college_approved' | 'approved'>('all');

  // Document Viewer State
  const [viewingDoc, setViewingDoc] = useState<DocumentInfo | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const handleOpenDocViewer = (docType: 'aadhaar' | 'fee_receipt' | 'college_id', app: StudentApplication) => {
    const docInfo: DocumentInfo = {
      title:
        docType === 'aadhaar'
          ? 'Aadhaar Resident Card & Identity Proof'
          : docType === 'fee_receipt'
          ? 'Academic Fee Receipt & Enrolment Proof'
          : 'College Student Identity Card',
      type: docType,
      fileName:
        docType === 'aadhaar'
          ? app.aadhaarFile || 'aadhaar_card_signed.pdf'
          : docType === 'fee_receipt'
          ? app.feeReceiptFile || 'college_fee_receipt.pdf'
          : 'student_id_card.pdf',
      studentName: app.name,
      fatherName: app.fatherName,
      collegeName: app.collegeName,
      rollNo: app.rollNumber,
      studentId: app.studentId,
      aadhaarNumber: app.aadhaarNumber,
      aadhaarAddress: app.aadhaarAddress,
      receiptNumber: app.feeReceiptNo || 'REC-TIET-2026-904',
      date: app.submittedDate,
    };
    setViewingDoc(docInfo);
    setIsDocModalOpen(true);
  };

  const selectedCollege =
    selectedCollegeId === 'all'
      ? { id: 'all', name: 'All Punjab Universities & Colleges (Statewide)', city: 'Punjab HQ' }
      : (colleges && colleges.find((c) => c.id === selectedCollegeId)) ||
        colleges?.[0] || {
          id: 'pec',
          name: 'Punjab Engineering College (PEC)',
          city: 'Chandigarh',
        };

  // Applications for this selected college
  const collegeApps = (applications || []).filter((app) => {
    if (!app) return false;
    const isAll = selectedCollegeId === 'all';
    const appCol = (app.collegeName || '').toLowerCase();
    const selCol = (selectedCollege?.name || '').toLowerCase();
    const matchesCol =
      isAll ||
      app.collegeId === selectedCollegeId ||
      appCol.includes(selCol) ||
      selCol.includes(appCol);

    const matchesFilter =
      filterView === 'all'
        ? true
        : filterView === 'college_approved'
        ? app.status === 'college_approved'
        : app.status === 'approved';

    const matchesSearch =
      (app.name && app.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.studentId && app.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.route && app.route.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.collegeName && app.collegeName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCol && matchesFilter && matchesSearch;
  });

  const handlePrtcApprove = (app: StudentApplication) => {
    const updatedApp: StudentApplication = {
      ...app,
      status: 'approved',
      prtcAdminId: userProfile?.adminId || userProfile?.passId || 'PRTC-HQ-001',
      prtcVerifiedBy: (userProfile?.name || 'Authorized Inspector').toUpperCase() + ' (DEPOT SUPT.)',
      prtcVerifiedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    onUpdateApplication(updatedApp);
    confetti({ particleCount: 80, spread: 70 });
    setSelectedApp(updatedApp);
  };

  const handlePrtcReject = (app: StudentApplication) => {
    const updatedApp: StudentApplication = {
      ...app,
      status: 'rejected',
      prtcAdminId: userProfile?.adminId || userProfile?.passId || 'PRTC-HQ-001',
      prtcVerifiedBy: (userProfile?.name || 'Authorized Inspector').toUpperCase(),
      prtcVerifiedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    onUpdateApplication(updatedApp);
    setSelectedApp(updatedApp);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#000666] text-white flex items-center justify-center font-bold shadow-sm">
            <span className="material-symbols-outlined text-3xl">local_police</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1b1c1c] tracking-tight">{userProfile.name}</h2>
              <span className="text-[10px] bg-red-100 text-red-900 font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">
                PRTC HEADQUARTERS ADMIN
              </span>
            </div>
            <p className="text-xs text-[#454652] mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#000666]">badge</span>
              Admin ID: <span className="font-mono font-bold text-[#000666]">{userProfile.adminId || 'PRTC-HQ-ADMIN-001'}</span> • Punjab Transport Dept.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenEditProfile}
            className="px-4 py-2 rounded-xl border border-[#c6c5d4] hover:bg-[#eae8e7] text-xs font-bold text-[#1b1c1c] transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">manage_accounts</span>
            Edit Profile
          </button>
        </div>
      </div>

      {/* College Selection Cards Strip */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#767683] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#000666]">domain</span>
            Punjab Universities & Affiliated Colleges ({colleges.length})
          </h3>
          <span className="text-xs text-[#767683]">Select an institution to inspect its college-stamped passes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* All Institutions Card */}
          <div
            onClick={() => setSelectedCollegeId('all')}
            className={`p-4 rounded-2xl cursor-pointer transition border ${
              selectedCollegeId === 'all'
                ? 'bg-[#000666] text-white border-[#000666] shadow-md ring-2 ring-[#000666]/20'
                : 'bg-white text-[#1b1c1c] border-[#c6c5d4] hover:border-[#767683]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  selectedCollegeId === 'all' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700'
                }`}
              >
                PUNJAB STATEWIDE
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  applications.filter((a) => a.status === 'college_approved').length > 0
                    ? selectedCollegeId === 'all'
                      ? 'bg-amber-400 text-black font-black'
                      : 'bg-amber-100 text-amber-900 font-bold'
                    : selectedCollegeId === 'all'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-gray-100 text-[#767683]'
                }`}
              >
                {applications.filter((a) => a.status === 'college_approved').length} Stamped
              </span>
            </div>
            <h4 className="font-extrabold text-xs leading-snug">All Punjab Institutions</h4>
            <p className={`text-[11px] mt-1 ${selectedCollegeId === 'all' ? 'text-[#bdc2ff]' : 'text-[#767683]'}`}>
              {applications.length} Total Applications
            </p>
          </div>

          {colleges.map((col) => {
            const isSelected = col.id === selectedCollegeId;
            const readyForPrtc = applications.filter(
              (a) =>
                (a.collegeId === col.id || (a.collegeName && a.collegeName.includes(col.name)) || (a.collegeName && col.name.includes(a.collegeName))) &&
                a.status === 'college_approved'
            ).length;

            return (
              <div
                key={col.id}
                onClick={() => setSelectedCollegeId(col.id)}
                className={`p-4 rounded-2xl cursor-pointer transition border ${
                  isSelected
                    ? 'bg-[#000666] text-white border-[#000666] shadow-md ring-2 ring-[#000666]/20'
                    : 'bg-white text-[#1b1c1c] border-[#c6c5d4] hover:border-[#767683]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#000666]'
                    }`}
                  >
                    {col.city} ISBT
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      readyForPrtc > 0
                        ? isSelected
                          ? 'bg-amber-400 text-black font-black'
                          : 'bg-amber-100 text-amber-900 font-bold'
                        : isSelected
                        ? 'bg-white/10 text-white/70'
                        : 'bg-gray-100 text-[#767683]'
                    }`}
                  >
                    {readyForPrtc} Stamped
                  </span>
                </div>
                <h4 className="font-extrabold text-xs leading-snug line-clamp-2">{col.name}</h4>
                <p className={`text-[11px] mt-1 ${isSelected ? 'text-[#bdc2ff]' : 'text-[#767683]'}`}>
                  {col.totalStudents || 850}+ Registered Enrolments
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: College-Approved Applications & PRTC Sanction Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Applications Table for Selected College */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666] text-lg">fact_check</span>
                Applications: {selectedCollege.name}
              </h3>
              <p className="text-xs text-[#767683]">
                Review applications with verified institutional stamps ready for PRTC token release
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#f0eded] p-1 rounded-xl">
              <button
                onClick={() => setFilterView('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterView === 'all' ? 'bg-white text-[#000666] shadow-xs' : 'text-[#767683]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterView('college_approved')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterView === 'college_approved' ? 'bg-white text-[#000666] shadow-xs' : 'text-[#767683]'
                }`}
              >
                Stamped by College
              </button>
              <button
                onClick={() => setFilterView('approved')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filterView === 'approved' ? 'bg-white text-[#000666] shadow-xs' : 'text-[#767683]'
                }`}
              >
                PRTC Sanctioned
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search candidate name, ID, or route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#c6c5d4] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666] shadow-xs"
            />
            <span className="material-symbols-outlined text-base text-[#767683] absolute left-3.5 top-3">
              search
            </span>
          </div>

          {/* List of Applications */}
          <div className="space-y-3">
            {collegeApps.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#c6c5d4]">
                <span className="material-symbols-outlined text-4xl text-[#c6c5d4]">check_circle</span>
                <h4 className="font-bold text-sm text-[#1b1c1c] mt-2">No applications in this category</h4>
                <p className="text-xs text-[#767683] mt-1">Select another college or filter above.</p>
              </div>
            ) : (
              collegeApps.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                const isCollegeApproved = app.status === 'college_approved';
                const isApproved = app.status === 'approved';

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`bg-white rounded-2xl p-4 border transition cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-2 border-[#000666] ring-2 ring-[#000666]/10'
                        : 'border-[#c6c5d4] hover:border-[#767683]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#000666] text-white flex items-center justify-center font-black text-sm shrink-0">
                          {app.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-[#1b1c1c]">{app.name}</h4>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                isApproved
                                  ? 'bg-green-100 text-green-800'
                                  : isCollegeApproved
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {isApproved
                                ? 'Pass Sanctioned'
                                : isCollegeApproved
                                ? 'College Stamped • Ready'
                                : 'Pending College'}
                            </span>
                          </div>
                          <p className="text-xs text-[#454652]">{app.route}</p>
                          <div className="flex items-center gap-2 text-[11px] text-[#767683] mt-0.5">
                            <span>ID: {app.studentId}</span>
                            <span>•</span>
                            <span className="font-mono text-[#000666] font-semibold">{app.passType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {app.collegeStampId && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black bg-blue-50 text-[#000666] px-2 py-0.5 rounded-full border border-blue-200">
                            <span className="material-symbols-outlined text-[10px]">verified</span>
                            {app.collegeStampId}
                          </span>
                        )}
                        <span className="block text-[10px] text-[#767683] mt-1">₹{app.subsidizedAmountPaid || 225} Paid</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: PRTC Sanction Terminal & Stamp Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-lg">local_shipping</span>
              PRTC Sanction Terminal
            </h3>
          </div>

          {selectedApp ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-md space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#eae8e7] pb-3">
                <div>
                  <h4 className="text-base font-black text-[#1b1c1c]">{selectedApp.name}</h4>
                  <p className="text-xs text-[#767683]">
                    {selectedApp.collegeName} • Roll: {selectedApp.rollNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#767683] block">Sanction Tariff</span>
                  <span className="text-xs font-mono font-bold text-[#000666]">
                    ₹{selectedApp.subsidizedAmountPaid || 225}.00
                  </span>
                </div>
              </div>

              {/* Verified College Stamp Inspector Box */}
              {selectedApp.collegeStampId ? (
                <div className="border-2 border-blue-300 bg-blue-50/50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-[#000666] tracking-wider uppercase block">
                        Stage 1: Verified College Seal
                      </span>
                      <h5 className="text-xs font-black text-[#1b1c1c]">{selectedApp.collegeName}</h5>
                      <p className="text-[11px] text-[#454652]">
                        Attestation Official: <span className="font-bold">{selectedApp.collegeVerifiedBy}</span>
                      </p>
                      <p className="text-[10px] text-[#767683]">Verified Date: {selectedApp.collegeVerifiedDate}</p>
                    </div>

                    {/* Circular Stamp Graphic */}
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#000666] flex flex-col items-center justify-center text-center rotate-[-6deg] bg-white text-[#000666] shrink-0 p-1">
                      <span className="text-[6px] font-black uppercase">INSTITUTION</span>
                      <span className="text-[8px] font-black">STAMPED</span>
                      <span className="text-[6px] font-mono">{selectedApp.collegeStampId}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span>Awaiting Stage 1 College Admin attestation before PRTC pass can be sanctioned.</span>
                </div>
              )}

              {/* Attached Student Verification Documents */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#767683]">
                    Attached Student Proofs ({3} Docs)
                  </h5>
                  <button
                    onClick={() => handleOpenDocViewer('aadhaar', selectedApp)}
                    className="text-[11px] font-bold text-[#000666] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Inspect All Proofs
                  </button>
                </div>

                {/* Doc 1: Aadhaar */}
                <div className="p-3 rounded-xl border border-[#c6c5d4] bg-[#fbf9f8] hover:border-[#000666] transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-xl text-[#000666] shrink-0">badge</span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#1b1c1c] truncate">
                        {selectedApp.aadhaarFile || 'aadhaar_card_signed.pdf'}
                      </p>
                      <p className="text-[10px] text-green-700 font-bold">✓ Punjab Domicile Verified</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDocViewer('aadhaar', selectedApp)}
                    className="shrink-0 bg-blue-50 hover:bg-blue-100 text-[#000666] border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    View Proof
                  </button>
                </div>

                {/* Doc 2: Fee receipt */}
                <div className="p-3 rounded-xl border border-[#c6c5d4] bg-[#fbf9f8] hover:border-purple-600 transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-xl text-purple-700 shrink-0">receipt_long</span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#1b1c1c] truncate">
                        {selectedApp.feeReceiptFile || 'college_fee_receipt.pdf'}
                      </p>
                      <p className="text-[10px] text-[#767683]">Ref: {selectedApp.feeReceiptNo || 'TIET-REC-2026-904'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDocViewer('fee_receipt', selectedApp)}
                    className="shrink-0 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    View Receipt
                  </button>
                </div>

                {/* Doc 3: Student ID */}
                <div className="p-3 rounded-xl border border-[#c6c5d4] bg-[#fbf9f8] hover:border-emerald-600 transition flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-xl text-emerald-700 shrink-0">contact_emergency</span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#1b1c1c] truncate">
                        student_identity_card.pdf
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold">✓ Enrolment Active (Roll: {selectedApp.rollNumber})</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDocViewer('college_id', selectedApp)}
                    className="shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    View ID Card
                  </button>
                </div>
              </div>

              {/* Transit Route Specs */}
              <div className="bg-[#fbf9f8] p-3.5 rounded-2xl border border-[#c6c5d4] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#767683]">Route:</span>
                  <span className="font-bold text-[#1b1c1c]">{selectedApp.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#767683]">Pass Type:</span>
                  <span className="font-semibold text-[#000666]">{selectedApp.passType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#767683]">Permanent Address:</span>
                  <span className="font-semibold text-right text-[#1b1c1c] max-w-[60%]">
                    {selectedApp.aadhaarAddress || 'Punjab State'}
                  </span>
                </div>
              </div>

              {/* PRTC Actions */}
              {selectedApp.status === 'college_approved' ? (
                <div className="space-y-2 pt-2 border-t border-[#eae8e7]">
                  <button
                    onClick={() => handlePrtcApprove(selectedApp)}
                    className="w-full py-3 rounded-2xl bg-[#138808] hover:bg-[#0f6806] text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">verified</span>
                    Sanction Pass & Generate PRTC Token QR
                  </button>

                  <button
                    onClick={() => handlePrtcReject(selectedApp)}
                    className="w-full py-2 rounded-xl border border-red-600 text-red-600 hover:bg-red-50 font-bold text-xs transition"
                  >
                    Reject Application
                  </button>
                </div>
              ) : selectedApp.status === 'approved' ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-900 flex items-center justify-between">
                    <span className="font-bold">✓ PRTC Sanctioned & Disbursed</span>
                    <span className="font-mono text-[11px]">{selectedApp.prtcAdminId}</span>
                  </div>
                  <button
                    onClick={() =>
                      onOpenPassModal({
                        ticketNumber: selectedApp.studentId,
                        holderName: selectedApp.name,
                        title: `${selectedApp.passType} Concession Pass`,
                        route: selectedApp.route,
                        college: selectedApp.collegeName,
                        validUntil: 'Active for 3 Months (90 Days)',
                        rollNo: selectedApp.rollNumber,
                      })
                    }
                    className="w-full py-2.5 rounded-xl bg-[#000666] text-white text-xs font-bold hover:bg-[#1a237e] transition flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">qr_code</span>
                    Inspect Conductor Token Pass
                  </button>
                </div>
              ) : (
                <div className="text-center pt-2">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Awaiting College Verification First
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#c6c5d4] shadow-xs">
              <span className="material-symbols-outlined text-4xl text-[#c6c5d4]">directions_bus</span>
              <h4 className="font-bold text-sm text-[#1b1c1c] mt-2">Select a student application</h4>
              <p className="text-xs text-[#767683] mt-1">
                Inspect college attestation seals and disburse authorized state concession passes.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Attached Document Viewer Modal */}
      {isDocModalOpen && selectedApp && (
        <DocumentViewerModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          document={viewingDoc}
          application={selectedApp}
        />
      )}
    </div>
  );
};
