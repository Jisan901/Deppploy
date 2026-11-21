export interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
}

export interface AppAction {
  id: number;
  appId: number;
  name: string;
  command: string;
  description?: string;
  timeoutSec: number;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: number;
  appId: number;
  actionName: string;
  command: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMED_OUT';
  exitCode?: number | null;
  stdout?: string | null;
  stderr?: string | null;
  triggeredBy: string;
  triggerIp?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  createdAt: string;
  app?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface AppItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  secret: string;
  cwd: string;
  branch?: string | null;
  environment?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  actions: AppAction[];
  latestDeployment?: Deployment | null;
  totalDeployments: number;
}

export interface SystemStats {
  server: {
    hostname: string;
    platform: string;
    release: string;
    arch: string;
    uptimeSeconds: number;
    nodeVersion: string;
    cpuCount: number;
    cpuModel: string;
    loadAvg: number[];
    memory: {
      total: number;
      free: number;
      used: number;
      usedPercentage: number;
    };
  };
  metrics: {
    totalApps: number;
    activeApps: number;
    totalDeployments: number;
    runningDeployments: number;
    successDeployments: number;
    failedDeployments: number;
  };
}

