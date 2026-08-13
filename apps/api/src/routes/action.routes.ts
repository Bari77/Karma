import { FastifyInstance } from "fastify";
import { ActionType, Role } from "@karma/shared";
import {
  createActionSchema,
  proposeActionSchema,
  updateActionSchema,
} from "@karma/shared";
import {
  canManageActions,
  canValidateProposals,
  createAction,
  deleteAction,
  listActiveActions,
  listAllActions,
  listPendingActions,
  performAction,
  proposeAction,
  updateAction,
  getActionsCooldownStatus,
  toggleActionFavorite,
} from "../services/action.service";
import { getUserById } from "../services/user.service";

export async function actionRoutes(fastify: FastifyInstance) {
  fastify.get("/active", async (request) => {
    const { type } = request.query as { type?: ActionType };
    const actions = await listActiveActions(type);
    return actions.map((a) => ({
      id: a.id,
      label: a.label,
      points: a.points,
      type: a.type,
      cooldownDays: a.cooldownDays,
    }));
  });

  fastify.get(
    "/my-status",
    { preHandler: [fastify.authenticate] },
    async (request) => getActionsCooldownStatus(request.user.id)
  );

  fastify.get(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!canManageActions(request.user.role as Role)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      return listAllActions();
    }
  );

  fastify.get(
    "/pending",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!canValidateProposals(request.user.role as Role)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      return listPendingActions();
    }
  );

  fastify.post(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!canManageActions(request.user.role as Role)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      const parsed = createActionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const action = await createAction(
        parsed.data.label,
        parsed.data.points,
        parsed.data.type as "GOOD" | "BAD",
        request.user.id,
        parsed.data.cooldownDays
      );
      return action;
    }
  );

  fastify.post(
    "/propose",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = proposeActionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const action = await proposeAction(
        parsed.data.label,
        parsed.data.points,
        parsed.data.type as "GOOD" | "BAD",
        request.user.id
      );
      return action;
    }
  );

  fastify.patch(
    "/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!canManageActions(request.user.role as Role)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      const { id } = request.params as { id: string };
      const parsed = updateActionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const action = await updateAction(
        id,
        parsed.data as Parameters<typeof updateAction>[1],
        request.user.id
      );
      return action;
    }
  );

  fastify.post(
    "/:id/validate",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!canValidateProposals(request.user.role as Role)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      const { id } = request.params as { id: string };
      const body = request.body as {
        points?: number;
        label?: string;
        cooldownDays?: number;
      };
      const action = await updateAction(
        id,
        {
          status: "ACTIVE",
          ...(body.points ? { points: body.points } : {}),
          ...(body.label ? { label: body.label } : {}),
          ...(body.cooldownDays !== undefined ? { cooldownDays: body.cooldownDays } : {}),
        },
        request.user.id
      );
      return action;
    }
  );

  fastify.post(
    "/:id/reject",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!canValidateProposals(request.user.role as Role)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      const { id } = request.params as { id: string };
      const action = await updateAction(id, { status: "REJECTED" }, request.user.id);
      return action;
    }
  );

  fastify.delete(
    "/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      if (!canManageActions(request.user.role as Role)) {
        return reply.status(403).send({ error: "Accès refusé" });
      }
      const { id } = request.params as { id: string };
      await deleteAction(id);
      return { ok: true };
    }
  );

  fastify.post(
    "/:id/favorite",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        return await toggleActionFavorite(request.user.id, id);
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );

  fastify.post(
    "/:id/perform",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        const result = await performAction(request.user.id, id);
        const user = await getUserById(request.user.id);
        return {
          pointsChange: result.pointsChange,
          karmaScore: user?.karmaScore ?? result.newScore,
          action: {
            label: result.action.label,
            type: result.action.type,
          },
          questUpdate: result.questUpdate,
        };
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Erreur",
        });
      }
    }
  );
}
