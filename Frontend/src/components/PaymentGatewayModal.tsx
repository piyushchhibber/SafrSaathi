import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export type PaymentCategory = 'corporate' | 'passenger' | 'one_day_pass' | 'student';

export interface PaymentItemDetails {
  category: PaymentCategory;
  title: string;
  subtitle?: string;
  route?: string;
  startingStation?: string;
  coverageRadiusKm?: number;
  passDuration?: string;
  passCategory?: string;
  holderName: string;
  holderId?: string;
  companyName?: string;
  rawAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  avatarUrl?: string;
}

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItemDetails | null;
  onPaymentSuccess: (generatedRecord: any) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  item,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [upiVpa, setUpiVpa] = useState('commuter@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8819');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('782');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('SBI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');
  const [qrTimer, setQrTimer] = useState<number>(300); // 5 mins

  // Corporate Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setPaymentStep('select');
      setIsProcessing(false);
      setQrTimer(300);
      setPromoCodeInput('');
      setAppliedPromo(null);
      setPromoError(null);
      setPromoDiscountAmount(0);
      if (item?.holderName) {
        setCardName(item.holderName);
      }
    }
  }, [isOpen, item]);

  useEffect(() => {
    let interval: any;
    if (isOpen && selectedMethod === 'upi' && paymentStep === 'select' && qrTimer > 0) {
      interval = setInterval(() => setQrTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, selectedMethod, paymentStep, qrTimer]);

  if (!isOpen || !item) return null;

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (code === 'FLAT25') {
      const discount = Math.round(item.totalAmount * 0.25);
      setPromoDiscountAmount(discount);
      setAppliedPromo('FLAT25');
      setPromoError(null);
      confetti({ particleCount: 50, spread: 60 });
    } else if (!code) {
      setPromoError('Please enter a promo code.');
    } else {
      setPromoError('Invalid promo code. Use FLAT25 for 25% discount.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscountAmount(0);
    setPromoCodeInput('');
    setPromoError(null);
  };

  const finalPayableAmount = Math.max(
    0,
    item.totalAmount - (appliedPromo === 'FLAT25' ? promoDiscountAmount : 0)
  );

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePay = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setPaymentStep('processing');

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('success');
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

      const transactionId = `TXN-PRTC-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const generatedPass = {
        id: `pass-${Date.now()}`,
        ticketNumber:
          item.category === 'corporate'
            ? `CORP-PB-${Math.floor(1000 + Math.random() * 9000)}`
            : item.category === 'one_day_pass'
            ? `PASS-24H-${Math.floor(10000 + Math.random() * 90000)}`
            : `PRTC-PB-${Math.floor(10000 + Math.random() * 90000)}`,
        title: item.title,
        type: item.category === 'corporate' ? 'corporate_pass' : item.category === 'one_day_pass' ? 'day_pass' : 'single',
        route: item.route || (item.startingStation ? `${item.startingStation} (50 KM Radius Network)` : 'All Punjab Roadways Network'),
        startingStation: item.startingStation,
        coverageRadiusKm: item.coverageRadiusKm || (item.category === 'one_day_pass' ? 50 : undefined),
        amount: finalPayableAmount,
        status: 'active',
        timestamp: 'Just now',
        validUntil:
          item.category === 'one_day_pass'
            ? 'Active for next 24 Hours (50 KM Zone)'
            : item.category === 'student'
            ? 'Active for 3 Months (90 Days)'
            : item.passDuration === 'Quarterly'
            ? '90 Days (3 Months) from today'
            : item.category === 'corporate'
            ? '30 Days (1 Month) from today'
            : 'Active for next 2 Hours',
        companyName: item.companyName,
        holderName: item.holderName,
        rollNo: item.holderId || 'PRTC-USER',
        college: item.companyName || (item.category === 'one_day_pass' ? `24Hr Pass • Origin: ${item.startingStation || 'Patiala'}` : 'Punjab State Transport PRTC'),
        avatarUrl: item.avatarUrl,
        transactionId,
        paymentMethod: selectedMethod.toUpperCase(),
        promoApplied: appliedPromo || undefined,
        discountGiven: promoDiscountAmount || item.discountAmount,
      };

      setTimeout(() => {
        onPaymentSuccess(generatedPass);
      }, 1400);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-[#c6c5d4] flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[92vh]">
        {/* Header with SafrSaathi & PRTC Security */}
        <div className="bg-[#000666] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-amber-300">lock</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  PRTC SafrSaathi Payment Gateway
                </h3>
                <span className="text-[9px] font-black uppercase bg-[#138808] text-white px-2 py-0.5 rounded-full">
                  256-BIT SSL SECURE
                </span>
              </div>
              <p className="text-xs text-[#bdc2ff] mt-0.5">
                Official Govt of Punjab Transport Tariff Collection Node
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={paymentStep === 'processing'}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        {paymentStep === 'processing' && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#000666] border-t-transparent animate-spin"></div>
            <div>
              <h4 className="font-black text-base text-[#000666]">Contacting Banking Gateway...</h4>
              <p className="text-xs text-[#767683] mt-1">
                Authorizing encrypted transaction of ₹{item.totalAmount}. Please do not refresh or hit back.
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] font-mono text-[#000666]">
              PRTC-AUTH-TOKEN: SHA256:{Math.random().toString(36).substring(2, 12).toUpperCase()}
            </div>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center text-green-700 font-black">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-green-800 uppercase bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                PAYMENT CONFIRMED ✓
              </span>
              <h4 className="font-black text-xl text-[#1b1c1c] mt-2">Transit Pass Generated!</h4>
              <p className="text-xs text-[#454652] mt-1">
                Your encrypted QR Transit Token is now active and stored in your dashboard.
              </p>
            </div>

            <div className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-[#767683]">Amount Charged:</span>
                <span className="font-mono font-bold text-[#000666]">₹{finalPayableAmount}.00</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-green-700">
                  <span>Corporate Promo Applied:</span>
                  <span className="font-mono font-bold">FLAT25 (Flat 25% Discount: -₹{promoDiscountAmount}.00)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#767683]">Issued To:</span>
                <span className="font-bold text-[#1b1c1c]">{item.holderName}</span>
              </div>
              {item.startingStation && (
                <div className="flex justify-between">
                  <span className="text-[#767683]">Starting Station (50 KM Zone):</span>
                  <span className="font-bold text-[#000666]">{item.startingStation}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#767683]">Pass Type:</span>
                <span className="font-semibold text-[#1b1c1c]">{item.title}</span>
              </div>
            </div>
          </div>
        )}

        {paymentStep === 'select' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Tariff Invoiced Breakdown Card */}
            <div className="bg-[#fbf9f8] border border-[#c6c5d4] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex justify-between items-start border-b border-[#eae8e7] pb-3">
                <div>
                  <span className="text-[9px] font-black uppercase bg-[#000666] text-white px-2 py-0.5 rounded tracking-wider">
                    {item.category.replace('_', ' ')}
                  </span>
                  <h4 className="font-black text-base text-[#1b1c1c] mt-1">{item.title}</h4>
                  <p className="text-xs text-[#454652]">
                    Holder: <span className="font-bold">{item.holderName}</span> {item.holderId ? `• ID: ${item.holderId}` : ''}
                  </p>
                  {item.companyName && (
                    <p className="text-xs text-[#000666] font-bold mt-0.5">
                      Company: {item.companyName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#767683] block uppercase font-bold">Total Invoiced</span>
                  <div className="flex flex-col items-end">
                    {appliedPromo && (
                      <span className="text-xs text-[#767683] line-through font-mono">₹{item.totalAmount}</span>
                    )}
                    <span className="text-2xl font-black text-[#000666]">₹{finalPayableAmount}</span>
                  </div>
                </div>
              </div>

              {/* Specific 50 KM starting position notice if applicable */}
              {item.startingStation && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-xs text-green-900 flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-green-700 shrink-0">near_me</span>
                  <div>
                    <span className="font-bold block">50 KM Radius Network Coverage:</span>
                    <span>Centered at <strong>{item.startingStation}</strong>. Valid on all PRTC connecting routes up to 50 km from departure hub.</span>
                  </div>
                </div>
              )}

              {/* Corporate Promo Code Section */}
              {item.category === 'corporate' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#000666] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#000666]">local_offer</span>
                      Corporate Promo Code
                    </span>
                    <span className="text-[10px] text-[#454652]">
                      Use code <strong className="text-[#000666] bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono">FLAT25</strong> for 25% discount
                    </span>
                  </div>

                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded-xl px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-700 text-sm">check_circle</span>
                        <div>
                          <span className="font-black text-green-900 tracking-wider font-mono">FLAT25 APPLIED</span>
                          <span className="text-[10px] text-green-800 block">
                            Flat 25% corporate discount saved ₹{promoDiscountAmount}.00
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[11px] font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter promo code (e.g. FLAT25)"
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value.toUpperCase());
                          setPromoError(null);
                        }}
                        className="flex-1 bg-white border border-[#c6c5d4] rounded-xl px-3 py-1.5 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#000666]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="bg-[#000666] text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-[#1a237e] transition shadow-xs"
                      >
                        Apply Code
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <p className="text-[11px] text-red-600 font-semibold">{promoError}</p>
                  )}
                </div>
              )}

              {/* Fare lines */}
              <div className="text-xs space-y-1 pt-1 text-[#454652]">
                <div className="flex justify-between">
                  <span>Base Commuter Tariff:</span>
                  <span className="font-mono">₹{item.rawAmount}.00</span>
                </div>
                {item.taxAmount ? (
                  <div className="flex justify-between">
                    <span>GST (CGST 2.5% + SGST 2.5%):</span>
                    <span className="font-mono">₹{item.taxAmount}.00</span>
                  </div>
                ) : null}
                {item.discountAmount ? (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Govt Welfare Concession / Rebate:</span>
                    <span className="font-mono">-₹{item.discountAmount}.00</span>
                  </div>
                ) : null}
                {appliedPromo && promoDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-bold bg-green-50 p-1.5 rounded-lg border border-green-200">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">local_offer</span>
                      Corporate Promo Discount (FLAT25 - 25% OFF):
                    </span>
                    <span className="font-mono">-₹{promoDiscountAmount}.00</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[#eae8e7] font-black text-sm text-[#1b1c1c]">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-[#000666]">₹{finalPayableAmount}.00</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#1b1c1c] uppercase tracking-wider">
                Choose Payment Option
              </label>

              {/* Method Tabs */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: 'qr_code_scanner' },
                  { id: 'card', label: 'Cards', icon: 'credit_card' },
                  { id: 'netbanking', label: 'NetBanking', icon: 'account_balance' },
                  { id: 'wallet', label: item.category === 'corporate' ? 'Fleet Credit' : 'Wallet', icon: 'account_balance_wallet' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedMethod(tab.id as any)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                      selectedMethod === tab.id
                        ? 'bg-[#000666] text-white border-[#000666] shadow-sm'
                        : 'bg-[#fbf9f8] text-[#454652] hover:bg-white border-[#c6c5d4]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                    <span className="text-[11px] truncate">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Method Detail Area */}
              <div className="bg-white border border-[#c6c5d4] rounded-2xl p-4 shadow-xs">
                {selectedMethod === 'upi' && (
                  <div className="space-y-4 text-center">
                    <div className="flex items-center justify-between border-b border-[#eae8e7] pb-2 text-xs">
                      <span className="font-bold text-[#1b1c1c] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#000666]">qr_code_2</span>
                        Scan Live UPI QR Code
                      </span>
                      <span className="text-[11px] font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                        Expires in {formatTimer(qrTimer)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-[#fbf9f8] rounded-xl border border-[#c6c5d4] max-w-[220px] mx-auto">
                      <div className="w-36 h-36 bg-white p-2 border border-gray-300 rounded-lg shadow-xs flex items-center justify-center">
                        {/* Dynamic QR SVG */}
                        <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3zm0 5h3v3h-3v-3zm5-2h3v2h-3v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-[#767683] mt-2">
                        Supported: Google Pay, PhonePe, Paytm, BHIM
                      </span>
                    </div>

                    <div className="text-left space-y-1.5">
                      <label className="block text-[11px] font-bold text-[#767683]">
                        Or Enter UPI Virtual ID / Mobile Number:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={upiVpa}
                          onChange={(e) => setUpiVpa(e.target.value)}
                          placeholder="yourname@okhdfcbank"
                          className="flex-1 bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c]"
                        />
                        <button
                          type="button"
                          onClick={() => handlePay()}
                          className="px-4 py-2 bg-[#000666] text-white text-xs font-bold rounded-xl hover:bg-[#1a237e]"
                        >
                          Verify & Pay
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'card' && (
                  <form onSubmit={handlePay} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-[#1b1c1c] mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c]"
                        placeholder="Name on card"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#1b1c1c] mb-1">Card Number (RuPay / Visa / MasterCard)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1b1c1c] font-mono"
                          required
                        />
                        <span className="material-symbols-outlined text-base text-[#767683] absolute left-2.5 top-2.5">
                          credit_card
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#1b1c1c] mb-1">Expiry Date (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#1b1c1c] mb-1">CVV / Security Code</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] font-mono"
                          required
                        />
                      </div>
                    </div>
                  </form>
                )}

                {selectedMethod === 'netbanking' && (
                  <div className="space-y-3 text-xs">
                    <label className="block font-bold text-[#1b1c1c]">Select Bank for Direct Institutional Debit</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['State Bank of India', 'Punjab National Bank', 'HDFC Bank', 'ICICI Bank', 'Punjab & Sind Bank', 'Axis Bank'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition ${
                            selectedBank === b
                              ? 'bg-blue-50 border-[#000666] text-[#000666]'
                              : 'bg-white border-[#c6c5d4] text-[#454652] hover:bg-[#fbf9f8]'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#767683] pt-1">
                      You will be redirected to {selectedBank}'s encrypted corporate / retail portal.
                    </p>
                  </div>
                )}

                {selectedMethod === 'wallet' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-900">wallet</span>
                        <div>
                          <p className="font-bold text-indigo-950">
                            {item.category === 'corporate' ? 'Corporate Fleet Transit Credit' : 'PRTC Commuter FastWallet'}
                          </p>
                          <p className="text-[10px] text-indigo-800">
                            Available Pre-funded Balance: <span className="font-bold font-mono">₹8,500.00</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-indigo-900 text-white px-2 py-0.5 rounded">
                        INSTANT
                      </span>
                    </div>
                    <p className="text-[11px] text-[#454652]">
                      Direct 1-tap debit from company pre-authorized transit allowance quota.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#c6c5d4] text-xs font-bold text-[#454652] hover:bg-[#eae8e7] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePay()}
                className="flex-2 py-3 rounded-xl bg-[#138808] hover:bg-[#0f6806] text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">payments</span>
                Pay ₹{finalPayableAmount}.00 & Issue Pass
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
