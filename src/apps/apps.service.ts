import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import crypto from "node:crypto";
import { PrismaService } from "../prisma.service.ts";

export interface CreateAppDto {
  name: string;
  slug?: string;
  description?: string;
  cwd: string;
  branch?: string;
  environment?: Record<string, string> | string;
  actions?: Array<{
    name: string;
    command: string;
    description?: string;
    timeoutSec?: number;
  }>;
}

@Injectable()
export class AppsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  generateSecret(): string {
    return `dep_sec_${crypto.randomBytes(32).toString("hex")}`;
  }

  async listApps() {
    const apps = await this.prisma.db.orm.public.App
      .select("id", "name", "slug", "description", "secret", "cwd", "branch", "environment", "isActive", "createdAt", "updatedAt")
      .all();

    const actions = await this.prisma.db.orm.public.AppAction
      .select("id", "appId", "name", "command", "description", "timeoutSec")
      .all();

    const deployments = await this.prisma.db.orm.public.Deployment
      .select("id", "appId", "actionName", "status", "exitCode", "durationMs", "createdAt", "finishedAt")
      .all();

    return apps.map((app) => {
      const appActions = actions.filter((a) => a.appId === app.id);
      const appDeployments = deployments
        .filter((d) => d.appId === app.id)
        .sort((a, b) => b.id - a.id);
      const latestDeployment = appDeployments[0] || null;

      return {
        ...app,
        actions: appActions,
        latestDeployment,
        totalDeployments: appDeployments.length,
      };
    });
  }

  async getApp(id: number) {
    const apps = await this.prisma.db.orm.public.App
      .select("id", "name", "slug", "description", "secret", "cwd", "branch", "environment", "isActive", "createdAt", "updatedAt")
      .all();
    const app = apps.find((a) => a.id === id);

    if (!app) {
      throw new NotFoundException(`App with ID ${id} not found`);
    }

    const actions = await this.prisma.db.orm.public.AppAction
      .select("id", "appId", "name", "command", "description", "timeoutSec")
      .all();
    const appActions = actions.filter((a) => a.appId === app.id);

    const deployments = await this.prisma.db.orm.public.Deployment
      .select("id", "appId", "actionName", "command", "status", "exitCode", "durationMs", "triggeredBy", "triggerIp", "createdAt", "finishedAt")
      .all();
    const appDeployments = deployments
      .filter((d) => d.appId === app.id)
      .sort((a, b) => b.id - a.id)
      .slice(0, 20);

    return {
      ...app,
      actions: appActions,
      deployments: appDeployments,
    };
  }

  async createApp(dto: CreateAppDto) {
    if (!dto.name || !dto.cwd) {
      throw new BadRequestException("App name and working directory (cwd) are required");
    }

    const slug = (dto.slug || dto.name)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");

    const existing = await this.prisma.db.orm.public.App
      .select("id", "slug")
      .all();
    if (existing.some((a) => a.slug === slug)) {
      throw new ConflictException(`An app with slug '${slug}' already exists`);
    }

    const secret = this.generateSecret();
    const envString =
      typeof dto.environment === "object"
        ? JSON.stringify(dto.environment)
        : dto.environment || null;

    const app = await this.prisma.db.orm.public.App.create({
      name: dto.name,
      slug,
      description: dto.description || null,
      secret,
      cwd: dto.cwd,
      branch: dto.branch || "main",
      environment: envString,
      isActive: true,
    });

    const actionsToCreate = dto.actions?.length
      ? dto.actions
      : [
          {
            name: "deploy",
            command: "git pull origin main && npm install && npm run build",
            description: "Default deployment pipeline",
            timeoutSec: 300,
          },
          {
            name: "status",
            command: "git status --short && git log -1 --oneline",
            description: "Check status and latest commit",
            timeoutSec: 30,
          },
        ];

    for (const act of actionsToCreate) {
      await this.prisma.db.orm.public.AppAction.create({
        appId: app.id,
        name: act.name.toLowerCase().trim(),
        command: act.command,
        description: act.description || null,
        timeoutSec: act.timeoutSec || 300,
      });
    }

    return this.getApp(app.id);
  }

  async updateApp(
    id: number,
    dto: {
      name?: string;
      slug?: string;
      description?: string;
      cwd?: string;
      branch?: string;
      environment?: string | Record<string, string>;
      isActive?: boolean;
    },
  ) {
    await this.getApp(id);

    const envString =
      typeof dto.environment === "object"
        ? JSON.stringify(dto.environment)
        : dto.environment !== undefined
          ? dto.environment
          : undefined;

    await this.prisma.db.orm.public.App
      .where({ id })
      .update({
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.cwd ? { cwd: dto.cwd } : {}),
        ...(dto.branch !== undefined ? { branch: dto.branch } : {}),
        ...(envString !== undefined ? { environment: envString } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      });

    return this.getApp(id);
  }

  async regenerateSecret(id: number) {
    await this.getApp(id);
    const newSecret = this.generateSecret();

    await this.prisma.db.orm.public.App
      .where({ id })
      .update({ secret: newSecret });

    return { secret: newSecret };
  }

  async deleteApp(id: number) {
    await this.getApp(id);

    const actions = await this.prisma.db.orm.public.AppAction.select("id", "appId").all();
    for (const a of actions.filter((act) => act.appId === id)) {
      await this.prisma.db.orm.public.AppAction.where({ id: a.id }).delete();
    }

    const deployments = await this.prisma.db.orm.public.Deployment.select("id", "appId").all();
    for (const d of deployments.filter((dep) => dep.appId === id)) {
      await this.prisma.db.orm.public.Deployment.where({ id: d.id }).delete();
    }

    await this.prisma.db.orm.public.App.where({ id }).delete();
    return { success: true, message: `App #${id} deleted successfully` };
  }

  async addAction(
    appId: number,
    dto: { name: string; command: string; description?: string; timeoutSec?: number },
  ) {
    await this.getApp(appId);
    if (!dto.name || !dto.command) {
      throw new BadRequestException("Action name and command are required");
    }

    const cleanName = dto.name.toLowerCase().trim();
    const existing = await this.prisma.db.orm.public.AppAction
      .select("id", "appId", "name")
      .all();

    if (existing.some((a) => a.appId === appId && a.name.toLowerCase() === cleanName)) {
      throw new ConflictException(`Action '${cleanName}' already exists for this app`);
    }

    const action = await this.prisma.db.orm.public.AppAction.create({
      appId,
      name: cleanName,
      command: dto.command,
      description: dto.description || null,
      timeoutSec: dto.timeoutSec || 300,
    });

    return action;
  }

  async updateAction(
    actionId: number,
    dto: { command?: string; description?: string; timeoutSec?: number },
  ) {
    const actions = await this.prisma.db.orm.public.AppAction.select("id").all();
    if (!actions.some((a) => a.id === actionId)) {
      throw new NotFoundException(`Action #${actionId} not found`);
    }

    await this.prisma.db.orm.public.AppAction
      .where({ id: actionId })
      .update({
        ...(dto.command ? { command: dto.command } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.timeoutSec ? { timeoutSec: dto.timeoutSec } : {}),
      });

    const updated = await this.prisma.db.orm.public.AppAction
      .select("id", "appId", "name", "command", "description", "timeoutSec")
      .all();
    return updated.find((a) => a.id === actionId);
  }

  async deleteAction(actionId: number) {
    const actions = await this.prisma.db.orm.public.AppAction.select("id").all();
    if (!actions.some((a) => a.id === actionId)) {
      throw new NotFoundException(`Action #${actionId} not found`);
    }

    await this.prisma.db.orm.public.AppAction.where({ id: actionId }).delete();
    return { success: true, message: `Action #${actionId} deleted` };
  }
}
