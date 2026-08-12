import { FastifyInstance } from "fastify";
import { Role, karmaHistoryQuerySchema } from "@karma/shared";
import { prisma } from "../lib/prisma";
import { getKarmaConfig } from "../lib/utils";
import { getUserById } from "../services/user.service";
import { applyDailyDecay, getKarmaHistory } from "../services/karma.service";
import { ADMIN_ROLES, hasRole } from "../types";

export async function karmaRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/stats",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await getUserById(request.user.id);
      if (!user) return reply.status(404).send({ error: "Utilisateur introuvable" });

      const { dailyDecay, maxKarma } = getKarmaConfig();
      return {
        karmaScore: user.karmaScore,
        maxKarma,
        dailyDecay,
        percentFull: Math.round((user.karmaScore / maxKarma) * 100),
      };
    }
  );

  fastify.get(
    "/history",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = karmaHistoryQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      try {
        return await getKarmaHistory(request.user.id, parsed.data);
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Requête invalide",
        });
      }
    }
  );

  fastify.post(
    "/decay-check",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const dbUser = await prisma.user.findUniqueOrThrow({
        where: { id: request.user.id },
      });
      const updated = await applyDailyDecay(dbUser);
      return { karmaScore: updated.karmaScore };
    }
  );

  fastify.get(
    "/users",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!hasRole(request.user.role as Role, ADMIN_ROLES)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          karmaScore: true,
          createdAt: true,
        },
        orderBy: { karmaScore: "desc" },
      });
      return users;
    }
  );
}
