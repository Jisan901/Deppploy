import React, { useState } from 'react';
import { Play, Terminal, Clock, Folder, CheckCircle, XCircle, Loader2, KeyRound, ExternalLink, Settings2 } from 'lucide-react';
import { AppItem } from '../types';

interface AppCardProps {
  app: AppItem;
  onOpenDetails: (app: AppItem) => void;
  onTriggerAction: (appId: number, actionName: string) => Promise<void>;
  onViewLogs: (deploymentId: number) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onOpenDetails,
  onTriggerAction,
  onViewLogs,
}) => {
  const [triggeringAction, setTriggeringAction] = useState<string | null>(null);

  const handleRun = async (e: React.MouseEvent, actionName: string) => {
    e.stopPropagation();
    if (triggeringAction) return;
    setTriggeringAction(actionName);
    try {
      await onTriggerAction(app.id, actionName);
    } finally {
      setTriggeringAction(null);
    }
  };

  const getStatusBadge = () => {
    const latest = app.latestDeployment;
    if (!latest) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
          No runs yet
        </span>
      );
    }
    if (latest.status === 'RUNNING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running: {latest.actionName}
        </span>
      );
    }
    if (latest.status === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
          <CheckCircle className="h-3 w-3" />
          {latest.actionName} passed ({latest.durationMs ? `${(latest.durationMs / 1000).toFixed(1)}s` : 'OK'})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
        <XCircle className="h-3 w-3" />
        {latest.actionName} failed (exit {latest.exitCode ?? '?'})
      </span>
    );
  };

  return (
    <div
      onClick={() => onOpenDetails(app)}
      className="group relative rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition p-5 cursor-pointer shadow-lg hover:shadow-xl flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-white group-hover:text-emerald-400 transition">
                {app.name}
              </h3>
              {!app.isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                  Disabled
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">{app.slug}</div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {app.description && (
          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{app.description}</p>
        )}

        <div className="mt-4 space-y-1.5 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2 truncate" title={app.cwd}>
            <Folder className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{app.cwd}</span>
          </div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-500 font-mono">••••••••{app.secret.slice(-6)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Configured Actions ({app.actions.length})</span>
          {app.latestDeployment && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewLogs(app.latestDeployment!.id);
              }}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono lowercase normal-case"
            >
              <Terminal className="h-3 w-3" />
              last log
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {app.actions.map((act) => (
            <button
              key={act.id}
              disabled={triggeringAction !== null}
              onClick={(e) => handleRun(e, act.name)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700/60 text-xs font-medium text-slate-200 hover:text-emerald-300 transition disabled:opacity-50"
            >
              {triggeringAction === act.name ? (
                <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
              ) : (
                <Play className="h-3 w-3 text-emerald-400 fill-emerald-400/30" />
              )}
              <span>{act.name}</span>
            </button>
          ))}
          {app.actions.length === 0 && (
            <span className="text-xs text-slate-500 italic">No actions configured yet</span>
          )}
        </div>
      </div>
    </div>
  );
};

