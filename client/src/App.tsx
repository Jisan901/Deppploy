import React, { useEffect, useState } from 'react';
import {
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Terminal,
  ShieldAlert,
  Server,
  RefreshCw,
} from 'lucide-react';
import { api, getToken, clearToken } from './api';
import { AppItem, Deployment, SystemStats, User } from './types';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { AppCard } from './components/AppCard';
import { AppDetailModal } from './components/AppDetailModal';
import { CreateAppModal } from './components/CreateAppModal';
import { DeploymentLogModal } from './components/DeploymentLogModal';
import { LoginModal } from './components/LoginModal';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [apps, setApps] = useState<AppItem[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [selectedApp, setSelectedApp] = useState<(AppItem & { deployments: Deployment[] }) | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'apps' | 'deployments'>('apps');
  const [loading, setLoading] = useState(false);

  // Load Initial Data
  const loadData = async () => {
    try {
      if (getToken()) {
        const me = await api.getMe().catch(() => null);
        if (me) {
          setUser(me);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          return;
        }

        const [appsData, statsData, deploysData] = await Promise.all([
          api.listApps().catch(() => []),
          api.getSystemStats().catch(() => null),
          api.listDeployments().catch(() => []),
        ]);

        setApps(appsData);
        setStats(statsData);
        setDeployments(deploysData);

        // If an app detail modal is currently open, refresh its data too
        if (selectedApp) {
          const freshApp = await api.getApp(selectedApp.id).catch(() => null);
          if (freshApp) setSelectedApp(freshApp);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Auto-refresh interval every 6 seconds to update running deployments
    const interval = setInterval(() => {
      if (getToken()) {
        loadData();
      }
    }, 6000);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      clearInterval(interval);
    };
  }, []);

  const handleOpenAppDetails = async (app: AppItem) => {
    try {
      const detailed = await api.getApp(app.id);
      setSelectedApp(detailed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerAction = async (appId: number, actionName: string) => {
    const res = await api.triggerAction(appId, actionName);
    await loadData();
    if (res?.deploymentId) {
      setSelectedLogId(res.deploymentId);
    }
  };

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  const filteredApps = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.cwd.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isAuthenticated) {
    return <LoginModal onLoggedIn={(u) => { setUser(u); setIsAuthenticated(true); loadData(); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        user={user}
        stats={stats}
        onRefresh={loadData}
        onLogout={handleLogout}
        onOpenCreateApp={() => setIsCreateOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* System & Security Stats Overview */}
        <DashboardStats stats={stats} />

        {/* Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 sm:pb-0 sm:border-0">
            <button
              onClick={() => setActiveView('apps')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeView === 'apps'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Applications ({apps.length})
            </button>
            <button
              onClick={() => setActiveView('deployments')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                activeView === 'deployments'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>Execution Audit Logs ({deployments.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search apps, paths, slugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* View 1: Applications Grid */}
        {activeView === 'apps' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onOpenDetails={handleOpenAppDetails}
                  onTriggerAction={handleTriggerAction}
                  onViewLogs={(id) => setSelectedLogId(id)}
                />
              ))}
            </div>

            {filteredApps.length === 0 && (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
                <Layers className="h-8 w-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No Applications Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? 'No apps match your search filter.'
                    : 'Click "+ New App" to register a project and configure safe deployment commands.'}
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                >
                  Create Application
                </button>
              </div>
            )}
          </div>
        )}

        {/* View 2: Global Deployments Audit Log Table */}
        {activeView === 'deployments' && (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Audit Execution Stream</h3>
                <p className="text-xs text-slate-400">All webhook triggers and manual actions executed on VPS</p>
              </div>
              <button
                onClick={loadData}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">App</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Triggered By</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {deployments.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedLogId(d.id)}
                      className="hover:bg-slate-800/40 transition cursor-pointer font-mono"
                    >
                      <td className="px-6 py-3.5 font-bold text-white">#{d.id}</td>
                      <td className="px-6 py-3.5 text-slate-200">{d.app?.name || `#${d.appId}`}</td>
                      <td className="px-6 py-3.5 text-emerald-400">{d.actionName}</td>
                      <td className="px-6 py-3.5">
                        {d.status === 'SUCCESS' && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            SUCCESS
                          </span>
                        )}
                        {d.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="h-3 w-3" />
                            FAILED ({d.exitCode})
                          </span>
                        )}
                        {d.status === 'RUNNING' && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            RUNNING
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {d.durationMs ? `${(d.durationMs / 1000).toFixed(2)}s` : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 truncate max-w-xs">{d.triggeredBy}</td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {new Date(d.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button className="text-emerald-400 hover:underline">view log →</button>
                      </td>
                    </tr>
                  ))}
                  {deployments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500 italic">
                        No deployments executed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AppDetailModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onReload={loadData}
        onViewLogs={(id) => setSelectedLogId(id)}
      />

      <CreateAppModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadData}
      />

      <DeploymentLogModal
        deploymentId={selectedLogId}
        onClose={() => setSelectedLogId(null)}
      />
    </div>
  );
}

