#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, '..');

const packageJson = JSON.parse(
  fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')
);

const APP_DIR = path.join(os.homedir(), '.deppploy');
const RUN_DIR = path.join(APP_DIR, 'run');
const LOGS_DIR = path.join(APP_DIR, 'logs');
const PID_FILE = path.join(RUN_DIR, 'deppploy.pid');
const STATE_FILE = path.join(RUN_DIR, 'state.json');
const LOG_FILE = path.join(LOGS_DIR, 'deppploy.log');

function ensureDirectories() {
  fs.mkdirSync(RUN_DIR, { recursive: true });
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getRunningState() {
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (state.pid && isProcessRunning(state.pid)) {
      return state;
    }
    // Stale state file
    try { fs.unlinkSync(STATE_FILE); } catch {}
    try { fs.unlinkSync(PID_FILE); } catch {}
    return null;
  } catch {
    return null;
  }
}

function saveRunningState(state) {
  ensureDirectories();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  fs.writeFileSync(PID_FILE, String(state.pid), 'utf8');
}

function clearRunningState() {
  try { if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE); } catch {}
  try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}
}

const program = new Command();

program
  .name('deppploy')
  .description('Secure, self-hosted CI/CD webhook deployment server with VS Code Dark UI')
  .version(packageJson.version);

// -----------------------------------------------------------------------------
// COMMAND: start
// -----------------------------------------------------------------------------
program
  .command('start')
  .description('Start the Deppploy deployment server')
  .option('-p, --port <number>', 'Port to listen on', '4444')
  .option('-h, --host <address>', 'Host address to bind to', '127.0.0.1')
  .option('-d, --daemon', 'Run in background as a daemon process', false)
  .option('--db, --database-url <url>', 'PostgreSQL database connection URL')
  .option('--env <path>', 'Custom .env file path')
  .action(async (options) => {
    const existing = getRunningState();
    if (existing) {
      console.log(`\x1b[33m[!] Deppploy is already running (PID: ${existing.pid})\x1b[0m`);
      console.log(`    URL: http://${existing.host}:${existing.port}`);
      console.log(`    Admin UI: http://${existing.host}:${existing.port}/admin`);
      console.log(`    Run 'deppploy status' or 'deppploy stop'`);
      return;
    }

    const host = options.host || '127.0.0.1';
    const port = String(options.port || '4444');
    const serverPath = path.join(PKG_ROOT, 'dist', 'server.mjs');

    if (!fs.existsSync(serverPath)) {
      console.error(`\x1b[31m[ERROR] Server bundle not found at: ${serverPath}\x1b[0m`);
      console.error(`Please run 'npm run build' inside the package directory.`);
      process.exit(1);
    }

    // Build environment variables
    const env = {
      ...process.env,
      HOST: host,
      PORT: port,
    };

    if (options.databaseUrl) {
      env.DATABASE_URL = options.databaseUrl;
    }

    // Load custom or default .env if present
    if (options.env && fs.existsSync(options.env)) {
      try {
        process.loadEnvFile?.(options.env);
      } catch {}
    } else {
      const localEnv = path.join(process.cwd(), '.env');
      const homeEnv = path.join(APP_DIR, '.env');
      if (fs.existsSync(localEnv)) {
        try { process.loadEnvFile?.(localEnv); } catch {}
      } else if (fs.existsSync(homeEnv)) {
        try { process.loadEnvFile?.(homeEnv); } catch {}
      }
    }

    ensureDirectories();

    if (options.daemon) {
      // Background daemon mode
      const logFd = fs.openSync(LOG_FILE, 'a');

      const child = spawn(process.execPath, [serverPath], {
        detached: true,
        stdio: ['ignore', logFd, logFd],
        env,
        cwd: PKG_ROOT,
      });

      child.unref();

      const pid = child.pid;
      saveRunningState({
        pid,
        host,
        port,
        startedAt: new Date().toISOString(),
        logFile: LOG_FILE,
      });

      // Give it 1 second to verify startup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!isProcessRunning(pid)) {
        clearRunningState();
        console.error(`\x1b[31m[ERROR] Server failed to start. Recent logs:\x1b[0m`);
        try {
          const logData = fs.readFileSync(LOG_FILE, 'utf8');
          const lines = logData.trim().split('\n').slice(-15);
          console.error(lines.join('\n'));
        } catch {}
        process.exit(1);
      }

      console.log(`\x1b[32m✔ Deppploy server started in background (PID: ${pid})\x1b[0m`);
      console.log(`  \x1b[36m•\x1b[0m Local Address: \x1b[1mhttp://${host}:${port}\x1b[0m`);
      console.log(`  \x1b[36m•\x1b[0m Admin Console: \x1b[1mhttp://${host}:${port}/admin\x1b[0m`);
      console.log(`  \x1b[36m•\x1b[0m Log Stream:   ${LOG_FILE}`);
      console.log('');
      console.log(`Run \x1b[33mdeppploy status\x1b[0m to check health, or \x1b[33mdeppploy stop\x1b[0m to terminate.`);
    } else {
      // Foreground mode
      console.log(`\x1b[36m=====================================================\x1b[0m`);
      console.log(`\x1b[1;34m  Deppploy CI/CD Server (Foreground Mode)\x1b[0m`);
      console.log(`\x1b[36m=====================================================\x1b[0m`);
      console.log(`  Listening: \x1b[1mhttp://${host}:${port}\x1b[0m`);
      console.log(`  Admin UI:  \x1b[1mhttp://${host}:${port}/admin\x1b[0m`);
      console.log(`  Press Ctrl+C to stop`);
      console.log(`-----------------------------------------------------`);

      const child = spawn(process.execPath, [serverPath], {
        stdio: 'inherit',
        env,
        cwd: PKG_ROOT,
      });

      child.on('exit', (code) => {
        process.exit(code ?? 0);
      });
    }
  });

