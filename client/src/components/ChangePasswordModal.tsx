import React, { useState } from 'react';
import { X, KeyRound, Lock, Loader2, Check } from 'lucide-react';
import { api } from '../api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded border border-[#3c3c3c] bg-[#252526] shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-[#007acc] flex items-center justify-center text-white">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Change Account Password</h3>
              <p className="text-xs text-[#858585]">Update administrator credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#333333] text-[#858585] hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#252526]">
          {error && (
            <div className="p-2.5 rounded border border-[#f14c4c]/50 bg-[#f14c4c]/20 text-[#f14c4c] text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded border border-[#16825d]/50 bg-[#16825d]/20 text-[#4ec9b0] text-xs flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] text-[#858585] block mb-1 font-mono">
              CURRENT PASSWORD *
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#858585]" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs font-mono focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#858585] block mb-1 font-mono">
              NEW PASSWORD (MIN 6 CHARS) *
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#858585]" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs font-mono focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#858585] block mb-1 font-mono">
              CONFIRM NEW PASSWORD *
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#858585]" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs font-mono focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#333333]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#3c3c3c] bg-[#252526] text-xs text-[#858585] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] active:bg-[#0062a3] text-white text-xs font-medium transition disabled:opacity-50 shadow-sm flex items-center gap-1.5 select-none"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
