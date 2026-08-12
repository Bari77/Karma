import { FastifyInstance } from "fastify";
import { createGroupSchema, joinGroupSchema } from "@karma/shared";
import {
  createGroup,
  deleteGroup,
  getGroupDetail,
  getMemberKarma,
  joinGroup,
  leaveGroup,
  listUserGroups,
  regenerateGroupInviteCode,
  removeGroupMember,
} from "../services/group.service";

export async function groupRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request) => listUserGroups(request.user.id)
  );

  fastify.post(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = createGroupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const group = await createGroup(
        request.user.id,
        parsed.data.name,
        parsed.data.description
      );
      return group;
    }
  );

  fastify.post(
    "/join",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = joinGroupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      try {
        return await joinGroup(request.user.id, parsed.data.inviteCode);
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );

  fastify.get(
    "/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        return await getGroupDetail(id, request.user.id);
      } catch (err) {
        return reply.status(403).send({
          error: err instanceof Error ? err.message : "Accès refusé",
        });
      }
    }
  );

  fastify.get(
    "/:id/members/:userId/karma",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id, userId } = request.params as { id: string; userId: string };
      try {
        return await getMemberKarma(id, request.user.id, userId);
      } catch (err) {
        return reply.status(403).send({
          error: err instanceof Error ? err.message : "Accès refusé",
        });
      }
    }
  );

  fastify.post(
    "/:id/leave",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        return await leaveGroup(id, request.user.id);
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );

  fastify.delete(
    "/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        return await deleteGroup(id, request.user.id);
      } catch (err) {
        return reply.status(403).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );

  fastify.delete(
    "/:id/members/:userId",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id, userId } = request.params as { id: string; userId: string };
      try {
        return await removeGroupMember(id, request.user.id, userId);
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );

  fastify.post(
    "/:id/invite-code/regenerate",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        return await regenerateGroupInviteCode(id, request.user.id);
      } catch (err) {
        return reply.status(403).send({
          error: err instanceof Error ? err.message : "Accès refusé",
        });
      }
    }
  );
}
