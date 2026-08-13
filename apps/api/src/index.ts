import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import "dotenv/config";
import Fastify from "fastify";
import path from "path";
import { ensureAvatarDir } from "./lib/avatar";
import { disconnectDb } from "./lib/prisma";
import authPlugin from "./plugins/auth";
import { actionRoutes } from "./routes/action.routes";
import { authRoutes } from "./routes/auth.routes";
import { groupRoutes } from "./routes/group.routes";
import { karmaRoutes } from "./routes/karma.routes";
import { userRoutes } from "./routes/user.routes";

const PORT = parseInt(process.env.PORT || "3001", 10);

async function main() {
  const fastify = Fastify({ logger: true });

  await ensureAvatarDir();

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  await fastify.register(multipart, {
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  });

  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
    decorateReply: false,
  });

  await fastify.register(authPlugin);

  fastify.get("/health", async () => ({ status: "ok", service: "karma-api" }));

  await fastify.register(authRoutes, { prefix: "/auth" });
  await fastify.register(karmaRoutes, { prefix: "/karma" });
  await fastify.register(actionRoutes, { prefix: "/actions" });
  await fastify.register(userRoutes, { prefix: "/users" });
  await fastify.register(groupRoutes, { prefix: "/groups" });

  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

process.on("SIGTERM", async () => {
  await disconnectDb();
  process.exit(0);
});
