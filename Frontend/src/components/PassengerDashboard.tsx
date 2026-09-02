import React, { useState } from 'react';
import { BusTicket, UserProfile, PortalRole } from '../types';
import confetti from 'canvas-confetti';
import { PaymentGatewayModal, PaymentItemDetails } from './PaymentGatewayModal';

interface PassengerDashboardProps {
  userProfile: UserProfile;
  tickets: BusTicket[];
  onUpdateUserProfile: (updated: UserProfile) => void;
  onNavigateRole: (role: PortalRole) => void;
  onOpenTicketModal: (ticket: BusTicket) => void;
  onBuyDirectTicket: () => void;
}

const PASSENGER_POPULAR_ROUTES = [
  { from: 'ISBT Sector 43 Chandigarh', to: 'Patiala Central Bus Stand', fare: 65, distance: '68 km', time: '1h 20m' },
  { from: 'Ludhiana Central Bus Stand', to: 'Jalandhar City Terminal', fare: 75, distance: '60 km', time: '1h 10m' },
  { from: 'Patiala Central Bus Stand', to: 'Rajpura Junction', fare: 30, distance: '28 km', time: '35m' },
  { from: 'Amritsar ISBT', to: 'Jalandhar ISBT', fare: 95, distance: '82 km', time: '1h 45m' },
  { from: 'Chandigarh ISBT 43', to: 'Mohali Phase 7 IT Corridor', fare: 25, distance: '12 km', time: '20m' },
  { from: 'Bathinda Central', to: 'Barnala Bus Stand', fare: 70, distance: '65 km', time: '1h 15m' },
];

