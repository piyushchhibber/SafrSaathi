import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserRoleType, UserProfile, College } from '../types';
import { mockColleges } from '../data/mockData';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { getStoredUsers, saveStoredUsers, RegisteredUserRecord } from '../utils/storage';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt?: (momentListener?: (notification: any) => void) => void;
        };
      };
    };
  }
}

// Dev mock Google credential creator for local zero-config testing
const createDevGoogleCredential = (name: string, email: string, picture: string): string => {
  const b64 = (obj: any) => {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch {
      return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  };
  const header = b64({ alg: 'none', typ: 'JWT' });
  const payload = b64({
    email,
    name,
    picture,
    email_verified: true,
    sub: 'google-dev-' + Date.now(),
    iss: 'https://accounts.google.com',
    aud: 'safrsathi-dev-client-id',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  return `${header}.${payload}.dev_signature`;
};

const formatAadhaar = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
};

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
  const { t } = useTranslation();
  const defaultRole = initialRoleType || initialRole || 'student';
  const [activeTab, setActiveTab] = useState<UserRoleType>(defaultRole);
  const [isSignUp, setIsSignUp] = useState(false);

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCollege, setStudentCollege] = useState(colleges[0]?.name || 'Chandigarh Engineering College-CGC Landran');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentFatherName, setStudentFatherName] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [studentAadhaar, setStudentAadhaar] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentDob, setStudentDob] = useState('2004-05-15');
  const [studentGender, setStudentGender] = useState('Male');
  const [punjabError, setPunjabError] = useState<string | null>(null);

  // 1. Google 3-Stage Onboarding State (section 5.4)
  const [signupToken, setSignupToken] = useState<string>('');
  const [onboardStep, setOnboardStep] = useState<number>(0); // 0 = off, 1 to 3
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [photoChoice, setPhotoChoice] = useState<'google' | 'upload'>('google');
  const [uploadedPhoto, setUploadedPhoto] = useState<string>('');
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Dev Account Chooser for testing without Google Client ID
  const [showDevAccountPicker, setShowDevAccountPicker] = useState(false);
  const [customTestEmail, setCustomTestEmail] = useState('');

  // OTP Verification State (for manual email/password registration)
  const [otpStep, setOtpStep] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRoleType>('student');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleInitializedRef = useRef(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

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

  // 5. Reset signupToken and onboardStep when the modal closes (section 5.4)
  const handleModalClose = () => {
    setSignupToken('');
    setOnboardStep(0);
    setAvatarPreview('');
    setUploadedPhoto('');
    setPhotoChoice('google');
    setOnboardError(null);
    setShowDevAccountPicker(false);
    setOtpStep(false);
    setOtpError(null);
    setPunjabError(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const targetRole = initialRoleType || initialRole || 'student';
      setActiveTab(targetRole);
      setIsSignUp(false);
      setOtpStep(false);
      setSignupToken('');
      setOnboardStep(0);
      setAvatarPreview('');
      setUploadedPhoto('');
      setPhotoChoice('google');
      setOnboardError(null);
      setShowDevAccountPicker(false);
      setOtpError(null);
      setPunjabError(null);

      if (targetRole === 'conductor') {
        setPrtcAdminId('PRTC-CRW-221');
        setPrtcEmail('harpreet.singh@prtc.punjab.gov.in');
        setPrtcPassword('password123');
      } else if (targetRole === 'prtc_admin') {
        setPrtcAdminId('PRTC-PAT-HQ-091');
        setPrtcEmail('g.singh@prtc.punjab.gov.in');
        setPrtcPassword('password123');
      }
    }
  }, [isOpen, initialRole, initialRoleType]);

  useEffect(() => {
    let timer: any;
    if (otpStep && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, resendTimer]);

  const fireSuccess = (profile: UserProfile, role: UserRoleType) => {
    if (onAuthSuccess) {
      onAuthSuccess(profile, role);
    }
    if (onLoginSuccess) {
      onLoginSuccess(profile, role);
    }
  };

  // Student Address Validation: same PIN / 'punjab' rule as backend (section 4.2)
  const validatePunjabResidency = (address: string): boolean => {
    if (!address) return false;
    const match = address.match(/\b(\d{6})\b/);
    if (match) {
      const pin = parseInt(match[1], 10);
      return (pin >= 140001 && pin <= 152999) || (pin >= 160001 && pin <= 160104);
    }
    return address.toLowerCase().includes('punjab');
  };

  const triggerOtpVerification = (profile: UserProfile, role: UserRoleType, phone: string) => {
    setPendingProfile(profile);
    setPendingRole(role);
    setTargetPhone(phone || '+91 98145 67210');
    setOtpDigits(['', '', '', '']);
    setOtpError(null);
    setResendTimer(30);
    setOtpStep(true);
  };

  // 2. Replace handleGoogleCredential (section 5.4)
  const handleGoogleCredential = async (response: { credential: string }) => {
    try {
      setOtpError(null);
      setPunjabError(null);
      setOnboardError(null);
      const result = await api.authenticateGoogle(response.credential, activeTab);
      if (result.needsOnboarding) {
        setSignupToken(result.signupToken);
        setStudentName(result.prefill.name || '');
        setStudentEmail(result.prefill.email); // render read-only
        setAvatarPreview(result.prefill.avatarUrl || '');
        setOnboardStep(1);
        return;
      }
      const auth = result as { profile: UserProfile; accessToken: string };
      localStorage.setItem('prtc_access_token', auth.accessToken);
      fireSuccess(auth.profile, activeTab);
      handleModalClose();
    } catch (err: any) {
      setOtpError(err?.message || 'Google Sign-In failed');
    }
  };

  // 4. Change Google-button effect condition to !otpStep && !signupToken (section 5.4)
  useEffect(() => {
    if (!isOpen || otpStep || signupToken || !googleClientId || !googleButtonRef.current || !window.google?.accounts?.id) return;
    googleButtonRef.current.innerHTML = '';
    if (!googleInitializedRef.current) {
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
      googleInitializedRef.current = true;
    }
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 360,
      text: isSignUp ? 'signup_with' : 'signin_with',
    });
  }, [isOpen, otpStep, signupToken, activeTab, isSignUp, googleClientId]);

  // Dev testing helper for Google sign in when VITE_GOOGLE_CLIENT_ID is not configured
  const triggerDevGoogleAuth = (email: string, name?: string, picture?: string) => {
    setShowDevAccountPicker(false);
    const token = createDevGoogleCredential(
      name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)),
      email,
      picture || avatarPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    );
    handleGoogleCredential({ credential: token });
  };

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Stage 1 -> Stage 2 transition validation
  const handleStage1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError(null);
    if (!studentName.trim()) {
      setOnboardError('Please enter your full student name.');
      return;
    }
    if (!studentDob) {
      setOnboardError('Please provide your date of birth.');
      return;
    }
    if (!studentPhone.trim() || studentPhone.replace(/\D/g, '').length < 10) {
      setOnboardError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!studentRollNo.trim()) {
      setOnboardError('Please enter your college roll number.');
      return;
    }
    const cleanAadhaar = studentAadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      setOnboardError('Enter a valid 12-digit Aadhaar number.');
      return;
    }
    setOnboardStep(2);
  };

  // Stage 2 -> Stage 3 transition validation
  const handleStage2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError(null);
    if (!validatePunjabResidency(studentAddress)) {
      setOnboardError('You are not eligible: a permanent Punjab address is required.');
      return;
    }
    setOnboardStep(3);
  };

  // Stage 3: Complete registration and issue pass
  const handleCompleteGoogleSignup = async () => {
    setIsCompleting(true);
    setOnboardError(null);
    try {
      const finalAvatar =
        photoChoice === 'upload' && uploadedPhoto
          ? uploadedPhoto
          : avatarPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

      const profile: Partial<UserProfile> = {
        name: studentName.trim(),
        email: studentEmail.trim().toLowerCase(),
        phone: studentPhone.trim(),
        dateOfBirth: studentDob,
        dob: studentDob,
        gender: studentGender,
        college: studentCollege,
        institution: studentCollege,
        rollNo: studentRollNo.trim(),
        aadhaarNumber: studentAadhaar.replace(/\D/g, ''),
        permanentAddress: studentAddress.trim(),
        avatarUrl: finalAvatar,
        roleTitle: 'Student • Subsidized Concession Pass Holder',
        isPunjabResident: true,
      };

      const result = await api.completeGoogleSignup(signupToken, profile);
      localStorage.setItem('prtc_access_token', result.accessToken);
      fireSuccess(result.profile, 'student');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      handleModalClose();
    } catch (err: any) {
      setOnboardError(err?.message || 'Failed to complete registration');
    } finally {
      setIsCompleting(false);
    }
  };

  // Manual Form Handlers
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPunjabError(null);
    if (isSignUp) {
      if (!validatePunjabResidency(studentAddress)) {
        setPunjabError('You are not eligible: a permanent Punjab address is required (PIN 140001-152999).');
        return;
      }
      const newProfile: UserProfile = {
        name: studentName,
        passId: `PRTC-STU-${Math.floor(100 + Math.random() * 900)}`,
        email: studentEmail,
        phone: studentPhone,
        college: studentCollege,
        institution: studentCollege,
        rollNo: studentRollNo,
        fatherName: studentFatherName,
        permanentAddress: studentAddress,
        aadhaarNumber: studentAadhaar ? `XXXX-XXXX-${studentAadhaar.replace(/\D/g, '').slice(-4)}` : '',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        roleType: 'student',
        roleTitle: 'Student • Subsidized Concession Pass Holder',
        isPunjabResident: true,
      };
      triggerOtpVerification(newProfile, 'student', studentPhone);
    } else {
      const existingProfile: UserProfile = {
        name: 'Prakash',
        passId: 'PRTC-STU-887',
        email: studentEmail || 'prakash@gmail.com',
        phone: '+91 98142 88712',
        college: 'Chandigarh Engineering College-CGC Landran',
        institution: 'Chandigarh Engineering College-CGC Landran',
        rollNo: '887',
        fatherName: 'R. Prakash',
        permanentAddress: 'Kharar Road, Mohali, Punjab',
        aadhaarNumber: 'XXXX-XXXX-6666',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        roleType: 'student',
        roleTitle: 'Student • Subsidized Concession Pass Holder',
        isPunjabResident: true,
      };
      triggerOtpVerification(existingProfile, 'student', '+91 98142 88712');
    }
  };

  const handleCorporateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const cleanName = corpName.trim() || 'Corporate Commuter';
      const cleanCompany = corpCompanyName.trim() || 'Infosys Limited';
      const cleanEmail = corpEmail.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '')}@infosys.com`;
      const cleanPhone = corpPhone.trim() || '+91 98722 44100';
      const newCorpId = `CORP-${Math.floor(1000 + Math.random() * 9000)}`;

      const corpProfile: UserProfile = {
        name: cleanName,
        passId: `PRTC-CORP-${Math.floor(1000 + Math.random() * 9000)}`,
        email: cleanEmail,
        phone: cleanPhone,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
        roleType: 'corporate',
        institution: `${cleanCompany} (Mohali IT Park)`,
        companyName: cleanCompany,
        corporateId: newCorpId,
        roleTitle: 'Corporate Commute Member',
      };

      try {
        const storedUsers = getStoredUsers();
        const existingIdx = storedUsers.findIndex(
          (u) =>
            u.roleType === 'corporate' &&
            (u.email.toLowerCase() === cleanEmail.toLowerCase() ||
             u.name.toLowerCase() === cleanName.toLowerCase())
        );
        const record: RegisteredUserRecord = {
          id: `usr-corp-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          roleType: 'corporate',
          institution: cleanCompany,
          companyName: cleanCompany,
          registeredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          lastLoginAt: 'Just now',
          avatarUrl: corpProfile.avatarUrl,
          passId: corpProfile.passId,
          corporateId: newCorpId,
        };
        if (existingIdx >= 0) {
          storedUsers[existingIdx] = { ...storedUsers[existingIdx], ...record };
        } else {
          storedUsers.push(record);
        }
        saveStoredUsers(storedUsers);
      } catch (err) {
        console.warn('Could not save corporate user', err);
      }

      triggerOtpVerification(corpProfile, 'corporate', cleanPhone);
    } else {
      // Sign In mode
      const cleanIdent = (corpEmail || '').trim();
      const storedUsers = getStoredUsers();
      const matched = storedUsers.find(
        (u) =>
          u.roleType === 'corporate' &&
          cleanIdent &&
          (u.email.toLowerCase() === cleanIdent.toLowerCase() ||
           u.name.toLowerCase() === cleanIdent.toLowerCase() ||
           (u.passId && u.passId.toLowerCase() === cleanIdent.toLowerCase()) ||
           (u.id && u.id.toLowerCase() === cleanIdent.toLowerCase()))
      );

      let corpProfile: UserProfile;

      if (matched) {
        corpProfile = {
          name: matched.name,
          passId: matched.passId || `PRTC-CORP-${matched.id.slice(-4)}`,
          email: matched.email,
          phone: matched.phone || '+91 98722 44100',
          avatarUrl: matched.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(matched.name)}`,
          roleType: 'corporate',
          institution: matched.institution || 'Infosys Limited',
          companyName: matched.companyName || matched.institution || 'Infosys Limited',
          corporateId: matched.corporateId || `CORP-${matched.id.slice(-4)}`,
          roleTitle: 'Corporate Commute Member',
        };
      } else if (!cleanIdent || cleanIdent.toLowerCase().includes('vikram') || cleanIdent.toLowerCase().includes('commute@infosys')) {
        // Pre-configured Demo Profile: Vikram Malhotra
        corpProfile = {
          name: 'Vikram Malhotra',
          passId: 'PRTC-CORP-402',
          email: 'commute@infosys.com',
          phone: '+91 98722 44100',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          roleType: 'corporate',
          institution: 'Infosys Ltd (Mohali IT Park)',
          companyName: 'Infosys Ltd',
          corporateId: 'CORP-PB-091',
          roleTitle: 'Corporate Transit Program Admin',
        };
      } else {
        // User typed a specific commuter name or email (e.g. "Bheem" or "bheem@...")
        const rawName = cleanIdent.includes('@') ? cleanIdent.split('@')[0] : cleanIdent;
        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        const newCorpId = `CORP-${Math.floor(1000 + Math.random() * 9000)}`;

        corpProfile = {
          name: displayName,
          passId: `PRTC-CORP-${Math.floor(1000 + Math.random() * 9000)}`,
          email: cleanIdent.includes('@') ? cleanIdent : `${cleanIdent.toLowerCase()}@infosys.com`,
          phone: '+91 98722 44100',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
          roleType: 'corporate',
          institution: 'Infosys Limited',
          companyName: 'Infosys Limited',
          corporateId: newCorpId,
          roleTitle: 'Corporate Transit Commuter',
        };

        try {
          storedUsers.push({
            id: `usr-corp-${Date.now()}`,
            name: displayName,
            email: corpProfile.email,
            phone: corpProfile.phone,
            roleType: 'corporate',
            institution: 'Infosys Limited',
            companyName: 'Infosys Limited',
            registeredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            lastLoginAt: 'Just now',
            avatarUrl: corpProfile.avatarUrl,
            passId: corpProfile.passId,
            corporateId: newCorpId,
          });
          saveStoredUsers(storedUsers);
        } catch {}
      }

      triggerOtpVerification(corpProfile, 'corporate', corpProfile.phone || '+91 98722 44100');
    }
  };

  const handlePassengerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const cleanName = passName.trim() || 'Passenger Commuter';
      const cleanEmail = passEmail.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
      const cleanPhone = passPhone.trim() || '+91 98881 22334';
      const passProfile: UserProfile = {
        name: cleanName,
        passId: `PRTC-PASS-${Math.floor(100 + Math.random() * 900)}`,
        email: cleanEmail,
        phone: cleanPhone,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
        roleType: 'passenger',
        institution: 'Direct PRTC Daily Commuter',
        roleTitle: 'Daily Commuter Pass Holder',
      };
      try {
        const storedUsers = getStoredUsers();
        storedUsers.push({
          id: `usr-pass-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          roleType: 'passenger',
          registeredAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          lastLoginAt: 'Just now',
          avatarUrl: passProfile.avatarUrl,
        });
        saveStoredUsers(storedUsers);
      } catch {}
      triggerOtpVerification(passProfile, 'passenger', cleanPhone);
    } else {
      const cleanIdent = (passEmail || '').trim();
      const storedUsers = getStoredUsers();
      const matched = storedUsers.find(
        (u) =>
          u.roleType === 'passenger' &&
          cleanIdent &&
          (u.email.toLowerCase() === cleanIdent.toLowerCase() ||
           u.name.toLowerCase() === cleanIdent.toLowerCase() ||
           u.id.toLowerCase() === cleanIdent.toLowerCase())
      );

      let passProfile: UserProfile;
      if (matched) {
        passProfile = {
          name: matched.name,
          passId: matched.passId || `PRTC-PASS-${matched.id.slice(-4)}`,
          email: matched.email,
          phone: matched.phone || '+91 98881 22334',
          avatarUrl: matched.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(matched.name)}`,
          roleType: 'passenger',
          institution: 'Direct PRTC Daily Commuter',
          roleTitle: 'Daily Commuter Pass Holder',
        };
      } else if (!cleanIdent || cleanIdent.toLowerCase().includes('priya') || cleanIdent.toLowerCase().includes('gurpreet')) {
        passProfile = {
          name: 'Priya Sharma',
          passId: 'PRTC-PASS-091',
          email: 'priya.sharma@gmail.com',
          phone: '+91 98881 22334',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
          roleType: 'passenger',
          institution: 'Direct PRTC Daily Commuter',
          roleTitle: 'Daily Commuter Pass Holder',
        };
      } else {
        const rawName = cleanIdent.includes('@') ? cleanIdent.split('@')[0] : cleanIdent;
        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        passProfile = {
          name: displayName,
          passId: `PRTC-PASS-${Math.floor(100 + Math.random() * 900)}`,
          email: cleanIdent.includes('@') ? cleanIdent : `${cleanIdent.toLowerCase()}@gmail.com`,
          phone: '+91 98881 22334',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
          roleType: 'passenger',
          institution: 'Direct PRTC Daily Commuter',
          roleTitle: 'Daily Commuter Pass Holder',
        };
      }
      triggerOtpVerification(passProfile, 'passenger', passProfile.phone || '+91 98881 22334');
    }
  };

  const handleCollegeAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selCollege = colleges.find((c) => c.id === collegeSelected) || colleges[0];
    const collegeProfile: UserProfile = {
      name: 'Dr. D. Sharma',
      passId: 'PRTC-CLG-881',
      email: collegeAdminEmail || 'admin.academics@cgc.edu.in',
      phone: collegeAdminPhone || '+91 98141 55667',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      roleType: 'college_admin',
      institution: selCollege?.name || 'Chandigarh Engineering College-CGC Landran',
      adminId: selCollege?.id?.toUpperCase() || 'CEC-CGC',
      collegeId: selCollege?.id || 'ccet',
      collegeName: selCollege?.name || 'Chandigarh Engineering College-CGC Landran',
      roleTitle: 'Dean of Student Welfare & Verification Head',
    };
    triggerOtpVerification(collegeProfile, 'college_admin', collegeAdminPhone || '+91 98141 55667');
  };

  const handlePrtcAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isConductor = activeTab === 'conductor';
    const prtcProfile: UserProfile = {
      name: isSignUp ? prtcAdminName : (isConductor ? 'Harpreet Singh' : 'S. Gurmukh Singh'),
      passId: prtcAdminId.trim() || (isConductor ? 'PRTC-CRW-221' : 'PRTC-PAT-HQ-091'),
      email: prtcEmail.trim() || (isConductor ? 'harpreet.singh@prtc.punjab.gov.in' : 'g.singh@prtc.punjab.gov.in'),
      phone: prtcPhone || '+91 98140 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      roleType: isConductor ? 'conductor' : 'prtc_admin',
      institution: 'Pepsu Road Transport Corporation (Govt. of Punjab)',
      prtcAdminId: prtcAdminId.trim() || (isConductor ? 'PRTC-CRW-221' : 'PRTC-PAT-HQ-091'),
      depotZone: prtcDepot || 'Patiala Central HQ',
      roleTitle: isConductor ? 'PRTC Bus Conductor • Digital Pass Verification' : 'Chief Transport Inspector & Pass Sanctioning Authority',
    };
    triggerOtpVerification(prtcProfile, isConductor ? 'conductor' : 'prtc_admin', prtcPhone || '+91 98140 11223');
  };

  const handleInstantConductorLogin = async () => {
    const conductorProfile: UserProfile = {
      name: 'Harpreet Singh',
      passId: 'PRTC-CRW-221',
      email: 'harpreet.singh@prtc.punjab.gov.in',
      phone: '+91 98140 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      roleType: 'conductor',
      institution: 'Pepsu Road Transport Corporation (Govt. of Punjab)',
      prtcAdminId: 'PRTC-CRW-221',
      depotZone: 'Patiala Central HQ',
      roleTitle: 'PRTC Bus Conductor • Digital Pass Verification',
    };
    try {
      const authRes = await api.authenticateProfile(conductorProfile, 'password123', 'login');
      localStorage.setItem('prtc_access_token', authRes.accessToken);
      fireSuccess(authRes.profile, 'conductor');
    } catch {
      fireSuccess(conductorProfile, 'conductor');
    }
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    handleModalClose();
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);
    setOtpError(null);

    if (val && index < 3) {
      const nextInput = document.getElementById(`modal-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`modal-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const entered = otpDigits.join('');
    if (entered.length < 4) {
      setOtpError('Please enter the complete 4-digit verification code.');
      return;
    }
    if (entered !== '0000' && entered !== '1234') {
      setOtpError('Invalid OTP code. For demo evaluation, use code 0000 or 1234.');
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      if (pendingProfile) {
        const mode = isSignUp ? 'register' : 'login';
        const passwordToUse =
          pendingRole === 'student' ? studentPassword :
          pendingRole === 'corporate' ? corpPassword :
          pendingRole === 'passenger' ? passPassword :
          pendingRole === 'college_admin' ? collegeAdminPin :
          prtcPassword;

        try {
          const authRes = await api.authenticateProfile(pendingProfile, passwordToUse || 'demo1234', mode);
          localStorage.setItem('prtc_access_token', authRes.accessToken);
          fireSuccess(authRes.profile, pendingRole);
        } catch {
          fireSuccess(pendingProfile, pendingRole);
        }

        confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
        handleModalClose();
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
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
    conductor: {
      title: 'Crew Scanner',
      desc: 'Onboard student pass verification & boarding control',
      icon: 'qr_code_scanner',
      accent: 'border-[#138808]',
    },
  };

  const currentRoleMeta = roleMeta[activeTab] || roleMeta.student;

  if (!isOpen) return null;

  const currentDisplayPhoto =
    photoChoice === 'upload' && uploadedPhoto
      ? uploadedPhoto
      : avatarPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-[#000666] text-white p-5 sm:p-6 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white text-[#000666] flex items-center justify-center font-black text-base shadow-md">
                <span className="material-symbols-outlined text-2xl">
                  {signupToken ? 'school' : currentRoleMeta.icon}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-xl leading-tight">
                    {signupToken ? 'Student Onboarding' : currentRoleMeta.title}
                  </h3>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {signupToken ? 'Google Verified' : 'Official PRTC'}
                  </span>
                </div>
                <p className="text-xs text-[#bdc2ff] mt-0.5">
                  {signupToken
                    ? 'Complete the 3-stage profile before your student pass is issued'
                    : currentRoleMeta.desc}
                </p>
              </div>
            </div>
            <button
              onClick={handleModalClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Stepper Progress Bar shown during Google Student Onboarding */}
          {signupToken ? (
            <div className="mt-4 pt-3 border-t border-white/15">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <div className={`flex items-center gap-1.5 ${onboardStep >= 1 ? 'text-white' : 'text-white/50'}`}>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                      onboardStep >= 1 ? 'bg-amber-400 text-[#000666]' : 'bg-white/20 text-white'
                    }`}
                  >
                    1
                  </span>
                  <span className="text-[11px] sm:text-xs">{t('auth.onboardingStep1', 'Personal Details')}</span>
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${onboardStep >= 2 ? 'bg-amber-400' : 'bg-white/20'}`} />
                <div className={`flex items-center gap-1.5 ${onboardStep >= 2 ? 'text-white' : 'text-white/50'}`}>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                      onboardStep >= 2 ? 'bg-amber-400 text-[#000666]' : 'bg-white/20 text-white'
                    }`}
                  >
                    2
                  </span>
                  <span className="text-[11px] sm:text-xs">{t('auth.onboardingStep2', 'Punjab Address')}</span>
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${onboardStep >= 3 ? 'bg-amber-400' : 'bg-white/20'}`} />
                <div className={`flex items-center gap-1.5 ${onboardStep >= 3 ? 'text-white' : 'text-white/50'}`}>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                      onboardStep >= 3 ? 'bg-amber-400 text-[#000666]' : 'bg-white/20 text-white'
                    }`}
                  >
                    3
                  </span>
                  <span className="text-[11px] sm:text-xs">{t('auth.onboardingStep3', 'ID Photo & Card')}</span>
                </div>
              </div>
            </div>
          ) : (
            /* 5-Role Tab Switcher inside Modal (hidden during onboarding) */
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-5 bg-black/20 p-1.5 rounded-2xl backdrop-blur-xs">
              {[
                { id: 'student', label: 'Student', icon: 'school' },
                { id: 'corporate', label: 'Corporate', icon: 'business' },
                { id: 'passenger', label: 'Passenger', icon: 'person' },
                { id: 'college_admin', label: 'College', icon: 'account_balance' },
                { id: 'prtc_admin', label: 'PRTC', icon: 'shield_person' },
                { id: 'conductor', label: 'Crew', icon: 'qr_code_scanner' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as UserRoleType);
                    setIsSignUp(false);
                    setPunjabError(null);
                    setOtpError(null);
                    if (tab.id === 'conductor') {
                      setPrtcAdminId('PRTC-CRW-221');
                      setPrtcEmail('harpreet.singh@prtc.punjab.gov.in');
                      setPrtcPassword('password123');
                    } else if (tab.id === 'prtc_admin') {
                      setPrtcAdminId('PRTC-PAT-HQ-091');
                      setPrtcEmail('g.singh@prtc.punjab.gov.in');
                      setPrtcPassword('password123');
                    }
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
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#fbf9f8]">
          {/* 3. Render the wizard whenever signupToken is set (section 5.4) */}
          {signupToken && onboardStep > 0 ? (
            <div className="space-y-5 animate-in fade-in">
              {onboardError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0 text-red-600">error</span>
                  <span>{onboardError}</span>
                </div>
              )}

              {/* Stage 1: locked email, editable name, DOB, gender, phone, college, roll no., Aadhaar */}
              {onboardStep === 1 && (
                <form onSubmit={handleStage1Next} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#000666] text-xl shrink-0 mt-0.5">verified_user</span>
                    <div>
                      <h4 className="text-xs font-bold text-[#000666]">{t('auth.googleVerifiedBadge', 'Google Account Verified')}</h4>
                      <p className="text-[11px] text-[#454652] mt-0.5">
                        {t('auth.googleVerifiedText', 'Your identity has been authenticated. Please complete your academic details to register for the PRTC concession pass.')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                      Verified Google Email <span className="text-[10px] text-green-700 font-semibold">(Locked)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={studentEmail}
                        readOnly
                        className="w-full bg-[#f3f4f6] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#454652] cursor-not-allowed font-medium pl-9"
                      />
                      <span className="material-symbols-outlined text-sm text-green-600 absolute left-3 top-2.5">lock</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      required
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Date of Birth (DOB) *</label>
                      <input
                        type="date"
                        value={studentDob}
                        onChange={(e) => setStudentDob(e.target.value)}
                        required
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Gender *</label>
                      <select
                        value={studentGender}
                        onChange={(e) => setStudentGender(e.target.value)}
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1c] mb-1">College Roll Number *</label>
                      <input
                        type="text"
                        value={studentRollNo}
                        onChange={(e) => setStudentRollNo(e.target.value)}
                        placeholder="e.g. 2115082"
                        required
                        className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Enrolled College / Institution *</label>
                    <select
                      value={studentCollege}
                      onChange={(e) => setStudentCollege(e.target.value)}
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
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                      12-Digit Aadhaar Number * <span className="text-[10px] text-[#767683] font-normal">(Required for concession pass)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={studentAadhaar}
                      onChange={(e) => setStudentAadhaar(formatAadhaar(e.target.value))}
                      placeholder="•••• •••• •••• (12 digits)"
                      required
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-mono text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-2"
                  >
                    <span>{t('auth.nextAddress', 'Next: Address Verification (Stage 2)')}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </form>
              )}

              {/* Stage 2: permanent address textarea; live Punjab check using PIN/'punjab' rule; disable Next and show red box */}
              {onboardStep === 2 && (
                <form onSubmit={handleStage2Next} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                      Permanent Punjab Residential Address *
                    </label>
                    <textarea
                      rows={3}
                      value={studentAddress}
                      onChange={(e) => {
                        setStudentAddress(e.target.value);
                        setOnboardError(null);
                      }}
                      placeholder="e.g. H.No 124, Sector 70, SAS Nagar Mohali, Punjab - 140308"
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666] leading-relaxed"
                      required
                    />
                    <p className="text-[11px] text-[#767683] mt-1">
                      Please include your 6-digit postal PIN code (e.g. 140001–152999 or Punjab district).
                    </p>
                  </div>

                  {/* Live Punjab Verification Feedback */}
                  {studentAddress.trim().length > 0 && (
                    <>
                      {validatePunjabResidency(studentAddress) ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-green-600 text-lg">verified</span>
                          <div>
                            <p className="font-bold">Punjab Residency Verified</p>
                            <p className="text-[11px] text-green-700">Eligible for PRTC state-subsidized student bus concession pass.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                          <span className="material-symbols-outlined text-red-600 text-lg shrink-0 mt-0.5">error</span>
                          <div>
                            <p className="font-bold text-red-800">Not eligible: A permanent Punjab address is required</p>
                            <p className="text-[11px] text-red-600 mt-0.5">
                              PRTC student concessions are funded by the Government of Punjab for students residing within Punjab.
                              Please enter a permanent address with a valid Punjab PIN code (140001–152999).
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setOnboardStep(1)}
                      className="w-1/3 py-2.5 px-3 border border-[#c6c5d4] hover:bg-gray-100 rounded-xl font-bold text-xs text-[#454652] transition flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>{t('auth.back', 'Back')}</span>
                    </button>
                    <button
                      type="submit"
                      disabled={!validatePunjabResidency(studentAddress)}
                      className={`w-2/3 py-2.5 px-3 rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 ${
                        validatePunjabResidency(studentAddress)
                          ? 'bg-[#000666] text-white hover:bg-[#1a237e] cursor-pointer'
                          : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>{t('auth.nextPhoto', 'Next: ID Card Photo (Stage 3)')}</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Stage 3: radio between Use Google photo and Upload (FileReader to Base64), live ID card preview */}
              {onboardStep === 3 && (
                <div className="space-y-4">
                  {/* Photo Selection Option */}
                  <div className="bg-white border border-[#c6c5d4] rounded-2xl p-4 space-y-3">
                    <label className="block text-xs font-bold text-[#1b1c1c]">Select Concession Pass Photo</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          photoChoice === 'google' ? 'border-[#000666] bg-blue-50/50 shadow-xs' : 'border-[#c6c5d4] hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="photoChoice"
                          value="google"
                          checked={photoChoice === 'google'}
                          onChange={() => setPhotoChoice('google')}
                          className="text-[#000666] focus:ring-[#000666]"
                        />
                        <div className="flex items-center gap-2 overflow-hidden">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Google Avatar" className="w-8 h-8 rounded-full object-cover border shrink-0" />
                          ) : (
                            <span className="material-symbols-outlined text-gray-500 text-2xl">account_circle</span>
                          )}
                          <span className="text-xs font-bold text-[#1b1c1c] truncate">Use Google Account Photo</span>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          photoChoice === 'upload' ? 'border-[#000666] bg-blue-50/50 shadow-xs' : 'border-[#c6c5d4] hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="photoChoice"
                          value="upload"
                          checked={photoChoice === 'upload'}
                          onChange={() => setPhotoChoice('upload')}
                          className="text-[#000666] focus:ring-[#000666]"
                        />
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-500 text-2xl">upload_file</span>
                          <span className="text-xs font-bold text-[#1b1c1c]">Upload Custom Photo</span>
                        </div>
                      </label>
                    </div>

                    {photoChoice === 'upload' && (
                      <div className="pt-2 animate-in fade-in">
                        <label className="block text-[11px] font-semibold text-[#454652] mb-1">
                          Select Passport-Size Photo (JPEG/PNG)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCustomPhotoUpload}
                          className="w-full text-xs text-[#454652] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#000666] file:text-white hover:file:bg-[#1a237e] file:cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Live ID Card Preview */}
                  <div className="bg-[#000666] rounded-2xl p-4 text-white shadow-lg space-y-3 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white text-[#000666] flex items-center justify-center font-black text-xs">
                          PRTC
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                            Pepsu Road Transport Corporation
                          </p>
                          <p className="text-[11px] font-extrabold leading-tight">Student Concession Bus Pass</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-green-500/20 text-green-300 border border-green-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                        Punjab Resident Verified
                      </span>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <img
                        src={currentDisplayPhoto}
                        alt="ID Preview"
                        className="w-20 h-24 rounded-xl object-cover border-2 border-white/30 shrink-0 shadow-sm bg-white/10"
                      />
                      <div className="space-y-1 text-xs flex-1 min-w-0">
                        <p className="font-extrabold text-sm truncate text-white">{studentName || 'Student Name'}</p>
                        <p className="text-[11px] text-white/80 truncate">
                          Roll No: <span className="font-bold text-white font-mono">{studentRollNo || '—'}</span>
                        </p>
                        <p className="text-[11px] text-white/80 truncate">
                          College: <span className="font-semibold text-white">{studentCollege}</span>
                        </p>
                        <p className="text-[10px] text-white/70">
                          DOB: {studentDob} • {studentGender}
                        </p>
                        <p className="text-[10px] text-white/70 truncate">
                          Aadhaar: XXXX-XXXX-{studentAadhaar.replace(/\D/g, '').slice(-4) || '••••'}
                        </p>
                        <p className="text-[10px] text-[#bdc2ff] line-clamp-1 italic">{studentAddress || 'Address'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setOnboardStep(2)}
                      className="w-1/3 py-3 px-3 border border-[#c6c5d4] hover:bg-gray-100 rounded-xl font-bold text-xs text-[#454652] transition flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>{t('auth.back', 'Back')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteGoogleSignup}
                      disabled={isCompleting}
                      className="w-2/3 py-3 px-4 bg-[#000666] hover:bg-[#1a237e] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCompleting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>{t('common.loading', 'Creating Pass Account...')}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span>{t('auth.completeRegistration', 'Complete Registration & Issue Pass')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : otpStep ? (
            /* OTP Verification Screen (for traditional form sign-up) */
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

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-md mx-auto text-left flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-700 text-lg shrink-0 mt-0.5">key</span>
                  <div>
                    <span className="font-black text-amber-900 text-xs block">Demo Evaluation Access (Prototype Mode)</span>
                    <span className="text-[11px] text-amber-800">
                      Use demo verification code: <strong className="font-mono text-sm text-[#000666] bg-amber-200/80 px-1.5 py-0.5 rounded font-black tracking-widest">0000</strong> &bull; <span className="text-amber-950 font-medium">Google Sign-In skips OTP verification entirely</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`modal-otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center font-mono font-black text-xl bg-white border-2 border-[#c6c5d4] focus:border-[#000666] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#000666]/20 transition shadow-xs text-[#1b1c1c]"
                  />
                ))}
              </div>

              {otpError && <p className="text-xs text-red-600 font-bold">{otpError}</p>}

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifying}
                  className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Verify & Enter Portal</span>
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center text-xs text-[#767683] px-1">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="hover:text-[#000666] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span> Edit Details
                  </button>
                  <button
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={() => {
                      setResendTimer(30);
                      setOtpError(null);
                    }}
                    className={`font-bold transition ${
                      resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#000666] hover:underline cursor-pointer'
                    }`}
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Google Sign-In Action (hidden when onboardStep > 0 or otpStep) */}
              {!otpStep && !signupToken && activeTab !== 'college_admin' && activeTab !== 'prtc_admin' && activeTab !== 'conductor' && (
                <div className="mb-5">
                  {googleClientId ? (
                    <div className="flex flex-col items-center justify-center">
                      <div ref={googleButtonRef} className="min-h-[44px] flex justify-center w-full" />
                      <p className="text-[10px] text-[#767683] mt-1 text-center">
                        Official Google OAuth verification
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowDevAccountPicker(!showDevAccountPicker)}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-[#f3f4f6] active:bg-[#e5e7eb] border border-[#c6c5d4] hover:border-[#000666]/40 rounded-xl shadow-xs transition font-bold text-[#1b1c1c] text-xs sm:text-sm cursor-pointer group"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ml-auto">
                          1-Click Test
                        </span>
                      </button>

                      {showDevAccountPicker && (
                        <div className="p-3 bg-white border border-[#000666]/30 rounded-2xl shadow-md space-y-2.5 animate-in fade-in">
                          <p className="text-xs font-bold text-[#000666]">Select or Enter Google Account to Test:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => triggerDevGoogleAuth('new.student@test.com', 'New Student')}
                              className="p-2 text-left bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition font-medium"
                            >
                              <div className="font-bold text-[#000666]">Brand-New Student</div>
                              <div className="text-[10px] text-[#454652]">new.student@test.com (Triggers 3-Stage Wizard)</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerDevGoogleAuth('prakash@gmail.com', 'Prakash', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80')}
                              className="p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition font-medium"
                            >
                              <div className="font-bold text-[#1b1c1c]">Prakash (CGC Landran)</div>
                              <div className="text-[10px] text-[#454652]">prakash@gmail.com (#887)</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerDevGoogleAuth('mani.ladla@gmail.com', 'Mani Ladla', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80')}
                              className="p-2 text-left bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-300 transition font-medium"
                            >
                              <div className="font-bold text-emerald-900">Mani Ladla (Zirakpur)</div>
                              <div className="text-[10px] text-emerald-700">mani.ladla@gmail.com (#869)</div>
                            </button>
                          </div>

                          <div className="pt-1 flex gap-2">
                            <input
                              type="email"
                              value={customTestEmail}
                              onChange={(e) => setCustomTestEmail(e.target.value)}
                              placeholder="Or enter any custom test email..."
                              className="flex-1 bg-white border border-[#c6c5d4] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#000666]"
                            />
                            <button
                              type="button"
                              onClick={() => customTestEmail.trim() && triggerDevGoogleAuth(customTestEmail.trim())}
                              className="bg-[#000666] text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-[#1a237e]"
                            >
                              Go
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {otpError && !signupToken && (
                    <div className="p-2.5 mt-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-center font-medium">
                      {otpError}
                    </div>
                  )}

                  <div className="relative flex py-3.5 items-center">
                    <div className="flex-grow border-t border-[#c6c5d4]"></div>
                    <span className="shrink-0 mx-3 text-[#767683] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                      or continue with {isSignUp ? 'manual application form' : 'credentials'}
                    </span>
                    <div className="flex-grow border-t border-[#c6c5d4]"></div>
                  </div>
                </div>
              )}

              {/* 1. STUDENT FORM */}
              {activeTab === 'student' && (
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#c6c5d4]">
                    <div>
                      <h4 className="font-bold text-sm text-[#1b1c1c]">
                        {isSignUp ? 'New Student Concession Application' : 'Student Pass Portal Login'}
                      </h4>
                      <p className="text-xs text-[#767683]">
                        {isSignUp ? 'Mandatory Punjab residency for 67% fare concession' : 'Sign in to access your digital PRTC concession QR card'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setPunjabError(null);
                        setOtpError(null);
                      }}
                      className="text-xs font-bold text-[#000666] hover:underline cursor-pointer"
                    >
                      {isSignUp ? 'Sign in instead' : 'New student? Register'}
                    </button>
                  </div>

                  {punjabError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm shrink-0">error</span>
                      <span>{punjabError}</span>
                    </div>
                  )}

                  {isSignUp ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Full Student Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Gurpreet Singh"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Mobile Number *</label>
                          <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={studentPhone}
                            onChange={(e) => setStudentPhone(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Enrolled College *</label>
                          <select
                            value={studentCollege}
                            onChange={(e) => setStudentCollege(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                          >
                            {colleges.map((col) => (
                              <option key={col.id} value={col.name}>
                                {col.name} ({col.city})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Roll / Enrollment No *</label>
                          <input
                            type="text"
                            placeholder="e.g. 2115082"
                            value={studentRollNo}
                            onChange={(e) => setStudentRollNo(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Father's Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. S. Balwinder Singh"
                            value={studentFatherName}
                            onChange={(e) => setStudentFatherName(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                            12-Digit Aadhaar No. * <span className="text-xs text-[#767683] font-normal">(Punjab Filter)</span>
                          </label>
                          <input
                            type="text"
                            maxLength={14}
                            placeholder="•••• •••• ••••"
                            value={studentAadhaar}
                            onChange={(e) => setStudentAadhaar(formatAadhaar(e.target.value))}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-mono text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                          Permanent Residential Address * <span className="text-xs text-red-600 font-bold">(Must be in Punjab)</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. House No. 42, Model Town, Patiala, Punjab - 147001"
                          value={studentAddress}
                          onChange={(e) => setStudentAddress(e.target.value)}
                          className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                          required
                        />
                        <p className="text-[10px] text-[#767683] mt-0.5">
                          Concession passes are subsidized strictly for bona-fide Punjab residents. Address is auto-screened against Punjab postal PIN codes (140001–152999).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Personal Email *</label>
                          <input
                            type="email"
                            placeholder="student@gmail.com"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Set Account Password *</label>
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
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Registered Student Email or Pass ID</label>
                        <input
                          type="text"
                          placeholder="e.g. prakash@gmail.com or PRTC-STU-887"
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

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        <span className="font-bold">Demo Student Account:</span> Use email{' '}
                        <strong className="font-mono">prakash@gmail.com</strong> (Pre-approved pass on Kharar - CGC Landran route).
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-4"
                  >
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    {isSignUp ? 'Verify Mobile & Apply for Concession' : 'Sign In with Mobile OTP'}
                  </button>
                </form>
              )}

              {/* 2. CORPORATE FORM */}
              {activeTab === 'corporate' && (
                <form onSubmit={handleCorporateSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#c6c5d4]">
                    <div>
                      <h4 className="font-bold text-sm text-[#1b1c1c]">
                        {isSignUp ? 'Register Corporate Transit Account' : 'Corporate Commute Admin Sign In'}
                      </h4>
                      <p className="text-xs text-[#767683]">Bulk commuter passes, chartered fleet tracking & corporate invoicing</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setOtpError(null);
                      }}
                      className="text-xs font-bold text-[#000666] hover:underline cursor-pointer"
                    >
                      {isSignUp ? 'Sign in instead' : 'New corporate? Register'}
                    </button>
                  </div>

                  {isSignUp ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Registered Company Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Infosys Ltd / Quark City"
                          value={corpCompanyName}
                          onChange={(e) => setCorpCompanyName(e.target.value)}
                          className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">HR / Commute Officer Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Vikram Malhotra"
                            value={corpName}
                            onChange={(e) => setCorpName(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Contact Phone</label>
                          <input
                            type="tel"
                            placeholder="+91 98722 44100"
                            value={corpPhone}
                            onChange={(e) => setCorpPhone(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Corporate Work Email</label>
                          <input
                            type="email"
                            placeholder="commute@company.com"
                            value={corpEmail}
                            onChange={(e) => setCorpEmail(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
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
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Corporate Email or Admin Pass ID</label>
                        <input
                          type="text"
                          placeholder="e.g. commute@infosys.com or PRTC-CORP-402"
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

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        <span className="font-bold">Demo Corporate Partner:</span> Use email{' '}
                        <strong className="font-mono">commute@infosys.com</strong> (Pre-configured for Mohali IT Park routes).
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-4"
                  >
                    <span className="material-symbols-outlined text-sm">business_center</span>
                    {isSignUp ? 'Create Corporate Account' : 'Sign In with Mobile OTP'}
                  </button>
                </form>
              )}

              {/* 3. PASSENGER FORM */}
              {activeTab === 'passenger' && (
                <form onSubmit={handlePassengerSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#c6c5d4]">
                    <div>
                      <h4 className="font-bold text-sm text-[#1b1c1c]">
                        {isSignUp ? 'Register Daily Commuter Account' : 'Passenger Transit Login'}
                      </h4>
                      <p className="text-xs text-[#767683]">Instant bus QR ticketing, route reservations & trip receipts</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setOtpError(null);
                      }}
                      className="text-xs font-bold text-[#000666] hover:underline cursor-pointer"
                    >
                      {isSignUp ? 'Sign in instead' : 'New commuter? Register'}
                    </button>
                  </div>

                  {isSignUp ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Gurpreet Kaur"
                            value={passName}
                            onChange={(e) => setPassName(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Mobile Number</label>
                          <input
                            type="tel"
                            placeholder="+91 98881 22334"
                            value={passPhone}
                            onChange={(e) => setPassPhone(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Email Address</label>
                          <input
                            type="email"
                            placeholder="passenger@gmail.com"
                            value={passEmail}
                            onChange={(e) => setPassEmail(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
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
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Email or Mobile Number</label>
                        <input
                          type="text"
                          placeholder="gurpreet.k@gmail.com or +91 98881 22334"
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

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        <span className="font-bold">Demo Commuter Account:</span> Use email{' '}
                        <strong className="font-mono">gurpreet.k@gmail.com</strong> (Pre-loaded with active e-tickets).
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-4"
                  >
                    <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    {isSignUp ? 'Create Passenger Account' : 'Sign In with Mobile OTP'}
                  </button>
                </form>
              )}

              {/* 4. COLLEGE ADMIN FORM */}
              {activeTab === 'college_admin' && (
                <form onSubmit={handleCollegeAdminSubmit} className="space-y-4">
                  <div className="pb-2 border-b border-[#c6c5d4]">
                    <h4 className="font-bold text-sm text-[#1b1c1c]">College Verification Officer Portal</h4>
                    <p className="text-xs text-[#767683]">Official portal for Punjab university and college registrars</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Affiliated Institution</label>
                    <select
                      value={collegeSelected}
                      onChange={(e) => setCollegeSelected(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    >
                      {colleges.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name} ({col.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Authorized Academic Email</label>
                    <input
                      type="email"
                      placeholder="admin.academics@cgc.edu.in"
                      value={collegeAdminEmail}
                      onChange={(e) => setCollegeAdminEmail(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Security Verification PIN</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={collegeAdminPin}
                      onChange={(e) => setCollegeAdminPin(e.target.value)}
                      className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2.5 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                    <span className="font-bold">Authorized College Dean:</span> Pre-loaded with Chandigarh Engineering College (CGC Landran) digital seal stamp authority.
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#000666] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#1a237e] transition shadow-md flex items-center justify-center gap-2 mt-4"
                  >
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    Access College Attestation Desk
                  </button>
                </form>
              )}

              {/* 5. PRTC ADMIN / CONDUCTOR FORM */}
              {(activeTab === 'prtc_admin' || activeTab === 'conductor') && (
                <>
                  {activeTab === 'conductor' && (
                    <div className="mb-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-xs space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                            <span className="material-symbols-outlined text-base">badge</span>
                          </div>
                          <div>
                            <span className="text-xs font-black text-emerald-950 block">Conductor Demo Credentials</span>
                            <span className="text-[10px] text-emerald-800 font-bold">Harpreet Singh • PRTC Onboard Verification Crew</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPrtcAdminId('PRTC-CRW-221');
                              setPrtcEmail('harpreet.singh@prtc.punjab.gov.in');
                              setPrtcPassword('password123');
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">edit_note</span>
                            Auto-Fill
                          </button>
                          <button
                            type="button"
                            onClick={handleInstantConductorLogin}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">bolt</span>
                            1-Click Login
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-emerald-200">
                        <div className="bg-white/90 p-2 rounded-xl border border-emerald-200">
                          <span className="text-[9px] uppercase font-bold text-[#767683] block">Crew Pass ID</span>
                          <code className="font-mono font-black text-emerald-900 text-xs">PRTC-CRW-221</code>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-emerald-200 truncate">
                          <span className="text-[9px] uppercase font-bold text-[#767683] block">Official Email</span>
                          <code className="font-mono font-bold text-emerald-900 text-[10px] truncate block">harpreet.singh@prtc.punjab.gov.in</code>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-emerald-200">
                          <span className="text-[9px] uppercase font-bold text-[#767683] block">Password / OTP</span>
                          <code className="font-mono font-black text-emerald-900 text-xs">password123 • OTP: 0000</code>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'prtc_admin' && (
                    <div className="mb-4 bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 shadow-xs space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#000666] text-white flex items-center justify-center font-black text-xs shadow-xs">
                            <span className="material-symbols-outlined text-base">shield_person</span>
                          </div>
                          <div>
                            <span className="text-xs font-black text-blue-950 block">PRTC State Authority Credentials</span>
                            <span className="text-[10px] text-blue-800 font-bold">S. Gurmukh Singh • Pass Sanctioning Authority</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPrtcAdminId('PRTC-PAT-HQ-091');
                            setPrtcEmail('g.singh@prtc.punjab.gov.in');
                            setPrtcPassword('password123');
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-blue-100 text-[#000666] border border-blue-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">edit_note</span>
                          Auto-Fill
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-blue-200">
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-200">
                          <span className="text-[9px] uppercase font-bold text-[#767683] block">Admin ID</span>
                          <code className="font-mono font-black text-blue-900 text-xs">PRTC-PAT-HQ-091</code>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-200 truncate">
                          <span className="text-[9px] uppercase font-bold text-[#767683] block">Email</span>
                          <code className="font-mono font-bold text-blue-900 text-[10px] truncate block">g.singh@prtc.punjab.gov.in</code>
                        </div>
                        <div className="bg-white/90 p-2 rounded-xl border border-blue-200">
                          <span className="text-[9px] uppercase font-bold text-[#767683] block">Password / OTP</span>
                          <code className="font-mono font-black text-blue-900 text-xs">password123 • OTP: 0000</code>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handlePrtcAdminSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#c6c5d4]">
                    <div>
                      <h4 className="font-bold text-sm text-[#1b1c1c]">
                        {isSignUp ? (activeTab === 'conductor' ? 'Register PRTC Crew Member' : 'Register PRTC State Inspector') : (activeTab === 'conductor' ? 'PRTC Conductor Login' : 'PRTC State Transport Authority Login')}
                      </h4>
                      <p className="text-xs text-[#767683]">{activeTab === 'conductor' ? 'Authorized onboard QR pass validation & boarding records' : 'Official pass sanctioning desk & depot audit enforcement'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setOtpError(null);
                      }}
                      className="text-xs font-bold text-[#000666] hover:underline cursor-pointer"
                    >
                      {isSignUp ? 'Sign in instead' : 'New PRTC Admin ID? Register'}
                    </button>
                  </div>

                  {isSignUp ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Inspector Full Name</label>
                          <input
                            type="text"
                            placeholder="S. Gurmukh Singh"
                            value={prtcAdminName}
                            onChange={(e) => setPrtcAdminName(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">
                            Unique PRTC Admin ID <span className="text-[10px] text-[#767683] font-normal">(Required)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="PRTC-PAT-HQ-091"
                            value={prtcAdminId}
                            onChange={(e) => setPrtcAdminId(e.target.value)}
                            className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-mono text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Assigned PRTC Depot</label>
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
                    {isSignUp ? (activeTab === 'conductor' ? 'Register PRTC Crew Member' : 'Register PRTC State Admin') : (activeTab === 'conductor' ? 'Sign In as Conductor' : 'Sign In with Unique Admin ID')}
                  </button>
                </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
