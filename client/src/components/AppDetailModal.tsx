import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Play,
  Trash2,
  Terminal,
  Code2,
  Folder,
  History,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api';
import { AppItem, Deployment } from '../types';

interface AppDetailModalProps {
  app: (AppItem & { deployments: Deployment[] }) | null;
  onClose: () => void;
  onReload: () => void;
  onViewLogs: (deploymentId: number) => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  onClose,
  onReload,
  onViewLogs,
}) => {
  if (!app) return null;

  const [activeTab, setActiveTab] = useState<'actions' | 'webhook' | 'history' | 'settings'>('actions');
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [triggeringAction, setTriggeringAction] = useState<string | null>(null);

  // New action form state
  const [showAddAction, setShowAddAction] = useState(false);
  const [actionName, setActionName] = useState('');
  const [actionCmd, setActionCmd] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionTimeout, setActionTimeout] = useState('300');
  const [isSavingAction, setIsSavingAction] = useState(false);

  // App settings edit state
  const [editCwd, setEditCwd] = useState(app.cwd);
  const [editBranch, setEditBranch] = useState(app.branch || 'main');
  const [editEnv, setEditEnv] = useState(app.environment || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(app.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleRegenerateSecret = async () => {
    if (!confirm('Are you sure you want to rotate this app secret? Any existing webhooks using the old secret will fail.')) {
      return;
    }
    setIsRegenerating(true);
    try {
      await api.regenerateSecret(app.id);
      onReload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTrigger = async (actName: string) => {
    if (triggeringAction) return;
    setTriggeringAction(actName);
    try {
      const res = await api.triggerAction(app.id, actName);
      onReload();
      if (res?.deploymentId) {
        onViewLogs(res.deploymentId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTriggeringAction(null);
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionName || !actionCmd) return;
    setIsSavingAction(true);
    try {
      await api.addAction(app.id, {
        name: actionName,
        command: actionCmd,
        description: actionDesc,
        timeoutSec: Number(actionTimeout) || 300,
      });
      setActionName('');
      setActionCmd('');
      setActionDesc('');
      setShowAddAction(false);
      onReload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleDeleteAction = async (actionId: number, actName: string) => {
    if (!confirm(`Delete action '${actName}'?`)) return;
    try {
      await api.deleteAction(actionId);
      onReload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.updateApp(app.id, {
        cwd: editCwd,
        branch: editBranch,
        environment: editEnv,
      });
      alert('Settings saved successfully!');
      onReload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const host = window.location.origin;
  const webhookUrl = `${host}/api/webhook/${app.secret}/deploy`;
  const shortcutUrl = `${host}/${app.secret}/deploy`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{app.name}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {app.slug}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
              <Folder className="h-3.5 w-3.5 text-slate-500" />
              <span>{app.cwd}</span>
              {app.branch && <span className="text-slate-500">({app.branch})</span>}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Secret Token Banner */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">App Secret:</span>
            <span className="text-xs font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-emerald-300">
              {showSecret ? app.secret : `••••••••••••••••••••${app.secret.slice(-6)}`}
            </span>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="text-xs text-slate-400 hover:text-slate-200 underline ml-1"
            >
              {showSecret ? 'Hide' : 'Reveal'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySecret}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
            >
              {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSecret ? 'Copied' : 'Copy Secret'}</span>
            </button>
            <button
              onClick={handleRegenerateSecret}
              disabled={isRegenerating}
              title="Regenerate Token"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-xs text-slate-400 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Rotate</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-900 flex gap-6 text-sm">
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 font-medium border-b-2 transition ${
              activeTab === 'actions'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Allowed Commands ({app.actions.length})
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-3 font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Webhook Setup Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Deployment Logs ({app.deployments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 font-medium border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            App Settings
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[60vh]">
          {/* TAB 1: Configured Actions */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Pre-configured Commands</h3>
                  <p className="text-xs text-slate-400">
                    Only these exact shell commands can be executed when an action webhook is triggered.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAction(!showAddAction)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Command</span>
                </button>
              </div>

              {/* Add action inline form */}
              {showAddAction && (
                <form
                  onSubmit={handleAddAction}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in"
                >
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    New Whitelisted Command
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Action Name (e.g. deploy, status, restart, build)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. deploy"
                        value={actionName}
                        onChange={(e) => setActionName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Timeout (seconds)</label>
                      <input
                        type="number"
                        placeholder="300"
                        value={actionTimeout}
                        onChange={(e) => setActionTimeout(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Shell Command to Run (runs in {app.cwd})
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="git pull origin main && pnpm install --frozen-lockfile && pnpm build && pm2 reload app"
                      value={actionCmd}
                      onChange={(e) => setActionCmd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Description (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Pull latest commit, rebuild and restart daemon"
                      value={actionDesc}
                      onChange={(e) => setActionDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAction(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAction}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition disabled:opacity-50"
                    >
                      {isSavingAction ? 'Saving...' : 'Save Command'}
                    </button>
                  </div>
                </form>
              )}

              {/* Actions List */}
              <div className="space-y-3">
                {app.actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-emerald-400">
                          {act.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-900">
                          timeout: {act.timeoutSec}s
                        </span>
                        {act.description && (
                          <span className="text-xs text-slate-400 truncate">{act.description}</span>
                        )}
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">
                        <span className="text-emerald-500 select-none mr-2">$</span>
                        {act.command}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Trigger URL: <code className="text-slate-400">{host}/api/webhook/{app.secret.slice(0, 10)}.../{act.name}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleTrigger(act.name)}
                        disabled={triggeringAction !== null}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-medium transition disabled:opacity-50"
                      >
                        {triggeringAction === act.name ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-emerald-400/40" />
                        )}
                        <span>Run Now</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAction(act.id, act.name)}
                        title="Delete action"
                        className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {app.actions.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No commands configured for this app yet. Click "Add Command" to define allowed deployment scripts.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Webhook Setup Guide */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300">
                <h4 className="font-semibold text-emerald-300 flex items-center gap-2 text-sm mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Secure CI/CD Webhook Trigger
                </h4>
                <p>
                  Instead of giving external services SSH access with Appleboy (where malicious commands can be injected via YAML),
                  configure your GitHub Actions or webhook to simply ping this endpoint. Deppploy executes only the command you configured in the dashboard.
                </p>
              </div>

              {/* Endpoint URLs */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Webhook Endpoints
                </h4>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">1. Standard API Endpoint:</div>
                  <div className="flex items-center justify-between gap-2 font-mono text-xs bg-slate-900 p-2 rounded border border-slate-800 text-emerald-300">
                    <span className="truncate">{webhookUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="text-xs text-slate-400 hover:text-white shrink-0"
                    >
                      {copiedWebhook ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 pt-1">2. Short URL Endpoint:</div>
                  <div className="flex items-center justify-between gap-2 font-mono text-xs bg-slate-900 p-2 rounded border border-slate-800 text-emerald-300">
                    <span className="truncate">{shortcutUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shortcutUrl);
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="text-xs text-slate-400 hover:text-white shrink-0"
                    >
                      {copiedWebhook ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* GitHub Actions Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Replace Appleboy in GitHub Actions (.github/workflows/deploy.yml)
                  </h4>
                  <button
                    onClick={() => {
                      const snippet = `name: Deploy to VPS
on:
  push:
    branches: [ ${app.branch || 'main'} ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Secure VPS Deployment
        run: |
          curl -X POST "${shortcutUrl}" \\
            -H "Content-Type: application/json" \\
            -d '{"ref": "\${{ github.ref }}", "sha": "\${{ github.sha }}", "actor": "\${{ github.actor }}"}'
`;
                      navigator.clipboard.writeText(snippet);
                      alert('GitHub Action workflow copied!');
                    }}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Workflow
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
{`name: Deploy to VPS
on:
  push:
    branches: [ ${app.branch || 'main'} ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Secure VPS Deployment
        run: |
          curl -X POST "${shortcutUrl}" \\
            -H "Content-Type: application/json" \\
            -d '{"ref": "\${{ github.ref }}", "sha": "\${{ github.sha }}", "actor": "\${{ github.actor }}"}'`}
                </div>
              </div>

              {/* cURL Example */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Test with cURL from Terminal
                </h4>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between gap-3">
                  <span className="truncate text-emerald-300">
                    curl -X POST "{shortcutUrl}"
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`curl -X POST "${shortcutUrl}"`);
                      alert('cURL copied!');
                    }}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Deployment History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Recent deployment executions for {app.name}.
              </div>

              {app.deployments?.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onViewLogs(d.id)}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-white">#{d.id}</span>
                      <span className="text-xs font-mono text-emerald-400">{d.actionName}</span>
                      {d.status === 'SUCCESS' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          <CheckCircle2 className="h-3 w-3" />
                          Passed
                        </span>
                      )}
                      {d.status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                          <XCircle className="h-3 w-3" />
                          Failed (exit {d.exitCode})
                        </span>
                      )}
                      {d.status === 'RUNNING' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Running
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
                      <span>{new Date(d.createdAt).toLocaleString()}</span>
                      <span>Trigger: {d.triggeredBy}</span>
                      {d.durationMs && <span>Duration: {(d.durationMs / 1000).toFixed(1)}s</span>}
                    </div>
                  </div>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-xs text-slate-300 hover:text-white transition font-mono">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    <span>View Output</span>
                  </button>
                </div>
              ))}

              {(!app.deployments || app.deployments.length === 0) && (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No deployment history recorded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: App Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  VPS Working Directory (cwd)
                </label>
                <input
                  type="text"
                  required
                  value={editCwd}
                  onChange={(e) => setEditCwd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Branch</label>
                <input
                  type="text"
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Environment Variables (JSON format, injected during action execution)
                </label>
                <textarea
                  rows={4}
                  placeholder={`{"NODE_ENV": "production", "PORT": "4000"}`}
                  value={editEnv}
                  onChange={(e) => setEditEnv(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