export const PassengerDashboard: React.FC<PassengerDashboardProps> = ({
  userProfile,
  tickets,
  onUpdateUserProfile,
  onNavigateRole,
  onOpenTicketModal,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(userProfile?.name || 'Priya Sharma');
  const [editedEmail, setEditedEmail] = useState(userProfile?.email || 'priya.sharma22@gmail.com');
  const [editedPhone, setEditedPhone] = useState(userProfile?.phone || '+91 98881 23456');

  // Direct Ticket Booking Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [coachType, setCoachType] = useState<'Ordinary' | 'HVAC AC' | 'Volvo Superfast'>('HVAC AC');
  const [passengerCount, setPassengerCount] = useState(1);

  // Payment Gateway Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentItemData, setPaymentItemData] = useState<PaymentItemDetails | null>(null);
  const [localTickets, setLocalTickets] = useState<BusTicket[]>(tickets);

  const selectedRouteObj = PASSENGER_POPULAR_ROUTES[selectedRouteIdx] || PASSENGER_POPULAR_ROUTES[0];

  const getBaseFare = () => {
    let multiplier = 1;
    if (coachType === 'HVAC AC') multiplier = 1.35;
    if (coachType === 'Volvo Superfast') multiplier = 1.8;
    return Math.round(selectedRouteObj.fare * multiplier);
  };

  const getTotalPayable = () => {
    return getBaseFare() * passengerCount;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile({
      ...userProfile,
      name: editedName,
      email: editedEmail,
      phone: editedPhone,
    });
    setIsEditingProfile(false);
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleOpenDirectBooking = () => {
    setIsBookingModalOpen(true);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const total = getTotalPayable();

    const paymentDetails: PaymentItemDetails = {
      category: 'passenger',
      title: `${coachType} Express Direct Ticket`,
      subtitle: `${selectedRouteObj.from} → ${selectedRouteObj.to}`,
      route: `${selectedRouteObj.from} → ${selectedRouteObj.to}`,
      holderName: editedName,
      rawAmount: total,
      totalAmount: total,
      avatarUrl: userProfile.avatarUrl,
    };

    setPaymentItemData(paymentDetails);
    setIsBookingModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (generatedPass: any) => {
    setIsPaymentModalOpen(false);
    const newTicket: BusTicket = {
      id: generatedPass.id || `tkt-${Date.now()}`,
      ticketNumber: generatedPass.ticketNumber,
      title: `${coachType} Express Ticket (${passengerCount} Pax)`,
      type: 'single',
      route: `${selectedRouteObj.from} → ${selectedRouteObj.to}`,
      timestamp: 'Just now',
      amount: generatedPass.amount,
      status: 'active',
      validUntil: 'Active for next 6 Hours',
    };

    setLocalTickets([newTicket, ...localTickets]);
    confetti({ particleCount: 80, spread: 70 });
    onOpenTicketModal(newTicket);
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 relative animate-in fade-in">
      {/* Side Navigation */}
      <aside className="w-full md:w-64 bg-[#f5f3f3] border border-[#c6c5d4] rounded-3xl p-5 flex flex-col shrink-0 h-fit shadow-xs space-y-5">
        <div className="pb-3 border-b border-[#c6c5d4]">
          <h2 className="text-base font-extrabold text-[#000666]">Passenger Portal</h2>
          <p className="text-[11px] text-[#454652]">PRTC Digital Transit Terminal</p>
        </div>

        <nav className="flex flex-col gap-1.5">
          <button
            onClick={() => handleOpenDirectBooking()}
            className="flex items-center gap-3 p-2.5 bg-[#000666] text-white rounded-2xl font-bold text-xs transition shadow-xs text-left"
          >
            <span className="material-symbols-outlined text-lg">directions_bus</span>
            Buy Direct Ticket
          </button>
          <button
            onClick={() => onNavigateRole('one_day_pass')}
            className="flex items-center gap-3 p-2.5 bg-green-700 hover:bg-green-800 text-white rounded-2xl font-bold text-xs transition shadow-xs text-left"
          >
            <span className="material-symbols-outlined text-lg">near_me</span>
            One Day Pass (50 KM)
          </button>
          <button
            onClick={() => setIsEditingProfile(true)}
            className="flex items-center gap-3 p-2.5 text-[#454652] hover:bg-[#eae8e7] rounded-2xl text-xs font-bold transition text-left"
          >
            <span className="material-symbols-outlined text-lg">person</span>
            My Profile & ID
          </button>
        </nav>

        <div className="border-t border-[#c6c5d4] pt-4 flex flex-col gap-2">
          <button
            onClick={() => onNavigateRole('student')}
            className="w-full bg-white border border-[#c6c5d4] text-[#000666] text-center py-2.5 rounded-2xl text-xs font-bold hover:bg-[#f5f3f3] transition flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-sm">school</span>
            Student Concession
          </button>
          <button
            onClick={() => onNavigateRole('corporate')}
            className="w-full bg-white border border-[#c6c5d4] text-[#000666] text-center py-2.5 rounded-2xl text-xs font-bold hover:bg-[#f5f3f3] transition flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-sm">corporate_fare</span>
            Corporate Passes
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 space-y-6">
        {/* Greetings */}
        <div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full mb-2">
            <span className="material-symbols-outlined text-xs">verified</span> PRTC Commuter Network
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1b1c1c] tracking-tight">
            Good Morning, {(editedName || 'Commuter').split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-[#454652] mt-0.5">
            Book instant QR bus tickets or unlimited 50 KM radius passes across Punjab.
          </p>
        </div>

        {/* 2 Action Cards (Direct Ticket & One Day Ticket with 50 KM Radius) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Direct Ticket */}
          <div
            onClick={handleOpenDirectBooking}
            className="bg-white border-2 border-[#FF9933] rounded-3xl p-6 relative hover:shadow-lg hover:-translate-y-0.5 transition duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#000666] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl text-amber-300">directions_bus</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#f5f3f3] group-hover:bg-[#FF9933] group-hover:text-white flex items-center justify-center transition">
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </div>
              <h3 className="text-lg font-black text-[#1b1c1c] mb-1 group-hover:text-[#000666] transition">
                Buy Direct Route Ticket
              </h3>
              <p className="text-xs text-[#454652] mb-4 leading-relaxed">
                Point-to-point journey tickets for Ordinary, HVAC AC, and Volvo coaches with instant QR token.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#eae8e7]">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#f0eded] text-[#454652] px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-xs text-[#FF9933]">bolt</span> Instant Gateway
              </span>
              <span className="text-xs font-bold text-[#000666]">From ₹25</span>
            </div>
          </div>

          {/* One Day Pass (50 KM Zone) */}
          <div
            onClick={() => onNavigateRole('one_day_pass')}
            className="bg-white border-2 border-[#138808] rounded-3xl p-6 relative hover:shadow-lg hover:-translate-y-0.5 transition duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#138808] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-2xl">near_me</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#f5f3f3] group-hover:bg-[#138808] group-hover:text-white flex items-center justify-center transition">
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-[#1b1c1c] group-hover:text-[#000666] transition">
                  Buy One Day Pass
                </h3>
                <span className="text-[9px] font-extrabold uppercase bg-green-100 text-green-800 px-2 py-0.5 rounded-md">
                  50 KM RADIUS
                </span>
              </div>
              <p className="text-xs text-[#454652] mb-4 leading-relaxed">
                Set a specific starting station and travel unlimited on all connecting routes within a 50 km perimeter.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#eae8e7]">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#f0eded] text-[#454652] px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-xs text-[#138808]">all_inclusive</span> 24h Radial Zone
              </span>
              <span className="text-xs font-bold text-green-700">₹120 / Day</span>
            </div>
          </div>
        </div>

        {/* Bento Grid: Recent Tickets & Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Tickets List */}
          <div className="lg:col-span-8 bg-white border border-[#c6c5d4] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#eae8e7]">
              <div>
                <h3 className="text-base font-black text-[#1b1c1c]">Recent Tickets & Digital Passes</h3>
                <p className="text-xs text-[#767683]">Tap any ticket to inspect its live validator QR</p>
              </div>
              <button
                onClick={handleOpenDirectBooking}
                className="text-xs font-bold text-[#000666] hover:underline"
              >
                + Book New Ticket
              </button>
            </div>

            <div className="space-y-3 flex-1">
              {localTickets.map((ticket) => {
                const isActive = ticket.status === 'active';

                return (
                  <div
                    key={ticket.id}
                    onClick={() => onOpenTicketModal(ticket)}
                    className="bg-[#fbf9f8] hover:bg-[#f0eded] border border-[#c6c5d4] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition shadow-2xs group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition shrink-0 ${
                          isActive ? 'bg-[#000666] text-white shadow-xs' : 'bg-[#eae8e7] text-[#767683]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">
                          {ticket.type === 'day_pass' ? 'near_me' : 'qr_code_2'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#1b1c1c] group-hover:text-[#000666] flex items-center gap-2">
                          {ticket.title}
                          {isActive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                        </div>
                        <div className="text-xs text-[#454652]">{ticket.route}</div>
                        <div className="text-[11px] text-[#767683] mt-0.5">
                          {ticket.timestamp} • {ticket.validUntil}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-sm text-[#1b1c1c]">
                        ₹{ticket.amount.toFixed(2)}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                          isActive
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-[#eae8e7] text-[#767683]'
                        }`}
                      >
                        {isActive ? 'Active Token' : 'Expired'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: User Profile Card */}
          <div className="lg:col-span-4 bg-white border border-[#c6c5d4] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#eae8e7]">
                <h3 className="text-base font-black text-[#1b1c1c]">Commuter Profile</h3>
                <span className="text-[10px] font-bold text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  UIDAI VERIFIED
                </span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#000666] shadow-xs mb-2"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#138808] border-2 border-white flex items-center justify-center text-white text-[10px]">
                    ✓
                  </div>
                </div>
                <h4 className="font-black text-base text-[#1b1c1c]">{editedName}</h4>
                <span className="text-xs font-mono text-[#454652]">Pass ID: {userProfile.passId}</span>
                <span className="text-[11px] text-[#767683] mt-0.5">{userProfile.institution}</span>
              </div>

              <div className="border-t border-[#eae8e7] pt-3 space-y-2 text-xs text-[#454652]">
                <div className="flex justify-between items-center">
                  <span className="text-[#767683]">Email:</span>
                  <span className="font-semibold text-[#1b1c1c] truncate max-w-[140px]">{editedEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#767683]">Phone:</span>
                  <span className="font-semibold text-[#1b1c1c]">{editedPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#767683]">State:</span>
                  <span className="font-semibold text-green-800">Punjab State Resident</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditingProfile(true)}
              className="w-full border border-[#c6c5d4] py-2.5 rounded-2xl text-xs font-bold text-[#1b1c1c] hover:bg-[#f5f3f3] transition shadow-xs mt-5 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Profile Info
            </button>
          </div>
        </div>
      </main>

      {/* Direct Ticket Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95 space-y-5">
            <div className="flex justify-between items-center border-b border-[#eae8e7] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666]">directions_bus</span>
                <h4 className="font-black text-base text-[#1b1c1c]">Direct Journey Ticket Booking</h4>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Select PRTC Travel Route</label>
                <select
                  value={selectedRouteIdx}
                  onChange={(e) => setSelectedRouteIdx(Number(e.target.value))}
                  className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                >
                  {PASSENGER_POPULAR_ROUTES.map((r, idx) => (
                    <option key={idx} value={idx}>
                      {r.from} → {r.to} ({r.distance} • {r.time})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Coach Type</label>
                  <select
                    value={coachType}
                    onChange={(e) => setCoachType(e.target.value as any)}
                    className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1c1c]"
                  >
                    <option value="Ordinary">Ordinary Express</option>
                    <option value="HVAC AC">HVAC Air-Conditioned</option>
                    <option value="Volvo Superfast">Volvo Superfast Luxury</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Number of Passengers</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                      className="w-8 h-8 rounded-lg bg-[#f0eded] hover:bg-[#eae8e7] font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold font-mono text-sm">
                      {passengerCount} {passengerCount === 1 ? 'Pax' : 'Pax'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPassengerCount(Math.min(6, passengerCount + 1))}
                      className="w-8 h-8 rounded-lg bg-[#f0eded] hover:bg-[#eae8e7] font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex justify-between items-center">
                <span>Calculated Fare ({passengerCount} Pax • {coachType}):</span>
                <span className="font-mono font-bold text-sm text-[#000666]">
                  ₹{getTotalPayable()}.00
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
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

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#eae8e7] mb-4">
              <h3 className="font-bold text-base text-[#1b1c1c]">Edit Passenger Profile</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-[#767683] hover:text-[#1b1c1c]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Email Address</label>
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 border border-[#c6c5d4] py-2 rounded-xl text-xs font-bold text-[#454652] hover:bg-[#f5f3f3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#000666] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#1a237e] shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Payment Gateway Modal for Passengers */}
      <PaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        item={paymentItemData}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
