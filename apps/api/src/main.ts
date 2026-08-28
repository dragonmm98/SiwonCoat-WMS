import { createApp } from "./create-app";

async function bootstrap() {
  const app = await createApp();

  await app.listen(
    Number(process.env.PORT ?? 4000),
    process.env.HOST ?? "0.0.0.0",
  );
}

void bootstrap();
