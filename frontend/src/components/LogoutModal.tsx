'use client';

import React from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-sm glass-card p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5 transform transition-all scale-100">
        {/* Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-2xl mx-auto shadow-inner">
            🚪
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">
            Confirm Sign Out
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Are you sure you want to end your active workspace session? You will need to log back in to view your channels.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 transition-all"
          >
            Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
