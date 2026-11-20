import React, { useState } from 'react';
import { X, Folder, Sparkles, Plus, Terminal } from 'lucide-react';
import { api } from '../api';

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [cwd, setCwd] = useState('');
  const [branch, setBranch] = useState('main');
  const [deployCmd, setDeployCmd] = useState('git pull origin main && pnpm install && pnpm build && pm2 reload app');
  const [statusCmd, setStatusCmd] = useState('git status --short && git log -1 --oneline');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyPreset = (preset: 'nest' | 'react' | 'pm2' | 'docker') => {
    if (preset === 'nest') {
      setName('Backend API');
      setSlug('backend-api');
      setCwd('/var/www/backend-api');
      setDeployCmd('git pull origin main && pnpm install --frozen-lockfile && pnpm build && pm2 reload backend-api');
      setStatusCmd('pm2 status backend-api');
    } else if (preset === 'react') {
      setName('Web Client');
      setSlug('web-client');
      setCwd('/var/www/web-client');
      setDeployCmd('git pull origin main && pnpm install --frozen-lockfile && pnpm build');
      setStatusCmd('git status --short && git log -1 --oneline');
    } else if (preset === 'pm2') {
      setName('Node PM2 Service');
      setSlug('node-service');
      setCwd('/var/www/service');
      setDeployCmd('git pull origin main && npm install && pm2 restart service');
      setStatusCmd('pm2 status service');
    } else if (preset === 'docker') {
      setName('Docker App');
      setSlug('docker-app');
      setCwd('/var/www/docker-app');
      setDeployCmd('git pull origin main && docker compose build && docker compose up -d');
      setStatusCmd('docker compose ps');
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cwd) return;
    setIsSubmitting(true);
    try {
      await api.createApp({
        name,
        slug: slug || undefined,
        description: description || undefined,
        cwd,
        branch,
        actions: [
          {
            name: 'deploy',
            command: deployCmd,
            description: 'Primary deployment sequence',
            timeoutSec: 300,
          },
          {
            name: 'status',
            command: statusCmd,
            description: 'Check active git commit or process status',
            timeoutSec: 30,
          },
        ],
      });
      onCreated();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Register New Application</h3>
              <p className="text-xs text-slate-400">Configure safe whitelisted deployment actions for your VPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('nest')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
          >
            NestJS PM2
          </button>
          <button
            type="button"
            onClick={() => applyPreset('react')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
          >
            React Vite
          </button>
          <button
            type="button"
            onClick={() => applyPreset('pm2')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
          >
            Node.js PM2
          </button>
          <button
            type="button"
            onClick={() => applyPreset('docker')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
          >
            Docker Compose
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Application Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. ConnectPoint API"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Slug (URL friendly)</label>
              <input
                type="text"
                placeholder="e.g. connectpoint-api-v1"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Working Directory on VPS (cwd) *</label>
            <div className="relative">
              <Folder className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                required
                placeholder="/var/www/my-app or /Users/jisan/Documents/pocket/connectpoint-api-v1"
                value={cwd}
                onChange={(e) => setCwd(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Git Branch</label>
              <input
                type="text"
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Description (optional)</label>
              <input
                type="text"
                placeholder="Production API service"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              Initial Allowed Commands
            </h4>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Action: <span className="font-mono text-emerald-400 font-semibold">deploy</span> command
              </label>
              <textarea
                rows={2}
                value={deployCmd}
                onChange={(e) => setDeployCmd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Action: <span className="font-mono text-emerald-400 font-semibold">status</span> command
              </label>
              <textarea
                rows={2}
                value={statusCmd}
                onChange={(e) => setStatusCmd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              {isSubmitting ? 'Creating...' : 'Create App & Generate Secret'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
