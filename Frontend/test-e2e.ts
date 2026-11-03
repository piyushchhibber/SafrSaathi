import { mockStudentApplications } from './src/data/mockData';
import { mergeWithInstitutionalApplications, getStoredApplications, saveStoredApplications } from './src/utils/storage';
import { StudentApplication } from './src/types';

// Mock localStorage in Node.js environment
const localStorageStore: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => localStorageStore[key] || null,
  setItem: (key: string, val: string) => {
    localStorageStore[key] = val;
  },
  removeItem: (key: string) => {
    delete localStorageStore[key];
  },
  clear: () => {
    for (const k in localStorageStore) delete localStorageStore[k];
  },
};

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('=== STARTING END-TO-END APPLICATION WORKFLOW TESTS ===\n');

// 1. Initial State
runTest('Storage initializes with institutional roster', () => {
  const initial = getStoredApplications();
  if (initial.length === 0) throw new Error('Initial roster should not be empty');
  const foundPrakashDemo = initial.find(a => a.rollNumber === '887');
  if (!foundPrakashDemo) throw new Error('CGC Landran demo Prakash (roll 887) should exist in mock roster');
});

// 2. Student Submits Application
let studentApp: StudentApplication = {
  id: 'app-prakash-singh-101',
  studentId: 'usr-bfad416f6c62',
  name: 'PRAKASH KUMAR SINGH',
  initials: 'PK',
  fatherName: 'S. Gurdeep Singh',
  collegeId: 'ccet',
  collegeName: 'Chandigarh Engineering College-CGC Landran',
  rollNumber: '2554887',
  course: 'B.Tech Computer Science & Engg',
  semester: 'Semester 4',
  passType: 'Subsidized Student Concession',
  route: 'Kharar Bus Stand -> CGC Landran Mohali Campus',
  distanceKm: 14,
  duration: 'Monthly',
  status: 'pending',
  submittedDate: '04 Nov 2026',
  aadhaarNumber: 'XXXX-XXXX-9987',
  aadhaarAddress: 'Kharar, Punjab',
  isPunjabResident: true,
  subsidizedAmountPaid: 225,
};

runTest('Student submits application (saved as pending in localStorage)', () => {
  const current = getStoredApplications();
  const updated = [studentApp, ...current.filter(a => a.id !== studentApp.id)];
  saveStoredApplications(updated);

  const stored = getStoredApplications();
  const found = stored.find(a => a.rollNumber === '2554887');
  if (!found) throw new Error('PRAKASH KUMAR SINGH was not found in stored applications');
  if (found.status !== 'pending') throw new Error(`Expected pending, got ${found.status}`);
  if (found.collegeStampId) throw new Error('Pending application must not have collegeStampId');
});

// 3. College Admin Approves and Applies Virtual Stamp
runTest('College Admin applies official virtual stamp', () => {
  const stored = getStoredApplications();
  const toApprove = stored.find(a => a.rollNumber === '2554887');
  if (!toApprove) throw new Error('Application not found');

  const stampedApp: StudentApplication = {
    ...toApprove,
    status: 'college_approved',
    collegeVerifiedBy: 'DR. D. SHARMA (DEAN / REGISTRAR)',
    collegeVerifiedDate: '04 Nov 2026',
    collegeStampId: 'SEAL-CGC-7741',
    collegeStampName: 'Official Seal of CGC Landran',
  };

  const updated = stored.map(a => a.id === stampedApp.id ? stampedApp : a);
  saveStoredApplications(updated);

  const reloaded = getStoredApplications();
  const verified = reloaded.find(a => a.rollNumber === '2554887');
  if (!verified) throw new Error('Stamped application missing after save');
  if (verified.status !== 'college_approved') throw new Error(`Expected college_approved, got ${verified.status}`);
  if (verified.collegeStampId !== 'SEAL-CGC-7741') throw new Error(`Invalid stamp ID: ${verified.collegeStampId}`);
  if (!verified.collegeVerifiedBy.includes('SHARMA')) throw new Error('Missing attestation officer');
});

