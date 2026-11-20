import bcrypt from "bcryptjs";
import { db } from "./db.ts";

let pendingSeed: Promise<void> | undefined;

async function runSeed(): Promise<void> {
  // Check if admin user already exists
  const existingUsers = await db.orm.public.User.select("id", "email").all();
  let adminUser = existingUsers.find((u) => u.email === "admin@deppploy.local");

  if (!adminUser) {
    const hashedPassword = bcrypt.hashSync("admin123456", 10);
    adminUser = await db.orm.public.User.create({
      email: "admin@deppploy.local",
      username: "admin",
      name: "Security Administrator",
      password: hashedPassword,
      role: "ADMIN",
    });
    console.log("Seeded default admin user: admin@deppploy.local / admin123456");
  }

  // Seed sample apps if no apps exist
  const existingApps = await db.orm.public.App.select("id", "slug").all();
  if (existingApps.length === 0) {
    const app1 = await db.orm.public.App.create({
      name: "ConnectPoint API",
      slug: "connectpoint-api-v1",
      description: "ConnectPoint Backend Core API Service",
      secret: "dep_sec_cp_api_9f83a2e1",
      cwd: "/Users/jisan/Documents/pocket/connectpoint-api-v1",
      branch: "main",
      environment: JSON.stringify({ NODE_ENV: "production", PORT: "4000" }),
      isActive: true,
    });

    await db.orm.public.AppAction.create({
      appId: app1.id,
      name: "deploy",
      command: "git pull origin main && echo 'Mock deploy step completed successfully for connectpoint-api-v1'",
      description: "Pull latest git commit, install dependencies, build and reload",
      timeoutSec: 300,
    });

    await db.orm.public.AppAction.create({
      appId: app1.id,
      name: "status",
      command: "git status --short && echo 'Branch:' && git rev-parse --abbrev-ref HEAD",
      description: "Check git status and active branch",
      timeoutSec: 30,
    });

    await db.orm.public.AppAction.create({
      appId: app1.id,
      name: "restart",
      command: "echo 'Process restarted successfully'",
      description: "Restart background process",
      timeoutSec: 30,
    });

    const app2 = await db.orm.public.App.create({
      name: "Internal Portal API",
      slug: "internal-portal-api-v1",
      description: "Internal Portal Backend Services",
      secret: "dep_sec_portal_api_7c51b4d0",
      cwd: "/Users/jisan/Documents/pocket/internal-portal-api-v1",
      branch: "main",
      environment: JSON.stringify({ NODE_ENV: "production", PORT: "5000" }),
      isActive: true,
    });

    await db.orm.public.AppAction.create({
      appId: app2.id,
      name: "deploy",
      command: "git pull origin main && echo 'Internal Portal API deployed successfully'",
      description: "Deploy internal portal API updates",
      timeoutSec: 300,
    });

    await db.orm.public.AppAction.create({
      appId: app2.id,
      name: "status",
      command: "git log -1 --oneline",
      description: "Show latest commit on VPS",
      timeoutSec: 30,
    });

    console.log("Seeded sample CI/CD apps and actions for Deppploy");
  }
}

export function seed(): Promise<void> {
  pendingSeed ??= runSeed().catch((error: unknown) => {
    pendingSeed = undefined;
    throw error;
  });
  return pendingSeed;
}
