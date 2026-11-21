import React from 'react';
import { RefreshCw, LogOut, Terminal, Server, Plus } from 'lucide-react';
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
    <header className="sticky top-0 z-30 border-b border-[#2d2d2d] bg-[#181818]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between py-2.5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-[#007acc] flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm select-none">
            D
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">Deppploy</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-[#007acc]/40 bg-[#0e639c]/20 text-[#75beff]">
              VPS CI/CD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {stats && (
            <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded border border-[#333333] bg-[#252526] text-xs font-mono text-[#cccccc]">
              <div className="flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-[#007acc]" />
                <span className="text-[#e7e7e7]">{stats.server.hostname}</span>
              </div>
              <span className="text-[#3c3c3c]">|</span>
              <div>
                <span className="text-[#858585]">CPU:</span>{' '}
                <span className="text-[#75beff] font-medium">{stats.server.loadAvg[0]?.toFixed(2)}</span>
              </div>
              <span className="text-[#3c3c3c]">|</span>
              <div>
                <span className="text-[#858585]">RAM:</span>{' '}
                <span className="text-[#4ec9b0] font-medium">{stats.server.memory.usedPercentage}%</span>
              </div>
            </div>
          )}

          <button
            onClick={onRefresh}
            title="Refresh state"
            className="p-1.5 rounded border border-[#333333] bg-[#252526] hover:bg-[#333333] text-[#858585] hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onOpenCreateApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] active:bg-[#0062a3] text-white font-medium text-xs shadow-sm transition select-none"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New App</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#2d2d2d]">
              <span className="text-xs text-[#858585] font-mono hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded text-[#858585] hover:text-white hover:bg-[#333333] transition"
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
