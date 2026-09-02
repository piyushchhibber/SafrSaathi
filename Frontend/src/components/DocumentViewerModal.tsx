import React, { useState, useEffect } from 'react';
import { StudentApplication } from '../types';

export interface DocumentInfo {
  title: string;
  type: 'aadhaar' | 'fee_receipt' | 'college_id' | 'domicile' | 'bonafide';
  fileName: string;
  fileSize?: string;
  studentName?: string;
  fatherName?: string;
  collegeName?: string;
  rollNo?: string;
  studentId?: string;
  aadhaarNumber?: string;
  aadhaarAddress?: string;
  receiptNumber?: string;
  amount?: string | number;
  date?: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentInfo | null;
  application?: StudentApplication | null;
  onMarkVerified?: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: initialDoc,
  application,
  onMarkVerified,
}) => {
  const [activeDocType, setActiveDocType] = useState<'aadhaar' | 'fee_receipt' | 'college_id'>('aadhaar');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isVerifiedLocally, setIsVerifiedLocally] = useState<boolean>(false);

  useEffect(() => {
    if (initialDoc) {
      if (initialDoc.type === 'fee_receipt' || initialDoc.fileName?.toLowerCase().includes('fee')) {
        setActiveDocType('fee_receipt');
      } else if (initialDoc.type === 'college_id' || initialDoc.fileName?.toLowerCase().includes('id')) {
        setActiveDocType('college_id');
      } else {
        setActiveDocType('aadhaar');
      }
    }
  }, [initialDoc]);

  if (!isOpen) return null;

  const studentName = initialDoc?.studentName || application?.name || 'Navjot Singh Dhillon';
  const fatherName = initialDoc?.fatherName || application?.fatherName || 'S. Gurdeep Singh';
  const collegeName = initialDoc?.collegeName || application?.collegeName || 'Punjab Engineering College (PEC)';
  const rollNo = initialDoc?.rollNo || application?.rollNumber || '102203418';
  const studentId = initialDoc?.studentId || application?.studentId || 'STU-2024-8841';
  const course = application?.course || 'B.Tech Computer Science & Engg.';
  const semester = application?.semester || '4th Semester (2024-25)';
  const aadhaarNumber = initialDoc?.aadhaarNumber || application?.aadhaarNumber || '7842-XXXX-4821';
  const aadhaarAddress =
    initialDoc?.aadhaarAddress ||
    application?.aadhaarAddress ||
    'House 142, Street 3, Urban Estate Phase 2, Patiala, Punjab - 147002';
  const feeReceiptNo = initialDoc?.receiptNumber || application?.feeReceiptNo || 'TIET-REC-2026-904';
  const aadhaarFileName = application?.aadhaarFile || 'aadhaar_card_signed.pdf';
  const feeReceiptFileName = application?.feeReceiptFile || 'college_fee_receipt_2026.pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-[#c6c5d4] flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-[#000666] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-[#bdc2ff]">
                {activeDocType === 'aadhaar' ? 'badge' : activeDocType === 'fee_receipt' ? 'receipt_long' : 'contact_emergency'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Student Verification Document Inspector
                </h3>
                <span className="text-[10px] font-black uppercase bg-[#138808] text-white px-2 py-0.5 rounded-full">
                  OFFICIAL ATTESTED
                </span>
              </div>
              <p className="text-xs text-[#bdc2ff] mt-0.5 flex items-center gap-2">
                <span>Candidate: <span className="font-bold text-white">{studentName}</span></span>
                <span>•</span>
                <span>Roll: <span className="font-mono text-white">{rollNo}</span></span>
                <span>•</span>
                <span>{collegeName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-xl px-2 py-1 gap-1 text-xs">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(75, prev - 15))}
                className="hover:text-[#bdc2ff] px-1 font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="font-mono text-[11px] px-1">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
                className="hover:text-[#bdc2ff] px-1 font-bold"
                title="Zoom In"
              >
                +
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Document Tab Switcher */}
        <div className="bg-[#f0eded] border-b border-[#c6c5d4] px-4 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveDocType('aadhaar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeDocType === 'aadhaar'
                ? 'bg-[#000666] text-white shadow-xs'
                : 'bg-white text-[#454652] hover:text-[#1b1c1c] border border-[#c6c5d4]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">badge</span>
            1. Aadhaar Card (Residency & ID)
          </button>

          <button
            onClick={() => setActiveDocType('fee_receipt')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeDocType === 'fee_receipt'
                ? 'bg-[#000666] text-white shadow-xs'
                : 'bg-white text-[#454652] hover:text-[#1b1c1c] border border-[#c6c5d4]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            2. College Fee Receipt (Enrolment)
          </button>

          <button
            onClick={() => setActiveDocType('college_id')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeDocType === 'college_id'
                ? 'bg-[#000666] text-white shadow-xs'
                : 'bg-white text-[#454652] hover:text-[#1b1c1c] border border-[#c6c5d4]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">contact_emergency</span>
            3. Student Identity Card (Campus Proof)
          </button>
        </div>

        {/* Document Content Workspace */}
        <div className="p-4 sm:p-6 bg-[#f4f3f2] overflow-y-auto flex-1 flex flex-col items-center">
          {/* Zoom container */}
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-[#c6c5d4] p-6 sm:p-8 relative overflow-hidden"
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-25deg]">
              <span className="text-6xl sm:text-8xl font-black uppercase text-black">
                GOVT OF PUNJAB • PRTC VERIFIED
              </span>
            </div>

            {/* Document Body rendering based on activeDocType */}
            {activeDocType === 'aadhaar' && (
              /* AADHAAR CARD PREVIEW */
              <div className="space-y-6">
                {/* Aadhaar Header */}
                <div className="border-b-2 border-[#E87722] pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E87722]/10 border border-[#E87722] flex items-center justify-center text-[#E87722] font-black text-lg">
                      <span className="material-symbols-outlined text-2xl">fingerprint</span>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-[#1b1c1c] uppercase tracking-wide">
                        Government of India • UIDAI
                      </h4>
                      <p className="text-[10px] text-[#767683] font-bold">
                        Unique Identification Authority of India - Digital Verification Extract
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black bg-blue-50 text-[#000666] border border-blue-200 px-2 py-0.5 rounded uppercase">
                      Self-Attested Copy
                    </span>
                  </div>
                </div>

                {/* Aadhaar Card Inner Box */}
                <div className="border-2 border-[#1B365D] rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-white via-[#fbf9f8] to-blue-50/20 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Photo + Details */}
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-24 rounded-xl bg-slate-200 border-2 border-[#1B365D] flex flex-col items-center justify-center text-slate-600 font-bold text-xs relative overflow-hidden shadow-xs shrink-0">
                        <span className="material-symbols-outlined text-4xl text-slate-400">account_box</span>
                        <span className="text-[9px] font-mono mt-1 text-slate-700">{studentId.slice(0, 8)}</span>
                        <div className="absolute bottom-0 inset-x-0 bg-[#000666] text-white text-[7px] text-center font-bold py-0.5">
                          UIDAI PHOTO
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-[10px] text-[#767683] block">Resident Name:</span>
                          <span className="font-black text-sm text-[#1b1c1c]">{studentName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#767683] block">Care of / Father:</span>
                          <span className="font-bold text-[#1b1c1c]">{fatherName}</span>
                        </div>
                        <div className="flex gap-4 pt-1 text-[11px]">
                          <div>
                            <span className="text-[9px] text-[#767683] block">DOB / YOB</span>
                            <span className="font-mono font-bold">14/08/2004</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#767683] block">Gender</span>
                            <span className="font-bold">MALE</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Barcode */}
                    <div className="sm:text-right flex flex-col items-start sm:items-end">
                      <div className="w-20 h-20 bg-white border border-[#c6c5d4] p-1.5 rounded-xl shadow-xs">
                        <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3zm0 5h3v3h-3v-3zm5-2h3v2h-3v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-mono text-[#767683] mt-1">UIDAI SECURE QR</span>
                    </div>
                  </div>

                  {/* Masked Aadhaar Number Banner */}
                  <div className="bg-[#1B365D] text-white rounded-xl py-2 px-4 text-center font-mono font-black text-base tracking-widest shadow-xs">
                    {aadhaarNumber}
                  </div>

                  {/* Address & Residency Clause */}
                  <div className="bg-white rounded-xl p-3 border border-[#c6c5d4] space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#767683] tracking-wider block">
                      Permanent Registered Residence (Punjab State)
                    </span>
                    <p className="font-bold text-[#1b1c1c] leading-snug">{aadhaarAddress}</p>
                    <div className="pt-2 flex items-center justify-between text-[11px] border-t border-[#eae8e7]">
                      <span className="text-green-700 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Verified Punjab Resident Status
                      </span>
                      <span className="text-[#767683]">File: {aadhaarFileName}</span>
                    </div>
                  </div>
                </div>

                {/* Self-Attestation & Student Signature */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-amber-900 block">Candidate Attestation & Declaration</span>
                    <p className="text-[11px] text-amber-800">
                      "I hereby certify that the above Aadhaar details and residential proof are true and valid."
                    </p>
                  </div>
                  <div className="text-right border-l border-amber-300 pl-3">
                    <span className="font-serif italic font-bold text-blue-900 text-sm block">
                      {studentName}
                    </span>
                    <span className="text-[9px] text-[#767683]">Digitally Affirmed</span>
                  </div>
                </div>
              </div>
            )}

            {activeDocType === 'fee_receipt' && (
              /* COLLEGE FEE RECEIPT & BONAFIDE PROOF */
              <div className="space-y-6">
                {/* College Header */}
                <div className="border-b-2 border-[#000666] pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#000666] text-white flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-[#1b1c1c] uppercase tracking-wide">
                        {collegeName}
                      </h4>
                      <p className="text-[10px] text-[#767683] font-bold">
                        Office of the Registrar / Academic & Accounts Division
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded uppercase">
                      Fee Receipt • 2026-27
                    </span>
                  </div>
                </div>

                {/* Receipt Details Box */}
                <div className="border border-[#c6c5d4] rounded-2xl p-5 bg-[#fbf9f8] space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#767683] block">Receipt Reference:</span>
                      <span className="font-mono font-bold text-[#000666] text-sm">
                        {feeReceiptNo}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#767683] block">Roll / Enrollment No:</span>
                      <span className="font-mono font-bold text-[#1b1c1c]">{rollNo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#767683] block">Term / Semester:</span>
                      <span className="font-bold text-[#1b1c1c]">{semester}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#767683] block">Student Name:</span>
                      <span className="font-black text-[#1b1c1c]">{studentName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#767683] block">Course / Branch:</span>
                      <span className="font-bold text-[#1b1c1c]">{course}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#767683] block">Attestation Date:</span>
                      <span className="font-bold text-[#1b1c1c]">{application?.submittedDate || '24 Aug 2026'}</span>
                    </div>
                  </div>

                  {/* Fee Itemization Table */}
                  <table className="w-full text-left text-xs border border-[#c6c5d4] bg-white rounded-xl overflow-hidden">
                    <thead className="bg-[#f0eded] text-[#454652] font-bold">
                      <tr>
                        <th className="p-2.5">Fee Component</th>
                        <th className="p-2.5">Academic Session</th>
                        <th className="p-2.5 text-right">Status / Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eae8e7]">
                      <tr>
                        <td className="p-2.5 font-bold">Academic Tuition & Examination Fee</td>
                        <td className="p-2.5">2026-27 (Regular)</td>
                        <td className="p-2.5 text-right font-mono font-bold text-green-700">PAID IN FULL</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">Institutional Transit Eligibility Quota</td>
                        <td className="p-2.5">PRTC Student Subsidy Scheme</td>
                        <td className="p-2.5 text-right font-mono font-bold text-green-700">CLEARED</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Stamp Seal Simulation */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-[11px] text-[#767683]">
                      <span className="material-symbols-outlined text-base text-green-600">verified</span>
                      <span>Verified via Institutional Accounts Ledger ({feeReceiptFileName})</span>
                    </div>

                    <div className="border-2 border-dashed border-[#000666] rounded-xl px-3 py-1.5 text-center rotate-[-4deg] bg-blue-50/50">
                      <span className="text-[8px] font-black text-[#000666] uppercase block">ACADEMIC ACCOUNTS</span>
                      <span className="text-[9px] font-black text-[#000666]">STAMPED & CLEARED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDocType === 'college_id' && (
              /* STUDENT IDENTITY CARD PREVIEW */
              <div className="space-y-6">
                {/* College ID Header */}
                <div className="border-b-2 border-[#000666] pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#000666] text-white flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-2xl">badge</span>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-[#1b1c1c] uppercase tracking-wide">
                        {collegeName}
                      </h4>
                      <p className="text-[10px] text-[#767683] font-bold">
                        Official Student Identity Card • Regular Full-Time Scholar
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black bg-green-100 text-green-900 border border-green-200 px-2 py-0.5 rounded uppercase">
                      Active Student Card
                    </span>
                  </div>
                </div>

                {/* Card Container */}
                <div className="border-2 border-[#000666] rounded-2xl p-5 bg-gradient-to-br from-white via-blue-50/20 to-white shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-28 rounded-xl bg-slate-200 border-2 border-[#000666] flex flex-col items-center justify-center text-slate-600 font-bold text-xs relative overflow-hidden shadow-xs shrink-0">
                      <span className="material-symbols-outlined text-5xl text-slate-400">person</span>
                      <div className="absolute bottom-0 inset-x-0 bg-[#000666] text-white text-[8px] text-center font-bold py-0.5">
                        STUDENT PHOTO
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] text-[#767683] block">Student Name:</span>
                        <h4 className="font-extrabold text-sm text-[#1b1c1c]">{studentName}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] text-[#767683] block">Roll Number</span>
                          <span className="font-mono font-bold text-[#000666]">{rollNo}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#767683] block">Student ID</span>
                          <span className="font-mono font-bold text-[#1b1c1c]">{studentId}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[9px] text-[#767683] block">Course</span>
                          <span className="font-bold text-[#1b1c1c]">{course}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#767683] block">Current Semester</span>
                          <span className="font-bold text-[#1b1c1c]">{semester}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#eae8e7] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9px] text-[#767683] block">Issuing Authority:</span>
                      <span className="font-bold text-[#1b1c1c]">Dean of Student Affairs</span>
                    </div>

                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#000666] flex flex-col items-center justify-center text-center rotate-[-5deg] p-1 bg-white text-[#000666]">
                      <span className="text-[6px] font-black uppercase">INSTITUTION</span>
                      <span className="text-[8px] font-black">AUTHORIZED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-[#c6c5d4] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#454652]">
            <span className="material-symbols-outlined text-green-600 text-base">security</span>
            <span>Document digitally verified against Punjab State Concession Security Registry</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onMarkVerified && (
              <button
                onClick={() => {
                  setIsVerifiedLocally(true);
                  onMarkVerified();
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {isVerifiedLocally ? 'Document Verified ✓' : 'Approve & Mark Verified'}
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#000666] hover:bg-[#1a237e] text-white font-bold text-xs transition shadow-sm"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

