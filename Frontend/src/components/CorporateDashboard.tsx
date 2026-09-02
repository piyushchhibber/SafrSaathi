import React, { useState } from 'react';
import { UserProfile, BusTicket } from '../types';
import confetti from 'canvas-confetti';
import { PaymentGatewayModal, PaymentItemDetails } from './PaymentGatewayModal';

interface CorporateDashboardProps {
  userProfile: UserProfile;
  onOpenPassModal: (passData: any) => void;
  onOpenEditProfile: () => void;
}

export const CorporateDashboard: React.FC<CorporateDashboardProps> = ({
  userProfile,
  onOpenPassModal,
  onOpenEditProfile,
}) => {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('Chandigarh ISBT 43 -> Mohali Quark City / IT Park');
  const [passCategory, setPassCategory] = useState<'Executive HVAC' | 'Standard AC' | 'Metro Intercity'>('Executive HVAC');
  const [passDuration, setPassDuration] = useState<'Monthly' | 'Quarterly'>('Monthly');
  const [employeeName, setEmployeeName] = useState(userProfile?.name || 'Rohit Verma');
  const [employeeId, setEmployeeId] = useState(userProfile?.corporateId || 'INF-8849');
  const [companyName, setCompanyName] = useState(userProfile?.companyName || 'Infosys Limited (Mohali IT Park)');
  const [corporateGstin, setCorporateGstin] = useState('03AAACI1234F1Z9');

  // Payment Gateway Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentItemData, setPaymentItemData] = useState<PaymentItemDetails | null>(null);

  const [corporateTickets, setCorporateTickets] = useState<BusTicket[]>([
    {
      id: 'corp-pass-1',
      ticketNumber: userProfile?.passId || 'CORP-INF-8849',
      title: 'Corporate Executive 1-Month Pass',
      type: 'corporate_pass',
      route: 'Chandigarh ISBT 43 -> Mohali Quark City / IT Park',
      timestamp: '01 Aug 2026',
      amount: 1450.0,
      status: 'active',
      validUntil: '1 Month Active (30 Days)',
      companyName: userProfile?.companyName || 'Infosys Limited',
      holderName: `${userProfile?.name || 'Rohit Verma'} (${userProfile?.designation || 'Lead'})`,
    },
    {
      id: 'corp-pass-2',
      ticketNumber: 'CORP-INF-9912',
      title: 'Corporate Standard AC 1-Month Pass',
      type: 'corporate_pass',
      route: 'Ludhiana Bus Stand -> Khanna Industrial Area',
      timestamp: '15 Jul 2026',
      amount: 1200.0,
      status: 'expired',
      validUntil: 'Expired (1 Month Term Ended)',
      companyName: userProfile.companyName || 'Infosys Limited',
      holderName: 'Aarav Patel (Software Engg)',
    },
  ]);

  const activePass = corporateTickets[0];

  const getBaseRate = () => {
    switch (passCategory) {
      case 'Executive HVAC':
        return 1450;
      case 'Standard AC':
        return 1200;
      case 'Metro Intercity':
        return 1600;
      default:
        return 1450;
    }
  };

  const calculateTotal = () => {
    const base = getBaseRate();
    const multiplier = passDuration === 'Quarterly' ? 2.8 : 1; // 20% discount on quarterly
    return Math.round(base * multiplier);
  };

  const handleProceedToPaymentGateway = (e: React.FormEvent) => {
    e.preventDefault();
    const total = calculateTotal();
    const gst = Math.round(total * 0.05);

    const item: PaymentItemDetails = {
      category: 'corporate',
      title: `Corporate ${passCategory} Pass (${passDuration})`,
      subtitle: `Route: ${selectedRoute} • Employee: ${employeeName} (${employeeId})`,
      route: selectedRoute,
      passDuration,
      passCategory,
      holderName: `${employeeName}`,
      holderId: employeeId,
      companyName,
      rawAmount: total,
      taxAmount: gst,
      totalAmount: total + gst,
      avatarUrl: userProfile.avatarUrl,
    };

    setPaymentItemData(item);
    setIsBuyModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (generatedPass: any) => {
    setIsPaymentModalOpen(false);
    const newPass: BusTicket = {
      id: generatedPass.id || `corp-pass-${Date.now()}`,
      ticketNumber: generatedPass.ticketNumber,
      title: generatedPass.title,
      type: 'corporate_pass',
      route: selectedRoute,
      timestamp: 'Just now',
      amount: generatedPass.amount,
      status: 'active',
      validUntil: generatedPass.validUntil,
      companyName: companyName,
      holderName: `${employeeName} (ID: ${employeeId})`,
    };

    setCorporateTickets([newPass, ...corporateTickets]);
    confetti({ particleCount: 80, spread: 70 });
  };

  const virtualPassData = {
    ticketNumber: activePass?.ticketNumber || userProfile.passId || 'CORP-INF-8849',
    holderName: activePass?.holderName || userProfile.name,
    title: activePass?.title || 'Corporate Executive 1-Month Pass',
    route: activePass?.route || 'Chandigarh ISBT 43 -> Mohali Quark City / IT Park',
    college: userProfile.companyName || userProfile.institution || 'Infosys Limited (Mohali IT Park)',
    validUntil: activePass?.validUntil || '1 Month Active (30 Days)',
    rollNo: userProfile.corporateId || 'CORP-PB-INF-09',
    avatarUrl: userProfile.avatarUrl,
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#000666] shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#1b1c1c] tracking-tight">{userProfile.name}</h2>
              <span className="text-[10px] bg-indigo-100 text-indigo-900 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
                CORPORATE COMMUTER
              </span>
            </div>
            <p className="text-xs text-[#454652] mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#000666]">business</span>
              {userProfile.companyName || 'Infosys Limited'} • ID: {userProfile.corporateId || 'CORP-PB-091'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenEditProfile}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#c6c5d4] hover:bg-[#eae8e7] text-xs font-bold text-[#1b1c1c] transition flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">edit_square</span>
            Edit Profile
          </button>
          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#000666] hover:bg-[#1a237e] text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            Buy Pass with Payment Gateway
          </button>
        </div>
      </div>

      {/* Main Grid: Virtual Corporate Pass & Pass Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Col: VIRTUAL CORPORATE PASS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-lg">badge</span>
              Corporate Digital Transit Pass
            </h3>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              Active Monthly Pass
            </span>
          </div>

          {/* Authentic Corporate Pass Graphic Card */}
          <div className="bg-gradient-to-br from-[#000666] via-[#1a237e] to-[#0a0e2a] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-white/10 relative overflow-hidden">
            {/* Background Watermark */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[180px]">corporate_fare</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/15 pb-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded text-white">
                    PRTC CORPORATE COMMUTE
                  </span>
                </div>
                <h4 className="font-extrabold text-base mt-1 text-white tracking-tight">
                  {userProfile.companyName || 'INFOSYS LIMITED'}
                </h4>
                <p className="text-[11px] text-[#bdc2ff]">{activePass?.title || 'Executive Monthly Transit Pass'}</p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-300 text-xl">workspace_premium</span>
              </div>
            </div>

            {/* Photo & Employee Info */}
            <div className="mt-4 flex gap-4 items-center">
              <div className="relative shrink-0">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-20 h-24 rounded-2xl object-cover border-2 border-white/40 shadow-md bg-white/10"
                />
                <div className="absolute -bottom-1.5 -left-1.5 bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                  ACTIVE
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                  {activePass?.holderName || userProfile.name}
                </h3>
                <p className="text-xs text-[#bdc2ff] font-medium leading-tight">
                  {userProfile.companyName || 'Infosys Limited (Mohali IT Park)'}
                </p>
                <div className="pt-1 grid grid-cols-2 gap-1 text-[11px]">
                  <div>
                    <span className="text-white/60 block text-[9px] uppercase font-bold">Corp ID</span>
                    <span className="font-mono font-bold text-white">{userProfile.corporateId || 'INF-8849'}</span>
                  </div>
                  <div>
                    <span className="text-white/60 block text-[9px] uppercase font-bold">Pass ID</span>
                    <span className="font-mono font-bold text-amber-300">
                      {activePass?.ticketNumber || 'CORP-INF-8849'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approved Route Banner */}
            <div className="mt-4 bg-black/30 border border-white/10 rounded-2xl p-3">
              <div className="flex items-center justify-between text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">
                <span>Sanctioned Corporate Corridor</span>
                <span className="text-amber-300">Executive AC</span>
              </div>
              <p className="text-xs font-bold text-white leading-snug">
                {activePass?.route || 'Chandigarh ISBT 43 -> Mohali Quark City / IT Park'}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-[#bdc2ff] border-t border-white/10 pt-1.5">
                <span>Valid: {activePass?.validUntil || '1 Month Active (30 Days)'}</span>
                <span className="text-green-400 font-bold">Govt Verified Fleet</span>
              </div>
            </div>

            {/* Dynamic QR Code & Conductor Scan Bar */}
            <div className="mt-4 bg-white rounded-2xl p-3.5 flex items-center justify-between gap-3 text-black">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3zm0 5h3v3h-3v-3zm5-2h3v2h-3v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                    <span className="text-xs font-black text-[#000666]">CORPORATE TOKEN</span>
                  </div>
                  <p className="text-[10px] text-[#767683] mt-0.5">Encrypted PRTC Conductor QR</p>
                </div>
              </div>

              <button
                onClick={() => onOpenPassModal(virtualPassData)}
                className="px-3 py-1.5 rounded-xl bg-[#000666] text-white font-bold text-xs hover:bg-[#1a237e] transition shadow-xs shrink-0"
              >
                Scan / View
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: CORPORATE PASS MANAGEMENT & PURCHASE */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-lg">history_edu</span>
              Corporate Transit Passes & Invoices
            </h3>
            <button
              onClick={() => setIsBuyModalOpen(true)}
              className="text-xs font-bold text-[#000666] hover:underline"
            >
              + Buy New Pass
            </button>
          </div>

          {/* List of passes */}
          <div className="space-y-3">
            {corporateTickets.map((ticket) => {
              const isActive = ticket.status === 'active';

              return (
                <div
                  key={ticket.id}
                  onClick={() =>
                    onOpenPassModal({
                      ticketNumber: ticket.ticketNumber,
                      holderName: ticket.holderName,
                      title: ticket.title,
                      route: ticket.route,
                      validUntil: ticket.validUntil || 'Active',
                      college: companyName,
                      avatarUrl: userProfile.avatarUrl,
                    })
                  }
                  className="bg-white hover:bg-[#fbf9f8] border border-[#c6c5d4] rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition shadow-xs group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                        isActive ? 'bg-[#000666] text-white shadow-xs' : 'bg-[#eae8e7] text-[#767683]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {isActive ? 'qr_code_2' : 'receipt_long'}
                      </span>
                    </div>

                    <div>
                      <div className="font-black text-sm text-[#1b1c1c] group-hover:text-[#000666] flex items-center gap-2">
                        {ticket.title}
                        {isActive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                      </div>
                      <p className="text-xs text-[#454652] mt-0.5">{ticket.route}</p>
                      <p className="text-[11px] text-[#767683] mt-0.5">
                        Holder: {ticket.holderName} • {ticket.validUntil}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-[#1b1c1c]">
                      ₹{ticket.amount.toFixed(2)}
                    </span>
                    <span
                      className={`block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        isActive
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-[#eae8e7] text-[#767683]'
                      }`}
                    >
                      {isActive ? 'Active Pass' : 'Expired'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Corporate Commute Subsidy Benefits Banner */}
          <div className="bg-[#f5f3f3] border border-[#c6c5d4] rounded-3xl p-5 space-y-3">
            <h4 className="font-extrabold text-xs text-[#000666] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">verified</span>
              Corporate Fleet Tax Benefits (Govt of Punjab)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#c6c5d4]">
                <span className="font-bold text-[#1b1c1c] block">GST Input Tax Credit</span>
                <span className="text-[11px] text-[#454652]">Full 5% GST offset under HSN 996411 for corporate travel.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#c6c5d4]">
                <span className="font-bold text-[#1b1c1c] block">Priority HVAC Fleet</span>
                <span className="text-[11px] text-[#454652]">Guaranteed seating on high-frequency IT Park corridors.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#c6c5d4]">
                <span className="font-bold text-[#1b1c1c] block">Bulk Fleet Invoicing</span>
                <span className="text-[11px] text-[#454652]">Monthly consolidated billing for company HR & transport desks.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Monthly Pass Configuration Modal */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95 space-y-5">
            <div className="flex justify-between items-center border-b border-[#eae8e7] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666]">corporate_fare</span>
                <h4 className="font-black text-base text-[#1b1c1c]">Corporate Pass Plan Builder</h4>
              </div>
              <button
                onClick={() => setIsBuyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProceedToPaymentGateway} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1c1c]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Select Corporate Commute Route</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                >
                  <option value="Chandigarh ISBT 43 -> Mohali Quark City / IT Park">
                    Chandigarh ISBT 43 &rarr; Mohali Quark City / IT Park
                  </option>
                  <option value="Patiala Central -> Chandigarh Sector 17 Tech Zone">
                    Patiala Central &rarr; Chandigarh Sector 17 Tech Zone
                  </option>
                  <option value="Ludhiana Central -> Mohali Knowledge City Phase 8B">
                    Ludhiana Central &rarr; Mohali Knowledge City Phase 8B
                  </option>
                  <option value="Amritsar GT Road -> Jalandhar Industrial Corridor">
                    Amritsar GT Road &rarr; Jalandhar Industrial Corridor
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Pass Category</label>
                  <select
                    value={passCategory}
                    onChange={(e) => setPassCategory(e.target.value as any)}
                    className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c]"
                  >
                    <option value="Executive HVAC">Executive HVAC (₹1,450/mo)</option>
                    <option value="Standard AC">Standard AC (₹1,200/mo)</option>
                    <option value="Metro Intercity">Metro Intercity (₹1,600/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Duration</label>
                  <select
                    value={passDuration}
                    onChange={(e) => setPassDuration(e.target.value as any)}
                    className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c]"
                  >
                    <option value="Monthly">1 Month (30 Days)</option>
                    <option value="Quarterly">3 Months (Quarterly - 20% Off)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Employee Corporate ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c]"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex justify-between items-center">
                <span>Estimated Invoiced Fare (incl. 5% GST):</span>
                <span className="font-mono font-bold text-sm text-[#000666]">
                  ₹{Math.round(calculateTotal() * 1.05)}.00
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBuyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#c6c5d4] text-xs font-bold text-[#454652]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-[#000666] text-white text-xs font-bold hover:bg-[#1a237e] shadow-md flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">payment</span>
                  Proceed to Payment Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Payment Gateway Modal for Corporates */}
      <PaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        item={paymentItemData}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
