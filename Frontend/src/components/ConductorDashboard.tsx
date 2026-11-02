import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { UserProfile } from '../types';
import { api, PassVerification } from '../utils/api';

type ScanResult = { data: PassVerification; boardedAt: string } | { error: string } | null;

interface BoardedSlip {
  id: string;
  name: string;
  passId: string;
  rollNumber: string;
  boardedAt: string;
  boardedTimestamp: number;
  expiresTimestamp: number; // 90 min validity
  route: string;
  busNumber: string;
  collegeName?: string;
  avatarUrl?: string;
}

const routeOptions = [
  'Kharar Bus Stand -> Landran',
  'Zirakpur Bus Stand -> Landran',
  'Patiala Bus Stand -> Nabha Road -> Thapar Campus',
  'Chandigarh ISBT 43 -> Patiala Bus Stand',
  'Mohali Phase 7 -> Sector 43 ISBT -> PEC Sector 12',
  'All Routes (Universal Inspection)',
];

const JOURNEY_VALIDITY_MINUTES = 90;

export const ConductorDashboard: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const [busNumber, setBusNumber] = useState('PRTC-PB-4821');
  const [tripRoute, setTripRoute] = useState(routeOptions[0]);
  const [payload, setPayload] = useState('');
  const [result, setResult] = useState<ScanResult>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [slips, setSlips] = useState<BoardedSlip[]>([]);
  const [activeSlipModal, setActiveSlipModal] = useState<BoardedSlip | null>(null);
  const [tripSummaryModal, setTripSummaryModal] = useState(false);
  const [antiPassbackWarning, setAntiPassbackWarning] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Auto-refresh remaining minutes every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch { /* already stopped */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const verify = async (raw = payload) => {
    const query = raw.trim();
    if (!query) return;
    setLoading(true);
    setResult(null);
    setAntiPassbackWarning(null);

    // Anti-Passback Check: Check if passenger already boarded on this active trip
    const now = Date.now();
    const existing = slips.find(
      (s) =>
        now < s.expiresTimestamp &&
        (s.passId.toLowerCase() === query.toLowerCase() ||
          s.rollNumber.toLowerCase() === query.toLowerCase() ||
          s.name.toLowerCase() === query.toLowerCase() ||
          (query.length > 15 && query.toLowerCase().includes(s.passId.toLowerCase())))
    );

    if (existing) {
      const remainingMins = Math.max(1, Math.round((existing.expiresTimestamp - now) / 60000));
      setAntiPassbackWarning(
        `Passenger "${existing.name}" is already boarded on Bus ${existing.busNumber} (Boarded at ${existing.boardedAt} · ${remainingMins} mins journey validity remaining). Duplicate scan prevented.`
      );
      setLoading(false);
      return;
    }

    try {
      const data = await api.verifyPass(query, tripRoute);
      setResult({
        data,
        boardedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (error: any) {
      setResult({
        error:
          error?.message ||
          'The pass could not be verified. Ensure pass ID is correct or student pass is approved.',
      });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = () => {
    setResult(null);
    setAntiPassbackWarning(null);
    setScanning(true);
    setTimeout(async () => {
      const el = document.getElementById('conductor-qr-reader');
      if (!el) {
        setScanning(false);
        setResult({ error: 'Scanner container element not found. Please try again.' });
        return;
      }
      try {
        const scanner = new Html5Qrcode('conductor-qr-reader');
        scannerRef.current = scanner;
        const config = { fps: 10, qrbox: { width: 240, height: 240 } };
        const onScan = (text: string) => {
          stopCamera().then(() => {
            setPayload(text);
            verify(text);
          });
        };
        try {
          await scanner.start({ facingMode: 'environment' }, config, onScan, () => {});
        } catch {
          await scanner.start({ facingMode: 'user' }, config, onScan, () => {});
        }
      } catch (error: any) {
        setScanning(false);
        setResult({
          error: `Camera could not start: ${error?.message || error}. You can still paste or type the pass ID below.`,
        });
      }
    }, 100);
  };

  useEffect(() => () => { void stopCamera(); }, []);

  const verified = result && 'data' in result ? result : null;
  const canBoard = !!verified?.data.routeValid;

  const markBoarded = () => {
    if (!verified || !canBoard) return;
    const now = Date.now();
    const newSlip: BoardedSlip = {
      id: `SLIP-${Date.now().toString().slice(-6)}`,
      name: verified.data.holderName,
      passId: verified.data.passId || verified.data.rollNumber,
      rollNumber: verified.data.rollNumber,
      boardedAt: verified.boardedAt,
      boardedTimestamp: now,
      expiresTimestamp: now + JOURNEY_VALIDITY_MINUTES * 60 * 1000,
      route: tripRoute,
      busNumber: busNumber,
      collegeName: verified.data.collegeName,
      avatarUrl: verified.data.avatarUrl,
    };

    setSlips((items) => [newSlip, ...items]);
    setResult(null);
    setPayload('');
    setActiveSlipModal(newSlip); // show printed slip popup immediately
  };

  const endTrip = () => {
    setTripSummaryModal(true);
  };

  const confirmResetTrip = () => {
    setSlips([]);
    setTripSummaryModal(false);
    setResult(null);
    setAntiPassbackWarning(null);
  };

  const now = Date.now();

  return (
    <div className="w-full max-w-[1160px] mx-auto space-y-5 pb-8 animate-in fade-in">
      {/* Top Bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#c6c5d4] rounded-2xl px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#000666] text-white flex items-center justify-center">
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </div>
          <div>
            <h1 className="font-black text-lg">Crew Scanner</h1>
            <p className="text-xs text-[#767683]">Onboard concession-pass verification & trip manifest</p>
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="font-bold">{userProfile.name}</p>
          <p className="font-mono text-[#000666]">{userProfile.passId} · Trip active</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        {/* Left Aside: Trip Control & Slips */}
        <aside className="space-y-5">
          <section className="bg-white rounded-3xl border border-[#c6c5d4] shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-[#eae8e7] pb-3">
              <h2 className="font-black text-base flex gap-2 items-center">
                <span className="material-symbols-outlined text-[#000666]">directions_bus</span>Trip control
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-1 rounded-full">
                ● TRIP ACTIVE
              </span>
            </div>
            <label className="block text-xs font-bold">
              Bus number
              <input
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#c6c5d4] px-3 py-3 font-bold focus:outline-none focus:border-[#000666]"
              />
            </label>
            <label className="block text-xs font-bold">
              Active route
              <select
                value={tripRoute}
                onChange={(e) => setTripRoute(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#c6c5d4] px-3 py-3 bg-white text-xs font-semibold focus:outline-none focus:border-[#000666]"
              >
                {routeOptions.map((route) => (
                  <option key={route}>{route}</option>
                ))}
              </select>
            </label>
            <div className="rounded-2xl bg-[#f5f3f3] p-3 text-xs space-y-1">
              <p>
                <span className="text-[#767683]">Depot HQ:</span> <b>Patiala Central Depot (Zone 1)</b>
              </p>
              <p>
                <span className="text-[#767683]">Crew pass ID:</span>{' '}
                <b className="text-[#000666]">{userProfile.passId}</b>
              </p>
              <p>
                <span className="text-[#767683]">Active boarded count:</span>{' '}
                <b className="text-emerald-700 font-bold">{slips.length} passenger{slips.length !== 1 ? 's' : ''}</b>
              </p>
            </div>
            {slips.length > 0 && (
              <button
                type="button"
                onClick={endTrip}
                className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">stop_circle</span>
                Complete Trip & Settle Manifest ({slips.length})
              </button>
            )}
          </section>

          {/* Recent Allotted Slips */}
          <section className="bg-white rounded-3xl border border-[#c6c5d4] p-5">
            <div className="flex justify-between text-xs font-black uppercase tracking-wide">
              <span>Recent Allotted Slips</span>
              <span className="text-[#767683] normal-case">{JOURNEY_VALIDITY_MINUTES}m journey limit</span>
            </div>
            {slips.length ? (
              <div className="mt-3 space-y-2.5">
                {slips.map((slip) => {
                  const remainingMins = Math.max(0, Math.round((slip.expiresTimestamp - now) / 60000));
                  const isExpired = remainingMins <= 0;
                  return (
                    <div
                      key={slip.id}
                      onClick={() => setActiveSlipModal(slip)}
                      className="cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 transition p-3 text-xs space-y-1 shadow-xs"
                    >
                      <div className="flex justify-between items-start">
                        <b>{slip.name}</b>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            isExpired ? 'bg-gray-200 text-gray-700' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isExpired ? 'EXPIRED' : `${remainingMins}m valid`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[#767683]">
                        <span>Pass: {slip.passId}</span>
                        <span>Boarded {slip.boardedAt}</span>
                      </div>
                      <div className="text-[10px] text-[#000666] font-bold flex items-center gap-1 pt-0.5">
                        <span className="material-symbols-outlined text-xs">receipt</span>
                        Click to view E-Ticket Slip
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#767683]">No passengers boarded on this active trip session.</p>
            )}
          </section>
        </aside>

        {/* Right Workspace: Scanner & Validation */}
        <section className="bg-white rounded-3xl border border-[#c6c5d4] shadow-xs p-5 sm:p-6">
          <div className="flex justify-between gap-3 items-start border-b border-[#eae8e7] pb-4">
            <div>
              <h2 className="font-black text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666]">qr_code_2</span>
                Verify passenger pass
              </h2>
              <p className="text-xs text-[#767683] mt-1">
                Scan the PRTC-issued QR, or enter student Pass ID / Roll Number.
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#767683]">INSTANT ROUTE VALIDATION</span>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              onClick={scanning ? stopCamera : startCamera}
              className="px-4 py-3 rounded-xl border-2 border-[#000666] text-[#000666] font-black text-xs flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              {scanning ? 'Stop camera' : 'Open live QR camera'}
            </button>
            <input
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              placeholder="Pass ID (e.g. PRTC-STU-887) or QR payload"
              className="flex-1 rounded-xl border border-[#c6c5d4] px-3 text-xs font-mono focus:outline-none focus:border-[#000666] min-h-11"
            />
            <button
              onClick={() => verify()}
              disabled={loading || !payload.trim()}
              className="px-5 py-3 rounded-xl bg-[#000666] text-white font-black text-xs disabled:opacity-40"
            >
              {loading ? 'Checking…' : 'Verify'}
            </button>
          </div>

          {/* Quick Test Demo Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[#767683] font-bold text-[11px]">Quick Verify:</span>
            <button
              type="button"
              onClick={() => {
                setPayload('PRTC-STU-2012');
                setTripRoute('Zirakpur Bus Stand -> Landran');
                verify('PRTC-STU-2012');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-bold hover:bg-emerald-200 transition text-[11px]"
            >
              Mani Ladla (Zirakpur • #869)
            </button>
            <button
              type="button"
              onClick={() => {
                setPayload('PRTC-STU-887');
                setTripRoute('Kharar Bus Stand -> Landran');
                verify('PRTC-STU-887');
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#000666] border border-blue-200 font-bold hover:bg-blue-100 transition text-[11px]"
            >
              Prakash (CGC Landran • #887)
            </button>
            <button
              type="button"
              onClick={() => {
                setPayload('usr-student-01');
                setTripRoute('Patiala Bus Stand -> Nabha Road -> Thapar Campus');
                verify('usr-student-01');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100 transition text-[11px]"
            >
              Navjot (Thapar • #101)
            </button>
            <button
              type="button"
              onClick={() => {
                setPayload('STU-2024-5519');
                setTripRoute('Mohali Phase 7 -> Sector 43 ISBT -> PEC Sector 12');
                verify('STU-2024-5519');
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold hover:bg-purple-100 transition text-[11px]"
            >
              Gurleen (PEC • #102)
            </button>
          </div>

          {/* Anti-Passback Warning Banner */}
          {antiPassbackWarning && (
            <div className="mt-4 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-black text-sm">
                <span className="material-symbols-outlined text-amber-700">warning</span>
                ANTI-PASSBACK ALERT: PASSENGER ALREADY BOARDED
              </div>
              <p className="font-semibold text-amber-800">{antiPassbackWarning}</p>
              <p className="text-[10px] text-amber-700 pt-1">
                Protection Active: Concession passes cannot be shared or re-scanned on the same bus trip.
              </p>
            </div>
          )}

          {scanning && (
            <div
              id="conductor-qr-reader"
              className="mt-4 max-w-sm rounded-2xl overflow-hidden border border-[#c6c5d4]"
            />
          )}

          {/* Verified Student Pass Details */}
          {verified && (
            <div
              className={`mt-5 border-2 rounded-3xl p-5 ${
                canBoard ? 'border-emerald-500 bg-emerald-50' : 'border-red-400 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-center gap-3 border-b border-emerald-200/70 pb-3">
                <div className="flex items-center gap-2 font-black text-sm">
                  <span
                    className={`material-symbols-outlined ${
                      canBoard ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {canBoard ? 'verified' : 'gpp_bad'}
                  </span>
                  {canBoard ? 'VERIFIED VALID PASS' : 'PASS VALID — ROUTE NOT AUTHORIZED'}
                </div>
                <span
                  className={`text-[10px] font-black rounded-full px-3 py-1 ${
                    canBoard ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {canBoard ? 'ACTIVE' : 'DO NOT BOARD'}
                </span>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="w-28 h-36 rounded-2xl overflow-hidden shrink-0 border-4 border-emerald-500 bg-white">
                  {verified.data.avatarUrl ? (
                    <img
                      src={verified.data.avatarUrl}
                      alt={verified.data.holderName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-3xl text-emerald-800">
                      {verified.data.holderName.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-xl">{verified.data.holderName}</h3>
                  <p className="text-xs font-bold text-[#454652]">Roll No: {verified.data.rollNumber}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                    <Info label="College" value={verified.data.collegeName || 'Verified institution'} />
                    <Info label="Pass type" value={verified.data.passType} />
                    <Info
                      label="Course"
                      value={
                        [verified.data.course, verified.data.semester].filter(Boolean).join(' · ') ||
                        'Student concession'
                      }
                    />
                    <Info
                      label="Expiry"
                      value={
                        verified.data.expiresAt
                          ? new Date(verified.data.expiresAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Active'
                      }
                    />
                  </div>
                  <div className="mt-2 rounded-xl border border-emerald-200 bg-white/70 p-2.5 text-xs">
                    <span className="font-black text-[#767683] uppercase text-[9px]">Authorized route</span>
                    <p className="font-bold">{verified.data.route}</p>
                    <p className={`mt-1 font-bold ${canBoard ? 'text-emerald-800' : 'text-red-700'}`}>
                      {verified.data.routeMessage}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-emerald-200 flex gap-3">
                <button
                  onClick={markBoarded}
                  disabled={!canBoard}
                  className="flex-1 rounded-xl bg-emerald-600 text-white py-3 text-xs font-black disabled:opacity-40 flex justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">confirmation_number</span>
                  MARK BOARDED & ALLOT TICKET (VALID {JOURNEY_VALIDITY_MINUTES} MINS)
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setPayload('');
                  }}
                  className="rounded-xl bg-white border border-red-200 text-red-700 px-4 text-xs font-black"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {result && 'error' in result && (
            <div className="mt-5 rounded-2xl border-2 border-red-400 bg-red-50 p-4 text-sm font-bold text-red-800 flex gap-2">
              <span className="material-symbols-outlined">gpp_bad</span>
              {result.error}
            </div>
          )}
        </section>
      </div>

      {/* MODAL 1: Digital Boarding E-Ticket Slip */}
      {activeSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95">
            <div className="text-center border-b pb-3 border-dashed border-[#c6c5d4]">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-1.5">
                <span className="material-symbols-outlined text-xl">check_circle</span>
              </div>
              <h3 className="font-black text-base text-[#1b1c1c]">PRTC ONBOARD BOARDING SLIP</h3>
              <p className="text-[10px] text-[#767683] uppercase font-bold tracking-wide">
                Zero-Fare Student Concession Commute Token
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Token ID:</span>
                <span className="font-mono font-bold">{activeSlipModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Passenger:</span>
                <span className="font-bold">{activeSlipModal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Roll Number:</span>
                <span className="font-mono">{activeSlipModal.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Bus & Crew:</span>
                <span className="font-bold">{activeSlipModal.busNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Boarding Time:</span>
                <span>{activeSlipModal.boardedAt}</span>
              </div>
              <div className="flex justify-between border-t border-dashed pt-2 text-emerald-800 font-bold">
                <span>Journey Validity:</span>
                <span>
                  Until{' '}
                  {new Date(activeSlipModal.expiresTimestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-[#000666] font-bold">
                <span>Fare Collected:</span>
                <span>₹0.00 (75% State Subsidy)</span>
              </div>
            </div>

            <button
              onClick={() => setActiveSlipModal(null)}
              className="w-full py-3 rounded-xl bg-[#000666] text-white font-bold text-xs"
            >
              Close & Ready for Next Passenger
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Trip Summary & Settlement */}
      {tripSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95">
            <div className="border-b pb-3">
              <h3 className="font-black text-lg text-[#1b1c1c]">Trip Settlement & Manifest</h3>
              <p className="text-xs text-[#767683]">
                Bus {busNumber} · {tripRoute}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-[#767683] text-[10px] uppercase font-bold">Students Boarded</p>
                <p className="text-xl font-black text-[#000666] mt-0.5">{slips.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-[#767683] text-[10px] uppercase font-bold">State Subsidy Claim</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">₹{slips.length * 35}</p>
              </div>
            </div>

            <p className="text-xs text-[#454652] leading-relaxed">
              Completing this trip locks the manifest and transmits the zero-fare boarding logs to Patiala Central Depot for state subsidy reimbursement.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={confirmResetTrip}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex justify-center items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                Submit & Start Next Trip
              </button>
              <button
                onClick={() => setTripSummaryModal(false)}
                className="px-4 py-3 rounded-xl bg-gray-100 text-[#454652] font-bold text-xs"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
    <p className="text-[9px] uppercase font-black text-[#767683]">{label}</p>
    <p className="font-bold text-[#1b1c1c] mt-0.5">{value}</p>
  </div>
);
