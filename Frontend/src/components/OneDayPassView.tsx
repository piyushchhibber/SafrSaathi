import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PaymentGatewayModal, PaymentItemDetails } from './PaymentGatewayModal';

interface OneDayPassViewProps {
  onIssuePass: (passDetails: any) => void;
}

interface HubInfo {
  name: string;
  district: string;
  nearbyStationsWithin50Km: { name: string; distanceKm: number; busRoute: string }[];
}

const PUNJAB_TRANSIT_HUBS: Record<string, HubInfo> = {
  'Patiala Central Bus Stand': {
    name: 'Patiala Central Bus Stand',
    district: 'Patiala',
    nearbyStationsWithin50Km: [
      { name: 'Rajpura Bus Stand', distanceKm: 28, busRoute: 'NH 7 Express' },
      { name: 'Nabha Cantt & City', distanceKm: 26, busRoute: 'SH 12 Route' },
      { name: 'Samana Bypass Stop', distanceKm: 28, busRoute: 'Patran Corridor' },
      { name: 'Sirhind GT Road', distanceKm: 36, busRoute: 'Sirhind Express' },
      { name: 'Fatehgarh Sahib', distanceKm: 42, busRoute: 'State Highway 8' },
      { name: 'Ambala City / Cantt', distanceKm: 48, busRoute: 'Interstate Border Loop' },
      { name: 'Bhawanigarh Depot', distanceKm: 38, busRoute: 'Sangrur Highway' },
      { name: 'Ghanour Tehsil Hub', distanceKm: 32, busRoute: 'Rural Express Link' },
    ],
  },
  'Chandigarh ISBT Sector 43': {
    name: 'Chandigarh ISBT Sector 43',
    district: 'Chandigarh / Tricity',
    nearbyStationsWithin50Km: [
      { name: 'Mohali Phase 7 & Phase 8B IT Park', distanceKm: 8, busRoute: 'City Metro HVAC' },
      { name: 'Kharar Bus Stand', distanceKm: 14, busRoute: 'NH 205 Corridor' },
      { name: 'Derabassi Industrial Zone', distanceKm: 22, busRoute: 'NH 152 Link' },
      { name: 'Pinjore Gardens / Kalka', distanceKm: 28, busRoute: 'Himalayan Expressway' },
      { name: 'Panchkula Sector 5 Hub', distanceKm: 12, busRoute: 'Tricity Loop' },
      { name: 'Zirakpur Flyover Junction', distanceKm: 15, busRoute: 'Airport Road Express' },
      { name: 'Rajpura Junction', distanceKm: 38, busRoute: 'GT Road Shuttles' },
      { name: 'Ropar (Roopnagar) Bus Stand', distanceKm: 42, busRoute: 'Sutlej Express' },
      { name: 'Morinda Bus Stand', distanceKm: 32, busRoute: 'Ludhiana Direct Link' },
    ],
  },
  'Ludhiana Central Bus Stand': {
    name: 'Ludhiana Central Bus Stand',
    district: 'Ludhiana',
    nearbyStationsWithin50Km: [
      { name: 'Phillaur Railway Bus Station', distanceKm: 16, busRoute: 'GT Road South' },
      { name: 'Ahmedgarh Town', distanceKm: 26, busRoute: 'Malerkotla Road' },
      { name: 'Phagwara City Bus Stand', distanceKm: 40, busRoute: 'NH 44 North Express' },
      { name: 'Khanna Industrial Hub', distanceKm: 44, busRoute: 'GT Road East' },
      { name: 'Jagraon Bus Stand', distanceKm: 42, busRoute: 'NH 5 Moga Highway' },
      { name: 'Doraha Canal Bridge', distanceKm: 24, busRoute: 'Intercity Loop' },
      { name: 'Samrala Junction', distanceKm: 36, busRoute: 'Chandigarh Bypass' },
    ],
  },
  'Amritsar ISBT (Near Golden Temple)': {
    name: 'Amritsar ISBT (Near Golden Temple)',
    district: 'Amritsar',
    nearbyStationsWithin50Km: [
      { name: 'Tarn Taran Sahib', distanceKm: 24, busRoute: 'NH 54 South' },
      { name: 'Jandiala Guru Hub', distanceKm: 18, busRoute: 'GT Road East' },
      { name: 'Attari / Wagah Border Post', distanceKm: 30, busRoute: 'Grand Trunk Express' },
      { name: 'Beas Bus Stand', distanceKm: 45, busRoute: 'Jalandhar Highway' },
      { name: 'Batala Bus Stand', distanceKm: 38, busRoute: 'Gurdaspur Road' },
      { name: 'Ajnala Tehsil Station', distanceKm: 28, busRoute: 'Northern Border Line' },
      { name: 'Rayya Town', distanceKm: 35, busRoute: 'Beas Sub-corridor' },
    ],
  },
  'Jalandhar ISBT City Terminal': {
    name: 'Jalandhar ISBT City Terminal',
    district: 'Jalandhar',
    nearbyStationsWithin50Km: [
      { name: 'Phagwara Bus Stand', distanceKm: 22, busRoute: 'NH 44 South' },
      { name: 'Kapurthala Bus Stand', distanceKm: 21, busRoute: 'Science City Express' },
      { name: 'Kartarpur Town Hub', distanceKm: 16, busRoute: 'GT Road West' },
      { name: 'Nakodar Junction', distanceKm: 26, busRoute: 'Moga Road' },
      { name: 'Shahkot Bus Stop', distanceKm: 45, busRoute: 'Sutlej Link' },
      { name: 'Goraya Flyover Station', distanceKm: 32, busRoute: 'Ludhiana Express' },
      { name: 'Beas River Junction', distanceKm: 42, busRoute: 'Amritsar Corridor' },
    ],
  },
  'Bathinda Central Bus Stand': {
    name: 'Bathinda Central Bus Stand',
    district: 'Bathinda',
    nearbyStationsWithin50Km: [
      { name: 'Goniana Mandi', distanceKm: 14, busRoute: 'Faridkot Highway' },
      { name: 'Maur Mandi Bus Stand', distanceKm: 32, busRoute: 'Mansa Road' },
      { name: 'Rampura Phul', distanceKm: 34, busRoute: 'Barnala Corridor' },
      { name: 'Kotkapura Junction', distanceKm: 48, busRoute: 'NH 54 North' },
      { name: 'Gidderbaha Depot', distanceKm: 30, busRoute: 'Muktsar Express' },
      { name: 'Talwandi Sabo (Damdama Sahib)', distanceKm: 28, busRoute: 'Religious Circuit' },
    ],
  },
};

