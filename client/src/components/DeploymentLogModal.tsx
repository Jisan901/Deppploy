import React, { useEffect, useState } from 'react';
import { X, Terminal, Copy, Check, Clock, Globe, Shield, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Deployment } from '../types';

interface DeploymentLogModalProps {
  deploymentId: number | null;
  onClose: () => void;
}

export const DeploymentLogModal: React.FC<DeploymentLogModalProps> = ({
  deploymentId,
  onClose,
}) => {
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLog = async () => {
    if (!deploymentId) return;
    setLoading(true);
    try {
      const data = await api.getDeployment(deploymentId);
      setDeployment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
  }, [deploymentId]);

  if (!deploymentId) return null;

  const handleCopy = () => {
    const text = `[COMMAND]: ${deployment?.command || ''}\n\n[STDOUT]:\n${deployment?.stdout || ''}\n\n[STDERR]:\n${deployment?.stderr || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">
                  Deployment #{deploymentId} : {deployment?.actionName}
                </h3>
                {deployment?.status === 'SUCCESS' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SUCCESS (exit 0)
                  </span>
                )}
                {deployment?.status === 'FAILED' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    FAILED (exit {deployment?.exitCode ?? 1})
                  </span>
                )}
                {deployment?.status === 'RUNNING' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    RUNNING...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                App: {deployment?.app?.name || 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLog}
              title="Refresh logs"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={handleCopy}
              title="Copy output"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metadata bar */}
        {deployment && (
          <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Duration: {deployment.durationMs ? `${(deployment.durationMs / 1000).toFixed(2)}s` : 'In progress'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <span>Trigger: {deployment.triggeredBy}</span>
            </div>
            {deployment.triggerIp && (
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-500" />
                <span>IP: {deployment.triggerIp}</span>
              </div>
            )}
            <div className="ml-auto text-slate-500">
              {new Date(deployment.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Executed Command */}
        {deployment && (
          <div className="px-6 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400 select-none">$</span>
            <span className="text-slate-200 overflow-x-auto whitespace-pre">{deployment.command}</span>
          </div>
        )}

        {/* Terminal output */}
        <div className="flex-1 p-6 bg-slate-950 font-mono text-xs overflow-y-auto max-h-[500px] select-text">
          {deployment?.stdout && (
            <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {deployment.stdout}
            </div>
          )}
          {deployment?.stderr && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 whitespace-pre-wrap leading-relaxed">
              <div className="text-[10px] uppercase font-bold text-red-400 mb-1">Standard Error Output:</div>
              {deployment.stderr}
            </div>
          )}
          {!deployment?.stdout && !deployment?.stderr && (
            <div className="text-slate-500 italic py-8 text-center">
              {loading ? 'Fetching execution stream...' : 'No output captured for this run.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
