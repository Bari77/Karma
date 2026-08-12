import { FastifyInstance } from "fastify";
import { loginSchema, registerSchema, Role } from "@karma/shared";
import { clearAuthCookie, setAuthCookie } from "../lib/cookie";
import { loginUser, registerUser } from "../services/user.service";

function signToken(
  fastify: FastifyInstance,
  user: { id: string; email: string; role: Role }
) {
  return fastify.jwt.sign({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const user = await registerUser(
        parsed.data.email,
        parsed.data.username,
        parsed.data.password
      );
      const token = signToken(fastify, user);
      setAuthCookie(reply, token);
      return { user };
    } catch (err) {
      return reply.status(409).send({
        error: err instanceof Error ? err.message : "Erreur inscription",
      });
    }
  });

  fastify.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const user = await loginUser(parsed.data.email, parsed.data.password);
      const token = signToken(fastify, user);
      setAuthCookie(reply, token);
      return { user };
    } catch {
      return reply.status(401).send({ error: "Identifiants invalides" });
    }
  });

  fastify.post("/logout", async (_request, reply) => {
    clearAuthCookie(reply);
    return { ok: true };
  });
}
