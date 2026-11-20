import React from 'react';
import { Layers, Activity, CheckCircle2, XCircle, ShieldAlert, Cpu } from 'lucide-react';
import { SystemStats } from '../types';

interface DashboardStatsProps {
  stats: SystemStats | null;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Security Banner highlighting why Deppploy was built */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-300">Appleboy CI/CD Vulnerability Eliminated</h4>
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
              Deppploy runs securely on this VPS. Incoming webhooks (<code className="text-emerald-400 font-mono">/appsecret/deploy</code>) can only trigger predefined, administrator-configured whitelist commands. Arbitrary remote bash execution from external YAML files is strictly blocked.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 whitespace-nowrap">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Security Guard Active</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Configured Apps</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.metrics.totalApps}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">{stats.metrics.activeApps} active on VPS</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Active Deploys</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.metrics.runningDeployments}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Currently running</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Successful Runs</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.metrics.successDeployments}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Exit code 0</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Failed / Errors</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.metrics.failedDeployments}</div>
            <div className="text-[11px] text-red-400 mt-0.5">Inspect in logs</div>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
