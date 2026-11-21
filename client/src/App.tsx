import React, { useEffect, useState } from 'react';
import {
  Layers,
  Search,
  Terminal,
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
    <div className="min-h-screen bg-[#1e1e1e] text-[#cccccc] flex flex-col font-sans">
      <Navbar
        user={user}
        stats={stats}
        onRefresh={loadData}
        onLogout={handleLogout}
        onOpenCreateApp={() => setIsCreateOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* System metrics row */}
        <DashboardStats stats={stats} />

        {/* View Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-b border-[#2d2d2d] pb-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setActiveView('apps')}
              className={`px-3 py-1.5 rounded transition ${
                activeView === 'apps'
                  ? 'bg-[#007acc] text-white font-medium shadow-sm'
                  : 'text-[#858585] hover:text-white hover:bg-[#252526]'
              }`}
            >
              APPLICATIONS ({apps.length})
            </button>
            <button
              onClick={() => setActiveView('deployments')}
              className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 ${
                activeView === 'deployments'
                  ? 'bg-[#007acc] text-white font-medium shadow-sm'
                  : 'text-[#858585] hover:text-white hover:bg-[#252526]'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>AUDIT LOGS ({deployments.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#858585]" />
            <input
              type="text"
              placeholder="Search apps or paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#252526] border border-[#3c3c3c] text-xs text-white placeholder-[#858585] focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] focus:outline-none transition font-mono"
            />
          </div>
        </div>

        {/* View 1: Applications Grid */}
        {activeView === 'apps' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
              <div className="p-12 text-center rounded border border-dashed border-[#333333] bg-[#252526]/40 space-y-2.5">
                <Layers className="h-6 w-6 text-[#858585] mx-auto" />
                <h3 className="text-xs font-semibold text-white font-mono uppercase">No Applications Found</h3>
                <p className="text-xs text-[#858585] max-w-sm mx-auto">
                  {searchQuery
                    ? 'No apps match your search filter.'
                    : 'Click "+ New App" to register a project and configure safe deployment commands.'}
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-3.5 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] text-white text-xs font-medium transition shadow-sm"
                >
                  Create Application
                </button>
              </div>
            )}
          </div>
        )}

        {/* View 2: Global Deployments Audit Log Table */}
        {activeView === 'deployments' && (
          <div className="rounded border border-[#333333] bg-[#252526] overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-[#2d2d2d] bg-[#181818] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Execution Audit Stream
                </h3>
                <p className="text-xs text-[#858585]">Every webhook ping and manual trigger executed on this VPS</p>
              </div>
              <button
                onClick={loadData}
                className="p-1.5 rounded border border-[#333333] bg-[#252526] text-[#858585] hover:text-white hover:bg-[#333333] text-xs flex items-center gap-1 font-mono transition"
              >
                <RefreshCw className="h-3 w-3" />
                <span>refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#181818] border-b border-[#2d2d2d] text-[#858585] text-[11px]">
                  <tr>
                    <th className="px-5 py-2.5">ID</th>
                    <th className="px-5 py-2.5">APP</th>
                    <th className="px-5 py-2.5">ACTION</th>
                    <th className="px-5 py-2.5">STATUS</th>
                    <th className="px-5 py-2.5">DURATION</th>
                    <th className="px-5 py-2.5">TRIGGER</th>
                    <th className="px-5 py-2.5">TIME</th>
                    <th className="px-5 py-2.5 text-right">OUTPUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d2d2d]">
                  {deployments.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedLogId(d.id)}
                      className="hover:bg-[#2a2d2e] transition cursor-pointer"
                    >
                      <td className="px-5 py-2.5 font-bold text-white">#{d.id}</td>
                      <td className="px-5 py-2.5 text-[#cccccc]">{d.app?.name || `#${d.appId}`}</td>
                      <td className="px-5 py-2.5 text-[#75beff] font-semibold">{d.actionName}</td>
                      <td className="px-5 py-2.5">
                        {d.status === 'SUCCESS' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#16825d]/50 bg-[#16825d]/20 text-[#4ec9b0] font-medium">
                            PASSED
                          </span>
                        )}
                        {d.status === 'FAILED' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#f14c4c]/50 bg-[#f14c4c]/20 text-[#f14c4c] font-medium">
                            FAILED ({d.exitCode})
                          </span>
                        )}
                        {d.status === 'RUNNING' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#007acc] bg-[#007acc]/20 text-[#75beff] animate-pulse">
                            RUNNING
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-[#858585]">
                        {d.durationMs ? `${(d.durationMs / 1000).toFixed(2)}s` : '-'}
                      </td>
                      <td className="px-5 py-2.5 text-[#858585] truncate max-w-xs">{d.triggeredBy}</td>
                      <td className="px-5 py-2.5 text-[#858585]">
                        {new Date(d.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button className="text-[#75beff] hover:underline">view log →</button>
                      </td>
                    </tr>
                  ))}
                  {deployments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-6 text-center text-[#858585] italic">
                        No executions recorded yet.
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