// -----------------------------------------------------------------------------
// COMMAND: status
// -----------------------------------------------------------------------------
program
  .command('status')
  .description('Check current server status and active process information')
  .option('-p, --port <number>', 'Port to check', '4444')
  .option('-h, --host <address>', 'Host to check', '127.0.0.1')
  .action(async (options) => {
    const state = getRunningState();
    const host = state?.host || options.host || '127.0.0.1';
    const port = state?.port || options.port || '4444';
    const pid = state?.pid;
    const startedAt = state?.startedAt;

    // Try pinging server
    let stats = null;
    let isPortResponding = false;
    try {
      const res = await fetch(`http://${host}:${port}/admin/`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.status === 200 || res.status === 301 || res.status === 302 || res.status === 401) {
        isPortResponding = true;
      }
    } catch {}

    const isAlive = (pid && isProcessRunning(pid)) || isPortResponding;

    if (!isAlive) {
      if (state) clearRunningState();
      console.log(`\x1b[90mStatus:\x1b[0m \x1b[31mSTOPPED\x1b[0m`);
      console.log(`No active Deppploy server detected on http://${host}:${port}`);
      console.log(`Run \x1b[36mdeppploy start --daemon\x1b[0m to start.`);
      return;
    }

    const uptimeStr = startedAt
      ? (() => {
          const sec = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
          return sec > 3600 ? `${(sec / 3600).toFixed(1)}h` : sec > 60 ? `${Math.floor(sec / 60)}m` : `${sec}s`;
        })()
      : 'active';

    console.log(`\x1b[32m● Deppploy is ONLINE\x1b[0m`);
    if (pid) console.log(`  \x1b[90mPID:\x1b[0m         ${pid}`);
    console.log(`  \x1b[90mAddress:\x1b[0m     http://${host}:${port}`);
    console.log(`  \x1b[90mAdmin UI:\x1b[0m    http://${host}:${port}/admin`);
    if (startedAt) console.log(`  \x1b[90mUptime:\x1b[0m      ${uptimeStr} (started ${new Date(startedAt).toLocaleString()})`);
    if (state?.logFile) console.log(`  \x1b[90mLogs:\x1b[0m        ${state.logFile}`);

    if (stats) {
      console.log(`  \x1b[90mApplications:\x1b[0m ${stats.metrics?.totalApps ?? 0} registered (${stats.metrics?.activeApps ?? 0} active)`);
      console.log(`  \x1b[90mDeployments:\x1b[0m  ${stats.metrics?.successDeployments ?? 0} passed, ${stats.metrics?.failedDeployments ?? 0} failed`);
    }

    if (host === '127.0.0.1' || host === 'localhost') {
      console.log('');
      console.log(`\x1b[34mℹ Private Access Mode:\x1b[0m Server is bound to loopback (${host}).`);
      console.log(`  To access remotely from your local machine via SSH tunnel:`);
      console.log(`  \x1b[36mssh -N -L ${port}:${host}:${port} <user>@<vps-ip>\x1b[0m`);
    }
  });

