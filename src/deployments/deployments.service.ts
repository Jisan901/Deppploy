import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { PrismaService } from "../prisma.service.ts";

export interface ExecutionResult {
  deploymentId: number;
  appName: string;
  appSlug: string;
  actionName: string;
  status: "SUCCESS" | "FAILED" | "TIMED_OUT";
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
}

@Injectable()
export class DeploymentsService {
  private activeProcesses = new Map<number, any>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async executeAction(params: {
    appId: number;
    actionName: string;
    triggeredBy?: string;
    triggerIp?: string;
    metadata?: any;
  }): Promise<ExecutionResult> {
    const { appId, actionName, triggeredBy = "MANUAL_UI", triggerIp, metadata } = params;

    // 1. Fetch App
    const apps = await this.prisma.db.orm.public.App
      .select("id", "name", "slug", "cwd", "environment", "isActive")
      .all();
    const app = apps.find((a) => a.id === appId);

    if (!app) {
      throw new NotFoundException(`App with ID ${appId} not found`);
    }

    if (!app.isActive) {
      throw new BadRequestException(`App '${app.name}' is currently disabled`);
    }

    // 2. Fetch configured allowed Action
    const actions = await this.prisma.db.orm.public.AppAction
      .select("id", "appId", "name", "command", "timeoutSec")
      .all();
    const action = actions.find(
      (act) => act.appId === appId && act.name.toLowerCase() === actionName.toLowerCase(),
    );

    if (!action) {
      throw new BadRequestException(
        `Action '${actionName}' is NOT allowed for app '${app.name}'. Only pre-configured commands can be executed.`,
      );
    }

    // 3. Concurrency check: Ensure no other deployment is actively running for this app
    const recentDeployments = await this.prisma.db.orm.public.Deployment
      .select("id", "appId", "status")
      .all();
    const isRunning = recentDeployments.some(
      (d) => d.appId === appId && d.status === "RUNNING",
    );

    if (isRunning) {
      throw new ConflictException(
        `Another deployment is already in progress for '${app.name}'. Please wait until it completes.`,
      );
    }

    // Verify cwd exists or create/warn
    const executionCwd = app.cwd || process.cwd();
    if (!fs.existsSync(executionCwd)) {
      throw new BadRequestException(
        `Configured working directory does not exist on VPS: ${executionCwd}`,
      );
    }

    // 4. Create initial Deployment record with RUNNING status
    const startedAt = new Date();
    const deployment = await this.prisma.db.orm.public.Deployment.create({
      appId: app.id,
      actionName: action.name,
      command: action.command,
      status: "RUNNING",
      triggeredBy,
      triggerIp: triggerIp ?? null,
      startedAt,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    // 5. Parse environment variables
    let customEnv: Record<string, string> = {};
    if (app.environment) {
      try {
        customEnv = typeof app.environment === "string" ? JSON.parse(app.environment) : app.environment;
      } catch {
        // ignore parse error
      }
    }

    const procEnv = {
      ...process.env,
      ...customEnv,
      DEP_APP_NAME: app.name,
      DEP_APP_SLUG: app.slug,
      DEP_ACTION_NAME: action.name,
      DEP_TRIGGERED_BY: triggeredBy,
      DEP_DEPLOYMENT_ID: String(deployment.id),
    };

    // 6. Spawn the strictly configured shell command
    return new Promise<ExecutionResult>((resolve) => {
      let stdoutAcc = "";
      let stderrAcc = "";
      let isTimedOut = false;
      const timeoutMs = (action.timeoutSec || 300) * 1000;

      const child = spawn("/bin/sh", ["-c", action.command], {
        cwd: executionCwd,
        env: procEnv,
        shell: false,
      });

      this.activeProcesses.set(deployment.id, child);

      const timer = setTimeout(() => {
        isTimedOut = true;
        stderrAcc += `\n[DEPPLOY ERROR]: Execution timed out after ${action.timeoutSec} seconds. Process killed.`;
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) child.kill("SIGKILL");
        }, 3000);
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutAcc += text;
        if (stdoutAcc.length > 500000) {
          stdoutAcc = stdoutAcc.slice(-500000); // cap at 500KB in memory
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        stderrAcc += text;
        if (stderrAcc.length > 500000) {
          stderrAcc = stderrAcc.slice(-500000);
        }
      });

      child.on("close", async (code: number | null) => {
        clearTimeout(timer);
        this.activeProcesses.delete(deployment.id);

        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();
        const finalStatus = isTimedOut ? "TIMED_OUT" : code === 0 ? "SUCCESS" : "FAILED";

        try {
          await this.prisma.db.orm.public.Deployment
            .where({ id: deployment.id })
            .update({
              status: finalStatus,
              exitCode: code ?? (isTimedOut ? -1 : 1),
              stdout: stdoutAcc,
              stderr: stderrAcc,
              durationMs,
              finishedAt,
            });
        } catch (err) {
          console.error("Failed to update deployment record:", err);
        }

        resolve({
          deploymentId: deployment.id,
          appName: app.name,
          appSlug: app.slug,
          actionName: action.name,
          status: finalStatus,
          exitCode: code,
          durationMs,
          stdout: stdoutAcc,
          stderr: stderrAcc,
        });
      });

      child.on("error", async (err: Error) => {
        clearTimeout(timer);
        this.activeProcesses.delete(deployment.id);

        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - startedAt.getTime();
        stderrAcc += `\n[DEPPLOY PROCESS ERROR]: ${err.message}`;

        await this.prisma.db.orm.public.Deployment
          .where({ id: deployment.id })
          .update({
            status: "FAILED",
            exitCode: -1,
            stdout: stdoutAcc,
            stderr: stderrAcc,
            durationMs,
            finishedAt,
          });

        resolve({
          deploymentId: deployment.id,
          appName: app.name,
          appSlug: app.slug,
          actionName: action.name,
          status: "FAILED",
          exitCode: -1,
          durationMs,
          stdout: stdoutAcc,
          stderr: stderrAcc,
        });
      });
    });
  }

