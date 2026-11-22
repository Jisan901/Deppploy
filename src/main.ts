import "reflect-metadata";

try {
  process.loadEnvFile?.();
} catch {
  // .env not present or already loaded
}

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const host = (process.env.HOST ?? "127.0.0.1").trim();
  const rawPort = (process.env.PORT ?? "").trim();
  const parsedPort = rawPort.length > 0 ? Number(rawPort) : Number.NaN;
  const port =
    Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535 ? parsedPort : 4444;
  await app.listen(port, host);
  console.log(`Deppploy Server running at http://${host}:${port}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
