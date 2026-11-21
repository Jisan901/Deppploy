import React from 'react';
import { RefreshCw, LogOut, Terminal, Server } from 'lucide-react';
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
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center text-black font-mono font-black text-sm select-none">
            D
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">Deppploy</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-400">
              VPS CI/CD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {stats && (
            <div className="hidden md:flex items-center gap-3 px-2.5 py-1 rounded-md border border-neutral-800 bg-neutral-950 text-xs font-mono text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Server className="h-3 w-3 text-neutral-500" />
                <span className="text-neutral-300">{stats.server.hostname}</span>
              </div>
              <span className="text-neutral-700">/</span>
              <div>
                <span className="text-neutral-500">CPU:</span>{' '}
                <span className="text-white">{stats.server.loadAvg[0]?.toFixed(2)}</span>
              </div>
              <span className="text-neutral-700">/</span>
              <div>
                <span className="text-neutral-500">RAM:</span>{' '}
                <span className="text-white">{stats.server.memory.usedPercentage}%</span>
              </div>
            </div>
          )}

          <button
            onClick={onRefresh}
            title="Refresh state"
            className="p-1.5 rounded-md border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onOpenCreateApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-black font-medium text-xs transition select-none"
          >
            <span className="text-sm leading-none">+</span>
            <span>New App</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-900 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
