import { FastifyInstance } from "fastify";
import { getQuestProgression } from "../services/quest.service";

export async function questRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/progression",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return getQuestProgression(request.user.id);
    }
  );
}
