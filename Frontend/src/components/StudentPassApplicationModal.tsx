import React, { useState } from 'react';
import { StudentApplication, UserProfile, College } from '../types';
import confetti from 'canvas-confetti';

interface StudentPassApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  colleges: College[];
  onSubmitApplication: (application: StudentApplication) => void;
}

export const StudentPassApplicationModal: React.FC<StudentPassApplicationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  colleges,
  onSubmitApplication,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Necessary Details
  const [collegeName, setCollegeName] = useState(userProfile.college || colleges[0]?.name || 'Punjab Engineering College (PEC)');
  const [course, setCourse] = useState('B.Tech Computer Science & Engg');
  const [academicYear, setAcademicYear] = useState('2nd Year');
  const [semester, setSemester] = useState('Semester 4');
  const [originStop, setOriginStop] = useState('Patiala Bus Stand');
  const [destinationCampus, setDestinationCampus] = useState('Thapar Campus Nabha Road');
  const [distanceKm, setDistanceKm] = useState(18);
  const [passDuration, setPassDuration] = useState<'Monthly' | 'Quarterly' | 'Semester'>('Quarterly');

  // Step 2: Upload Documents
  const [aadhaarFileName, setAadhaarFileName] = useState('aadhaar_card_self_signed.pdf');
  const [aadhaarAffirmed, setAadhaarAffirmed] = useState(true);
  const [feeReceiptFileName, setFeeReceiptFileName] = useState('fee_receipt_current_sem.pdf');
  const [feeReceiptNo, setFeeReceiptNo] = useState('TIET-REC-2026-904');

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Pricing calculation
  const baseRate = 35; // Standard Subsidized Transit Base
  const durationMultiplier = passDuration === 'Semester' ? 20 : (passDuration === 'Quarterly' ? 12 : 4);
  const rawTotal = baseRate * durationMultiplier;
  const subsidyPercent = 75; // 75% State Government Student Welfare Subsidy
  const studentPayable = Math.round(rawTotal * (1 - subsidyPercent / 100));

  const matchedCollege =
    (colleges && colleges.find((c) => c.name === collegeName)) ||
    colleges?.[0] || {
      id: 'pec',
      name: 'Punjab Engineering College (PEC)',
    };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinalSubmit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const studentFullName = userProfile?.name || 'Navjot Singh Dhillon';
      const newApp: StudentApplication = {
        id: `app-${Date.now()}`,
        studentId: userProfile?.passId || `STU-2024-${Math.floor(1000 + Math.random() * 9000)}`,
        name: studentFullName,
        initials: studentFullName
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || 'NS',
        fatherName: userProfile?.fatherName || 'S. Gurdeep Singh',
        collegeId: matchedCollege?.id || 'pec',
        collegeName: collegeName || matchedCollege?.name || 'Punjab Engineering College (PEC)',
        rollNumber: userProfile?.rollNo || '102203418',
        course: course,
        semester: `${academicYear} • ${semester}`,
        passType: 'Subsidized Student Concession',
        route: `${originStop} -> ${destinationCampus}`,
        distanceKm: Number(distanceKm),
        duration: passDuration,
        status: 'pending',
        submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        aadhaarNumber: userProfile?.aadhaarNumber || '7842-XXXX-4821',
        aadhaarAddress: userProfile?.permanentAddress || 'Patiala, Punjab',
        isPunjabResident: true,
        aadhaarFile: aadhaarFileName,
        feeReceiptFile: feeReceiptFileName,
        feeReceiptSize: '1.2 MB',
        feeReceiptNo: feeReceiptNo,
        signatureAffirmed: aadhaarAffirmed,
        originalFare: rawTotal,
        subsidizedAmountPaid: studentPayable,
      };

      confetti({ particleCount: 80, spread: 70 });
      onSubmitApplication(newApp);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#000666] text-white p-5 sm:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#000666] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">app_registration</span>
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Apply for Student Concession Pass</h3>
                <p className="text-xs text-[#bdc2ff]">PRTC Punjab State Transport • 75% Welfare Subsidy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Stepper Header */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { num: 1, label: 'Route Details' },
              { num: 2, label: 'Upload Documents' },
              { num: 3, label: 'Recheck Info' },
              { num: 4, label: 'Fee Payment' },
            ].map((step) => (
              <div
                key={step.num}
                className={`py-2 px-1 rounded-xl text-center transition ${
                  currentStep === step.num
                    ? 'bg-white text-[#000666] font-extrabold shadow-sm'
                    : currentStep > step.num
                    ? 'bg-[#1a237e] text-white font-semibold'
                    : 'bg-white/10 text-white/60 font-medium'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider">Step {step.num}</div>
                <div className="text-xs truncate">{step.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#fbf9f8]">
          {/* STEP 1: NECESSARY DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-700">info</span>
                <span>Please specify your regular daily transit route and academic enrolment details.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">College / University</label>
                  <select
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  >
                    {colleges.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Course / Degree</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  >
                    <option value="1st Year">1st Year (Freshman)</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                    <option value="5th Year">5th Year (Dual Degree / Law / Arch)</option>
                    <option value="Postgraduate (PG 1st/2nd Year)">Postgraduate (PG / Ph.D.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Current Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                    <option value="Semester 9">Semester 9</option>
                    <option value="Semester 10">Semester 10</option>
                    <option value="Annual Academic System">Annual Examination System</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Pass Duration</label>
                  <select
                    value={passDuration}
                    onChange={(e) => setPassDuration(e.target.value as any)}
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  >
                    <option value="Quarterly">3 Months Pass (90 Days - Quarterly Concession)</option>
                    <option value="Monthly">1 Month Pass (30 Days)</option>
                    <option value="Semester">6 Months Pass (Full Semester)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">One-Way Transit Distance (KM)</label>
                  <input
                    type="number"
                    value={distanceKm}
                    min={1}
                    max={120}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Origin Bus Stop / Boarding Depot</label>
                  <input
                    type="text"
                    value={originStop}
                    onChange={(e) => setOriginStop(e.target.value)}
                    placeholder="e.g. Patiala Central Bus Stand"
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Destination Campus / Alighting Stop</label>
                  <input
                    type="text"
                    value={destinationCampus}
                    onChange={(e) => setDestinationCampus(e.target.value)}
                    placeholder="e.g. Thapar Campus Nabha Road"
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD DOCUMENTS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-amber-700 shrink-0">upload_file</span>
                <div>
                  <p className="font-bold">Required Attestation Documents</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Please upload your signed Aadhaar copy and current college fee receipt for verification by your College Admin and PRTC Depot Authority.
                  </p>
                </div>
              </div>

              {/* Document 1: Aadhaar */}
              <div className="p-4 bg-white border-2 border-dashed border-[#c6c5d4] rounded-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#000666] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl">badge</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1b1c1c]">Aadhaar Card Copy (Self-Signed) *</h4>
                      <p className="text-[11px] text-[#767683]">Front & back with clear student signature</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span> Attached
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between bg-[#fbf9f8] p-2.5 rounded-xl border border-[#c6c5d4]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#000666]">
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    {aadhaarFileName} (1.4 MB)
                  </div>
                  <label className="cursor-pointer bg-white border border-[#c6c5d4] hover:bg-[#eae8e7] text-xs font-semibold px-2.5 py-1 rounded-lg transition">
                    Replace
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setAadhaarFileName(e.target.files[0].name);
                      }}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aadhaarAffirmed}
                    onChange={(e) => setAadhaarAffirmed(e.target.checked)}
                    className="rounded text-[#000666] focus:ring-[#000666]"
                  />
                  <span className="text-[11px] text-[#454652]">
                    I affirm that the uploaded Aadhaar contains my genuine physical signature and Punjab permanent address.
                  </span>
                </label>
              </div>

              {/* Document 2: College Fee Receipt */}
              <div className="p-4 bg-white border-2 border-dashed border-[#c6c5d4] rounded-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-xl">receipt_long</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1b1c1c]">Latest College / University Fee Receipt *</h4>
                      <p className="text-[11px] text-[#767683]">Proof of active admission for current term</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span> Attached
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#454652] mb-1">Fee Receipt / Voucher No.</label>
                    <input
                      type="text"
                      value={feeReceiptNo}
                      onChange={(e) => setFeeReceiptNo(e.target.value)}
                      placeholder="e.g. TIET-REC-2026-904"
                      className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#1b1c1c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#454652] mb-1">Attached PDF File</label>
                    <div className="flex items-center justify-between bg-[#fbf9f8] p-1.5 rounded-lg border border-[#c6c5d4]">
                      <span className="text-xs font-mono text-[#000666] truncate">{feeReceiptFileName}</span>
                      <label className="cursor-pointer bg-white border border-[#c6c5d4] text-[10px] font-semibold px-2 py-0.5 rounded transition">
                        Browse
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setFeeReceiptFileName(e.target.files[0].name);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RECHECK & VERIFICATION */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-green-700">fact_check</span>
                <span>Please carefully recheck all application parameters before proceeding to fee payment.</span>
              </div>

              <div className="bg-white border border-[#c6c5d4] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="border-b border-[#eae8e7] pb-2 flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-[#000666] uppercase tracking-wider">
                    Student Profile Verification
                  </h4>
                  <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                    Punjab Resident Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#767683] block">Student Name</span>
                    <span className="font-bold text-[#1b1c1c]">{userProfile.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#767683] block">Father's Name</span>
                    <span className="font-bold text-[#1b1c1c]">{userProfile.fatherName || 'S. Gurdeep Singh'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#767683] block">Roll Number</span>
                    <span className="font-bold font-mono text-[#1b1c1c]">{userProfile.rollNo || '102203418'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#767683] block">Aadhaar Number</span>
                    <span className="font-bold font-mono text-[#1b1c1c]">{userProfile.aadhaarNumber || '7842-XXXX-4821'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-[#767683] block">Permanent Address</span>
                    <span className="font-semibold text-[#1b1c1c]">{userProfile.permanentAddress || 'Patiala, Punjab'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#c6c5d4] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="border-b border-[#eae8e7] pb-2 flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-[#000666] uppercase tracking-wider">
                    Requested Transit Route & Concession
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-[#000666] font-bold px-2 py-0.5 rounded-full">
                    Student Concession • {passDuration}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#767683] block">Institution</span>
                    <span className="font-bold text-[#1b1c1c]">{collegeName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#767683] block">Course & Academic Term</span>
                    <span className="font-bold text-[#1b1c1c]">{course} ({academicYear} • {semester})</span>
                  </div>
                  <div className="sm:col-span-2 bg-[#fbf9f8] p-2.5 rounded-xl border border-[#c6c5d4]">
                    <span className="text-[10px] text-[#767683] block mb-0.5">Approved Transit Path</span>
                    <div className="flex items-center gap-2 font-bold text-xs text-[#000666]">
                      <span>{originStop}</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      <span>{destinationCampus}</span>
                      <span className="text-[11px] text-[#767683] font-normal">({distanceKm} KM)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#eae8e7] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-green-600">verified</span>
                    <span className="text-[#454652] text-[11px]">Documents Attached: {aadhaarFileName}, {feeReceiptFileName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ONLINE FEE PAYMENT */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Subsidy Calculation Breakdown */}
              <div className="bg-[#000666] text-white rounded-2xl p-4 sm:p-5 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#bdc2ff]">
                      Punjab Govt Student Welfare Subsidy
                    </span>
                    <h4 className="text-xl font-black mt-1">₹{studentPayable}.00</h4>
                    <p className="text-xs text-[#bdc2ff] mt-0.5">
                      Subsidized Concession Pass ({passDuration} Duration)
                    </p>
                  </div>
                  <div className="bg-green-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-sm">savings</span>
                    75% Govt Subsidy
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-white/70 block">Standard Fare</span>
                    <span className="line-through text-white/80 font-mono">₹{rawTotal}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/70 block">Govt Share</span>
                    <span className="text-green-300 font-bold font-mono">-₹{rawTotal - studentPayable}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/70 block">You Pay</span>
                    <span className="text-white font-black font-mono">₹{studentPayable}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-[#1b1c1c]">Select Instant Online Payment Method</label>

                {[
                  {
                    id: 'upi',
                    name: 'UPI / QR / Google Pay / PhonePe / Paytm',
                    desc: 'Zero transaction surcharge • Instant automated reconciliation',
                    icon: 'qr_code_scanner',
                  },
                  {
                    id: 'card',
                    name: 'Debit / Credit Card (RuPay / Visa / Master)',
                    desc: 'Direct payment gateway integration',
                    icon: 'credit_card',
                  },
                  {
                    id: 'netbanking',
                    name: 'Net Banking (SBI / PNB / HDFC / All Punjab Banks)',
                    desc: 'Direct institutional internet banking',
                    icon: 'account_balance',
                  },
                ].map((method) => (
                  <label
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition ${
                      paymentMethod === method.id
                        ? 'border-[#000666] bg-blue-50/50'
                        : 'border-[#c6c5d4] bg-white hover:border-[#000666]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id as any)}
                      className="text-[#000666] focus:ring-[#000666]"
                    />
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#c6c5d4] flex items-center justify-center text-[#000666]">
                      <span className="material-symbols-outlined text-lg">{method.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#1b1c1c]">{method.name}</p>
                      <p className="text-[11px] text-[#767683]">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#c6c5d4] flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-[#c6c5d4] text-xs font-bold text-[#454652] hover:bg-[#eae8e7] transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#c6c5d4] text-xs font-bold text-[#454652] hover:bg-[#eae8e7] transition"
            >
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-[#000666] text-white text-xs font-bold hover:bg-[#1a237e] transition shadow-md flex items-center gap-1.5"
            >
              Proceed to {currentStep === 1 ? 'Documents' : currentStep === 2 ? 'Recheck' : 'Payment'}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-[#138808] hover:bg-[#0f6806] text-white text-xs font-extrabold transition shadow-md flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing & Submitting Application...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Pay ₹{studentPayable} & Apply for Pass
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
