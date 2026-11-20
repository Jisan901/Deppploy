import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import os from "node:os";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.ts";
import { PrismaService } from "../prisma.service.ts";

@Controller("api/system")
@UseGuards(JwtAuthGuard)
export class SystemController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get("stats")
  async getStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const apps = await this.prisma.db.orm.public.App.select("id", "isActive").all();
    const deployments = await this.prisma.db.orm.public.Deployment
      .select("id", "status", "createdAt")
      .all();

    const runningCount = deployments.filter((d) => d.status === "RUNNING").length;
    const successCount = deployments.filter((d) => d.status === "SUCCESS").length;
    const failedCount = deployments.filter((d) => d.status === "FAILED" || d.status === "TIMED_OUT").length;

    return {
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        uptimeSeconds: Math.floor(os.uptime()),
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || "Generic CPU",
        loadAvg: os.loadavg(),
        memory: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          usedPercentage: Math.round((usedMem / totalMem) * 100),
        },
      },
      metrics: {
        totalApps: apps.length,
        activeApps: apps.filter((a) => a.isActive).length,
        totalDeployments: deployments.length,
        runningDeployments: runningCount,
        successDeployments: successCount,
        failedDeployments: failedCount,
      },
    };
  }
}
