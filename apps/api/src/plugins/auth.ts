import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { AUTH_COOKIE } from "../lib/cookie";
import { JwtPayload } from "../types";

export default fp(async (fastify) => {
  await fastify.register(cookie);

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    cookie: {
      cookieName: AUTH_COOKIE,
      signed: false,
    },
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({ error: "Non authentifié" });
      }
    }
  );
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
