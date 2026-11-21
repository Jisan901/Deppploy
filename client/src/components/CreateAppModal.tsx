import React, { useState } from 'react';
import { X, Folder, Plus, Sparkles } from 'lucide-react';
import { api } from '../api';
import { CodeEditor } from './CodeEditor';

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
  const [deployCmd, setDeployCmd] = useState('git pull origin main && pnpm install --frozen-lockfile && pnpm build && pm2 reload app');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded border border-[#3c3c3c] bg-[#252526] shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] bg-[#181818]">
          <div>
            <h3 className="font-semibold text-sm text-white">Register New Application</h3>
            <p className="text-xs text-[#858585] mt-0.5">Configure safe whitelisted commands for your VPS</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#333333] text-[#858585] hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="px-6 py-2.5 bg-[#1f1f1f] border-b border-[#2d2d2d] flex items-center gap-2 text-xs font-mono">
          <span className="text-[#858585] flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#007acc]" />
            presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('nest')}
            className="px-2 py-0.5 rounded border border-[#3c3c3c] bg-[#252526] text-[#cccccc] hover:bg-[#007acc] hover:border-[#007acc] hover:text-white transition"
          >
            NestJS PM2
          </button>
          <button
            type="button"
            onClick={() => applyPreset('react')}
            className="px-2 py-0.5 rounded border border-[#3c3c3c] bg-[#252526] text-[#cccccc] hover:bg-[#007acc] hover:border-[#007acc] hover:text-white transition"
          >
            React Vite
          </button>
          <button
            type="button"
            onClick={() => applyPreset('pm2')}
            className="px-2 py-0.5 rounded border border-[#3c3c3c] bg-[#252526] text-[#cccccc] hover:bg-[#007acc] hover:border-[#007acc] hover:text-white transition"
          >
            Node.js PM2
          </button>
          <button
            type="button"
            onClick={() => applyPreset('docker')}
            className="px-2 py-0.5 rounded border border-[#3c3c3c] bg-[#252526] text-[#cccccc] hover:bg-[#007acc] hover:border-[#007acc] hover:text-white transition"
          >
            Docker
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto bg-[#252526]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#858585] block mb-1 font-mono">
                APPLICATION NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ConnectPoint API"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#858585] block mb-1 font-mono">
                SLUG (URL FRIENDLY)
              </label>
              <input
                type="text"
                placeholder="e.g. connectpoint-api-v1"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs font-mono focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#858585] block mb-1 font-mono">
              VPS WORKING DIRECTORY (CWD) *
            </label>
            <div className="relative">
              <Folder className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#007acc]" />
              <input
                type="text"
                required
                placeholder="/var/www/my-app or /Users/jisan/Documents/pocket/connectpoint-api-v1"
                value={cwd}
                onChange={(e) => setCwd(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs font-mono focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#858585] block mb-1 font-mono">
                TARGET BRANCH
              </label>
              <input
                type="text"
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs font-mono focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#858585] block mb-1 font-mono">
                DESCRIPTION (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="Production API service"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] text-white text-xs focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#333333] space-y-3">
            <div>
              <label className="text-[11px] text-[#858585] block mb-1 font-mono">
                ACTION: <span className="text-[#75beff] font-semibold">deploy</span> SCRIPT (VS Code Editor)
              </label>
              <CodeEditor
                value={deployCmd}
                onChange={setDeployCmd}
                language="shell"
                label="DEPLOY ACTION SCRIPT"
                minHeight="90px"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#858585] block mb-1 font-mono">
                ACTION: <span className="text-[#75beff] font-semibold">status</span> SCRIPT (VS Code Editor)
              </label>
              <CodeEditor
                value={statusCmd}
                onChange={setStatusCmd}
                language="shell"
                label="STATUS ACTION SCRIPT"
                minHeight="70px"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#333333]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#3c3c3c] bg-[#252526] text-xs text-[#858585] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] text-white text-xs font-medium transition disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'Creating...' : 'Create App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
