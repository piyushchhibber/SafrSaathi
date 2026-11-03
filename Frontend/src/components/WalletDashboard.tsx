import React, { useState, useEffect } from 'react';
import { UserProfile, WalletInfo, WalletTransaction } from '../types';
import { api } from '../utils/api';
import confetti from 'canvas-confetti';

interface WalletDashboardProps {
  userProfile: UserProfile;
  onClose: () => void;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ userProfile, onClose }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'history'>('overview');
  const [addAmount, setAddAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const [walletData, txnData] = await Promise.all([
        api.getWallet(),
        api.getWalletTransactions(),
      ]);
      setWallet(walletData);
      setTransactions(txnData);
    } catch (err) {
      console.warn('Could not load wallet data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const handleAddMoney = async () => {
    const amt = customAmount ? parseFloat(customAmount) : addAmount;
    if (!amt || amt <= 0) return;
    if (amt > 50000) {
      alert('Maximum top-up is ₹50,000 per transaction');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await api.addMoneyToWallet(amt, paymentMethod);
      setWallet((prev) => prev ? { ...prev, balance: result.balance } : prev);
      setTransactions((prev) => [result.transaction, ...prev]);
      setSuccessMessage(`₹${amt.toFixed(0)} added successfully!`);
      setCustomAmount('');
      confetti({ particleCount: 70, spread: 60 });
      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('overview');
      }, 2000);
    } catch (err: any) {
      alert(err?.message || 'Failed to add money');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full my-auto shadow-2xl border border-[#c6c5d4] flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#000666] to-[#1a237e] text-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-amber-300">account_balance_wallet</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">SafrSaathi Wallet</h3>
                <p className="text-[11px] text-[#bdc2ff]">Digital Transit Wallet • {userProfile.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-[11px] text-[#bdc2ff] uppercase tracking-wider font-bold mb-1">Available Balance</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-black tracking-tight">
                {isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>₹{(wallet?.balance ?? 0).toFixed(2)}</>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#eae8e7] bg-[#fbf9f8]">
          {[
            { id: 'overview' as const, label: 'Overview', icon: 'dashboard' },
            { id: 'add' as const, label: 'Add Money', icon: 'add_circle' },
            { id: 'history' as const, label: 'History', icon: 'receipt_long' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#000666] text-[#000666] bg-white'
                  : 'border-transparent text-[#767683] hover:text-[#454652]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Success Toast */}
          {successMessage && (
            <div className="bg-green-50 border border-green-300 rounded-xl p-3 flex items-center gap-2 animate-in slide-in-from-top">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              <span className="text-xs font-bold text-green-800">{successMessage}</span>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('add')}
                  className="bg-[#000666] text-white rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-[#1a237e] transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-2xl text-amber-300">add_circle</span>
                  <span className="text-xs font-bold">Add Money</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="bg-white border-2 border-[#c6c5d4] rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-[#f5f3f3] transition"
                >
                  <span className="material-symbols-outlined text-2xl text-[#000666]">receipt_long</span>
                  <span className="text-xs font-bold text-[#454652]">View History</span>
                </button>
              </div>

              {/* Info Cards */}
              <div className="bg-[#fbf9f8] border border-[#c6c5d4] rounded-2xl p-4 space-y-3">
                <div className="text-xs font-black text-[#1b1c1c] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#000666]">info</span>
                  How Wallet Works
                </div>
                <div className="space-y-2 text-[11px] text-[#454652]">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs text-green-600 mt-0.5">check</span>
                    <span>Add money via UPI, Card, or Net Banking — instantly credited</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs text-green-600 mt-0.5">check</span>
                    <span>Pay for tickets & passes with 1-tap — no OTP needed</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs text-green-600 mt-0.5">check</span>
                    <span>Track all transactions in real-time with full history</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs text-green-600 mt-0.5">check</span>
                    <span>Secure 256-bit encrypted — RBI compliant digital wallet</span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions Preview */}
              {transactions.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-[#1b1c1c]">Recent Activity</span>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-[11px] font-bold text-[#000666] hover:underline"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map((txn) => (
                      <div key={txn.id} className="bg-white border border-[#c6c5d4] rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            txn.type === 'credit'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            <span className="material-symbols-outlined text-base">
                              {txn.type === 'credit' ? 'south_west' : 'north_east'}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#1b1c1c]">{txn.description}</div>
                            <div className="text-[10px] text-[#767683]">{formatDate(txn.createdAt)}</div>
                          </div>
                        </div>
                        <span className={`text-xs font-mono font-bold ${
                          txn.type === 'credit' ? 'text-green-700' : 'text-red-600'
                        }`}>
                          {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADD MONEY TAB */}
          {activeTab === 'add' && (
            <div className="space-y-5">
              {/* Quick Amount Selector */}
              <div>
                <label className="block text-xs font-black text-[#1b1c1c] mb-2">Select Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setAddAmount(amt); setCustomAmount(''); }}
                      className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                        addAmount === amt && !customAmount
                          ? 'bg-[#000666] text-white border-[#000666] shadow-sm'
                          : 'bg-white text-[#454652] border-[#c6c5d4] hover:bg-[#f5f3f3]'
                      }`}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Or Enter Custom Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#767683]">₹</span>
                  <input
                    type="number"
                    min="1"
                    max="50000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount (₹1 - ₹50,000)"
                    className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-black text-[#1b1c1c] mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi' as const, label: 'UPI', icon: 'qr_code_scanner' },
                    { id: 'card' as const, label: 'Card', icon: 'credit_card' },
                    { id: 'netbanking' as const, label: 'Net Banking', icon: 'account_balance' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                        paymentMethod === m.id
                          ? 'bg-[#000666] text-white border-[#000666] shadow-sm'
                          : 'bg-white text-[#454652] border-[#c6c5d4] hover:bg-[#f5f3f3]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-xs text-blue-900">Amount to Add:</span>
                <span className="font-mono font-black text-lg text-[#000666]">
                  ₹{(customAmount ? parseFloat(customAmount) || 0 : addAmount).toLocaleString()}
                </span>
              </div>

              {/* Add Money Button */}
              <button
                onClick={handleAddMoney}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-[#138808] hover:bg-[#0f6806] text-white text-sm font-extrabold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Add ₹{(customAmount ? parseFloat(customAmount) || 0 : addAmount).toLocaleString()} to Wallet
                  </>
                )}
              </button>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-[#767683] text-xs">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-[#c6c5d4] mb-2 block">receipt_long</span>
                  <p className="text-xs font-bold text-[#767683]">No transactions yet</p>
                  <p className="text-[11px] text-[#c6c5d4]">Add money to start using your wallet</p>
                </div>
              ) : (
                transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="bg-white border border-[#c6c5d4] rounded-2xl p-4 flex items-center justify-between hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        txn.type === 'credit'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        <span className="material-symbols-outlined text-xl">
                          {txn.type === 'credit' ? 'south_west' : 'north_east'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1b1c1c]">{txn.description}</div>
                        <div className="text-[10px] text-[#767683]">{formatDate(txn.createdAt)}</div>
                        {txn.paymentMethod && (
                          <span className="text-[9px] font-bold uppercase bg-[#f0eded] text-[#767683] px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {txn.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-mono font-black ${
                        txn.type === 'credit' ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(0)}
                      </div>
                      <div className="text-[10px] text-[#767683] font-mono">
                        Bal: ₹{txn.balanceAfter.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
