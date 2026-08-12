import { FastifyInstance } from "fastify";
import {
  Role,
  changePasswordSchema,
  updateProfileSchema,
  updateUserRoleSchema,
} from "@karma/shared";
import {
  changeUserPassword,
  clearUserAvatar,
  getUserById,
  listStaffUsers,
  setUserAvatar,
  updateUserProfile,
  updateUserRole,
} from "../services/user.service";
import { hasRole, SUPER_ADMIN_ROLES } from "../types";

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await getUserById(request.user.id);
      if (!user) return reply.status(404).send({ error: "Utilisateur introuvable" });
      return user;
    }
  );

  fastify.patch(
    "/me",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      try {
        return await updateUserProfile(request.user.id, parsed.data);
      } catch (err) {
        return reply.status(409).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );

  fastify.patch(
    "/me/password",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = changePasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      try {
        await changeUserPassword(
          request.user.id,
          parsed.data.currentPassword,
          parsed.data.newPassword
        );
        return { ok: true };
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );

  fastify.post(
    "/me/avatar",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: "Aucun fichier envoyé" });
      }
      try {
        const buffer = await file.toBuffer();
        return await setUserAvatar(request.user.id, buffer, file.mimetype);
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Erreur upload",
        });
      }
    }
  );

  fastify.delete(
    "/me/avatar",
    { preHandler: [fastify.authenticate] },
    async (request) => clearUserAvatar(request.user.id)
  );

  fastify.get(
    "/staff",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!hasRole(request.user.role as Role, SUPER_ADMIN_ROLES)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      return listStaffUsers();
    }
  );

  fastify.patch(
    "/:id/role",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!hasRole(request.user.role as Role, SUPER_ADMIN_ROLES)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      const { id } = request.params as { id: string };
      const parsed = updateUserRoleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      try {
        const user = await updateUserRole(id, parsed.data.role);
        return user;
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );
}