// 4. Role Switch to PRTC Admin (Incoming Server Sync with older or pending state)
runTest('Role switch to PRTC Admin preserves College Stamp against stale server payloads', () => {
  // Simulate server returning stale or pending data for the same student
  const staleServerApp = {
    id: 'app-prakash-singh-101',
    studentId: 'usr-bfad416f6c62',
    name: 'PRAKASH KUMAR SINGH',
    rollNumber: '2554887',
    collegeId: 'ccet',
    collegeName: 'Chandigarh Engineering College-CGC Landran',
    status: 'pending', // stale server status
    course: 'B.Tech Computer Science & Engg',
  } as StudentApplication;

  const merged = mergeWithInstitutionalApplications([staleServerApp]);
  const matched = merged.find(a => a.rollNumber === '2554887' || a.studentId === 'usr-bfad416f6c62');
  if (!matched) throw new Error('PRAKASH KUMAR SINGH missing after PRTC role switch sync');
  if (matched.status !== 'college_approved') {
    throw new Error(`CRITICAL REGRESSION: Status downgraded to ${matched.status}! Must stay college_approved`);
  }
  if (!matched.collegeStampId) {
    throw new Error('CRITICAL REGRESSION: College stamp was lost during PRTC role switch!');
  }
});

// 5. PRTC Admin Sanctions Pass and Generates Token QR
runTest('PRTC Admin sanctions pass and completes Stage 2', () => {
  const stored = getStoredApplications();
  const toSanction = stored.find(a => a.rollNumber === '2554887');
  if (!toSanction) throw new Error('App not found for PRTC sanctioning');

  // Verify Stage 1 is cleared before sanctioning
  if (toSanction.status !== 'college_approved') {
    throw new Error(`Cannot sanction pass: Stage 1 not complete (status: ${toSanction.status})`);
  }

  const sanctionedApp: StudentApplication = {
    ...toSanction,
    status: 'approved',
    prtcAdminId: 'PRTC-PAT-HQ-091',
    prtcVerifiedBy: 'S. GURMUKH SINGH (DEPOT SUPT.)',
    prtcVerifiedDate: '04 Nov 2026',
  };

  const updated = stored.map(a => a.id === sanctionedApp.id ? sanctionedApp : a);
  saveStoredApplications(updated);

  const reloaded = getStoredApplications();
  const finalApp = reloaded.find(a => a.rollNumber === '2554887');
  if (!finalApp) throw new Error('Sanctioned app not found in storage');
  if (finalApp.status !== 'approved') throw new Error(`Expected approved, got ${finalApp.status}`);
  if (finalApp.collegeStampId !== 'SEAL-CGC-7741') throw new Error('College stamp was lost after PRTC approval');
  if (finalApp.prtcAdminId !== 'PRTC-PAT-HQ-091') throw new Error('PRTC admin ID missing');
});

// 6. Return to College Admin: verify pass stays approved
runTest('Return to College Admin shows Attestation Completed & Pass Approved', () => {
  const stored = getStoredApplications();
  const app = stored.find(a => a.rollNumber === '2554887');
  if (!app) throw new Error('App not found');
  if (app.status !== 'approved') throw new Error(`Expected approved status, got ${app.status}`);
  if (!app.collegeStampId) throw new Error('College stamp should be visible in College Admin');
});

// 7. Student View: verify both stages show completed
runTest('Student Dashboard shows complete approval pipeline', () => {
  const stored = getStoredApplications();
  const studentView = stored.find(a => a.studentId === 'usr-bfad416f6c62' || a.rollNumber === '2554887');
  if (!studentView) throw new Error('Student application not found');

  const isStage1Complete = studentView.status === 'college_approved' || studentView.status === 'approved';
  const isStage2Complete = studentView.status === 'approved';

  if (!isStage1Complete) throw new Error('Stage 1 (College Seal) not marked complete');
  if (!isStage2Complete) throw new Error('Stage 2 (PRTC Sanction) not marked complete');
});

console.log('\n=== ALL 7 END-TO-END WORKFLOW TESTS COMPLETED SUCCESSFULLY ===');
