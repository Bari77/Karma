import { FastifyReply } from "fastify";

export const AUTH_COOKIE = "karma_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie(AUTH_COOKIE, token, authCookieOptions);
}

export function clearAuthCookie(reply: FastifyReply) {
  reply.clearCookie(AUTH_COOKIE, { path: "/" });
}
