import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.ts";
import { DeploymentsService } from "./deployments.service.ts";

@Controller("api/deployments")
@UseGuards(JwtAuthGuard)
export class DeploymentsController {
  constructor(
    @Inject(DeploymentsService) private readonly deploymentsService: DeploymentsService,
  ) {}

  @Get()
  async list(
    @Query("appId") appId?: string,
    @Query("limit") limit?: string,
  ) {
    const parsedAppId = appId ? Number(appId) : undefined;
    const parsedLimit = limit ? Number(limit) : 50;
    return this.deploymentsService.listDeployments(parsedAppId, parsedLimit);
  }

  @Get(":id")
  async getOne(@Param("id", ParseIntPipe) id: number) {
    return this.deploymentsService.getDeployment(id);
  }

  @Post(":id/cancel")
  async cancel(@Param("id", ParseIntPipe) id: number) {
    return this.deploymentsService.cancelDeployment(id);
  }
}
