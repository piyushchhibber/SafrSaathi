import React, { useState } from 'react';
import { UserProfile, College, StudentApplication } from '../types';
import { DocumentViewerModal, DocumentInfo } from './DocumentViewerModal';
import confetti from 'canvas-confetti';

interface CollegeAdminDashboardProps {
  userProfile: UserProfile;
  colleges: College[];
  applications: StudentApplication[];
  onUpdateApplication: (app: StudentApplication) => void;
  onOpenEditProfile: () => void;
}

export const CollegeAdminDashboard: React.FC<CollegeAdminDashboardProps> = ({
  userProfile,
  colleges,
  applications,
  onUpdateApplication,
  onOpenEditProfile,
}) => {
  const currentCollegeName = userProfile.college || userProfile.institution || 'All Colleges (All Punjab Campuses)';
  const [selectedCollege, setSelectedCollege] = useState<string>(currentCollegeName);
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'college_approved' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminStampNotes, setAdminStampNotes] = useState('Attested against active enrollment register & Punjab residency record');
  
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

  // Filter apps
  const collegeApps = (applications || []).filter((app) => {
    if (!app) return false;
    const appColName = (app.collegeName || '').toLowerCase();
    const selCol = (selectedCollege || '').toLowerCase();
    const isAll = selCol === '' || selCol.includes('all colleges');
    const matchesCol =
      isAll ||
      appColName.includes(selCol) ||
      selCol.includes(appColName);
    const matchesStatus = statusFilter === 'all' ? true : app.status === statusFilter;
    const matchesSearch =
      (app.name && app.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.studentId && app.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.rollNumber && app.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.course && app.course.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCol && matchesStatus && matchesSearch;
  });

  const pendingCount = (applications || []).filter((a) => {
    if (!a || a.status !== 'pending') return false;
    const selCol = (selectedCollege || '').toLowerCase();
    const isAll = selCol === '' || selCol.includes('all colleges');
    if (isAll) return true;
    const appColName = (a.collegeName || '').toLowerCase();
    return appColName.includes(selCol) || selCol.includes(appColName);
  }).length;

  const handleApproveWithCollegeStamp = (app: StudentApplication) => {
    const updatedApp: StudentApplication = {
      ...app,
      status: 'college_approved',
      collegeVerifiedBy: (userProfile?.name || 'Authorized Dean').toUpperCase() + ' (DEAN / REGISTRAR)',
      collegeVerifiedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      collegeStampId: `SEAL-${(selectedCollege || 'COLL').substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onUpdateApplication(updatedApp);
    confetti({ particleCount: 70, spread: 60 });
    setSelectedApp(updatedApp);
  };

  const handleReject = (app: StudentApplication) => {
    const updatedApp: StudentApplication = {
      ...app,
      status: 'rejected',
      collegeVerifiedBy: (userProfile?.name || 'Authorized Signatory').toUpperCase(),
      collegeVerifiedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
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
            <span className="material-symbols-outlined text-3xl">account_balance</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1b1c1c] tracking-tight">{userProfile.name}</h2>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                COLLEGE NODAL DESK
              </span>
            </div>
            <p className="text-xs text-[#454652] mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#000666]">school</span>
              Institutional Authority: <span className="font-bold text-[#1b1c1c]">{selectedCollege}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
          >
            <option value="All Colleges (All Punjab Campuses)">All Punjab Colleges & Universities</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={onOpenEditProfile}
            className="px-4 py-2 rounded-xl border border-[#c6c5d4] hover:bg-[#eae8e7] text-xs font-bold text-[#1b1c1c] transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">manage_accounts</span>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Main Grid: Application List & Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Applications Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666] text-lg">pending_actions</span>
                Student Concession Applications
              </h3>
              <p className="text-xs text-[#767683]">
                {pendingCount} new requests awaiting institutional verification & college stamp
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#f0eded] p-1 rounded-xl">
              {(['all', 'pending', 'college_approved', 'approved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    statusFilter === tab ? 'bg-white text-[#000666] shadow-xs' : 'text-[#767683] hover:text-black'
                  }`}
                >
                  {tab === 'all'
                    ? 'All'
                    : tab === 'pending'
                    ? `Pending (${pendingCount})`
                    : tab === 'college_approved'
                    ? 'Stamped'
                    : 'Issued'}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search student name, roll number, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#c6c5d4] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666] shadow-xs"
            />
            <span className="material-symbols-outlined text-base text-[#767683] absolute left-3.5 top-3">
              search
            </span>
          </div>

          {/* Applications list */}
          <div className="space-y-3">
            {collegeApps.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#c6c5d4]">
                <span className="material-symbols-outlined text-4xl text-[#c6c5d4]">check_circle</span>
                <h4 className="font-bold text-sm text-[#1b1c1c] mt-2">No applications match filter</h4>
                <p className="text-xs text-[#767683] mt-1">Try resetting the status filter or search query.</p>
              </div>
            ) : (
              collegeApps.map((app) => {
                const isSelected = selectedApp?.id === app.id;
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
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#000666] flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                          {app.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-[#1b1c1c]">{app.name}</h4>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                app.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : app.status === 'college_approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : app.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {app.status === 'college_approved' ? 'Stamped by College' : app.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#454652]">
                            {app.course} • Roll: <span className="font-mono font-semibold">{app.rollNumber}</span>
                          </p>
                          <p className="text-[11px] text-[#767683] mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-[#000666]">route</span>
                            {app.route} ({app.passType})
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-[#767683] block">{app.studentId}</span>
                        {app.collegeStampId && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black bg-blue-50 text-[#000666] px-1.5 py-0.5 rounded border border-blue-200">
                            <span className="material-symbols-outlined text-[10px]">verified</span>
                            Stamped
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Document Review & College Stamp Station */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-lg">verified</span>
              Institutional Verification & Stamp Station
            </h3>
          </div>

          {selectedApp ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-md space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#eae8e7] pb-3">
                <div>
                  <h4 className="text-base font-black text-[#1b1c1c]">{selectedApp.name}</h4>
                  <p className="text-xs text-[#767683]">
                    Father: <span className="font-bold text-[#1b1c1c]">{selectedApp.fatherName}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#767683] block">Submitted</span>
                  <span className="text-xs font-bold text-[#1b1c1c]">{selectedApp.submittedDate}</span>
                </div>
              </div>

              {/* Student Academic & Aadhaar Meta */}
              <div className="bg-[#fbf9f8] p-3.5 rounded-2xl border border-[#c6c5d4] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#767683]">Permanent Address (Aadhaar):</span>
                  <span className="font-semibold text-right text-[#1b1c1c] max-w-[60%]">
                    {selectedApp.aadhaarAddress || 'Patiala, Punjab'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#767683]">Punjab Residency:</span>
                  <span className="font-bold text-green-700">Eligible (Punjab State Resident)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#767683]">Aadhaar Masked ID:</span>
                  <span className="font-mono font-bold text-[#1b1c1c]">{selectedApp.aadhaarNumber || '7842-XXXX-4821'}</span>
                </div>
              </div>

              {/* Uploaded Documents */}
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

              {/* Official Virtual College Stamp Preview */}
              {selectedApp.status === 'college_approved' || selectedApp.status === 'approved' ? (
                <div className="border-2 border-[#000666] bg-blue-50/60 rounded-2xl p-4 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-[#000666] uppercase block">
                        Official Institutional Endorsement
                      </span>
                      <h5 className="font-extrabold text-xs text-[#000666] mt-0.5">{selectedApp.collegeName}</h5>
                      <p className="text-[11px] text-[#454652] mt-1">
                        Attested by: <span className="font-bold">{selectedApp.collegeVerifiedBy}</span>
                      </p>
                      <p className="text-[10px] text-[#767683]">Date: {selectedApp.collegeVerifiedDate}</p>
                    </div>

                    {/* Prominent Circular College Stamp Graphic */}
                    <div className="w-20 h-20 rounded-full border-4 border-dashed border-[#000666] flex flex-col items-center justify-center text-center rotate-[-8deg] p-1 bg-white/70 shadow-sm shrink-0">
                      <span className="text-[7px] font-black text-[#000666] uppercase leading-tight">COLLEGE SEAL</span>
                      <span className="text-[9px] font-black text-[#000666] my-0.5">APPROVED</span>
                      <span className="text-[7px] font-mono text-[#000666]">{selectedApp.collegeStampId}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              {selectedApp.status === 'pending' ? (
                <div className="space-y-2 pt-2 border-t border-[#eae8e7]">
                  <button
                    onClick={() => handleApproveWithCollegeStamp(selectedApp)}
                    className="w-full py-3 rounded-2xl bg-[#000666] hover:bg-[#1a237e] text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">verified</span>
                    Apply Virtual College Stamp & Approve
                  </button>

                  <button
                    onClick={() => handleReject(selectedApp)}
                    className="w-full py-2 rounded-xl border border-red-600 text-red-600 hover:bg-red-50 font-bold text-xs transition"
                  >
                    Reject Application
                  </button>
                </div>
              ) : (
                <div className="text-center pt-2">
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    College Attestation Completed
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#c6c5d4] shadow-xs">
              <span className="material-symbols-outlined text-4xl text-[#c6c5d4]">touch_app</span>
              <h4 className="font-bold text-sm text-[#1b1c1c] mt-2">Select an application to inspect</h4>
              <p className="text-xs text-[#767683] mt-1">
                View student documents, verify Aadhaar residency, and apply the official College Stamp.
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
