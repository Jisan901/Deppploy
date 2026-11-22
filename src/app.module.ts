import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ServeStaticModule } from "@nestjs/serve-static";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getClientDistPath(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const candidateInPkg = path.resolve(__dirname, "..", "client", "dist");
    if (fs.existsSync(candidateInPkg)) {
      return candidateInPkg;
    }
  } catch {
    // ignore
  }

  const candidateInCwd = path.join(process.cwd(), "client", "dist");
  if (fs.existsSync(candidateInCwd)) {
    return candidateInCwd;
  }

  return path.join(process.cwd(), "client", "dist");
}

import { AppController } from "./app.controller.ts";
import { PrismaService } from "./prisma.service.ts";
import { UsersController } from "./users.controller.ts";
import { UsersService } from "./users.service.ts";

import { AuthController } from "./auth/auth.controller.ts";
import { AuthService } from "./auth/auth.service.ts";

import { AppsController } from "./apps/apps.controller.ts";
import { AppsService } from "./apps/apps.service.ts";

import { DeploymentsController } from "./deployments/deployments.controller.ts";
import { DeploymentsService } from "./deployments/deployments.service.ts";

import { SystemController } from "./system/system.controller.ts";
import { WebhookController } from "./webhook/webhook.controller.ts";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "deppploy-super-secret-production-key-2026-safe-guard",
      signOptions: { expiresIn: "7d" },
    }),
    ServeStaticModule.forRoot({
      rootPath: getClientDistPath(),
      serveRoot: "/admin",
      serveStaticOptions: {
        index: "index.html",
      },
    }),
  ],
  controllers: [
    AuthController,
    AppsController,
    DeploymentsController,
    SystemController,
    WebhookController,
    UsersController,
    AppController,
  ],
  providers: [
    PrismaService,
    AuthService,
    AppsService,
    DeploymentsService,
    UsersService,
  ],
})
export class AppModule {}
