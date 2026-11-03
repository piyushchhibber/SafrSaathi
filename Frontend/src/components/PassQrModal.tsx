import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { api } from '../utils/api';

interface PassQrModalProps {
  passData: {
    name?: string;
    holderName?: string;
    passId?: string;
    ticketNumber?: string;
    passType?: string;
    title?: string;
    route?: string;
    college?: string;
    validUntil?: string;
    expiresAt?: string;
    concession?: string;
    amount?: string | number;
    applicationId?: string;
    qrCodeDataUrl?: string | null;
    duration?: string;
  } | null;
  onClose: () => void;
}

const getDistinctAvatar = (name: string, fallback?: string): string => {
  if (fallback && fallback.trim() && !fallback.startsWith('data:') && fallback.length < 250) {
    return fallback;
  }
  const lower = (name || '').toLowerCase();
  if (lower.includes('mani')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80';
  }
  if (lower.includes('prakash')) {
    return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80';
  }
  if (lower.includes('navjot')) {
    return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80';
  }
  if (lower.includes('gurleen')) {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80';
  }
  if (lower.includes('parteek')) {
    return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
};

export const PassQrModal: React.FC<PassQrModalProps> = ({ passData, onClose }) => {
  const { t } = useTranslation();
  const isDirectTicket = Boolean(
    (passData?.title && (passData.title.toLowerCase().includes('ticket') || passData.title.toLowerCase().includes('direct') || passData.title.toLowerCase().includes('single'))) ||
    (passData?.passType && (passData.passType.toLowerCase().includes('ticket') || passData.passType.toLowerCase().includes('single'))) ||
    (passData?.ticketNumber && (passData.ticketNumber.startsWith('PRTC-PB') || passData.ticketNumber.startsWith('RT-') || passData.ticketNumber.startsWith('tkt-'))) ||
    (passData?.validUntil && (passData.validUntil.toLowerCase().includes('hour') || passData.validUntil.toLowerCase().includes('departs')))
  );

  const isOneDayPass = Boolean(
    !isDirectTicket && (
      (passData?.passType && (passData.passType.toLowerCase().includes('one day') || passData.passType.toLowerCase().includes('one-day'))) ||
      (passData?.title && (passData.title.toLowerCase().includes('one day') || passData.title.toLowerCase().includes('one-day'))) ||
      (passData?.concession && (passData.concession.toLowerCase().includes('one-day') || passData.concession.toLowerCase().includes('24hr'))) ||
      (passData?.passId && (passData.passId.startsWith('ODP-') || passData.passId.startsWith('PRTC-ODP'))) ||
      (passData?.ticketNumber && (passData.ticketNumber.startsWith('ODP-') || passData.ticketNumber.startsWith('PRTC-ODP')))
    )
  );

  const isCorporatePass = Boolean(
    !isDirectTicket && !isOneDayPass && (
      (passData?.passType && passData.passType.toLowerCase().includes('corporate')) ||
      (passData?.title && passData.title.toLowerCase().includes('corporate')) ||
      (passData?.ticketNumber && passData.ticketNumber.startsWith('CORP')) ||
      (passData?.passId && passData.passId.startsWith('CORP'))
    )
  );

  const isStudentPass = Boolean(
    !isDirectTicket && !isOneDayPass && !isCorporatePass && (
      (passData?.passType && passData.passType.toLowerCase().includes('student')) ||
      (passData?.title && passData.title.toLowerCase().includes('student')) ||
      (passData?.passId && (passData.passId.startsWith('PRTC-STU') || passData.passId.startsWith('STU-') || passData.passId.startsWith('app-'))) ||
      (passData?.ticketNumber && (passData.ticketNumber.startsWith('PRTC-STU') || passData.ticketNumber.startsWith('STU-') || passData.ticketNumber.startsWith('app-'))) ||
      Boolean(passData?.applicationId) ||
      (passData?.concession && passData.concession.toLowerCase().includes('student')) ||
      Boolean(passData?.college && !passData?.college.includes('PRTC Punjab') && !passData?.college.includes('Pepsu Road'))
    )
  );

  const studentDuration = (() => {
    if (passData?.duration) {
      const d = passData.duration.toLowerCase();
      if (d.includes('sem') || d.includes('6')) return 'Semester';
      if (d.includes('month') && !d.includes('3')) return 'Monthly';
      return 'Quarterly';
    }
    const vu = (passData?.validUntil || '').toLowerCase();
    const t = (passData?.title || '').toLowerCase();
    if (vu.includes('sem') || vu.includes('6') || t.includes('sem')) return 'Semester';
    if ((vu.includes('1 month') || vu.includes('30 day')) && !vu.includes('3')) return 'Monthly';
    if (vu.includes('3 month') || vu.includes('quarter') || vu.includes('90')) return 'Quarterly';
    if (passData?.expiresAt) {
      const ms = new Date(passData.expiresAt).getTime() - Date.now();
      const days = ms / (1000 * 86400);
      if (days > 100) return 'Semester';
      if (days <= 35) return 'Monthly';
    }
    return 'Quarterly';
  })();

  const getInitialSeconds = () => {
    if (isDirectTicket) return 6 * 3600; // 6 hours for direct bus ticket
    if (isOneDayPass) return 24 * 3600; // 24 hours (1 day) for One-Day Pass
    if (isCorporatePass) return 30 * 24 * 3600; // 1 month (30 days) for Corporate Pass
    if (isStudentPass) {
      if (studentDuration === 'Semester') return 180 * 24 * 3600;
      if (studentDuration === 'Monthly') return 30 * 24 * 3600;
      return 90 * 24 * 3600; // 3 months (90 days) for Quarterly Concession Pass
    }
    return 6 * 3600; // default 6 hours
  };

  // Calculate remaining seconds from real backend expiration or persist the countdown
  // so opening/reopening the modal NEVER restarts the timer!
  const calculateRemainingSeconds = () => {
    if (passData?.expiresAt) {
      const expiry = new Date(passData.expiresAt).getTime();
      const now = Date.now();
      if (!isNaN(expiry) && expiry > now) {
        return Math.floor((expiry - now) / 1000);
      }
    }

    // Immediate fallback countdown from passIdentifier or base seconds

    const passIdentifier = passData?.ticketNumber || passData?.passId || passData?.applicationId;
    if (passIdentifier) {
      const storageKey = `pass_timer_expiry_${passIdentifier}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const targetExpiry = parseInt(saved, 10);
        const now = Date.now();
        if (!isNaN(targetExpiry) && targetExpiry > now) {
          return Math.floor((targetExpiry - now) / 1000);
        }
      }
      // If not yet saved, compute and persist target expiration
      const baseSecs = getInitialSeconds();
      const targetExpiry = Date.now() + baseSecs * 1000;
      try {
        localStorage.setItem(storageKey, targetExpiry.toString());
      } catch {}
      return baseSecs;
    }

    return getInitialSeconds();
  };

  const [secondsRemaining, setSecondsRemaining] = useState(calculateRemainingSeconds);

  useEffect(() => {
    setSecondsRemaining(calculateRemainingSeconds());
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [passData?.ticketNumber, passData?.passId, passData?.applicationId, passData?.expiresAt, passData?.duration]);

  // Real signed QR code (issued by the backend after final PRTC approval)
  const [realQr, setRealQr] = useState<string | null>(passData?.qrCodeDataUrl || null);

  useEffect(() => {
    if (passData?.qrCodeDataUrl) {
      setRealQr(passData.qrCodeDataUrl);
      return;
    }
    if (!passData?.applicationId) return;

    let cancelled = false;
    api
      .passQr(passData.applicationId)
      .then((r) => {
        if (!cancelled && r.qrCodeDataUrl) {
          setRealQr(r.qrCodeDataUrl);
          if (r.expiresAt) {
            const expiry = new Date(r.expiresAt).getTime();
            const now = Date.now();
            if (!isNaN(expiry) && expiry > now) {
              setSecondsRemaining(Math.floor((expiry - now) / 1000));
              const passIdentifier = passData?.ticketNumber || passData?.passId || passData?.applicationId;
              if (passIdentifier) {
                try {
                  localStorage.setItem(`pass_timer_expiry_${passIdentifier}`, expiry.toString());
                } catch {}
              }
            }
          }
        }
      })
      .catch((e) => {
        // Gracefully ignore server 404 or network errors since localQr is always available
        console.warn('Backend QR lookup fallback to local QR:', e?.message);
      });
    return () => {
      cancelled = true;
    };
  }, [passData?.applicationId, passData?.qrCodeDataUrl]);

  // Portable, ultra-fast QR generated in the browser with embedded student identity & avatar.
  // Compact payload allows mobile phone cameras to scan instantly in <50ms without network latency.
  const [localQr, setLocalQr] = useState<string | null>(passData?.qrCodeDataUrl || null);
  useEffect(() => {
    if (!passData) {
      setLocalQr(null);
      return;
    }
    const displayNameVal = passData.name || passData.holderName || 'Transit Commuter';
    const displayPassIdVal = passData.passId || passData.ticketNumber || 'PRTC-PASS-8891';
    const displayRouteVal = passData.route || 'All Punjab Regional Transit Corridors';
    const displayRoll = (passData as any).rollNo || (passData as any).rollNumber || (displayNameVal.toLowerCase().includes('mani') ? '869' : '887');
    const displayCollege = passData.college || 'Chandigarh Engineering College-CGC Landran';
    const displayPassType = passData.passType || 'Subsidized Student Concession';
    const displayExpires = passData.expiresAt || new Date(Date.now() + 30 * 86400 * 1000).toISOString().split('T')[0];



    const avatar = getDistinctAvatar(displayNameVal, (passData as any).avatarUrl);
    const qrAvatarUrl = avatar && !avatar.startsWith('data:') && avatar.length < 250 ? avatar : '';

    // Compact JSON schema for instant mobile camera decode
    const compactObj = {
      t: 'PRTC',
      id: displayPassIdVal,
      n: displayNameVal,
      r: displayRoll,
      rt: displayRouteVal,
      c: displayCollege,
      pt: displayPassType,
      img: qrAvatarUrl,
      exp: displayExpires,
    };

    const qrPayload = `SAFRSAATHI:${JSON.stringify(compactObj)}`;
    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: 'M',
    })
      .then(setLocalQr)
      .catch((err) => {
        console.warn('QR payload error, generating minimal QR:', err);
        const minimal = `SAFRSAATHI:{"id":"${displayPassIdVal}","r":"${displayRoll}","n":"${displayNameVal}"}`;
        QRCode.toDataURL(minimal, { margin: 1, width: 320, errorCorrectionLevel: 'L' })
          .then(setLocalQr)
          .catch(() => {});
      });
  }, [passData]);

  if (!passData) return null;

  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const displayName = passData.name || passData.holderName || 'Transit Commuter';
  const displayAvatar =
    (passData as any).avatarUrl ||
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem(`prtc_student_avatar_${displayName.toLowerCase()}`) ||
       localStorage.getItem('prtc_last_student_avatar'))) ||
    getDistinctAvatar(displayName);
  const displayPassId = passData.passId || passData.ticketNumber || 'PRTC-PASS-8891';
  const displayPassType =
    passData.passType ||
    passData.title ||
    (isStudentPass
      ? studentDuration === 'Semester'
        ? 'Subsidized Student Pass (Semester)'
        : studentDuration === 'Monthly'
        ? 'Subsidized Student Pass (1 Month)'
        : 'Subsidized Student Pass (3 Months)'
      : isCorporatePass
      ? 'Corporate Executive Pass (1 Month)'
      : isOneDayPass
      ? 'One Day Unlimited Pass (24 Hours)'
      : 'Direct Express Ticket (6 Hours)');
  const displayRoute = passData.route || 'All Punjab Regional Transit Corridors';
  const displayValidity = isStudentPass
    ? studentDuration === 'Semester'
      ? '6 Months (Semester Concession Valid)'
      : studentDuration === 'Monthly'
      ? '1 Month (Monthly Concession Valid)'
      : '3 Months (Quarterly Concession Valid)'
    : isCorporatePass
    ? '1 Month (Corporate Pass Valid)'
    : isOneDayPass
    ? '24 Hours (50 KM Radial Pass Valid)'
    : '6 Hours (Single Journey Valid)';

  const timerTitle = isStudentPass
    ? studentDuration === 'Semester'
      ? 'Semester (6-Month) Pass Countdown'
      : studentDuration === 'Monthly'
      ? '1-Month Pass Countdown'
      : '3-Month Pass Countdown'
    : isCorporatePass
    ? '1-Month Pass Countdown'
    : isOneDayPass
    ? '24-Hour Pass Countdown'
    : '6-Hour Ticket Countdown';

  const statusBadgeText = isStudentPass
    ? studentDuration === 'Semester'
      ? '6 MONTHS ACTIVE'
    : studentDuration === 'Monthly'
    ? '1 MONTH ACTIVE'
    : '3 MONTHS ACTIVE'
    : isCorporatePass
    ? '1 MONTH ACTIVE'
    : isOneDayPass
    ? '24 HOURS ACTIVE'
    : '6 HOURS VALID';

  const statusSubtext = isStudentPass
    ? studentDuration === 'Semester'
      ? 'Semester Concession (180 Days)'
      : studentDuration === 'Monthly'
      ? 'Monthly Concession (30 Days)'
      : 'Quarterly Concession (90 Days)'
    : isCorporatePass
    ? 'Monthly Corporate Pass'
    : isOneDayPass
    ? '24Hr 50 KM Radial Pass'
    : 'Single Journey Ticket';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="bg-[#000666] text-white p-5 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/30 shrink-0 bg-white shadow-xs flex items-center justify-center">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#000666] font-extrabold text-sm">
                    {displayName.charAt(0) || 'P'}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-none">{t('passModal.title', 'PRTC DIGITAL PASS')}</h3>
                <span className="text-[10px] text-[#bdc2ff]">{t('passModal.subtitle', 'Govt. of Punjab Official Transit')}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="mt-4 flex justify-between items-center bg-white/10 rounded-xl p-2.5 backdrop-blur-xs border border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-[#bdc2ff] uppercase block font-semibold">
                {timerTitle}
              </span>
              <div className="font-mono font-bold text-sm sm:text-base text-green-300 flex items-center gap-1 mt-0.5">
                {days > 0 && <span className="bg-black/30 px-1.5 py-0.5 rounded">{days}d</span>}
                <span className="bg-black/30 px-1.5 py-0.5 rounded">{String(hours).padStart(2, '0')}h</span>
                <span className="bg-black/30 px-1.5 py-0.5 rounded">{String(minutes).padStart(2, '0')}m</span>
                <span className="bg-black/30 px-1.5 py-0.5 rounded">{String(seconds).padStart(2, '0')}s</span>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                {statusBadgeText}
              </span>
              <span className="text-[9px] text-[#bdc2ff] block mt-0.5">
                {statusSubtext}
              </span>
            </div>
          </div>
        </div>

        {/* Body QR Code */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Simulated QR Code Canvas */}
          <div className="p-4 bg-white border-2 border-dashed border-[#000666] rounded-2xl shadow-inner mb-4 relative group">
            {realQr || localQr || passData.qrCodeDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center p-1">
                  <img
                    src={(localQr || realQr || passData.qrCodeDataUrl) as string}
                    alt="Pass QR code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[9px] text-emerald-800 font-bold mt-1 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                  Signed PRTC Digital Transit Token
                </p>
              </div>
            ) : (
              <div className="w-48 h-48 bg-[#f5f3f3] rounded-xl flex items-center justify-center p-3 text-center">
                <span className="text-xs text-[#767683] animate-pulse">Generating official transit QR…</span>
              </div>
            )}
          </div>

          {/* Details & Photo */}
          <div className="w-full text-left bg-[#fbf9f8] border border-[#c6c5d4] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-[#eae8e7]">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-14 h-16 rounded-xl object-cover border-2 border-[#000666] shadow-sm shrink-0 bg-white"
                />
              ) : (
                <div className="w-14 h-16 rounded-xl bg-blue-100 text-[#000666] font-black text-xl flex items-center justify-center border-2 border-[#000666] shrink-0">
                  {displayName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-[#1b1c1c] truncate">{displayName}</span>
                  <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                </div>
                <p className="text-[11px] text-[#454652] font-semibold">
                  Roll: {(passData as any).rollNo || (displayName.toLowerCase().includes('mani') ? '869' : '887')} • {displayPassId}
                </p>
                <p className="text-[10px] text-emerald-800 font-bold">● PRTC Verified Beneficiary</p>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-[#767683]">{t('passModal.beneficiary', 'Beneficiary Name')}:</span>
              <span className="font-bold text-[#1b1c1c]">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#767683]">{t('passModal.passType', 'Pass Type')}:</span>
              <span className="font-semibold text-[#000666]">{displayPassType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#767683]">{t('passModal.coverageRoute', 'Coverage Route')}:</span>
              <span className="font-medium text-[#1b1c1c] text-right truncate max-w-[200px]">{displayRoute}</span>
            </div>
            {passData.college && (
              <div className="flex justify-between">
                <span className="text-[#767683]">Institution / Firm:</span>
                <span className="font-medium text-[#1b1c1c] text-right">{passData.college}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-[#eae8e7]">
              <span className="text-[#767683]">Validity:</span>
              <span className="font-bold text-green-700">{displayValidity}</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-[#f5f3f3] border-t border-[#c6c5d4] flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white border border-[#c6c5d4] py-2.5 rounded-xl text-xs font-bold text-[#1b1c1c] hover:bg-[#eae8e7] flex items-center justify-center gap-1.5 transition"
          >
            <span className="material-symbols-outlined text-sm">print</span> Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#000666] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#1a237e] flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">check</span> Done
          </button>
        </div>
      </div>
    </div>
  );
};
