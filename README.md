# Deppploy — Secure VPS CI/CD Deployment Server

**Deppploy** is a self-hosted, secure CI/CD server designed to run directly on your VPS.

## 🛡️ Why Deppploy? The Appleboy Vulnerability Fix

Previously, many workflows relied on `appleboy/ssh-action` in GitHub Actions. With Appleboy, your VPS grants SSH access to external CI/CD runners, and the runner can execute **any arbitrary shell command** written in `.github/workflows/*.yml`. If a repository or workflow YAML is compromised, malicious code can be executed directly on your VPS with full user/root privileges.

### How Deppploy Solves This:
- **Zero Arbitrary Remote Command Execution**: The VPS administrator defines the explicit, whitelisted shell commands for each application inside the Deppploy Admin UI (e.g. `action: "deploy"` -> `git pull origin main && pnpm install --frozen-lockfile && pnpm build && pm2 reload app`).
- **Webhooks Only**: External services (GitHub Actions, GitLab CI, curl) only send a webhook request containing an authenticated App Secret token (`POST /api/webhook/<secret>/deploy` or `POST /<secret>/deploy`).
- **Strict Isolation**: No external parameters can pass bash strings or commands. Deppploy only executes the exact command configured in its PostgreSQL database, inside the application's designated working directory (`cwd`), with timeout and concurrency protections.

---

## ⚡ Tech Stack

- **Backend**: NestJS 12
- **Database & ORM**: PostgreSQL (`postgresql://postgres:901762@localhost:9017/deppploy`) + **Prisma 8** (with Contracts & Migrations)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons (served directly by NestJS via `@nestjs/serve-static`)
- **Authentication**: JWT with bcrypt password hashing

---

## 🚀 Quick Start

### 1. Environment Configuration
Ensure your database is accessible and export `DATABASE_URL`:
```bash
export DATABASE_URL="postgresql://postgres:901762@localhost:9017/deppploy"
export PORT=3000
export JWT_SECRET="deppploy-super-secret-key-2026"
```

### 2. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 3. Build & Run Production Server
```bash
npm run build:all
npm run start
```

---

## 🔑 Default Admin Credentials

- **URL**: `http://localhost:3000/` (or your VPS domain: `https://deploy.yourdomain.com`)
- **Email**: `admin@deppploy.local`
- **Password**: `admin123456`

---

## 📡 Webhook Usage

### 1. Trigger Deploy Action
```bash
curl -X POST "http://localhost:3000/api/webhook/<app-secret>/deploy"
```
Or use the shortcut URL:
```bash
curl -X POST "http://localhost:3000/<app-secret>/deploy"
```

### 2. Query App Status
```bash
curl -X GET "http://localhost:3000/<app-secret>/status"
```

### 3. Replace Appleboy in GitHub Actions (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to VPS
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Secure VPS Deployment
        run: |
          curl -X POST "https://deploy.yourdomain.com/api/webhook/${{ secrets.DEPPLOY_APP_SECRET }}/deploy" \
            -H "Content-Type: application/json" \
            -d '{"ref": "${{ github.ref }}", "sha": "${{ github.sha }}"}'
```

---

## 🗄️ Prisma 8 Workflow Commands

- **Emit contract types**: `npm run contract:emit`
- **Plan a migration**: `npx prisma migration plan --name <migration-name>`
- **Apply migration to development database**: `npx prisma db migrate --advance-ref db --yes`
- **Database Status**: `npx prisma migration status`
