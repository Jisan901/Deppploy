import React, { useEffect, useState } from 'react';
import { X, Terminal, Clock, Globe, Shield, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Deployment } from '../types';
import { CodeEditor } from './CodeEditor';

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

  const combinedOutput = [
    deployment?.stdout ? `[STDOUT]:\n${deployment.stdout}` : '',
    deployment?.stderr ? `\n[STDERR]:\n${deployment.stderr}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-lg bg-black border border-neutral-800 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded border border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-300">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">
                  Deployment #{deploymentId} : {deployment?.actionName}
                </h3>
                {deployment?.status === 'SUCCESS' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-black font-semibold">
                    SUCCESS (exit 0)
                  </span>
                )}
                {deployment?.status === 'FAILED' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-neutral-700 text-neutral-400">
                    FAILED (exit {deployment?.exitCode ?? 1})
                  </span>
                )}
                {deployment?.status === 'RUNNING' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-neutral-700 text-white animate-pulse">
                    RUNNING
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                App: {deployment?.app?.name || 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLog}
              title="Refresh log stream"
              className="p-1.5 rounded border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Metadata bar */}
        {deployment && (
          <div className="px-6 py-2 bg-neutral-950 border-b border-neutral-800/80 flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-neutral-600" />
              <span>{deployment.durationMs ? `${(deployment.durationMs / 1000).toFixed(2)}s` : 'in progress'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-neutral-600" />
              <span>Trigger: {deployment.triggeredBy}</span>
            </div>
            {deployment.triggerIp && (
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-neutral-600" />
                <span>IP: {deployment.triggerIp}</span>
              </div>
            )}
            <div className="ml-auto text-neutral-600">
              {new Date(deployment.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Command Executed */}
        {deployment && (
          <div className="px-6 py-2 bg-black border-b border-neutral-900 font-mono text-xs flex items-center gap-2 text-neutral-300">
            <span className="text-neutral-500 select-none">$</span>
            <span className="overflow-x-auto whitespace-pre">{deployment.command}</span>
          </div>
        )}

        {/* Terminal Output with CodeEditor */}
        <div className="flex-1 p-4 bg-black overflow-hidden flex flex-col">
          <CodeEditor
            value={combinedOutput || (loading ? 'Loading stream...' : 'No output captured.')}
            readOnly={true}
            language="text"
            label="PROCESS OUTPUT"
            minHeight="320px"
            maxHeight="520px"
          />
        </div>
      </div>
    </div>
  );
};