// -----------------------------------------------------------------------------
// COMMAND: stop
// -----------------------------------------------------------------------------
program
  .command('stop')
  .description('Stop the running background Deppploy daemon')
  .action(async () => {
    const state = getRunningState();
    if (!state) {
      console.log(`\x1b[33mNo running Deppploy daemon found.\x1b[0m`);
      return;
    }

    const { pid } = state;
    console.log(`Stopping Deppploy daemon (PID: ${pid})...`);

    try {
      process.kill(pid, 'SIGTERM');

      // Wait up to 5 seconds for clean exit
      let stopped = false;
      for (let i = 0; i < 25; i++) {
        await new Promise((r) => setTimeout(r, 200));
        if (!isProcessRunning(pid)) {
          stopped = true;
          break;
        }
      }

      if (!stopped) {
        console.log(`Process did not exit cleanly. Sending SIGKILL...`);
        try { process.kill(pid, 'SIGKILL'); } catch {}
      }

      clearRunningState();
      console.log(`\x1b[32m✔ Deppploy daemon stopped.\x1b[0m`);
    } catch (err) {
      clearRunningState();
      console.error(`\x1b[31m[ERROR] Failed to stop process:\x1b[0m ${err.message}`);
    }
  });

// -----------------------------------------------------------------------------
// COMMAND: restart
// -----------------------------------------------------------------------------
program
  .command('restart')
  .description('Restart the background Deppploy daemon')
  .option('-p, --port <number>', 'Port to listen on')
  .option('-h, --host <address>', 'Host address to bind to')
  .action(async (options) => {
    const state = getRunningState();
    const port = options.port || state?.port || '4444';
    const host = options.host || state?.host || '127.0.0.1';

    if (state) {
      console.log(`Stopping active daemon (PID: ${state.pid})...`);
      try {
        process.kill(state.pid, 'SIGTERM');
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 200));
          if (!isProcessRunning(state.pid)) break;
        }
      } catch {}
      clearRunningState();
    }

    console.log(`Starting Deppploy daemon on http://${host}:${port}...`);
    const serverPath = path.join(PKG_ROOT, 'dist', 'server.mjs');
    ensureDirectories();

    const logFd = fs.openSync(LOG_FILE, 'a');
    const child = spawn(process.execPath, [serverPath], {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: {
        ...process.env,
        HOST: host,
        PORT: port,
      },
      cwd: PKG_ROOT,
    });

    child.unref();

    saveRunningState({
      pid: child.pid,
      host,
      port,
      startedAt: new Date().toISOString(),
      logFile: LOG_FILE,
    });

    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(`\x1b[32m✔ Deppploy restarted successfully (PID: ${child.pid})\x1b[0m`);
    console.log(`  Admin UI: http://${host}:${port}/admin`);
  });

// -----------------------------------------------------------------------------
// COMMAND: logs
// -----------------------------------------------------------------------------
program
  .command('logs')
  .description('Display or follow output logs of the daemon process')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .option('-f, --follow', 'Follow log stream live in terminal', false)
  .action((options) => {
    if (!fs.existsSync(LOG_FILE)) {
      console.log(`\x1b[33mNo log file found at: ${LOG_FILE}\x1b[0m`);
      return;
    }

    const linesCount = parseInt(options.lines, 10) || 50;

    if (options.follow) {
      const tail = spawn('tail', ['-n', String(linesCount), '-f', LOG_FILE], {
        stdio: 'inherit',
      });
      tail.on('exit', () => process.exit(0));
    } else {
      const logContent = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = logContent.split('\n');
      console.log(lines.slice(-linesCount).join('\n'));
    }
  });

// -----------------------------------------------------------------------------
// COMMAND: tunnel
// -----------------------------------------------------------------------------
program
  .command('tunnel <sshTarget>')
  .description('Establish an SSH port forwarding tunnel to access remote Deppploy')
  .option('-p, --port <number>', 'Remote port to forward', '4444')
  .option('-l, --local-port <number>', 'Local port to bind', '4444')
  .action((sshTarget, options) => {
    const remotePort = options.port || '4444';
    const localPort = options.localPort || '4444';
    console.log(`\x1b[36mEstablishing SSH tunnel to ${sshTarget}...\x1b[0m`);
    console.log(`Forwarding local port ${localPort} -> 127.0.0.1:${remotePort} on ${sshTarget}`);
    console.log(`\x1b[32mOnce connected, open: http://localhost:${localPort}/admin\x1b[0m`);
    console.log(`Press Ctrl+C to close tunnel.`);
    console.log('');

    const ssh = spawn(
      'ssh',
      ['-N', '-L', `${localPort}:127.0.0.1:${remotePort}`, sshTarget],
      { stdio: 'inherit' }
    );

    ssh.on('exit', (code) => {
      console.log(`Tunnel closed (exit code ${code})`);
      process.exit(code ?? 0);
    });
  });

program.parse(process.argv);
