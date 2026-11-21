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
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-800 text-neutral-500">
          no runs
        </span>
      );
    }
    if (latest.status === 'RUNNING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-700 bg-neutral-900 text-white animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          running: {latest.actionName}
        </span>
      );
    }
    if (latest.status === 'SUCCESS') {
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-black font-semibold">
          {latest.actionName} passed ({latest.durationMs ? `${(latest.durationMs / 1000).toFixed(1)}s` : 'ok'})
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-700 text-neutral-300">
        {latest.actionName} failed (code {latest.exitCode ?? '?'})
      </span>
    );
  };

  return (
    <div
      onClick={() => onOpenDetails(app)}
      className="group rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-600 hover:bg-neutral-900/40 p-4 transition cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-white group-hover:underline flex items-center gap-1">
                {app.name}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition" />
              </h3>
              {!app.isActive && (
                <span className="text-[10px] px-1 py-0.2 rounded border border-neutral-800 text-neutral-500 uppercase font-mono">
                  Disabled
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-neutral-500 mt-0.5">{app.slug}</div>
          </div>
          <div>{renderStatus()}</div>
        </div>

        {app.description && (
          <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{app.description}</p>
        )}

        <div className="mt-3.5 space-y-1 text-xs text-neutral-500 font-mono">
          <div className="flex items-center gap-1.5 truncate" title={app.cwd}>
            <Folder className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
            <span className="truncate">{app.cwd}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
            <span>••••••••{app.secret.slice(-6)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-900">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mb-2">
          <span>ACTIONS ({app.actions.length})</span>
          {app.latestDeployment && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewLogs(app.latestDeployment!.id);
              }}
              className="text-neutral-400 hover:text-white flex items-center gap-1 transition"
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
              disabled={triggeringAction !== null}
              onClick={(e) => handleRun(e, act.name)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-800 bg-black hover:bg-white hover:text-black hover:border-white text-xs font-mono text-neutral-300 transition disabled:opacity-50"
            >
              {triggeringAction === act.name ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-2.5 w-2.5 fill-current" />
              )}
              <span>{act.name}</span>
            </button>
          ))}
          {app.actions.length === 0 && (
            <span className="text-xs text-neutral-600 italic">No actions configured</span>
          )}
        </div>
      </div>
    </div>
  );
};
