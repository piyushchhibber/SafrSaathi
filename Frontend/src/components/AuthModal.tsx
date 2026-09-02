import React, { useEffect, useState } from 'react';
import { UserRoleType, UserProfile, College } from '../types';
import { mockColleges } from '../data/mockData';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

interface AuthModalProps {
  initialRole?: UserRoleType;
  initialRoleType?: UserRoleType;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (profile: UserProfile, role?: UserRoleType) => void;
  onAuthSuccess?: (profile: UserProfile, role: UserRoleType) => void;
  colleges?: College[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialRole,
  initialRoleType,
  isOpen,
  onClose,
  onLoginSuccess,
  onAuthSuccess,
  colleges = mockColleges,
}) => {
  const defaultRole = initialRoleType || initialRole || 'student';
  const [activeTab, setActiveTab] = useState<UserRoleType>(defaultRole);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialRoleType || initialRole || 'student');
      setPunjabError(null);
    }
  }, [isOpen, initialRole, initialRoleType]);

  const fireSuccess = (profile: UserProfile, role: UserRoleType) => {
    if (onAuthSuccess) {
      onAuthSuccess(profile, role);
    }
    if (onLoginSuccess) {
      onLoginSuccess(profile, role);
    }
  };

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCollege, setStudentCollege] = useState(colleges[0]?.name || 'Punjab Engineering College (PEC)');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentFatherName, setStudentFatherName] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [studentAadhaar, setStudentAadhaar] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [punjabError, setPunjabError] = useState<string | null>(null);

  // OTP Verification State
  const [otpStep, setOtpStep] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRoleType>('student');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);

  // Corporate Form State
  const [corpCompanyName, setCorpCompanyName] = useState('');
  const [corpName, setCorpName] = useState('');
  const [corpEmail, setCorpEmail] = useState('');
  const [corpPhone, setCorpPhone] = useState('');
  const [corpPassword, setCorpPassword] = useState('');

  // Passenger Form State
  const [passName, setPassName] = useState('');
  const [passEmail, setPassEmail] = useState('');
  const [passPhone, setPassPhone] = useState('');
  const [passPassword, setPassPassword] = useState('');

  // College Admin Form State
  const [collegeSelected, setCollegeSelected] = useState(colleges[0]?.id || 'pec');
  const [collegeAdminEmail, setCollegeAdminEmail] = useState('');
  const [collegeAdminPhone, setCollegeAdminPhone] = useState('');
  const [collegeAdminPin, setCollegeAdminPin] = useState('');

  // PRTC Admin Form State
  const [prtcAdminId, setPrtcAdminId] = useState('');
  const [prtcAdminName, setPrtcAdminName] = useState('');
  const [prtcDepot, setPrtcDepot] = useState('Patiala Central HQ');
  const [prtcEmail, setPrtcEmail] = useState('');
  const [prtcPhone, setPrtcPhone] = useState('');
  const [prtcPassword, setPrtcPassword] = useState('');

  useEffect(() => {
    let timer: any;
    if (otpStep && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, resendTimer]);

  useEffect(() => {
    if (isOpen) {
      setOtpStep(false);
      setOtpDigits(['', '', '', '']);
      setOtpError(null);
    }
  }, [isOpen]);

  const triggerOtpVerification = (profile: UserProfile, role: UserRoleType, phone: string) => {
    setPendingProfile(profile);
    setPendingRole(role);
    setTargetPhone(phone || '+91 98145 67210');
    setOtpDigits(['', '', '', '']);
    setOtpError(null);
    setResendTimer(30);
    setOtpStep(true);
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = otpDigits.join('');
    if (entered === '0000') {
      setOtpError(null);
      if (pendingProfile && pendingRole) {
        try {
          const passwordByRole: Record<UserRoleType, string> = {
            student: studentPassword,
            corporate: corpPassword,
            passenger: passPassword,
            college_admin: collegeAdminPin,
            prtc_admin: prtcPassword,
          };
          const result = await api.authenticateProfile(
            pendingProfile,
            passwordByRole[pendingRole] || 'demo1234',
            isSignUp ? 'register' : 'login'
          );
          localStorage.setItem('prtc_access_token', result.accessToken);
          confetti({ particleCount: 70, spread: 60 });
          fireSuccess(result.profile, pendingRole);
          setOtpStep(false);
          onClose();
        } catch (err: any) {
          setOtpError(err?.message || 'Authentication failed.');
        }
      }
    } else {
      setOtpError('Invalid OTP! Please enter 0000 to verify.');
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto advance to next input
    if (digit && index < 3) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleAutoFillOtp = () => {
    setOtpDigits(['0', '0', '0', '0']);
    setOtpError(null);
  };

  if (!isOpen) return null;

  // Student Address Validation (Must be Punjab)
  const validatePunjabResidency = (address: string): boolean => {
    const lower = address.toLowerCase();
    const isPunjab = lower.includes('punjab') || 
      lower.includes('patiala') || 
      lower.includes('rajpura') || 
      lower.includes('chandigarh') || 
      lower.includes('mohali') || 
      lower.includes('ludhiana') || 
      lower.includes('amritsar') || 
      lower.includes('jalandhar') || 
      lower.includes('bathinda') || 
      lower.includes('hoshiarpur') || 
      lower.includes('firozpur') ||
      lower.includes('rupnagar') ||
      lower.includes('gurdaspur') ||
      lower.includes('sangrur');
    return isPunjab;
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPunjabError(null);

    if (isSignUp) {
      if (!validatePunjabResidency(studentAddress)) {
        setPunjabError(
          '❌ Not Eligible: Your permanent Aadhaar address is not in Punjab. Under Punjab Govt Student Concession Transport Policy, only verified Punjab permanent residents are eligible for subsidized passes.'
        );
        return;
      }

      if (studentAadhaar.replace(/\D/g, '').length !== 12) {
        setPunjabError('Please enter a valid 12-digit Aadhaar card number.');
        return;
      }

      const newProfile: UserProfile = {
        name: studentName,
        passId: `PRTC-STU-${Math.floor(1000 + Math.random() * 9000)}`,
        email: studentEmail,
        phone: studentPhone || '+91 98145 67210',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        roleType: 'student',
        institution: studentCollege,
        roleTitle: 'Student • Subsidized Concession Pass Holder',
        fatherName: studentFatherName,
        rollNo: studentRollNo,
        college: studentCollege,
        permanentAddress: studentAddress,
        isPunjabResident: true,
        aadhaarNumber: studentAadhaar,
      };

      triggerOtpVerification(newProfile, 'student', studentPhone || '+91 98145 67210');
    } else {
      // Default / Sign In
      const existing: UserProfile = {
        name: studentEmail.split('@')[0] ? studentEmail.split('@')[0].toUpperCase() : 'Navjot Singh Dhillon',
        passId: 'PRTC-STU-9942',
        email: studentEmail || 'navjot.dhillon@thapar.edu',
        phone: studentPhone || '+91 98145 67210',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        roleType: 'student',
        institution: 'Thapar Institute of Engg. & Technology',
        roleTitle: 'B.Tech Student • Subsidized Concession Holder',
        fatherName: 'S. Gurdeep Singh Dhillon',
        rollNo: '102203418',
        college: 'Thapar Institute of Engg. & Technology',
        permanentAddress: 'House 142, Street 3, Urban Estate Phase 2, Patiala, Punjab - 147002',
        isPunjabResident: true,
        aadhaarNumber: '7842-9910-4821',
      };
      triggerOtpVerification(existing, 'student', studentPhone || '+91 98145 67210');
    }
  };

  const handleCorporateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const corpProfile: UserProfile = {
      name: isSignUp ? corpName : 'Rohit Verma',
      passId: `CORP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: corpEmail || 'rohit.verma@infosys.com',
      phone: corpPhone || '+91 98722 34109',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      roleType: 'corporate',
      companyName: isSignUp ? corpCompanyName : 'Infosys Limited (Mohali Campus)',
      institution: isSignUp ? corpCompanyName : 'Infosys Limited',
      designation: 'Operations Lead',
      roleTitle: 'Corporate Commute Coordinator',
      corporateId: 'CORP-PB-091',
    };
    triggerOtpVerification(corpProfile, 'corporate', corpPhone || '+91 98722 34109');
  };

  const handlePassengerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const passProfile: UserProfile = {
      name: isSignUp ? passName : 'Priya Sharma',
      passId: `PRTC-COMM-${Math.floor(1000 + Math.random() * 9000)}`,
      email: passEmail || 'priya.sharma22@gmail.com',
      phone: passPhone || '+91 98881 23456',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      roleType: 'passenger',
      institution: 'Punjab State Transit Commuter',
      roleTitle: 'Regular Transit Passenger',
    };
    triggerOtpVerification(passProfile, 'passenger', passPhone || '+91 98881 23456');
  };

  const handleCollegeAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCollege = (colleges && colleges.find((c) => c.id === collegeSelected)) || colleges?.[0] || {
      id: 'pec',
      name: 'Punjab Engineering College (PEC)',
      adminName: 'Dr. S. Kapoor',
    };
    const clgProfile: UserProfile = {
      name: targetCollege?.adminName ? targetCollege.adminName.split('(')[0].trim() : 'Dr. S. Kapoor',
      passId: `${(targetCollege?.id || 'PEC').toUpperCase()}-ADMIN-01`,
      email: collegeAdminEmail || 'deansw@pec.edu.in',
      phone: collegeAdminPhone || '+91 98150 99881',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      roleType: 'college_admin',
      institution: targetCollege?.name || 'Punjab Engineering College (PEC)',
      collegeId: targetCollege?.id || 'pec',
      collegeName: targetCollege?.name || 'Punjab Engineering College (PEC)',
      roleTitle: 'College Attestation & Verification Officer',
      designationTitle: 'Dean / Authorized Signatory',
    };
    triggerOtpVerification(clgProfile, 'college_admin', collegeAdminPhone || '+91 98150 99881');
  };

  const handlePrtcAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prtcProfile: UserProfile = {
      name: isSignUp ? prtcAdminName : 'S. Gurmukh Singh',
      passId: prtcAdminId || 'PRTC-PAT-HQ-091',
      email: prtcEmail || 'g.singh@prtc.punjab.gov.in',
      phone: prtcPhone || '+91 98140 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      roleType: 'prtc_admin',
      institution: 'Pepsu Road Transport Corporation (Govt. of Punjab)',
      prtcAdminId: prtcAdminId || 'PRTC-HQ-091',
      depotZone: prtcDepot || 'Patiala HQ Central Depot',
      roleTitle: 'Chief Transport Inspector & Pass Sanctioning Authority',
    };
    triggerOtpVerification(prtcProfile, 'prtc_admin', prtcPhone || '+91 98140 11223');
  };

  const roleMeta = {
    student: {
      title: 'Student Portal',
      desc: 'Subsidized Concession Pass Login & Registration',
      icon: 'school',
      accent: 'border-[#1a237e]',
    },
    corporate: {
      title: 'Corporate Commute',
      desc: 'Bulk passes, staff routes & executive transit',
      icon: 'business_center',
      accent: 'border-[#000666]',
    },
    passenger: {
      title: 'Passenger Transit',
      desc: 'Quick direct tickets & 24hr city network travel',
      icon: 'person',
      accent: 'border-[#138808]',
    },
    college_admin: {
      title: 'College Admin Desk',
      desc: 'Institutional verification & virtual stamp attestation',
      icon: 'account_balance',
      accent: 'border-[#FF9933]',
    },
    prtc_admin: {
      title: 'PRTC State Authority',
      desc: 'Depot inspections, pass approvals & college audit',
      icon: 'admin_panel_settings',
      accent: 'border-[#000666]',
    },
  };

  const currentRoleMeta = roleMeta[activeTab] || roleMeta.student;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-[#000666] text-white p-5 sm:p-6 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white text-[#000666] flex items-center justify-center font-black text-base shadow-md">
                <span className="material-symbols-outlined text-2xl">{currentRoleMeta.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-xl leading-tight">
                    {currentRoleMeta.title}
                  </h3>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Official PRTC
                  </span>
                </div>
                <p className="text-xs text-[#bdc2ff] mt-0.5">{currentRoleMeta.desc}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* 5-Role Tab Switcher inside Modal */}
          <div className="grid grid-cols-5 gap-1.5 mt-5 bg-black/20 p-1.5 rounded-2xl backdrop-blur-xs">
            {[
              { id: 'student', label: 'Student', icon: 'school' },
              { id: 'corporate', label: 'Corporate', icon: 'business' },
              { id: 'passenger', label: 'Passenger', icon: 'person' },
              { id: 'college_admin', label: 'College', icon: 'account_balance' },
              { id: 'prtc_admin', label: 'PRTC', icon: 'shield_person' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as UserRoleType);
                  setPunjabError(null);
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#000666] shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body with Role-Specific Login & Sign-Up Forms */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#fbf9f8]">
          {otpStep ? (
            /* OTP Verification Screen */
            <div className="py-3 px-2 space-y-6 text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-[#000666] flex items-center justify-center mx-auto text-[#000666] shadow-sm">
                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                  SMS OTP Dispatched
                </div>
                <h3 className="font-extrabold text-xl text-[#1b1c1c]">Verify Mobile Number</h3>
                <p className="text-xs text-[#454652] mt-1 max-w-sm mx-auto leading-relaxed">
                  Enter the 4-digit mobile verification OTP sent via SMS to{' '}
                  <span className="font-bold text-[#000666] font-mono">{targetPhone}</span>
                </p>
              </div>

              {/* Dummy OTP Highlight Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-md mx-auto text-left flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-700 text-lg shrink-0 mt-0.5">key</span>
                  <div>
                    <span className="font-black text-amber-900 text-xs block">Demo OTP Access</span>
                    <span className="text-[11px] text-amber-800">
                      Use verification code: <strong className="font-mono text-sm text-[#000666] bg-amber-200/80 px-1.5 py-0.5 rounded font-black tracking-widest">0000</strong>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="px-3 py-1.5 bg-[#000666] text-white rounded-xl text-xs font-bold hover:bg-[#1a237e] transition shrink-0 shadow-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                  Enter 0000
                </button>
              </div>

              {/* 4 Digit OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-xs mx-auto">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      id={`otp-box-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpDigits[idx]}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-14 h-14 text-center text-2xl font-mono font-black rounded-2xl border-2 transition focus:outline-none ${
                        otpError
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : otpDigits[idx]
                          ? 'border-[#000666] bg-blue-50/50 text-[#000666]'
                          : 'border-[#c6c5d4] bg-white text-[#1b1c1c] focus:border-[#000666]'
                      }`}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center justify-center gap-1.5 animate-in shake">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {otpError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#000666] hover:bg-[#1a237e] text-white py-3.5 rounded-xl font-black text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  Verify OTP & Proceed
                </button>

                <div className="flex items-center justify-between text-xs text-[#767683] pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(false);
                      setOtpError(null);
                    }}
                    className="font-bold text-[#000666] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Change Details
                  </button>

                  {resendTimer > 0 ? (
                    <span className="text-[11px] font-mono text-[#767683]">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResendTimer(30);
                        setOtpError(null);
                        setOtpDigits(['', '', '', '']);
                      }}
                      className="font-bold text-[#000666] hover:underline text-[11px]"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Sign In vs Sign Up toggle for roles that support both */}
              {activeTab !== 'college_admin' && (
                <div className="flex border border-[#c6c5d4] p-1 rounded-xl bg-[#eae8e7] mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setPunjabError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      !isSignUp ? 'bg-white text-[#000666] shadow-xs' : 'text-[#454652]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setPunjabError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      isSignUp ? 'bg-white text-[#000666] shadow-xs' : 'text-[#454652]'
                    }`}
                  >
                    New Sign Up
                  </button>
                </div>
              )}

              {/* 1. STUDENT FORM */}
              {activeTab === 'student' && (
                <form onSubmit={handleStudentSubmit} className="space-y-4">
              {isSignUp ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-blue-700 mt-0.5">verified_user</span>
                    <div>
                      <p className="font-bold">Punjab Student Concession Eligibility Requirement</p>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Students must provide their permanent address as printed on Aadhaar Card. Concession applies strictly to verified Punjab residents.
                      </p>
                    </div>
                  </div>

                  {punjabError && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3.5 text-xs text-red-900 flex items-start gap-2 animate-in shake">
                      <span className="material-symbols-outlined text-base text-red-600 shrink-0">error</span>
                      <p className="font-semibold leading-relaxed">{punjabError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Full Name (as in Aadhaar)</label>
                      <input
                        type="text"
                        placeholder="e.g. Navjot Singh"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Father's Name</label>
                      <input
                        type="text"
                        placeholder="e.g. S. Gurdeep Singh"
                        value={studentFatherName}
                        onChange={(e) => setStudentFatherName(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">College / University</label>
                      <select
                        value={studentCollege}
                        onChange={(e) => setStudentCollege(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      >
                        {colleges.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">College Roll No. / Enrolment ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 102203418"
                        value={studentRollNo}
                        onChange={(e) => setStudentRollNo(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                      Permanent Address as in Aadhaar <span className="text-red-600">* (Must be in Punjab)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. House 142, Street 3, Urban Estate, Patiala, Punjab - 147002"
                      value={studentAddress}
                      onChange={(e) => {
                        setStudentAddress(e.target.value);
                        setPunjabError(null);
                      }}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Aadhaar Card Number (12 Digits)</label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="XXXX-XXXX-XXXX"
                        value={studentAadhaar}
                        onChange={(e) => setStudentAadhaar(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-mono text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Mobile Phone No.</label>
                      <input
                        type="tel"
                        placeholder="+91 98145 XXXXX"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="student@college.edu"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Create Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Student Sign In */
                <>
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                        Student Email / Pass ID / Roll Number
                      </label>
                      <input
                        type="text"
                        placeholder="navjot.dhillon@thapar.edu or PRTC-STU-9942"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      />
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                      <span className="font-bold">Quick Demo Access:</span> Pre-loaded with verified Thapar Institute student credentials. Click Sign In to access virtual pass & application tracker.
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-4"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                {isSignUp ? 'Register & Verify Student Account' : 'Sign In to Student Portal'}
              </button>
            </form>
          )}

          {/* 2. CORPORATE FORM */}
          {activeTab === 'corporate' && (
            <form onSubmit={handleCorporateSubmit} className="space-y-3.5">
              {isSignUp ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Company / Organization Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Infosys Ltd / Quark Media / TCS Mohali"
                      value={corpCompanyName}
                      onChange={(e) => setCorpCompanyName(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Corporate Representative Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rohit Verma"
                      value={corpName}
                      onChange={(e) => setCorpName(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Official Company Email</label>
                      <input
                        type="email"
                        placeholder="transport@company.com"
                        value={corpEmail}
                        onChange={(e) => setCorpEmail(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Official Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98722 XXXXX"
                        value={corpPhone}
                        onChange={(e) => setCorpPhone(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={corpPassword}
                      onChange={(e) => setCorpPassword(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Corporate Email / ID</label>
                    <input
                      type="text"
                      placeholder="rohit.verma@infosys.com or CORP-PB-INF-09"
                      value={corpEmail}
                      onChange={(e) => setCorpEmail(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={corpPassword}
                      onChange={(e) => setCorpPassword(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <span className="font-bold">Corporate Transit Access:</span> Pre-loaded with Infosys Mohali campus credentials. Access monthly pass allocation & virtual corporate badges.
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-4"
              >
                <span className="material-symbols-outlined text-sm">business</span>
                {isSignUp ? 'Create Corporate Account' : 'Sign In to Corporate Hub'}
              </button>
            </form>
          )}

          {/* 3. PASSENGER FORM */}
          {activeTab === 'passenger' && (
            <form onSubmit={handlePassengerSubmit} className="space-y-3.5">
              {isSignUp ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={passName}
                      onChange={(e) => setPassName(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="priya.sharma@gmail.com"
                        value={passEmail}
                        onChange={(e) => setPassEmail(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98881 XXXXX"
                        value={passPhone}
                        onChange={(e) => setPassPhone(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passPassword}
                      onChange={(e) => setPassPassword(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Mobile Number or Email</label>
                    <input
                      type="text"
                      placeholder="+91 98881 23456 or priya.sharma22@gmail.com"
                      value={passEmail}
                      onChange={(e) => setPassEmail(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passPassword}
                      onChange={(e) => setPassPassword(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-[#138808] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#0f6806] transition shadow-md flex items-center justify-center gap-2 mt-4"
              >
                <span className="material-symbols-outlined text-sm">confirmation_number</span>
                {isSignUp ? 'Register Commuter Account' : 'Sign In to Passenger Hub'}
              </button>
            </form>
          )}

          {/* 4. COLLEGE ADMIN FORM */}
          {activeTab === 'college_admin' && (
            <form onSubmit={handleCollegeAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Select College / Institution</label>
                <select
                  value={collegeSelected}
                  onChange={(e) => setCollegeSelected(e.target.value)}
                  className="w-full bg-white border-2 border-[#FF9933] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1b1c1c] focus:outline-none"
                  required
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.city} ({c.pendingCount} Pending Applications)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Institutional Admin Email / Faculty ID</label>
                <input
                  type="text"
                  placeholder="deansw@pec.edu.in or registrar@college.edu"
                  value={collegeAdminEmail}
                  onChange={(e) => setCollegeAdminEmail(e.target.value)}
                  className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Institutional Security PIN / Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={collegeAdminPin}
                  onChange={(e) => setCollegeAdminPin(e.target.value)}
                  className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-amber-700 shrink-0">verified</span>
                <div>
                  <p className="font-bold">Attestation Authority Access</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Authorizes college verification officers to inspect student Aadhaar + fee receipts and apply official digital college stamps.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-4"
              >
                <span className="material-symbols-outlined text-sm">account_balance</span>
                Sign In to College Approvals Desk
              </button>
            </form>
          )}

          {/* 5. PRTC ADMIN FORM */}
          {activeTab === 'prtc_admin' && (
            <form onSubmit={handlePrtcAdminSubmit} className="space-y-3.5">
              {isSignUp ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Official Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. S. Gurmukh Singh"
                        value={prtcAdminName}
                        onChange={(e) => setPrtcAdminName(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                        Unique PRTC Admin ID <span className="text-[#000666] font-mono">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PRTC-PAT-HQ-091"
                        value={prtcAdminId}
                        onChange={(e) => setPrtcAdminId(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-mono text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Depot / Regional Division</label>
                      <select
                        value={prtcDepot}
                        onChange={(e) => setPrtcDepot(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      >
                        <option value="Patiala Central HQ">Patiala Central HQ (Head Office)</option>
                        <option value="Chandigarh ISBT 43 Depot">Chandigarh ISBT 43 Depot</option>
                        <option value="Ludhiana Central Depot">Ludhiana Central Depot</option>
                        <option value="Amritsar GT Road Depot">Amritsar GT Road Depot</option>
                        <option value="Bathinda Cantt Depot">Bathinda Cantt Depot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Official Govt Email</label>
                      <input
                        type="email"
                        placeholder="officer@prtc.punjab.gov.in"
                        value={prtcEmail}
                        onChange={(e) => setPrtcEmail(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Security Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={prtcPassword}
                      onChange={(e) => setPrtcPassword(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                      Unique PRTC Admin ID <span className="text-xs text-[#767683] font-normal">(Required for state portal)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PRTC-PAT-HQ-091 or PRTC-DEPOT-CHD-04"
                      value={prtcAdminId}
                      onChange={(e) => setPrtcAdminId(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs font-mono text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Official Email / Username</label>
                    <input
                      type="text"
                      placeholder="g.singh@prtc.punjab.gov.in"
                      value={prtcEmail}
                      onChange={(e) => setPrtcEmail(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={prtcPassword}
                      onChange={(e) => setPrtcPassword(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <span className="font-bold">State Transport Sanctioning Authority:</span> Pre-loaded with Chief Transport Inspector credentials (PRTC HQ Patiala).
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-4"
              >
                <span className="material-symbols-outlined text-sm">security</span>
                {isSignUp ? 'Register PRTC State Admin' : 'Sign In with Unique Admin ID'}
              </button>
            </form>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
