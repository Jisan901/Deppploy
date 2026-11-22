# Deppploy 🚀

> **Secure, self-hosted CI/CD webhook deployment server with an authentic VS Code Dark Modern admin UI.**

Replace vulnerable SSH runners (like Appleboy) with strict, administrator-whitelisted command execution. Deppploy ensures **zero arbitrary remote code execution** on your VPS.

---

## ⚡ Features

- **CLI-First**: Control your server with `deppploy start`, `deppploy status`, `deppploy stop`, `deppploy logs`.
- **Background Daemon**: Run seamlessly as a detached background daemon (`--daemon`) or in foreground.
- **VS Code Dark Modern UI**: Built-in web console with authentic syntax-highlighted code editors for Shell scripts, YAML, JSON, and process execution logs.
- **Zero Arbitrary Execution**: External CI/CD webhooks (GitHub Actions, GitLab CI, curl) can only trigger exact commands configured and approved in the database by the admin.
- **256-Bit Secret Tokens**: High-entropy cryptographically generated tokens (`dep_sec_...`) with instant rotation.
- **Loopback Privacy & SSH Tunneling**: Bind strictly to `127.0.0.1:4444` for private VPS operation accessible only through SSH port forwarding.
- **Audit Logs & Cleanup**: Full execution streams (exit codes, stdout, stderr, execution duration, trigger IP) with one-click purge options.
- **Password Management**: Change administrative credentials directly from the UI or API.

---

## 📦 Installation

Install globally via npm:

```bash
npm install -g deppploy
```

Or run directly without installation via `npx`:

```bash
npx deppploy start --port 4444 --host 127.0.0.1
```

---

## 💻 CLI Commands

### 1. Start Server

```bash
# Foreground mode
deppploy start --port 4444 --host 127.0.0.1

# Background daemon mode (recommended on VPS)
deppploy start --daemon --port 4444 --host 127.0.0.1

# With custom PostgreSQL database URL
deppploy start --daemon --port 4444 --db "postgresql://user:pass@localhost:5432/deppploy"
```

### 2. Check Server Status

```bash
deppploy status
```

Output:
```text
● Deppploy is ONLINE
  PID:         86740
  Address:     http://127.0.0.1:4444
  Admin UI:    http://127.0.0.1:4444/admin
  Uptime:      2.5h (started 11/22/2026, 8:00:00 PM)
  Logs:        ~/.deppploy/logs/deppploy.log
  Applications: 2 registered (2 active)
  Deployments:  15 passed, 0 failed

ℹ Private Access Mode: Server is bound to loopback (127.0.0.1).
  To access remotely from your local machine via SSH tunnel:
  ssh -N -L 4444:127.0.0.1:4444 <user>@<vps-ip>
```

### 3. View / Follow Logs

```bash
# View last 50 lines
deppploy logs

# Follow real-time log output live
deppploy logs -f

# View last 100 lines
deppploy logs -n 100
```

### 4. Restart Server

```bash
deppploy restart
# or restart with new port
deppploy restart --port 5000
```

### 5. Stop Server

```bash
deppploy stop
```

### 6. Connect via SSH Port Forwarding Tunnel

If your server runs on a remote VPS bound to `127.0.0.1:4444`, establish a secure tunnel:

```bash
deppploy tunnel ubuntu@your-vps-ip
# Or directly via ssh:
ssh -N -L 4444:127.0.0.1:4444 ubuntu@your-vps-ip
```

Then open your local browser to **[http://localhost:4444/admin](http://localhost:4444/admin)**.

---

## 🔑 Default Admin Credentials

- **URL**: `http://localhost:4444/admin`
- **Email**: `admin@deppploy.local`
- **Password**: `admin123456` *(Changeable via top navbar key icon)*

---

## 🛡️ Replacing Appleboy in GitHub Actions

Previously with `appleboy/ssh-action`, YAML files could run arbitrary bash commands on your VPS:

```yaml
# ❌ VULNERABLE: Anyone who modifies the YAML can execute arbitrary commands on the VPS
- name: Deploy via Appleboy
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.HOST }}
    username: ubuntu
    key: ${{ secrets.KEY }}
    script: |
      rm -rf / # arbitrary commands can be injected!
```

With **Deppploy**, only pre-configured whitelisted actions are executed:

```yaml
# ✅ SECURE: The runner only triggers an authorized action token
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
          curl -X POST "https://deploy.yourdomain.com/dep_sec_your_app_token_here/deploy" \
            -H "Content-Type: application/json" \
            -d '{"ref": "${{ github.ref }}", "sha": "${{ github.sha }}", "actor": "${{ github.actor }}"}'
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4444` | Server listening port |
| `HOST` | `127.0.0.1` | Network interface (`127.0.0.1` for private loopback, `0.0.0.0` for public) |
| `DATABASE_URL` | - | PostgreSQL connection URL |
| `JWT_SECRET` | auto-generated | Secret key for admin session authentication |

---

## 🚀 Publishing to npm

To publish this package to npm:

```bash
# 1. Log in to your npm account
npm login

# 2. Build and publish
npm publish
```

---

## 📄 License

MIT © Jisan
