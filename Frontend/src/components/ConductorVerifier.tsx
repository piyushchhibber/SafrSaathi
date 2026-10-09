import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api, PassVerification } from '../utils/api';

type Result =
  | { kind: 'valid'; data: PassVerification }
  | { kind: 'invalid'; message: string }
  | null;

export const ConductorVerifier: React.FC = () => {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const verify = async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setLoading(true);
    try {
      const data = await api.verifyPass(value);
      setResult({ kind: 'valid', data });
    } catch (e: any) {
      setResult({ kind: 'invalid', message: e?.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  const stopScan = async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        /* scanner already stopped */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startScan = () => {
    setResult(null);
    setScanning(true);
    // Wait one tick so the #qr-reader element exists in the DOM
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          (text) => {
            stopScan().then(() => {
              setToken(text);
              verify(text);
            });
          },
          () => {}
        );
      } catch (e: any) {
        setScanning(false);
        setResult({ kind: 'invalid', message: `Camera could not start: ${e?.message || e}` });
      }
    }, 50);
  };

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c6c5d4] shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#000666] text-xl">qr_code_scanner</span>
        <h3 className="font-extrabold text-sm text-[#1b1c1c] uppercase tracking-wider">
          Conductor Pass Scanner
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste the QR text here, or use the camera"
          className="flex-1 border border-[#c6c5d4] rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-[#000666]"
        />
        <button
          onClick={() => verify(token)}
          disabled={loading || !token.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#000666] text-white text-xs font-extrabold disabled:opacity-40"
        >
          {loading ? 'Checking…' : 'Verify Pass'}
        </button>
        <button
          onClick={scanning ? stopScan : startScan}
          className="px-4 py-2.5 rounded-xl border border-[#000666] text-[#000666] text-xs font-extrabold flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">photo_camera</span>
          {scanning ? 'Stop Camera' : 'Scan with Camera'}
        </button>
      </div>

      {scanning && <div id="qr-reader" className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden" />}

      {result?.kind === 'valid' && (
        <div className="border-2 border-green-500 bg-green-50 rounded-2xl p-4 flex items-center gap-4">
          {result.data.avatarUrl ? (
            <img
              src={result.data.avatarUrl}
              alt={result.data.holderName}
              className="w-16 h-20 rounded-xl object-cover border border-green-300"
            />
          ) : (
            <div className="w-16 h-20 rounded-xl bg-green-100 text-green-800 flex items-center justify-center font-black text-xl">
              {result.data.holderName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-700">verified</span>
              <span className="text-sm font-black text-green-800 uppercase">Valid Pass</span>
            </div>
            <p className="text-base font-black text-[#1b1c1c] truncate">{result.data.holderName}</p>
            <p className="text-xs text-[#454652]">
              Roll: {result.data.rollNumber} • {result.data.passType}
            </p>
            <p className="text-xs text-[#454652] truncate">{result.data.route}</p>
            <p className="text-[10px] text-[#767683] mt-1">Verified by {result.data.verifiedBy}</p>
          </div>
        </div>
      )}

      {result?.kind === 'invalid' && (
        <div className="border-2 border-red-500 bg-red-50 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-700 text-3xl">gpp_bad</span>
          <div>
            <p className="text-sm font-black text-red-800 uppercase">
              {/permission|authentication/i.test(result.message) ? 'Not Authorised' : 'Pass Not Valid'}
            </p>
            <p className="text-xs text-red-900">
              {/permission|authentication/i.test(result.message)
                ? 'Sign in with a PRTC admin account to verify passes.'
                : result.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};