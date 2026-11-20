import { Injectable } from "@nestjs/common";
import type { OnModuleInit } from "@nestjs/common";
import { db } from "./prisma/db.ts";
import { seed } from "./prisma/seed.ts";

@Injectable()
export class PrismaService implements OnModuleInit {
  readonly db = db;

  async onModuleInit() {
    await seed();
  }

  async listUsers(limit = 10) {
    const users = await this.db.orm.public.User
      .select("id", "email", "username", "name", "role", "createdAt")
      .limit(limit)
      .all();

    return users.map((u) => ({
      id: String(u.id),
      email: u.email,
      username: u.username ?? null,
      name: u.name ?? null,
      role: u.role,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    }));
  }
}
