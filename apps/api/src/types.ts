import { FastifyRequest } from "fastify";
import { Role } from "@karma/shared";

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload;
}

export function hasRole(userRole: Role, allowed: Role[]): boolean {
  return allowed.includes(userRole);
}

export const STAFF_ROLES = [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN];
export const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN];
export const SUPER_ADMIN_ROLES = [Role.SUPER_ADMIN];
