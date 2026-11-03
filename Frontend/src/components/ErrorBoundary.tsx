import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI exception captured by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('prtc_active_session_v2');
      localStorage.removeItem('prtc_access_token');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4 text-[#1b1c1c] font-sans">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-gray-200 text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#000666]">Temporary Display Glitch Resolved</h2>
              <p className="text-xs text-[#767683] mt-2 leading-relaxed">
                SafrSaathi encountered an unexpected client state. Click below to continue uninterrupted.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-[#000666] text-white font-extrabold text-sm hover:bg-[#1a237e] transition shadow-md"
              >
                Refresh SafrSaathi
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
              >
                Clear Local Session & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
