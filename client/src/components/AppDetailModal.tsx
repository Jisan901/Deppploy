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
  Loader2,
  Edit2,
  Save,
} from 'lucide-react';
import { api } from '../api';
import { AppItem, Deployment, AppAction } from '../types';
import { CodeEditor } from './CodeEditor';

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

  // Editing existing action inline with CodeEditor
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [editActionCmd, setEditActionCmd] = useState('');
  const [editActionTimeout, setEditActionTimeout] = useState('300');
  const [isUpdatingAction, setIsUpdatingAction] = useState(false);

  // App settings edit state
  const [editCwd, setEditCwd] = useState(app.cwd);
  const [editBranch, setEditBranch] = useState(app.branch || 'main');
  const [editEnv, setEditEnv] = useState(app.environment || '{\n  "NODE_ENV": "production"\n}');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(app.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleRegenerateSecret = async () => {
    if (!confirm('Rotate this app secret? Existing webhooks using the current secret will fail.')) {
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

  const handleStartEditAction = (action: AppAction) => {
    setEditingActionId(action.id);
    setEditActionCmd(action.command);
    setEditActionTimeout(String(action.timeoutSec || 300));
  };

  const handleSaveEditAction = async (actionId: number) => {
    setIsUpdatingAction(true);
    try {
      await api.updateAction(actionId, {
        command: editActionCmd,
        timeoutSec: Number(editActionTimeout) || 300,
      });
      setEditingActionId(null);
      onReload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingAction(false);
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
      alert('Settings saved');
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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-lg bg-black border border-neutral-800 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-start justify-between gap-4 bg-neutral-950">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-white">{app.name}</h2>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-400">
                {app.slug}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2 font-mono">
              <Folder className="h-3 w-3 text-neutral-600" />
              <span>{app.cwd}</span>
              {app.branch && <span className="text-neutral-600">({app.branch})</span>}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Secret Token Banner */}
        <div className="px-6 py-2.5 bg-neutral-950 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-neutral-500" />
            <span className="text-neutral-400">SECRET:</span>
            <span className="text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {showSecret ? app.secret : `••••••••••••••••••••${app.secret.slice(-6)}`}
            </span>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="text-neutral-500 hover:text-white underline ml-1"
            >
              {showSecret ? 'hide' : 'reveal'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySecret}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-800 bg-neutral-900 hover:bg-white hover:text-black hover:border-white text-neutral-300 transition"
            >
              {copiedSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedSecret ? 'Copied' : 'Copy Token'}</span>
            </button>
            <button
              onClick={handleRegenerateSecret}
              disabled={isRegenerating}
              title="Rotate Secret Token"
              className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            >
              <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Rotate</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-neutral-800 bg-black flex gap-5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2.5 font-medium border-b-2 transition ${
              activeTab === 'actions'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            COMMANDS ({app.actions.length})
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>WEBHOOK GUIDE</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>AUDIT LOGS ({app.deployments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 font-medium border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            SETTINGS
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[62vh]">
          {/* TAB 1: Configured Actions with CodeEditor */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    Whitelisted Commands
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Pre-configured scripts executed when an action webhook is triggered.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAction(!showAddAction)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-white hover:bg-neutral-200 text-black text-xs font-medium transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Command</span>
                </button>
              </div>

              {/* Add action form with CodeEditor */}
              {showAddAction && (
                <form
                  onSubmit={handleAddAction}
                  className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3 animate-in fade-in"
                >
                  <div className="text-xs font-mono uppercase tracking-wider text-white font-medium">
                    New Action Definition
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1 font-mono">
                        ACTION NAME (e.g. deploy, status, restart) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. deploy"
                        value={actionName}
                        onChange={(e) => setActionName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-black border border-neutral-800 text-white text-xs font-mono focus:border-neutral-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1 font-mono">
                        TIMEOUT (SECONDS)
                      </label>
                      <input
                        type="number"
                        placeholder="300"
                        value={actionTimeout}
                        onChange={(e) => setActionTimeout(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-black border border-neutral-800 text-white text-xs font-mono focus:border-neutral-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1 font-mono">
                      SHELL SCRIPT (Code Editor) *
                    </label>
                    <CodeEditor
                      value={actionCmd}
                      onChange={setActionCmd}
                      language="shell"
                      label="BASH SCRIPT"
                      placeholder="git pull origin main && pnpm install --frozen-lockfile && pnpm build && pm2 reload app"
                      minHeight="110px"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1 font-mono">
                      DESCRIPTION (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pull latest commit, rebuild and restart daemon"
                      value={actionDesc}
                      onChange={(e) => setActionDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-black border border-neutral-800 text-white text-xs focus:border-neutral-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAction(false)}
                      className="px-3 py-1.5 rounded border border-neutral-800 bg-neutral-900 text-xs text-neutral-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAction}
                      className="px-3.5 py-1.5 rounded bg-white hover:bg-neutral-200 text-xs font-medium text-black transition disabled:opacity-50"
                    >
                      {isSavingAction ? 'Saving...' : 'Save Action'}
                    </button>
                  </div>
                </form>
              )}

              {/* Actions List with CodeEditor integration */}
              <div className="space-y-3">
                {app.actions.map((act) => {
                  const isEditingThis = editingActionId === act.id;

                  return (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-sm text-white">
                            {act.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono px-1.5 py-0.2 rounded border border-neutral-800">
                            timeout: {act.timeoutSec}s
                          </span>
                          {act.description && (
                            <span className="text-xs text-neutral-500 truncate max-w-sm">
                              {act.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {isEditingThis ? (
                            <>
                              <button
                                onClick={() => handleSaveEditAction(act.id)}
                                disabled={isUpdatingAction}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white text-black text-xs font-medium hover:bg-neutral-200 transition"
                              >
                                <Save className="h-3 w-3" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingActionId(null)}
                                className="px-2 py-1 rounded border border-neutral-800 text-xs text-neutral-400 hover:text-white transition"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEditAction(act)}
                                title="Edit command in code editor"
                                className="p-1.5 rounded border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleTrigger(act.name)}
                                disabled={triggeringAction !== null}
                                className="flex items-center gap-1 px-3 py-1 rounded border border-neutral-700 bg-neutral-900 hover:bg-white hover:text-black hover:border-white text-xs font-mono text-neutral-200 transition disabled:opacity-50"
                              >
                                {triggeringAction === act.name ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3 fill-current" />
                                )}
                                <span>Run</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAction(act.id, act.name)}
                                title="Delete action"
                                className="p-1.5 rounded border border-neutral-800 text-neutral-600 hover:text-white hover:bg-neutral-900 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Display or Edit Command with CodeEditor */}
                      {isEditingThis ? (
                        <div className="space-y-2 pt-1">
                          <CodeEditor
                            value={editActionCmd}
                            onChange={setEditActionCmd}
                            language="shell"
                            label={`EDIT ${act.name.toUpperCase()}`}
                            minHeight="100px"
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-mono text-neutral-500">Timeout (s):</label>
                            <input
                              type="number"
                              value={editActionTimeout}
                              onChange={(e) => setEditActionTimeout(e.target.value)}
                              className="w-24 px-2 py-0.5 rounded bg-black border border-neutral-800 text-white text-xs font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <CodeEditor
                          value={act.command}
                          readOnly={true}
                          language="shell"
                          label={`COMMAND: ${act.name}`}
                          minHeight="70px"
                          maxHeight="160px"
                        />
                      )}

                      <div className="text-[11px] font-mono text-neutral-600">
                        Webhook: <code className="text-neutral-400">{host}/api/webhook/{app.secret.slice(0, 10)}.../{act.name}</code>
                      </div>
                    </div>
                  );
                })}

                {app.actions.length === 0 && (
                  <div className="p-6 text-center border border-dashed border-neutral-800 rounded-lg text-neutral-600 text-xs font-mono">
                    No actions configured. Click "Add Command" to define a whitelisted deployment script.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Webhook Setup Guide */}
          {activeTab === 'webhook' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950 text-xs text-neutral-400 space-y-1">
                <div className="text-white font-medium">Safe Webhook Endpoint</div>
                <p>
                  Instead of giving external runners SSH access with Appleboy (where malicious scripts can be injected in YAML),
                  configure your GitHub Actions to send an HTTP POST to Deppploy.
                </p>
              </div>

              {/* Endpoints */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-neutral-500 uppercase">1. Webhook Endpoints</div>
                <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between gap-2 bg-black p-2 rounded border border-neutral-800 text-white">
                    <span className="truncate">{webhookUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="text-neutral-400 hover:text-white text-xs shrink-0"
                    >
                      {copiedWebhook ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-black p-2 rounded border border-neutral-800 text-white">
                    <span className="truncate">{shortcutUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shortcutUrl);
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="text-neutral-400 hover:text-white text-xs shrink-0"
                    >
                      {copiedWebhook ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* GitHub Actions Snippet using CodeEditor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-500 uppercase">
                    2. GitHub Actions (.github/workflows/deploy.yml)
                  </span>
                </div>
                <CodeEditor
                  value={`name: Deploy to VPS
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
                  readOnly={true}
                  language="yaml"
                  label="WORKFLOW YAML"
                  minHeight="180px"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Deployment Logs */}
          {activeTab === 'history' && (
            <div className="space-y-2.5 font-mono text-xs">
              {app.deployments?.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onViewLogs(d.id)}
                  className="p-3 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">#{d.id}</span>
                      <span className="text-neutral-300 font-semibold">{d.actionName}</span>
                      {d.status === 'SUCCESS' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-black font-semibold">
                          PASSED (exit 0)
                        </span>
                      )}
                      {d.status === 'FAILED' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded border border-neutral-700 text-neutral-400">
                          FAILED (exit {d.exitCode})
                        </span>
                      )}
                      {d.status === 'RUNNING' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded border border-neutral-700 text-white animate-pulse">
                          RUNNING
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-3">
                      <span>{new Date(d.createdAt).toLocaleTimeString()}</span>
                      <span>by {d.triggeredBy}</span>
                      {d.durationMs && <span>{(d.durationMs / 1000).toFixed(1)}s</span>}
                    </div>
                  </div>

                  <button className="flex items-center gap-1 text-neutral-400 hover:text-white transition">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>view log →</span>
                  </button>
                </div>
              ))}

              {(!app.deployments || app.deployments.length === 0) && (
                <div className="p-6 text-center text-neutral-600 text-xs border border-dashed border-neutral-800 rounded-lg">
                  No deployment history recorded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: App Settings & Environment CodeEditor */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-mono">
                  VPS WORKING DIRECTORY (CWD) *
                </label>
                <input
                  type="text"
                  required
                  value={editCwd}
                  onChange={(e) => setEditCwd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-black border border-neutral-800 text-white text-xs font-mono focus:border-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-mono">
                  TARGET GIT BRANCH
                </label>
                <input
                  type="text"
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-black border border-neutral-800 text-white text-xs font-mono focus:border-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1 font-mono">
                  ENVIRONMENT VARIABLES (JSON Code Editor)
                </label>
                <CodeEditor
                  value={editEnv}
                  onChange={setEditEnv}
                  language="json"
                  label="ENV VARIABLES (JSON)"
                  minHeight="140px"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-4 py-1.5 rounded bg-white hover:bg-neutral-200 text-black text-xs font-medium transition disabled:opacity-50"
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
