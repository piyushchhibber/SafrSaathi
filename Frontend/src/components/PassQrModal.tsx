import React, { useEffect, useState } from 'react';

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
    concession?: string;
    amount?: string | number;
  } | null;
  onClose: () => void;
}

export const PassQrModal: React.FC<PassQrModalProps> = ({ passData, onClose }) => {
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
      (passData?.passId && (passData.passId.startsWith('PRTC-STU') || passData.passId.startsWith('STU-'))) ||
      (passData?.ticketNumber && (passData.ticketNumber.startsWith('PRTC-STU') || passData.ticketNumber.startsWith('STU-'))) ||
      (passData?.concession && passData.concession.toLowerCase().includes('student')) ||
      Boolean(passData?.college && !passData?.college.includes('PRTC Punjab') && !passData?.college.includes('Pepsu Road'))
    )
  );

  const getInitialSeconds = () => {
    if (isDirectTicket) return 6 * 3600; // 6 hours for direct bus ticket
    if (isOneDayPass) return 24 * 3600; // 24 hours (1 day) for One-Day Pass
    if (isCorporatePass) return 30 * 24 * 3600; // 1 month (30 days) for Corporate Pass
    if (isStudentPass) return 90 * 24 * 3600; // 3 months (90 days) for Student Concession Pass
    return 6 * 3600; // default 6 hours
  };

  const [secondsRemaining, setSecondsRemaining] = useState(getInitialSeconds);

  useEffect(() => {
    // Reset timer to exact duration every time passData opens
    setSecondsRemaining(getInitialSeconds());
    
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [passData]);

  if (!passData) return null;

  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const displayName = passData.name || passData.holderName || 'Navjot Singh Dhillon';
  const displayPassId = passData.passId || passData.ticketNumber || 'PRTC-PASS-8891';
  const displayPassType =
    passData.passType ||
    passData.title ||
    (isStudentPass
      ? 'Subsidized Student Pass (3 Months)'
      : isCorporatePass
      ? 'Corporate Executive Pass (1 Month)'
      : isOneDayPass
      ? 'One Day Unlimited Pass (24 Hours)'
      : 'Direct Express Ticket (6 Hours)');
  const displayRoute = passData.route || 'All Punjab Regional Transit Corridors';
  const displayValidity = isStudentPass
    ? '3 Months (Quarterly Concession Valid)'
    : isCorporatePass
    ? '1 Month (Corporate Pass Valid)'
    : isOneDayPass
    ? '24 Hours (50 KM Radial Pass Valid)'
    : '6 Hours (Single Journey Valid)';

  const timerTitle = isStudentPass
    ? '3-Month Pass Countdown'
    : isCorporatePass
    ? '1-Month Pass Countdown'
    : isOneDayPass
    ? '24-Hour Pass Countdown'
    : '6-Hour Ticket Countdown';

  const statusBadgeText = isStudentPass
    ? '3 MONTHS ACTIVE'
    : isCorporatePass
    ? '1 MONTH ACTIVE'
    : isOneDayPass
    ? '24 HOURS ACTIVE'
    : '6 HOURS VALID';

  const statusSubtext = isStudentPass
    ? 'Quarterly Concession'
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white text-[#000666] flex items-center justify-center font-bold text-xs">
                P
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-none">PRTC DIGITAL PASS</h3>
                <span className="text-[10px] text-[#bdc2ff]">Govt. of Punjab Official Transit</span>
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
            <div className="w-48 h-48 bg-[#f5f3f3] rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
              {/* QR Pattern visual */}
              <div className="grid grid-cols-6 gap-1 w-full h-full opacity-80">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                        ? 'bg-[#000666]'
                        : i % 5 === 0
                          ? 'bg-[#1a237e]'
                          : 'bg-white'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#000666] flex items-center justify-center text-[#000666] shadow-md font-bold text-xs">
                  PRTC
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#767683] mt-2">
              SECURITY CODE: {displayPassId}
            </div>
          </div>

          {/* Details */}
          <div className="w-full text-left bg-[#fbf9f8] border border-[#c6c5d4] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#767683]">Beneficiary Name:</span>
              <span className="font-bold text-[#1b1c1c]">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#767683]">Pass Type:</span>
              <span className="font-semibold text-[#000666]">{displayPassType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#767683]">Coverage Route:</span>
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
