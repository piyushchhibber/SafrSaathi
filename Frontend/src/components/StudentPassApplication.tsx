import React, { useState } from 'react';
import { PortalRole, StudentApplication } from '../types';
import confetti from 'canvas-confetti';

interface StudentPassApplicationProps {
  onApplicationSubmit: (newApp: StudentApplication) => void;
  onNavigateRole: (role: PortalRole) => void;
  onOpenPassModal: (passData: any) => void;
}

export const StudentPassApplication: React.FC<StudentPassApplicationProps> = ({
  onApplicationSubmit,
  onNavigateRole,
  onOpenPassModal,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(3); // Default to Step 3 as in screenshot!

  // Form State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: 'Aarav Kumar',
    dob: '2003-08-15',
    gender: 'Male',
    email: 'aarav.kumar@pec.edu.in',
    phone: '+91 98140 12345',
    college: 'Punjab Engineering College (PEC), Chandigarh',
    rollNumber: '21103045',
    course: 'B.Tech Computer Science & Engineering',
    semester: 'Semester 5 (2024-2025)',
  });

  const [addressInfo, setAddressInfo] = useState({
    addressLine: 'H.No 412, Sector 12-A',
    city: 'Chandigarh',
    district: 'Chandigarh / SAS Nagar',
    pincode: '160012',
    originDepot: 'ISBT Sector 43, Chandigarh',
    destinationDepot: 'Patiala Central Bus Stand',
    passCategory: 'Student AC' as 'Student AC' | 'Student Non-AC' | 'Student Express',
    validityMonths: '3 Months (Quarterly Pass / 90 Days)',
  });

  const [uploadedAadhaar, setUploadedAadhaar] = useState<{
    name: string;
    size: string;
  } | null>(null);

  const [uploadedReceipt, setUploadedReceipt] = useState<{
    name: string;
    size: string;
  } | null>({
    name: 'fee_receipt_sem3_2024.pdf',
    size: '1.2 MB',
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAadhaarUpload = (fileName: string, size: string) => {
    setUploadedAadhaar({ name: fileName, size });
  };

  const handleFileUploadSim = (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhaar' | 'receipt') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      if (type === 'aadhaar') {
        setUploadedAadhaar({ name: file.name, size: sizeMb });
      } else {
        setUploadedReceipt({ name: file.name, size: sizeMb });
      }
    }
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newApp: StudentApplication = {
        id: `app-${Date.now()}`,
        studentId: `PEC-2024-${Math.floor(100 + Math.random() * 900)}`,
        name: personalInfo.fullName,
        initials: personalInfo.fullName.split(' ').map(n => n[0]).join(''),
        collegeId: 'pec',
        collegeName: 'Punjab Engineering College',
        passType: addressInfo.passCategory,
        route: `${addressInfo.city} - ${addressInfo.destinationDepot.split(' ')[0]}`,
        status: 'approved',
        submittedDate: 'Today',
        collegeVerifiedBy: 'DR. S. KAPOOR (Verified Desk)',
        collegeVerifiedDate: 'Today',
        aadhaarNumber: 'XXXX-XXXX-4891',
        rollNumber: personalInfo.rollNumber,
        course: personalInfo.course,
        semester: personalInfo.semester,
        feeReceiptFile: uploadedReceipt?.name || 'fee_receipt.pdf',
        feeReceiptSize: uploadedReceipt?.size || '1.2 MB',
        aadhaarFile: uploadedAadhaar?.name || 'aadhaar_doc.pdf',
      };

      onApplicationSubmit(newApp);
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });

      onOpenPassModal({
        name: personalInfo.fullName,
        passId: newApp.studentId,
        passType: addressInfo.passCategory,
        route: `${addressInfo.originDepot} ↔ ${addressInfo.destinationDepot}`,
        college: personalInfo.college,
        validUntil: 'Active for 3 Months (90 Days)',
        concession: '75% State Student Concession',
        amount: addressInfo.passCategory === 'Student AC' ? '₹375 / 3 Months' : '₹225 / 3 Months',
      });
    }, 800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col">
      {/* Red/Rose Eligibility Notice as in Screenshot */}
      <div className="bg-[#ffdad6] border border-[#ffb4ab] text-[#93000a] p-4 rounded-2xl mb-8 flex items-start gap-3.5 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-[#ffb4ab] flex items-center justify-center shrink-0 text-[#93000a]">
          <span className="material-symbols-outlined text-lg">info</span>
        </div>
        <div>
          <h4 className="font-bold text-sm leading-tight text-[#93000a]">Eligibility Notice</h4>
          <p className="text-xs text-[#93000a] mt-0.5 leading-relaxed">
            Only Punjab residents enrolled in recognized state colleges and universities are eligible for this Student Concession Pass. Institutional attestation and Aadhaar verification will be performed automatically.
          </p>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1b1c1c] tracking-tight">
          Student Pass Application
        </h1>
        <p className="text-sm text-[#454652] mt-1">
          Complete the steps below to apply for your new academic session bus pass.
        </p>
      </div>

      {/* 4-Step Stepper Bar */}
      <div className="mb-10 relative">
        <div className="flex justify-between items-center relative z-10">
          {/* Step 1 */}
          <button
            onClick={() => setCurrentStep(1)}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
              currentStep > 1 
                ? 'bg-[#1a237e] text-white' 
                : currentStep === 1 
                  ? 'border-2 border-[#1a237e] bg-white text-[#1a237e]' 
                  : 'bg-[#eae8e7] text-[#454652]'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className={`text-xs mt-1.5 font-semibold ${
              currentStep === 1 ? 'text-[#000666] font-bold' : 'text-[#454652]'
            }`}>
              Personal
            </span>
          </button>

          {/* Line 1-2 */}
          <div className={`flex-1 h-1 mx-2 -mt-5 transition-colors ${
            currentStep >= 2 ? 'bg-[#1a237e]' : 'bg-[#eae8e7]'
          }`} />

          {/* Step 2 */}
          <button
            onClick={() => setCurrentStep(2)}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
              currentStep > 2 
                ? 'bg-[#1a237e] text-white' 
                : currentStep === 2 
                  ? 'border-2 border-[#1a237e] bg-white text-[#1a237e]' 
                  : 'bg-[#eae8e7] text-[#454652]'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span className={`text-xs mt-1.5 font-semibold ${
              currentStep === 2 ? 'text-[#000666] font-bold' : 'text-[#454652]'
            }`}>
              Address & Route
            </span>
          </button>

          {/* Line 2-3 */}
          <div className={`flex-1 h-1 mx-2 -mt-5 transition-colors ${
            currentStep >= 3 ? 'bg-[#1a237e]' : 'bg-[#eae8e7]'
          }`} />

          {/* Step 3 */}
          <button
            onClick={() => setCurrentStep(3)}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
              currentStep > 3 
                ? 'bg-[#1a237e] text-white' 
                : currentStep === 3 
                  ? 'border-2 border-[#1a237e] bg-white text-[#1a237e]' 
                  : 'bg-[#eae8e7] text-[#454652]'
            }`}>
              {currentStep > 3 ? '✓' : '3'}
            </div>
            <span className={`text-xs mt-1.5 font-semibold ${
              currentStep === 3 ? 'text-[#000666] font-bold' : 'text-[#454652]'
            }`}>
              Documents
            </span>
          </button>

          {/* Line 3-4 */}
          <div className={`flex-1 h-1 mx-2 -mt-5 transition-colors ${
            currentStep >= 4 ? 'bg-[#1a237e]' : 'bg-[#eae8e7]'
          }`} />

          {/* Step 4 */}
          <button
            onClick={() => setCurrentStep(4)}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
              currentStep === 4 
                ? 'border-2 border-[#1a237e] bg-white text-[#1a237e]' 
                : 'bg-[#eae8e7] text-[#454652]'
            }`}>
              4
            </div>
            <span className={`text-xs mt-1.5 font-semibold ${
              currentStep === 4 ? 'text-[#000666] font-bold' : 'text-[#454652]'
            }`}>
              Payment & Pass
            </span>
          </button>
        </div>
      </div>

      {/* STEP 1: Personal Details */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#c6c5d4] rounded-2xl p-6 md:p-8 shadow-sm mb-6 animate-in fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#000666]">person</span>
            <h2 className="text-xl font-bold text-[#1b1c1c]">Personal & College Information</h2>
          </div>
          <p className="text-xs text-[#454652] mb-6">
            Enter your academic registration details as recorded in your university records.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Full Name (As per Aadhaar)</label>
              <input
                type="text"
                value={personalInfo.fullName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">College / University</label>
              <input
                type="text"
                value={personalInfo.college}
                onChange={(e) => setPersonalInfo({ ...personalInfo, college: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">University Roll Number / Student ID</label>
              <input
                type="text"
                value={personalInfo.rollNumber}
                onChange={(e) => setPersonalInfo({ ...personalInfo, rollNumber: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Enrolled Course</label>
              <input
                type="text"
                value={personalInfo.course}
                onChange={(e) => setPersonalInfo({ ...personalInfo, course: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Phone Number (Linked to Aadhaar OTP)</label>
              <input
                type="text"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Academic Session & Semester</label>
              <input
                type="text"
                value={personalInfo.semester}
                onChange={(e) => setPersonalInfo({ ...personalInfo, semester: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Address & Route Selection */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#c6c5d4] rounded-2xl p-6 md:p-8 shadow-sm mb-6 animate-in fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#000666]">map</span>
            <h2 className="text-xl font-bold text-[#1b1c1c]">Residence Address & Transit Route</h2>
          </div>
          <p className="text-xs text-[#454652] mb-6">
            Specify your origin boarding station and destination college depot corridor.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Permanent Residential Address (Punjab)</label>
              <input
                type="text"
                value={addressInfo.addressLine}
                onChange={(e) => setAddressInfo({ ...addressInfo, addressLine: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">District / Region</label>
              <input
                type="text"
                value={addressInfo.district}
                onChange={(e) => setAddressInfo({ ...addressInfo, district: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Pin Code</label>
              <input
                type="text"
                value={addressInfo.pincode}
                onChange={(e) => setAddressInfo({ ...addressInfo, pincode: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Origin Bus Stand / Depot</label>
              <input
                type="text"
                value={addressInfo.originDepot}
                onChange={(e) => setAddressInfo({ ...addressInfo, originDepot: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Destination Campus Bus Stand</label>
              <input
                type="text"
                value={addressInfo.destinationDepot}
                onChange={(e) => setAddressInfo({ ...addressInfo, destinationDepot: e.target.value })}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Pass Category</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Student AC', 'Student Non-AC', 'Student Express'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAddressInfo({ ...addressInfo, passCategory: cat })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                      addressInfo.passCategory === cat
                        ? 'border-[#000666] bg-[#000666] text-white shadow-xs'
                        : 'border-[#c6c5d4] bg-[#fbf9f8] text-[#1b1c1c] hover:bg-[#f0eded]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Document Verification (Screen from screenshot Image 5) */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#c6c5d4] rounded-2xl p-6 md:p-8 shadow-sm mb-6 animate-in fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#000666]">description</span>
            <h2 className="text-xl font-bold text-[#1b1c1c]">Document Verification</h2>
          </div>
          <p className="text-xs text-[#454652] mb-6">
            Please upload clear, legible copies of the required documents. Max file size: 5MB per document.
          </p>

          {/* Aadhaar Card Box */}
          <div className="border border-[#c6c5d4] rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-[#1b1c1c] flex items-center gap-2">
                Aadhaar Card (Self-Attested)
                <span className="bg-[#ffdad6] text-[#93000a] text-[10px] font-bold px-2 py-0.5 rounded">
                  REQUIRED
                </span>
              </span>
              <span className="material-symbols-outlined text-[#767683]">badge</span>
            </div>
            <p className="text-xs text-[#454652] mb-4">
              Front and back copy with your signature. PDF or JPG formats only.
            </p>

            {uploadedAadhaar ? (
              <div className="bg-[#f5f3f3] border border-[#c6c5d4] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-700 text-3xl">verified</span>
                  <div>
                    <div className="text-xs font-bold text-[#1b1c1c]">{uploadedAadhaar.name}</div>
                    <div className="text-[11px] text-[#454652]">{uploadedAadhaar.size} • Ready for UIDAI Match</div>
                  </div>
                </div>
                <button
                  onClick={() => setUploadedAadhaar(null)}
                  className="text-red-700 hover:text-red-900"
                  title="Remove"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const f = e.dataTransfer.files[0];
                    handleAadhaarUpload(f.name, (f.size / 1024).toFixed(0) + ' KB');
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isDragging ? 'border-[#000666] bg-[#f0eded]' : 'border-[#c6c5d4] hover:bg-[#f5f3f3]'
                }`}
                onClick={() => document.getElementById('aadhaar-input')?.click()}
              >
                <input
                  id="aadhaar-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUploadSim(e, 'aadhaar')}
                />
                <span className="material-symbols-outlined text-4xl text-[#1a237e] mb-2">cloud_upload</span>
                <span className="text-sm font-semibold text-[#1b1c1c]">Click to upload or drag and drop</span>
                <span className="text-xs text-[#767683] mt-1">SVG, PNG, JPG or PDF (max. 800×400px)</span>
              </div>
            )}
          </div>

          {/* Current Semester Fee Receipt Box */}
          <div className="border border-[#c6c5d4] rounded-xl p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-[#1b1c1c] flex items-center gap-2">
                Current Semester Fee Receipt
                <span className="bg-[#ffdad6] text-[#93000a] text-[10px] font-bold px-2 py-0.5 rounded">
                  REQUIRED
                </span>
              </span>
              <span className="material-symbols-outlined text-[#767683]">receipt_long</span>
            </div>
            <p className="text-xs text-[#454652] mb-4">
              Official college receipt showing payment for the current academic session.
            </p>

            {uploadedReceipt ? (
              <div className="bg-[#f5f3f3] border border-[#c6c5d4] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-600 text-3xl">picture_as_pdf</span>
                  <div>
                    <div className="text-xs font-bold text-[#1b1c1c]">{uploadedReceipt.name}</div>
                    <div className="text-[11px] text-[#454652]">{uploadedReceipt.size} • Uploaded just now</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-700 font-bold text-sm">✓</span>
                  <button
                    onClick={() => setUploadedReceipt(null)}
                    className="text-red-700 hover:text-red-900"
                    title="Remove file"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-[#c6c5d4] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f5f3f3] transition"
                onClick={() => document.getElementById('receipt-input')?.click()}
              >
                <input
                  id="receipt-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUploadSim(e, 'receipt')}
                />
                <span className="material-symbols-outlined text-4xl text-[#1a237e] mb-2">cloud_upload</span>
                <span className="text-sm font-semibold text-[#1b1c1c]">Click to upload Fee Receipt</span>
                <span className="text-xs text-[#767683] mt-1">PDF or JPG (max. 5MB)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Payment & Concession Summary */}
      {currentStep === 4 && (
        <div className="bg-white border border-[#c6c5d4] rounded-2xl p-6 md:p-8 shadow-sm mb-6 animate-in fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#000666]">payments</span>
            <h2 className="text-xl font-bold text-[#1b1c1c]">Concession Summary & Pass Issuance</h2>
          </div>
          <p className="text-xs text-[#454652] mb-6">
            Review the subsidized student rate sponsored by the Government of Punjab.
          </p>

          <div className="bg-[#f5f3f3] border border-[#c6c5d4] rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center pb-3 border-b border-[#c6c5d4] text-xs">
              <span className="text-[#454652]">Standard 3-Month Fare (Normal Public Rate):</span>
              <span className="line-through text-[#767683]">₹1,500.00</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#c6c5d4] text-xs">
              <span className="text-green-800 font-bold">Punjab Govt 75% Student Subsidy:</span>
              <span className="text-green-800 font-bold">- ₹1,125.00</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <div>
                <span className="text-sm font-bold text-[#1b1c1c]">Net Payable Pass Fee:</span>
                <span className="block text-[11px] text-[#454652]">Valid for unlimited campus commute for 3 Months (Quarterly)</span>
              </div>
              <span className="text-2xl font-black text-[#000666]">₹375.00</span>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="block text-xs font-bold text-[#1b1c1c]">Payment Mode</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="border-2 border-[#000666] bg-[#fbf9f8] p-3 rounded-xl flex items-center gap-2 text-xs font-bold text-[#000666]">
                <span className="material-symbols-outlined">qr_code_2</span> UPI / QR Pay
              </div>
              <div className="border border-[#c6c5d4] bg-white p-3 rounded-xl flex items-center gap-2 text-xs font-medium text-[#454652]">
                <span className="material-symbols-outlined">credit_card</span> Debit / NetBanking
              </div>
              <div className="border border-[#c6c5d4] bg-white p-3 rounded-xl flex items-center gap-2 text-xs font-medium text-[#454652]">
                <span className="material-symbols-outlined">account_balance_wallet</span> Campus Wallet
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Actions */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => {
            if (currentStep > 1) setCurrentStep(currentStep - 1);
            else onNavigateRole('gateway');
          }}
          className="border border-[#c6c5d4] px-6 py-2.5 rounded-xl text-xs font-bold text-[#1b1c1c] hover:bg-[#eae8e7] transition shadow-xs"
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>

        {currentStep < 4 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="bg-[#000666] text-white px-8 py-2.5 rounded-xl text-xs font-bold hover:bg-[#1a237e] transition shadow-sm flex items-center gap-2"
          >
            Save & Continue
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="bg-[#138808] text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-[#006400] transition shadow-md flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Issuing Pass...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">verified</span>
                Pay & Generate Digital Pass
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
