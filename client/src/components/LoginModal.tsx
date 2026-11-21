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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black font-sans">
      <div className="w-full max-w-sm p-6 rounded-lg bg-neutral-950 border border-neutral-800 space-y-6">
        <div className="space-y-1">
          <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-black font-mono font-bold text-sm mb-3">
            D
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Deppploy Console</h2>
          <p className="text-xs text-neutral-500">
            Sign in to manage VPS applications & deployment webhooks
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1 font-mono">EMAIL</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded bg-black border border-neutral-800 text-white text-xs font-mono focus:border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-neutral-400 block mb-1 font-mono">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded bg-black border border-neutral-800 text-white text-xs font-mono focus:border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-2.5 rounded bg-black border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-0.5">
            <div className="text-neutral-500">Default Credentials:</div>
            <div className="text-white">admin@deppploy.local / admin123456</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-white hover:bg-neutral-200 text-black font-medium text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 select-none"
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
