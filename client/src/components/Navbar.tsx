import React from 'react';
import { ShieldCheck, Server, RefreshCw, LogOut, Terminal, Lock } from 'lucide-react';
import { User, SystemStats } from '../types';

interface NavbarProps {
  user: User | null;
  stats: SystemStats | null;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenCreateApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  stats,
  onRefresh,
  onLogout,
  onOpenCreateApp,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white">Deppploy</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Secure VPS CI/CD
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero-arbitrary command runner & webhook gatekeeper</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stats && (
            <div className="hidden md:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-emerald-400" />
                <span>{stats.server.hostname}</span>
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">CPU:</span>
                <span className="font-mono text-emerald-400">{stats.server.loadAvg[0]?.toFixed(2)}</span>
              </div>
              <div className="h-3 w-px bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">RAM:</span>
                <span className="font-mono text-emerald-400">{stats.server.memory.usedPercentage}%</span>
              </div>
            </div>
          )}

          <button
            onClick={onRefresh}
            title="Refresh state"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenCreateApp}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-600/20"
          >
            <span className="text-base leading-none">+</span>
            <span>New App</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-slate-200">{user.name || user.email}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

