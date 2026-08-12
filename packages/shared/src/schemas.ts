import { z } from "zod";
import { ActionType, Role } from "./types";
import { THEME_IDS } from "./themes";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createActionSchema = z.object({
  label: z.string().min(2).max(120),
  points: z.number().int().positive(),
  type: z.nativeEnum(ActionType),
  cooldownDays: z.number().int().min(0).max(365).optional(),
});

export const updateActionSchema = z.object({
  label: z.string().min(2).max(120).optional(),
  points: z.number().int().positive().optional(),
  type: z.nativeEnum(ActionType).optional(),
  cooldownDays: z.number().int().min(0).max(365).optional(),
  status: z.enum(["ACTIVE", "PENDING", "REJECTED"]).optional(),
});

export const proposeActionSchema = z.object({
  label: z.string().min(2).max(120),
  points: z.number().int().positive(),
  type: z.nativeEnum(ActionType),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const themeIdSchema = z.enum(THEME_IDS);

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  themeId: themeIdSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const createGroupSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(200).optional(),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(4).max(20),
});

export const karmaHistoryQuerySchema = z.object({
  period: z.enum(["week", "month", "all"]).default("week"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type ProposeActionInput = z.infer<typeof proposeActionSchema>;
export type KarmaHistoryQuery = z.infer<typeof karmaHistoryQuerySchema>;
