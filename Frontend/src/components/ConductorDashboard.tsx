import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { UserProfile } from '../types';
import { api, PassVerification } from '../utils/api';

type ScanResult = { data: PassVerification; boardedAt: string } | { error: string } | null;

const routeOptions = [
  'Zirakpur Bus Stand -> Landran',
  'Patiala Bus Stand -> Nabha Road -> Thapar Campus',
  'Chandigarh ISBT 43 -> Patiala Bus Stand',
  'Mohali Phase 7 -> Sector 43 ISBT -> PEC Sector 12',
];

export const ConductorDashboard: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const [busNumber, setBusNumber] = useState('PRTC-PB-4821');
  const [tripRoute, setTripRoute] = useState(routeOptions[0]);
  const [payload, setPayload] = useState('');
  const [result, setResult] = useState<ScanResult>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [slips, setSlips] = useState<{ name: string; passId: string; time: string }[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* already stopped */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const verify = async (raw = payload) => {
    if (!raw.trim()) return;
    setLoading(true); setResult(null);
    try {
      const data = await api.verifyPass(raw, tripRoute);
      setResult({ data, boardedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    } catch (error: any) {
      setResult({ error: error?.message || 'The pass could not be verified.' });
    } finally { setLoading(false); }
  };

  const startCamera = () => {
    setResult(null); setScanning(true);
    window.setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('conductor-qr-reader');
        scannerRef.current = scanner;
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 230 }, (text) => {
          stopCamera().then(() => { setPayload(text); verify(text); });
        }, () => {});
      } catch (error: any) { setScanning(false); setResult({ error: `Camera could not start: ${error?.message || error}` }); }
    }, 50);
  };

  useEffect(() => () => { void stopCamera(); }, []);
  const verified = result && 'data' in result ? result : null;
  const canBoard = !!verified?.data.routeValid;
  const markBoarded = () => {
    if (!verified || !canBoard) return;
    setSlips((items) => [{ name: verified.data.holderName, passId: verified.data.rollNumber, time: verified.boardedAt }, ...items].slice(0, 4));
    setResult(null); setPayload('');
  };

  return <div className="w-full max-w-[1160px] mx-auto space-y-5 pb-8 animate-in fade-in">
    <section className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#c6c5d4] rounded-2xl px-5 py-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#000666] text-white flex items-center justify-center"><span className="material-symbols-outlined">qr_code_scanner</span></div>
        <div><h1 className="font-black text-lg">Crew Scanner</h1><p className="text-xs text-[#767683]">Onboard concession-pass verification</p></div>
      </div>
      <div className="text-right text-xs"><p className="font-bold">{userProfile.name}</p><p className="font-mono text-[#000666]">{userProfile.passId} · Trip active</p></div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
      <aside className="space-y-5">
        <section className="bg-white rounded-3xl border border-[#c6c5d4] shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#eae8e7] pb-3"><h2 className="font-black text-base flex gap-2 items-center"><span className="material-symbols-outlined text-[#000666]">directions_bus</span>Trip control</h2><span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-1 rounded-full">● TRIP ACTIVE</span></div>
          <label className="block text-xs font-bold">Bus number<input value={busNumber} onChange={(e) => setBusNumber(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#c6c5d4] px-3 py-3 font-bold focus:outline-none focus:border-[#000666]" /></label>
          <label className="block text-xs font-bold">Active route<select value={tripRoute} onChange={(e) => setTripRoute(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#c6c5d4] px-3 py-3 bg-white text-xs font-semibold focus:outline-none focus:border-[#000666]">{routeOptions.map((route) => <option key={route}>{route}</option>)}</select></label>
          <div className="rounded-2xl bg-[#f5f3f3] p-3 text-xs space-y-1"><p><span className="text-[#767683]">Depot HQ:</span> <b>Patiala Central Depot (Zone 1)</b></p><p><span className="text-[#767683]">Crew pass ID:</span> <b className="text-[#000666]">{userProfile.passId}</b></p></div>
        </section>
        <section className="bg-white rounded-3xl border border-[#c6c5d4] p-5"><div className="flex justify-between text-xs font-black uppercase tracking-wide"><span>Recent allotted slips</span><span className="text-[#767683] normal-case">This trip</span></div>{slips.length ? <div className="mt-3 space-y-2">{slips.map((slip) => <div key={`${slip.passId}-${slip.time}`} className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-xs"><b>{slip.name}</b><div className="text-[#767683]">{slip.passId} · {slip.time}</div></div>)}</div> : <p className="mt-3 text-xs text-[#767683]">No passengers boarded in this session.</p>}</section>
      </aside>

      <section className="bg-white rounded-3xl border border-[#c6c5d4] shadow-xs p-5 sm:p-6">
        <div className="flex justify-between gap-3 items-start border-b border-[#eae8e7] pb-4"><div><h2 className="font-black text-lg flex items-center gap-2"><span className="material-symbols-outlined text-[#000666]">qr_code_2</span>Verify passenger pass</h2><p className="text-xs text-[#767683] mt-1">Scan the PRTC-issued QR or paste its signed payload.</p></div><span className="text-[10px] font-bold text-[#767683]">INSTANT ROUTE VALIDATION</span></div>
        <div className="mt-5 flex flex-col sm:flex-row gap-2"><button onClick={scanning ? stopCamera : startCamera} className="px-4 py-3 rounded-xl border-2 border-[#000666] text-[#000666] font-black text-xs flex justify-center items-center gap-2"><span className="material-symbols-outlined text-base">photo_camera</span>{scanning ? 'Stop camera' : 'Open live QR camera'}</button><input value={payload} onChange={(e) => setPayload(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verify()} placeholder="Pass / QR payload" className="flex-1 rounded-xl border border-[#c6c5d4] px-3 text-xs font-mono focus:outline-none focus:border-[#000666] min-h-11"/><button onClick={() => verify()} disabled={loading || !payload.trim()} className="px-5 py-3 rounded-xl bg-[#000666] text-white font-black text-xs disabled:opacity-40">{loading ? 'Checking…' : 'Verify'}</button></div>
        {scanning && <div id="conductor-qr-reader" className="mt-4 max-w-sm rounded-2xl overflow-hidden border border-[#c6c5d4]" />}
        {verified && <div className={`mt-5 border-2 rounded-3xl p-5 ${canBoard ? 'border-emerald-500 bg-emerald-50' : 'border-red-400 bg-red-50'}`}>
          <div className="flex justify-between items-center gap-3 border-b border-emerald-200/70 pb-3"><div className="flex items-center gap-2 font-black text-sm"><span className={`material-symbols-outlined ${canBoard ? 'text-emerald-700' : 'text-red-700'}`}>{canBoard ? 'verified' : 'gpp_bad'}</span>{canBoard ? 'VERIFIED VALID PASS' : 'PASS VALID — ROUTE NOT AUTHORIZED'}</div><span className={`text-[10px] font-black rounded-full px-3 py-1 ${canBoard ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>{canBoard ? 'ACTIVE' : 'DO NOT BOARD'}</span></div>
          <div className="mt-4 flex flex-col sm:flex-row gap-4"><div className="w-28 h-36 rounded-2xl overflow-hidden shrink-0 border-4 border-emerald-500 bg-white">{verified.data.avatarUrl ? <img src={verified.data.avatarUrl} alt={verified.data.holderName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-3xl text-emerald-800">{verified.data.holderName.slice(0, 1)}</div>}</div><div className="flex-1"><h3 className="font-black text-xl">{verified.data.holderName}</h3><p className="text-xs font-bold text-[#454652]">Roll No: {verified.data.rollNumber}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs"><Info label="College" value={verified.data.collegeName || 'Verified institution'} /><Info label="Pass type" value={verified.data.passType} /><Info label="Course" value={[verified.data.course, verified.data.semester].filter(Boolean).join(' · ') || 'Student concession'} /><Info label="Expiry" value={verified.data.expiresAt ? new Date(verified.data.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Active'} /></div><div className="mt-2 rounded-xl border border-emerald-200 bg-white/70 p-2.5 text-xs"><span className="font-black text-[#767683] uppercase text-[9px]">Authorized route</span><p className="font-bold">{verified.data.route}</p><p className={`mt-1 font-bold ${canBoard ? 'text-emerald-800' : 'text-red-700'}`}>{verified.data.routeMessage}</p></div></div></div>
          <div className="mt-5 pt-4 border-t border-emerald-200 flex gap-3"><button onClick={markBoarded} disabled={!canBoard} className="flex-1 rounded-xl bg-emerald-600 text-white py-3 text-xs font-black disabled:opacity-40 flex justify-center gap-2"><span className="material-symbols-outlined text-sm">confirmation_number</span>MARK BOARDED & ALLOT TICKET</button><button onClick={() => { setResult(null); setPayload(''); }} className="rounded-xl bg-white border border-red-200 text-red-700 px-4 text-xs font-black">Reject</button></div>
        </div>}
        {result && 'error' in result && <div className="mt-5 rounded-2xl border-2 border-red-400 bg-red-50 p-4 text-sm font-bold text-red-800 flex gap-2"><span className="material-symbols-outlined">gpp_bad</span>{result.error}</div>}
      </section>
    </div>
  </div>;
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="rounded-xl border border-emerald-100 bg-white/80 px-3 py-2"><p className="text-[9px] uppercase font-black text-[#767683]">{label}</p><p className="font-bold text-[#1b1c1c] mt-0.5">{value}</p></div>;
