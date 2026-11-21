import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";

import "temporal-polyfill/global";

try {
  process.loadEnvFile?.();
} catch {
  // .env not present or already loaded
}

import service from "../../service.ts";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

function loadComposerDatabase() {
  try {
    return service.load().database.client;
  } catch {
    return undefined;
  }
}

const connectionUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:901762@localhost:9017/deppploy";

export const db =
  loadComposerDatabase() ??
  postgres({ contract, url: connectionUrl });
