import React, { useState } from 'react';
import { Play, Terminal, Folder, KeyRound, Loader2, ArrowUpRight } from 'lucide-react';
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

  const renderStatus = () => {
    const latest = app.latestDeployment;
    if (!latest) {
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#3c3c3c] bg-[#1e1e1e] text-[#858585]">
          no runs
        </span>
      );
    }
    if (latest.status === 'RUNNING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border border-[#007acc] bg-[#007acc]/20 text-[#75beff] animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          running: {latest.actionName}
        </span>
      );
    }
    if (latest.status === 'SUCCESS') {
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#16825d]/50 bg-[#16825d]/20 text-[#4ec9b0] font-medium">
          {latest.actionName} passed ({latest.durationMs ? `${(latest.durationMs / 1000).toFixed(1)}s` : 'ok'})
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#f14c4c]/50 bg-[#f14c4c]/20 text-[#f14c4c] font-medium">
        {latest.actionName} failed (code {latest.exitCode ?? '?'})
      </span>
    );
  };

  return (
    <div
      onClick={() => onOpenDetails(app)}
      className="group rounded border border-[#333333] bg-[#252526] hover:border-[#007acc] hover:bg-[#2a2d2e] p-4 transition cursor-pointer flex flex-col justify-between shadow-sm"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-white group-hover:text-[#75beff] transition flex items-center gap-1">
                {app.name}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-[#007acc] transition" />
              </h3>
              {!app.isActive && (
                <span className="text-[10px] px-1.5 py-0.2 rounded border border-[#3c3c3c] bg-[#1e1e1e] text-[#858585] uppercase font-mono">
                  Disabled
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-[#858585] mt-0.5">{app.slug}</div>
          </div>
          <div>{renderStatus()}</div>
        </div>

        {app.description && (
          <p className="text-xs text-[#cccccc] mt-2 line-clamp-2">{app.description}</p>
        )}

        <div className="mt-3.5 space-y-1 text-xs text-[#858585] font-mono">
          <div className="flex items-center gap-1.5 truncate" title={app.cwd}>
            <Folder className="h-3.5 w-3.5 text-[#007acc] shrink-0" />
            <span className="truncate">{app.cwd}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-[#007acc] shrink-0" />
            <span>••••••••••••••••{app.secret.slice(-8)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#333333]">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#858585] mb-2">
          <span>ACTIONS ({app.actions.length})</span>
          {app.latestDeployment && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewLogs(app.latestDeployment!.id);
              }}
              className="text-[#858585] hover:text-[#75beff] flex items-center gap-1 transition"
            >
              <Terminal className="h-3 w-3" />
              <span>logs</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {app.actions.map((act) => (
            <button
              key={act.id}
              onClick={(e) => handleRun(e, act.name)}
              disabled={triggeringAction !== null}
              title={`Run '${act.name}' on VPS`}
              className="group/btn flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-[#333333] hover:bg-[#007acc] border border-[#3c3c3c] hover:border-[#007acc] text-[#cccccc] hover:text-white transition disabled:opacity-50 select-none"
            >
              {triggeringAction === act.name ? (
                <Loader2 className="h-3 w-3 animate-spin text-white" />
              ) : (
                <Play className="h-2.5 w-2.5 fill-current text-[#75beff] group-hover/btn:text-white transition" />
              )}
              <span>{act.name}</span>
            </button>
          ))}
          {app.actions.length === 0 && (
            <span className="text-xs text-[#858585] italic font-mono">No actions configured</span>
          )}
        </div>
      </div>
    </div>
  );
};
