export type PortalRole = 
  | 'gateway'
  | 'student'
  | 'corporate'
  | 'passenger'
  | 'college_admin'
  | 'prtc_admin'
  | 'schedules';

export type UserRoleType = 'student' | 'corporate' | 'passenger' | 'college_admin' | 'prtc_admin';

export interface StudentApplication {
  id: string;
  studentId: string;
  name: string;
  initials: string;
  fatherName?: string;
  collegeId: string;
  collegeName: string;
  rollNumber: string;
  course: string;
  semester: string;
  passType: 'Student AC' | 'Student Non-AC' | 'Student Express' | 'Subsidized Student Concession' | string;
  route: string;
  distanceKm?: number;
  duration?: 'Monthly' | 'Quarterly' | 'Semester';
  status: 'pending' | 'college_approved' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedDate: string;
  // College Admin Verification
  collegeVerifiedBy?: string;
  collegeVerifiedDate?: string;
  collegeStampId?: string;
  collegeStampName?: string;
  // PRTC Admin Verification
  prtcVerifiedBy?: string;
  prtcVerifiedDate?: string;
  prtcAdminId?: string;
  // Documents & Bio
  aadhaarNumber: string;
  aadhaarAddress?: string;
  isPunjabResident?: boolean;
  aadhaarFile?: string;
  feeReceiptFile?: string;
  feeReceiptSize?: string;
  feeReceiptNo?: string;
  signatureAffirmed?: boolean;
  subsidizedAmountPaid?: number;
  originalFare?: number;
}

export interface College {
  id: string;
  name: string;
  city: string;
  location: string;
  pendingCount: number;
  statusTag: 'Pre-cleared' | 'Awaiting Review' | 'Verified';
  adminName?: string;
  established?: string;
}

export interface BusTicket {
  id: string;
  ticketNumber: string;
  title: string;
  type: 'single' | 'day_pass' | 'monthly_pass' | 'corporate_pass';
  route: string;
  timestamp: string;
  amount: number;
  status: 'active' | 'expired' | 'upcoming';
  qrCodeUrl?: string;
  validUntil?: string;
  companyName?: string;
  holderName?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  passId: string;
  email: string;
  phone: string;
  avatarUrl: string;
  roleType: UserRoleType;
  institution?: string;
  roleTitle?: string;
  // Student Specific
  fatherName?: string;
  rollNo?: string;
  college?: string;
  permanentAddress?: string;
  isPunjabResident?: boolean;
  aadhaarNumber?: string;
  // Corporate Specific
  companyName?: string;
  corporateId?: string;
  designation?: string;
  gstin?: string;
  // College Admin Specific
  collegeId?: string;
  collegeName?: string;
  designationTitle?: string;
  // PRTC Admin Specific
  prtcAdminId?: string;
  depotZone?: string;
}

export interface RouteSchedule {
  routeNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  busType: 'Ordinary' | 'HVAC' | 'Integral Coach' | 'Express';
  fare: number;
  availableSeats: number;
  frequency: string;
}