export const OneDayPassView: React.FC<OneDayPassViewProps> = ({ onIssuePass }) => {
  const [startingStation, setStartingStation] = useState<string>('Patiala Central Bus Stand');
  const [customStationInput, setCustomStationInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [selectedPassTier, setSelectedPassTier] = useState<'standard' | 'family' | 'executive'>('standard');
  const [passengerName, setPassengerName] = useState<string>('Priya Sharma');
  const [passengerPhone, setPassengerPhone] = useState<string>('+91 98881 23456');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Payment Gateway Trigger State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentItemData, setPaymentItemData] = useState<PaymentItemDetails | null>(null);

  const activeHub = PUNJAB_TRANSIT_HUBS[startingStation] || {
    name: startingStation,
    district: 'Punjab State',
    nearbyStationsWithin50Km: [
      { name: 'Connecting Urban Hub A', distanceKm: 18, busRoute: 'PRTC City Loop' },
      { name: 'Suburban Depot B', distanceKm: 28, busRoute: 'State Highway Corridor' },
      { name: 'District Border C', distanceKm: 44, busRoute: 'Express Intercity Link' },
      { name: 'Tehsil Terminal D', distanceKm: 34, busRoute: 'Ordinary & HVAC Service' },
    ],
  };

  const getTierFare = () => {
    switch (selectedPassTier) {
      case 'standard':
        return 120;
      case 'family':
        return 350;
      case 'executive':
        return 180;
      default:
        return 120;
    }
  };

  const getTierLabel = () => {
    switch (selectedPassTier) {
      case 'standard':
        return 'One Day Unlimited Pass (Single Passenger)';
      case 'family':
        return 'One Day Family Pass (Up to 4 Passengers)';
      case 'executive':
        return 'One Day Executive HVAC / Premium Pass';
      default:
        return 'One Day Unlimited Pass';
    }
  };

  const handleInitiatePayment = () => {
    const finalStartingPoint = isCustomMode && customStationInput.trim() ? customStationInput.trim() : startingStation;
    const fare = getTierFare();

    const paymentDetails: PaymentItemDetails = {
      category: 'one_day_pass',
      title: getTierLabel(),
      subtitle: `Valid for 24 Hours within 50 KM radius from ${finalStartingPoint}`,
      route: `${finalStartingPoint} (50 KM Radial Network)`,
      startingStation: finalStartingPoint,
      coverageRadiusKm: 50,
      holderName: passengerName,
      rawAmount: fare,
      totalAmount: fare,
    };

    setPaymentItemData(paymentDetails);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (generatedPass: any) => {
    setIsPaymentModalOpen(false);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    onIssuePass({
      name: passengerName,
      passId: generatedPass.ticketNumber,
      title: generatedPass.title,
      route: generatedPass.route,
      startingStation: generatedPass.startingStation,
      coverageRadiusKm: 50,
      college: `24Hr Pass • Origin: ${generatedPass.startingStation || startingStation} (50 KM Radius)`,
      validUntil: 'Active for next 24 Hours',
      concession: '24Hr 50 KM Network Pass',
      amount: `₹${generatedPass.amount}.00`,
      avatarUrl: generatedPass.avatarUrl,
      ticketNumber: generatedPass.ticketNumber,
    });
  };

  const faqs = [
    {
      q: 'How does the 50 KM Starting Position Rule work?',
      a: 'When you purchase a One-Day pass, you specify your starting station in Punjab (e.g. Patiala Central Bus Stand). The pass allows unlimited boardings across all PRTC buses on any route that operates within a 50 km radial zone from your chosen origin depot.',
    },
    {
      q: 'Validity Period & Conductor Scanning',
      a: 'The 24-hour pass activates upon purchase or on your first QR scan with the conductor. It remains active for a full 24 consecutive hours across all PRTC Ordinary and HVAC city/suburban loops within the 50 km perimeter.',
    },
    {
      q: 'Can I travel beyond the 50 KM zone?',
      a: 'For travel beyond the 50 km perimeter from your designated starting station, you can pay the incremental fare difference directly to the conductor or book an intercity point-to-point ticket.',
    },
    {
      q: 'Refund & Group Eligibility',
      a: 'The Family Pass (₹350) covers up to 4 family members traveling together within the 50 km zone. Passes are instant and verifiable digitally on any mobile device.',
    },
  ];

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-8 sm:gap-10 animate-in fade-in">
      {/* Top Hero & Interactive Pass Configuration */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Info & 50 KM Radius Visualizer */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-full font-extrabold w-fit shadow-xs">
            <span className="material-symbols-outlined text-sm text-[#138808]">near_me</span>
            50 KM RADIUS ZONE • 24HR UNLIMITED COMMUTE
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#000666] tracking-tight leading-tight">
            One Day Unlimited Pass
          </h1>

          <p className="text-sm sm:text-base text-[#454652] leading-relaxed">
            Select your <strong>Starting Position</strong> in Punjab to unlock 24-hour unlimited travel on all PRTC Ordinary & HVAC buses operating within a <strong>50 Kilometre radial zone</strong> from your departure station.
          </p>

          {/* 50 KM Zone Requirement Highlight Card */}
          <div className="bg-gradient-to-r from-blue-900 via-[#000666] to-[#1a237e] text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-white/10 relative overflow-hidden space-y-4">
            {/* Background Radar graphic */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
              <span className="material-symbols-outlined text-[160px]">radar</span>
            </div>

            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Active 50 KM Radius Perimeter Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2.5 py-1 rounded-full uppercase">
                Radius: 50.0 KM
              </span>
            </div>

            {/* Current Origin Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-black/30 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <span className="text-[10px] text-white/70 block uppercase font-bold tracking-wider">
                  Starting Position / Origin Depot
                </span>
                <span className="font-black text-sm text-amber-300 block mt-0.5">
                  {isCustomMode && customStationInput ? customStationInput : startingStation}
                </span>
                <span className="text-[10px] text-[#bdc2ff] block mt-0.5">
                  Center Point (0.0 KM Origin)
                </span>
              </div>

              <div className="bg-black/30 backdrop-blur-xs p-3 rounded-2xl border border-white/15">
                <span className="text-[10px] text-white/70 block uppercase font-bold tracking-wider">
                  Eligible PRTC Bus Fleets
                </span>
                <span className="font-bold text-xs text-white block mt-0.5">
                  Ordinary + City HVAC + Suburban Intercity
                </span>
                <span className="text-[10px] text-emerald-300 block mt-0.5">
                  All Routes Within 50 KM Boundary
                </span>
              </div>
            </div>

            {/* Reachable stations inside 50km zone */}
            <div>
              <span className="text-[11px] font-extrabold text-[#bdc2ff] uppercase tracking-wider block mb-2">
                Reachable Towns & Connected Corridors within 50 KM:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeHub.nearbyStationsWithin50Km.map((st, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1 rounded-xl text-[11px] font-medium text-white transition"
                  >
                    <span className="font-bold text-amber-300">{st.name}</span>
                    <span className="text-[10px] text-[#bdc2ff]">({st.distanceKm} km)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pass Booking & Payment Initiation Card */}
        <div className="lg:col-span-5 bg-white border-2 border-[#000666] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 relative">
          {/* Top Indian Tricolor Stripe */}
          <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

          {/* Pricing Header */}
          <div className="flex justify-between items-start pt-2">
            <div>
              <span className="text-[10px] font-black uppercase text-[#138808] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                24-Hour State Pass
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1b1c1c] mt-1">Book Day Pass</h2>
              <p className="text-xs text-[#454652]">50 KM Radius Unlimited PRTC Travel</p>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-black text-[#000666]">₹{getTierFare()}</span>
              <span className="block text-[10px] text-[#767683]">All taxes included</span>
            </div>
          </div>

          {/* STEP 1: SELECT SPECIFIC STARTING POSITION (50 KM RULE) */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-[#1b1c1c] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#000666]">location_on</span>
                1. Specific Starting Position (50 KM Rule)
              </span>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-[11px] text-[#000666] underline font-bold"
              >
                {isCustomMode ? 'Choose from list' : 'Type other depot'}
              </button>
            </label>

            {!isCustomMode ? (
              <select
                value={startingStation}
                onChange={(e) => setStartingStation(e.target.value)}
                className="w-full bg-[#fbf9f8] border-2 border-[#000666]/40 focus:border-[#000666] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#1b1c1c] outline-none shadow-xs"
              >
                {Object.keys(PUNJAB_TRANSIT_HUBS).map((hub) => (
                  <option key={hub} value={hub}>
                    📍 {hub}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter starting station (e.g. Rajpura Bus Stand, Khanna)..."
                value={customStationInput}
                onChange={(e) => setCustomStationInput(e.target.value)}
                className="w-full bg-[#fbf9f8] border-2 border-[#000666]/40 focus:border-[#000666] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#1b1c1c] outline-none"
              />
            )}

            {/* Quick Hub Select Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Patiala Central Bus Stand', 'Chandigarh ISBT Sector 43', 'Ludhiana Central Bus Stand', 'Amritsar ISBT (Near Golden Temple)'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setIsCustomMode(false);
                    setStartingStation(h);
                  }}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition border ${
                    startingStation === h && !isCustomMode
                      ? 'bg-[#000666] text-white border-[#000666]'
                      : 'bg-[#f0eded] text-[#454652] hover:bg-white border-[#c6c5d4]'
                  }`}
                >
                  {h.split(' ')[0]} Hub
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: SELECT PASS TIER */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-[#1b1c1c] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#000666]">confirmation_number</span>
              2. Pass Category & Fare
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPassTier('standard')}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-1 ${
                  selectedPassTier === 'standard'
                    ? 'border-[#000666] bg-blue-50/60 text-[#000666] shadow-xs'
                    : 'border-[#c6c5d4] bg-[#fbf9f8] text-[#454652]'
                }`}
              >
                <span className="text-[10px] font-bold">Single Passenger</span>
                <span className="text-sm font-black text-[#000666]">₹120</span>
                <span className="text-[9px] text-[#767683]">1 Person</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPassTier('family')}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-1 ${
                  selectedPassTier === 'family'
                    ? 'border-[#000666] bg-blue-50/60 text-[#000666] shadow-xs'
                    : 'border-[#c6c5d4] bg-[#fbf9f8] text-[#454652]'
                }`}
              >
                <span className="text-[10px] font-bold">Family / Group</span>
                <span className="text-sm font-black text-[#000666]">₹350</span>
                <span className="text-[9px] text-[#767683]">Up to 4 Pax</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPassTier('executive')}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-1 ${
                  selectedPassTier === 'executive'
                    ? 'border-[#000666] bg-blue-50/60 text-[#000666] shadow-xs'
                    : 'border-[#c6c5d4] bg-[#fbf9f8] text-[#454652]'
                }`}
              >
                <span className="text-[10px] font-bold">Executive HVAC</span>
                <span className="text-sm font-black text-[#000666]">₹180</span>
                <span className="text-[9px] text-[#767683]">AC Express</span>
              </button>
            </div>
          </div>

          {/* STEP 3: PASSENGER DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-[#1b1c1c] mb-1">Passenger Name</label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1c1c]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-[#1b1c1c] mb-1">Mobile / WhatsApp</label>
              <input
                type="text"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1c1c]"
                required
              />
            </div>
          </div>

          {/* Benefits Bullet List */}
          <ul className="space-y-2 text-xs pt-1 border-t border-[#eae8e7]">
            <li className="flex items-center gap-2 text-[#1b1c1c]">
              <span className="w-4 h-4 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span>Valid across all PRTC routes within <strong>50 KM</strong> of {isCustomMode && customStationInput ? customStationInput : startingStation.split(' ')[0]}</span>
            </li>
            <li className="flex items-center gap-2 text-[#1b1c1c]">
              <span className="w-4 h-4 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span>Instant QR Token with Conductor Verification Gateway</span>
            </li>
          </ul>

          {/* Trigger to Payment Gateway */}
          <button
            type="button"
            onClick={handleInitiatePayment}
            className="w-full bg-[#138808] hover:bg-[#0f6806] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition shadow-md group text-sm"
          >
            <span className="material-symbols-outlined text-lg">payment</span>
            Proceed to Payment Gateway (₹{getTierFare()})
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </section>

      {/* Coverage Area & How to Use Grid */}
      <section>
        <div className="border-b border-[#c6c5d4] pb-3 mb-6">
          <h3 className="text-2xl font-extrabold text-[#1b1c1c]">Coverage Radius Guidelines & Route Map</h3>
          <p className="text-xs text-[#454652]">50 KM radius network guidelines for seamless passenger commutes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Visual */}
          <div className="lg:col-span-7 bg-[#1a237e] text-white rounded-3xl min-h-[340px] relative overflow-hidden flex flex-col justify-between p-6 shadow-xs">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&auto=format&fit=crop&q=80')`,
              }}
            />

            <div className="relative z-10">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                State Transit Radar
              </span>
              <h4 className="text-xl font-extrabold mt-2">Punjab Radial 50 KM Commuter Zones</h4>
              <p className="text-xs text-[#bdc2ff] mt-0.5">
                Starting Station: {isCustomMode && customStationInput ? customStationInput : startingStation}
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2 my-4 text-xs">
              {activeHub.nearbyStationsWithin50Km.slice(0, 3).map((st, idx) => (
                <div key={idx} className="bg-black/35 backdrop-blur-xs p-2.5 rounded-2xl border border-white/20">
                  <div className="font-bold text-white flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {st.name}
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold">{st.distanceKm} KM • {st.busRoute}</div>
                </div>
              ))}
            </div>

            <div className="relative z-10 bg-white text-[#1b1c1c] p-3 rounded-2xl shadow-md text-xs flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">Zone Status:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-semibold text-green-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span> Inside 50 KM (Full Pass Valid)
                </span>
                <span className="flex items-center gap-1 font-semibold text-[#000666]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#000666]"></span> Ordinary & HVAC Coaches
                </span>
              </div>
            </div>
          </div>

          {/* How to Use 3-Step Guide */}
          <div className="lg:col-span-5 bg-white border border-[#c6c5d4] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <h4 className="font-black text-lg text-[#1b1c1c] mb-4">How to Use 50 KM Pass</h4>

            <ol className="space-y-4 text-xs">
              <li className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#fbf9f8] border border-[#eae8e7]">
                <span className="w-7 h-7 rounded-full bg-[#000666] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <div className="font-bold text-sm text-[#1b1c1c]">Set Starting Station & Pay</div>
                  <div className="text-[#454652] mt-0.5">
                    Choose your origin station (e.g. Patiala or Chandigarh) and complete payment via UPI QR or Card.
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#fbf9f8] border border-[#eae8e7]">
                <span className="w-7 h-7 rounded-full bg-[#1a237e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <div className="font-bold text-sm text-[#1b1c1c]">24-Hour 50 KM Zone Activates</div>
                  <div className="text-[#454652] mt-0.5">
                    Pass is instantly valid for all connecting routes up to 50 km from the chosen origin.
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-3.5 p-3 rounded-2xl bg-[#fbf9f8] border border-[#eae8e7]">
                <span className="w-7 h-7 rounded-full bg-[#138808] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <div className="font-bold text-sm text-[#1b1c1c]">Scan on Conductor Machine</div>
                  <div className="text-[#454652] mt-0.5">
                    Display dynamic QR code upon boarding. The conductor machine verifies the 50 KM radius token.
                  </div>
                </div>
              </li>
            </ol>

            <button
              onClick={handleInitiatePayment}
              className="w-full mt-4 bg-[#000666] hover:bg-[#1a237e] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              Get 50 KM Pass Now (₹{getTierFare()})
            </button>
          </div>
        </div>
      </section>

      {/* Accordion FAQs */}
      <section className="bg-white border border-[#c6c5d4] rounded-3xl p-6 shadow-xs mb-4">
        <h4 className="font-black text-lg text-[#1b1c1c] mb-4">Terms & 50 KM Radius Policy</h4>
        <div className="divide-y divide-[#eae8e7]">
          {faqs.map((item, idx) => (
            <div key={idx} className="py-3">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center text-left text-xs font-bold text-[#1b1c1c] hover:text-[#000666]"
              >
                <span>{item.q}</span>
                <span className="material-symbols-outlined text-base text-[#767683]">
                  {openFaq === idx ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {openFaq === idx && (
                <p className="text-xs text-[#454652] mt-2 leading-relaxed pl-3 border-l-2 border-[#000666]">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Unified Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        item={paymentItemData}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
