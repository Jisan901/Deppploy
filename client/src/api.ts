import { AppItem, Deployment, SystemStats, User } from './types';

const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('deppploy_token');
}

export function setToken(token: string) {
  localStorage.setItem('deppploy_token', token);
}

export function clearToken() {
  localStorage.removeItem('deppploy_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized or session expired');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, pass: string): Promise<{ accessToken: string; user: User }> {
    const res = await request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    setToken(res.accessToken);
    return res;
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  async changePassword(oldPass: string, newPass: string) {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPass, newPass }),
    });
  },

  // Apps
  async listApps(): Promise<AppItem[]> {
    return request<AppItem[]>('/apps');
  },

  async getApp(id: number): Promise<AppItem & { deployments: Deployment[] }> {
    return request<AppItem & { deployments: Deployment[] }>(`/apps/${id}`);
  },

  async createApp(data: any): Promise<AppItem> {
    return request<AppItem>('/apps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApp(id: number, data: any): Promise<AppItem> {
    return request<AppItem>(`/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async regenerateSecret(id: number): Promise<{ secret: string }> {
    return request<{ secret: string }>(`/apps/${id}/regenerate-secret`, {
      method: 'POST',
    });
  },

  async deleteApp(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/apps/${id}`, {
      method: 'DELETE',
    });
  },

  // Actions
  async addAction(appId: number, data: { name: string; command: string; description?: string; timeoutSec?: number }) {
    return request(`/apps/${appId}/actions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAction(actionId: number, data: { command?: string; description?: string; timeoutSec?: number }) {
    return request(`/apps/actions/${actionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAction(actionId: number) {
    return request(`/apps/actions/${actionId}`, {
      method: 'DELETE',
    });
  },

  async triggerAction(appId: number, actionName: string): Promise<any> {
    return request(`/apps/${appId}/trigger/${actionName}`, {
      method: 'POST',
    });
  },

  // Deployments
  async listDeployments(appId?: number): Promise<Deployment[]> {
    return request<Deployment[]>(`/deployments${appId ? `?appId=${appId}` : ''}`);
  },

  async clearDeployments(appId?: number): Promise<{ success: boolean; count: number; message: string }> {
    return request<{ success: boolean; count: number; message: string }>(
      `/deployments/clear${appId ? `?appId=${appId}` : ''}`,
      { method: 'DELETE' }
    );
  },

  async getDeployment(id: number): Promise<Deployment> {
    return request<Deployment>(`/deployments/${id}`);
  },

  // System
  async getSystemStats(): Promise<SystemStats> {
    return request<SystemStats>('/system/stats');
  },
};