  async listDeployments(appId?: number, limit = 50) {
    const deployments = await this.prisma.db.orm.public.Deployment
      .select("id", "appId", "actionName", "command", "status", "exitCode", "triggeredBy", "triggerIp", "startedAt", "finishedAt", "durationMs", "createdAt")
      .all();

    const apps = await this.prisma.db.orm.public.App
      .select("id", "name", "slug")
      .all();
    const appMap = new Map(apps.map((a) => [a.id, a]));

    let filtered = deployments;
    if (appId) {
      filtered = deployments.filter((d) => d.appId === appId);
    }

    filtered.sort((a, b) => b.id - a.id);
    const sliced = filtered.slice(0, limit);

    return sliced.map((d) => ({
      ...d,
      app: appMap.get(d.appId) || null,
    }));
  }

  async getDeployment(id: number) {
    const deployments = await this.prisma.db.orm.public.Deployment
      .select("id", "appId", "actionName", "command", "status", "exitCode", "stdout", "stderr", "triggeredBy", "triggerIp", "startedAt", "finishedAt", "durationMs", "metadata", "createdAt")
      .all();
    const deployment = deployments.find((d) => d.id === id);

    if (!deployment) {
      throw new NotFoundException(`Deployment #${id} not found`);
    }

    const apps = await this.prisma.db.orm.public.App
      .select("id", "name", "slug", "cwd")
      .all();
    const app = apps.find((a) => a.id === deployment.appId);

    return {
      ...deployment,
      app: app || null,
    };
  }

  async cancelDeployment(id: number) {
    const proc = this.activeProcesses.get(id);
    if (!proc) {
      return { success: false, message: "Process is not currently running" };
    }
    proc.kill("SIGTERM");
    return { success: true, message: "Termination signal sent to deployment process" };
  }

  async clearDeployments(appId?: number) {
    const deployments = await this.prisma.db.orm.public.Deployment
      .select("id", "appId")
      .all();

    let toDelete = deployments;
    if (appId) {
      toDelete = deployments.filter((d) => d.appId === appId);
    }

    for (const d of toDelete) {
      await this.prisma.db.orm.public.Deployment.where({ id: d.id }).delete();
    }

    return {
      success: true,
      count: toDelete.length,
      message: `Cleared ${toDelete.length} deployment log(s)`,
    };
  }
}
