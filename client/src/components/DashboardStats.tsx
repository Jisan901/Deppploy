import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SystemStats } from '../types';

interface DashboardStatsProps {
  stats: SystemStats | null;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* VS Code Dark Blue Security Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded border border-[#007acc]/40 bg-[#0e639c]/15 text-xs text-[#cccccc]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#007acc] shrink-0" />
          <span>
            <strong className="text-white font-medium">Safe Webhook Guard:</strong> External CI/CD pings can only execute administrator-configured whitelisted commands on this VPS.
          </span>
        </div>
        <div className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#007acc]/30 text-[#75beff] shrink-0">
          POST /api/webhook/:secret/:action
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded border border-[#333333] bg-[#252526] hover:border-[#007acc]/50 transition">
          <div className="text-[11px] text-[#858585] uppercase tracking-wider font-mono">Applications</div>
          <div className="text-xl font-bold text-white mt-1 font-mono">{stats.metrics.totalApps}</div>
          <div className="text-[11px] text-[#858585] mt-0.5">{stats.metrics.activeApps} active on server</div>
        </div>

        <div className="p-3.5 rounded border border-[#333333] bg-[#252526] hover:border-[#007acc]/50 transition">
          <div className="text-[11px] text-[#858585] uppercase tracking-wider font-mono">Active Runs</div>
          <div className="text-xl font-bold text-[#75beff] mt-1 font-mono">{stats.metrics.runningDeployments}</div>
          <div className="text-[11px] text-[#858585] mt-0.5">In execution</div>
        </div>

        <div className="p-3.5 rounded border border-[#333333] bg-[#252526] hover:border-[#007acc]/50 transition">
          <div className="text-[11px] text-[#858585] uppercase tracking-wider font-mono">Successful</div>
          <div className="text-xl font-bold text-[#4ec9b0] mt-1 font-mono">{stats.metrics.successDeployments}</div>
          <div className="text-[11px] text-[#858585] mt-0.5">Exit code 0</div>
        </div>

        <div className="p-3.5 rounded border border-[#333333] bg-[#252526] hover:border-[#007acc]/50 transition">
          <div className="text-[11px] text-[#858585] uppercase tracking-wider font-mono">Failed</div>
          <div className="text-xl font-bold text-[#f14c4c] mt-1 font-mono">{stats.metrics.failedDeployments}</div>
          <div className="text-[11px] text-[#858585] mt-0.5">Check audit logs</div>
        </div>
      </div>
    </div>
  );
};
