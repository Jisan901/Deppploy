import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface LoginModalProps {
  onLoggedIn: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoggedIn }) => {
  const [email, setEmail] = useState('admin@deppploy.local');
  const [password, setPassword] = useState('admin123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      onLoggedIn(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181818] font-sans">
      <div className="w-full max-w-sm p-6 rounded border border-[#3c3c3c] bg-[#252526] shadow-2xl space-y-6">
        <div className="space-y-1">
          <div className="h-8 w-8 rounded bg-[#007acc] flex items-center justify-center text-white font-mono font-bold text-sm mb-3 shadow-sm">
            D
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Deppploy Console</h2>
          <p className="text-xs text-[#858585]">
            Sign in to manage VPS applications & deployment webhooks
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded border border-[#f14c4c]/50 bg-[#f14c4c]/20 text-[#f14c4c] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-[#858585] block mb-1 font-mono">EMAIL</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#858585]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs font-mono focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#858585] block mb-1 font-mono">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#858585]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs font-mono focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#1e1e1e] border border-[#333333] text-[11px] font-mono text-[#858585] space-y-0.5">
            <div className="text-[#858585]">Default Credentials:</div>
            <div className="text-[#75beff]">admin@deppploy.local / admin123456</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-[#007acc] hover:bg-[#0098ff] active:bg-[#0062a3] text-white font-medium text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 select-none shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
