import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { DeploymentsService } from "../deployments/deployments.service.ts";
import { PrismaService } from "../prisma.service.ts";

@Controller()
export class WebhookController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DeploymentsService) private readonly deploymentsService: DeploymentsService,
  ) {}

  private async handleTrigger(
    secret: string,
    action: string,
    req: any,
    body?: any,
  ) {
    if (!secret || secret.length < 8) {
      throw new UnauthorizedException("Invalid or missing secret key");
    }

    const apps = await this.prisma.db.orm.public.App
      .select("id", "name", "slug", "secret", "isActive")
      .all();
    const app = apps.find((a) => a.secret === secret);

    if (!app) {
      throw new UnauthorizedException("Unauthorized: Application secret does not match any registered app");
    }

    const triggerIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Webhook";

    const result = await this.deploymentsService.executeAction({
      appId: app.id,
      actionName: action,
      triggeredBy: `WEBHOOK (${userAgent})`,
      triggerIp: String(triggerIp),
      metadata: body || { triggeredAt: new Date().toISOString() },
    });

    const isSuccess = result.status === "SUCCESS";
    return {
      success: isSuccess,
      app: result.appName,
      slug: result.appSlug,
      action: result.actionName,
      status: result.status,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      deploymentId: result.deploymentId,
      output: result.stdout || result.stderr,
    };
  }

  // Standard API webhook endpoints
  @Post("api/webhook/:secret/:action")
  @HttpCode(HttpStatus.OK)
  async postApiWebhook(
    @Param("secret") secret: string,
    @Param("action") action: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.handleTrigger(secret, action, req, body);
  }

  @Get("api/webhook/:secret/:action")
  async getApiWebhook(
    @Param("secret") secret: string,
    @Param("action") action: string,
    @Req() req: any,
  ) {
    return this.handleTrigger(secret, action, req);
  }

  // Top-level direct shortcuts: e.g. server.com/appsecret/deploy, server.com/appsecret/status
  @Post(":secret/:action")
  @HttpCode(HttpStatus.OK)
  async postDirectShortcut(
    @Param("secret") secret: string,
    @Param("action") action: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    // Avoid conflicting with static assets or internal paths
    if (["api", "admin", "assets", "favicon.ico", "vite.svg"].includes(secret)) {
      return;
    }
    return this.handleTrigger(secret, action, req, body);
  }

  @Get(":secret/:action")
  async getDirectShortcut(
    @Param("secret") secret: string,
    @Param("action") action: string,
    @Req() req: any,
  ) {
    if (["api", "assets", "favicon.ico", "vite.svg"].includes(secret)) {
      return;
    }
    return this.handleTrigger(secret, action, req);
  }
}

