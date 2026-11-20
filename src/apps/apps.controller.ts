import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.ts";
import { DeploymentsService } from "../deployments/deployments.service.ts";
import { AppsService } from "./apps.service.ts";
import type { CreateAppDto } from "./apps.service.ts";

@Controller("api/apps")
@UseGuards(JwtAuthGuard)
export class AppsController {
  constructor(
    @Inject(AppsService) private readonly appsService: AppsService,
    @Inject(DeploymentsService) private readonly deploymentsService: DeploymentsService,
  ) {}

  @Get()
  async list() {
    return this.appsService.listApps();
  }

  @Post()
  async create(@Body() body: CreateAppDto) {
    return this.appsService.createApp(body);
  }

  @Get(":id")
  async getOne(@Param("id", ParseIntPipe) id: number) {
    return this.appsService.getApp(id);
  }

  @Put(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() body: any) {
    return this.appsService.updateApp(id, body);
  }

  @Post(":id/regenerate-secret")
  async regenerateSecret(@Param("id", ParseIntPipe) id: number) {
    return this.appsService.regenerateSecret(id);
  }

  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    return this.appsService.deleteApp(id);
  }

  @Post(":id/actions")
  async addAction(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { name: string; command: string; description?: string; timeoutSec?: number },
  ) {
    return this.appsService.addAction(id, body);
  }

  @Put("actions/:actionId")
  async updateAction(
    @Param("actionId", ParseIntPipe) actionId: number,
    @Body() body: { command?: string; description?: string; timeoutSec?: number },
  ) {
    return this.appsService.updateAction(actionId, body);
  }

  @Delete("actions/:actionId")
  async deleteAction(@Param("actionId", ParseIntPipe) actionId: number) {
    return this.appsService.deleteAction(actionId);
  }

  @Post(":id/trigger/:actionName")
  async triggerAction(
    @Param("id", ParseIntPipe) id: number,
    @Param("actionName") actionName: string,
    @Req() req: any,
  ) {
    const triggerIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
    return this.deploymentsService.executeAction({
      appId: id,
      actionName,
      triggeredBy: `MANUAL_UI (${req.user?.email || "admin"})`,
      triggerIp: String(triggerIp),
    });
  }
}
