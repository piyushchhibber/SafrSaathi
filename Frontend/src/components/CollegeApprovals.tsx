import React, { useState } from 'react';
import { College, StudentApplication, PortalRole } from '../types';
import confetti from 'canvas-confetti';

interface CollegeApprovalsProps {
  colleges: College[];
  applications: StudentApplication[];
  onUpdateApplicationStatus: (id: string, newStatus: StudentApplication['status']) => void;
  onApproveAllForCollege: (collegeId: string) => void;
  onNavigateRole: (role: PortalRole) => void;
}

export const CollegeApprovals: React.FC<CollegeApprovalsProps> = ({
  colleges,
  applications,
  onUpdateApplicationStatus,
  onApproveAllForCollege,
  onNavigateRole,
}) => {
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('pec');
  const [selectedStudentForReview, setSelectedStudentForReview] = useState<StudentApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId) || colleges[0];

  const collegeApplications = applications.filter((app) => {
    const matchesCollege = app.collegeId === selectedCollegeId;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCollege && matchesSearch;
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = (app: StudentApplication) => {
    onUpdateApplicationStatus(app.id, 'approved');
    showToast(`Application for ${app.name} (${app.studentId}) Approved Successfully.`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    if (selectedStudentForReview?.id === app.id) {
      setSelectedStudentForReview(null);
    }
  };

  const handleReject = (app: StudentApplication) => {
    onUpdateApplicationStatus(app.id, 'rejected');
    showToast(`Application for ${app.name} (${app.studentId}) Rejected.`);
    if (selectedStudentForReview?.id === app.id) {
      setSelectedStudentForReview(null);
    }
  };

  const handleApproveAll = () => {
    onApproveAllForCollege(selectedCollegeId);
    showToast(`All pending applications for ${selectedCollege.name} have been Approved!`);
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 relative">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#000666] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#8690ee] animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <span className="text-xs font-semibold">{notification}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Internal Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-[#f5f3f3] border border-[#c6c5d4] rounded-2xl p-4 flex flex-col shrink-0 h-fit shadow-xs">
        <div className="mb-6 pt-1 pb-3 border-b border-[#c6c5d4]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#000666] flex items-center justify-center text-white text-xs font-bold">
              <span className="material-symbols-outlined text-sm">verified_user</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#000666]">PRTC Portal</h2>
              <p className="text-[11px] text-[#454652]">Official Transport Services</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 mb-6">
          <button
            className="flex items-center gap-3 p-2.5 bg-[#1a237e] text-white rounded-xl font-semibold text-xs transition shadow-xs text-left"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Dashboard
          </button>
          <button
            className="flex items-center gap-3 p-2.5 text-[#454652] hover:bg-[#eae8e7] rounded-xl text-xs font-medium transition text-left"
          >
            <span className="material-symbols-outlined text-lg">school</span>
            Colleges
          </button>
          <button
            className="flex items-center gap-3 p-2.5 text-[#454652] hover:bg-[#eae8e7] rounded-xl text-xs font-medium transition text-left"
          >
            <span className="material-symbols-outlined text-lg">pending_actions</span>
            Pending Approvals
          </button>
          <button
            className="flex items-center gap-3 p-2.5 text-[#454652] hover:bg-[#eae8e7] rounded-xl text-xs font-medium transition text-left"
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            Reports
          </button>
        </nav>

        <div className="border-t border-[#c6c5d4] pt-4 flex flex-col gap-2">
          <button
            onClick={() => onNavigateRole('student')}
            className="w-full bg-[#000666] text-white text-center py-2.5 rounded-xl text-xs font-bold hover:bg-[#1a237e] transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add_card</span>
            Apply for Pass
          </button>
          <button
            onClick={() => onNavigateRole('passenger')}
            className="w-full bg-white border border-[#c6c5d4] text-[#000666] text-center py-2 rounded-xl text-xs font-semibold hover:bg-[#f5f3f3] transition text-left px-3 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person</span>
            Passenger View
          </button>
          <button
            onClick={() => onNavigateRole('gateway')}
            className="flex items-center gap-2.5 p-2 text-[#454652] hover:text-[#000666] text-xs font-medium text-left"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Back to Gateway
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1c] tracking-tight">
              College Approvals
            </h1>
            <p className="text-xs md:text-sm text-[#454652] mt-0.5">
              Review student applications pre-approved and attested by higher educational institutions.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search student or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#c6c5d4] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1b1c1c] placeholder:text-[#767683] focus:outline-none focus:border-[#000666] shadow-xs"
              />
              <span className="material-symbols-outlined text-sm text-[#767683] absolute left-3 top-2.5">
                search
              </span>
            </div>
            <button 
              onClick={() => setSearchQuery('')}
              className="bg-white border border-[#c6c5d4] p-2 rounded-xl text-[#454652] hover:bg-[#f5f3f3] transition shadow-xs"
              title="Reset Search"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid: College Selector & Student Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Colleges List */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#767683] px-1">
              Affiliated Institutions ({colleges.length})
            </div>

            {colleges.map((college) => {
              const isSelected = college.id === selectedCollegeId;
              const pendingInThis = applications.filter(a => a.collegeId === college.id && a.status === 'college_approved').length;
              
              return (
                <div
                  key={college.id}
                  onClick={() => setSelectedCollegeId(college.id)}
                  className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden shadow-xs ${
                    isSelected
                      ? 'bg-white border-2 border-[#000666] shadow-md ring-2 ring-[#000666]/10'
                      : 'bg-white border border-[#c6c5d4] hover:bg-[#fbf9f8] hover:border-[#767683]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#000666]" />
                  )}

                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-sm text-[#1b1c1c] leading-tight">
                      {college.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      pendingInThis > 0
                        ? 'bg-[#1a237e] text-white'
                        : 'bg-[#eae8e7] text-[#454652]'
                    }`}>
                      {pendingInThis} Pending
                    </span>
                  </div>

                  <p className="text-xs text-[#454652] mb-3">
                    {college.location}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#454652] bg-[#f0eded] px-2 py-0.5 rounded-md">
                      <span className="material-symbols-outlined text-[13px] text-green-700">
                        {college.statusTag === 'Pre-cleared' ? 'verified' : 'schedule'}
                      </span>
                      {college.statusTag}
                    </span>
                    <span className="text-[10px] text-[#767683]">
                      Depot: {college.city} ISBT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Students Table */}
          <div className="lg:col-span-8 bg-white border border-[#c6c5d4] rounded-2xl overflow-hidden shadow-sm flex flex-col">
            {/* Header Strip */}
            <div className="p-4 border-b border-[#c6c5d4] flex flex-wrap justify-between items-center bg-[#fbf9f8] gap-3">
              <div>
                <h3 className="font-bold text-sm text-[#1b1c1c] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                  {selectedCollege.name} - Institutionally Verified
                </h3>
                <p className="text-[11px] text-[#454652]">
                  Showing {collegeApplications.length} candidate applications for this semester
                </p>
              </div>

              <button
                onClick={handleApproveAll}
                disabled={collegeApplications.length === 0}
                className="bg-[#000666] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#1a237e] transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                Approve All ({collegeApplications.length})
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5f3f3] text-[#454652] border-b border-[#c6c5d4]">
                  <tr>
                    <th className="p-3.5 font-bold">Student ID</th>
                    <th className="p-3.5 font-bold">Name & Route</th>
                    <th className="p-3.5 font-bold">Pass Type</th>
                    <th className="p-3.5 font-bold text-right">Review & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eae8e7]">
                  {collegeApplications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[#767683]">
                        <span className="material-symbols-outlined text-4xl text-[#c6c5d4] mb-2">assignment_turned_in</span>
                        <p className="font-semibold text-sm">No applications pending for {selectedCollege.name}.</p>
                        <p className="text-xs text-[#767683] mt-1">All student concession records are up to date.</p>
                      </td>
                    </tr>
                  ) : (
                    collegeApplications.map((app) => {
                      const isPending = app.status === 'college_approved';
                      const isApproved = app.status === 'approved';
                      const isRejected = app.status === 'rejected';

                      return (
                        <tr key={app.id} className="hover:bg-[#fbf9f8] transition">
                          {/* Student ID */}
                          <td className="p-3.5 font-mono text-xs text-[#1b1c1c] font-semibold">
                            {app.studentId}
                          </td>

                          {/* Name & Route */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#eae8e7] text-[#000666] flex items-center justify-center text-xs font-bold shrink-0 border border-[#c6c5d4]">
                                {app.initials}
                              </div>
                              <div>
                                <div className="font-bold text-[#1b1c1c]">{app.name}</div>
                                <div className="text-[10px] text-[#454652]">{app.route}</div>
                              </div>
                            </div>
                          </td>

                          {/* Pass Type & Status Tag */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="bg-[#f0eded] border border-[#c6c5d4] text-[#1b1c1c] px-2 py-0.5 rounded text-[11px] font-medium">
                                {app.passType}
                              </span>
                              {isPending && (
                                <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[11px]">verified</span>
                                  College Approved
                                </span>
                              )}
                              {isApproved && (
                                <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  ✓ Issued & Active
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  ✕ Rejected
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => handleApprove(app)}
                                    className="border border-green-700 text-green-700 hover:bg-green-700 hover:text-white p-1.5 rounded-lg transition"
                                    title="Approve Pass"
                                  >
                                    <span className="material-symbols-outlined text-sm block">check</span>
                                  </button>
                                  <button
                                    onClick={() => handleReject(app)}
                                    className="border border-red-700 text-red-700 hover:bg-red-700 hover:text-white p-1.5 rounded-lg transition"
                                    title="Reject Pass"
                                  >
                                    <span className="material-symbols-outlined text-sm block">close</span>
                                  </button>
                                </>
                              ) : null}
                              <button
                                onClick={() => setSelectedStudentForReview(app)}
                                className="bg-[#1a237e] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#000666] transition shadow-xs"
                              >
                                View Documents
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Side Review Drawer / Verification Modal */}
      {selectedStudentForReview && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col border-l border-[#c6c5d4] animate-in slide-in-from-right duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#eae8e7] mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666]">fact_check</span>
                <h3 className="font-bold text-lg text-[#1b1c1c]">Student Document Review</h3>
              </div>
              <button
                onClick={() => setSelectedStudentForReview(null)}
                className="w-8 h-8 rounded-full bg-[#f5f3f3] hover:bg-[#eae8e7] flex items-center justify-center text-[#454652] transition"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Applicant Profile Card */}
            <div className="bg-[#fbf9f8] border border-[#c6c5d4] rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#000666] text-white flex items-center justify-center text-xl font-bold">
                  {selectedStudentForReview.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-[#1b1c1c]">{selectedStudentForReview.name}</h4>
                    <span className="bg-[#000666] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {selectedStudentForReview.passType}
                    </span>
                  </div>
                  <p className="text-xs text-[#454652]">{selectedStudentForReview.collegeName}</p>
                  <p className="text-xs font-mono text-[#767683] mt-0.5">ID: {selectedStudentForReview.studentId} • Roll: {selectedStudentForReview.rollNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#eae8e7] text-xs">
                <div>
                  <span className="text-[#767683] block">Course & Term:</span>
                  <span className="font-semibold text-[#1b1c1c]">{selectedStudentForReview.course}</span>
                </div>
                <div>
                  <span className="text-[#767683] block">Designated Bus Route:</span>
                  <span className="font-semibold text-[#1b1c1c]">{selectedStudentForReview.route}</span>
                </div>
              </div>
            </div>

            {/* Institutional Verification Stamp Section */}
            <div className="border-2 border-green-600/40 bg-green-50/50 rounded-2xl p-5 mb-6 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-800">
                    Institutional Verification
                  </span>
                  <h5 className="font-bold text-sm text-green-950 mt-1">
                    {selectedStudentForReview.collegeName}
                  </h5>
                  <p className="text-xs text-green-900 mt-1">
                    Verified By: <span className="font-bold">{selectedStudentForReview.collegeVerifiedBy || 'Authorized Registrar'}</span>
                  </p>
                  <p className="text-[11px] text-green-800 mt-0.5">
                    Attestation Date: {selectedStudentForReview.collegeVerifiedDate || 'Oct 24, 2024'}
                  </p>
                </div>

                {/* Simulated Official Green Stamp */}
                <div className="border-2 border-green-700 text-green-800 px-3 py-1.5 rounded-lg rotate-[-6deg] font-black text-center text-xs tracking-wider shadow-xs uppercase">
                  ✓ VERIFIED
                  <div className="text-[8px] font-normal tracking-normal">PRTC ACADEMIC DESK</div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents Previews */}
            <div className="space-y-4 mb-8 flex-1">
              <h5 className="font-bold text-xs uppercase tracking-wider text-[#767683]">
                Attached Verifiable Documents
              </h5>

              {/* Aadhaar Card */}
              <div className="border border-[#c6c5d4] rounded-xl p-4 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#000666] text-lg">badge</span>
                    <span className="font-bold text-xs">Aadhaar Card (Self-Attested)</span>
                  </div>
                  <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    Aadhaar Validated
                  </span>
                </div>
                <p className="text-[11px] text-[#454652] mb-3 font-mono">
                  Linked UIDAI Masked ID: {selectedStudentForReview.aadhaarNumber || 'XXXX-XXXX-4891'}
                </p>
                <div className="h-28 bg-[#f5f3f3] rounded-lg border border-dashed border-[#c6c5d4] flex flex-col items-center justify-center text-center p-3">
                  <span className="material-symbols-outlined text-2xl text-[#767683] mb-1">document_scanner</span>
                  <span className="text-xs font-semibold text-[#1b1c1c]">aadhaar_front_back_signed.pdf</span>
                  <span className="text-[10px] text-[#767683]">Punjab Resident Proof Verified (Sector 12, Chandigarh)</span>
                </div>
              </div>

              {/* Fee Receipt */}
              <div className="border border-[#c6c5d4] rounded-xl p-4 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600 text-lg">receipt_long</span>
                    <span className="font-bold text-xs">Semester Fee Receipt</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Active Enrollment
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#f5f3f3] p-3 rounded-lg border border-[#c6c5d4]">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-600 text-2xl">picture_as_pdf</span>
                    <div>
                      <div className="text-xs font-bold text-[#1b1c1c]">{selectedStudentForReview.feeReceiptFile || 'fee_receipt_sem3_2024.pdf'}</div>
                      <div className="text-[10px] text-[#767683]">{selectedStudentForReview.feeReceiptSize || '1.2 MB'} • Session 2024-2025 Paid</div>
                    </div>
                  </div>
                  <button className="text-[#000666] hover:underline text-xs font-bold">
                    Open PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="border-t border-[#eae8e7] pt-4 flex gap-3">
              <button
                onClick={() => {
                  showToast(`Information request sent to ${selectedStudentForReview.name}.`);
                  setSelectedStudentForReview(null);
                }}
                className="flex-1 border border-[#c6c5d4] text-[#454652] py-2.5 rounded-xl text-xs font-bold hover:bg-[#f5f3f3] transition"
              >
                Request Info
              </button>
              <button
                onClick={() => handleReject(selectedStudentForReview)}
                className="flex-1 border border-red-600 text-red-600 py-2.5 rounded-xl text-xs font-bold hover:bg-red-50 transition"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedStudentForReview)}
                className="flex-1 bg-[#000666] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#1a237e] transition shadow-md"
              >
                Final Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
