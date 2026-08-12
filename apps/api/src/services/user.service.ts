import bcrypt from "bcryptjs";
import { Role, ThemeId, isThemeId } from "@karma/shared";
import { prisma } from "../lib/prisma";
import { removeUserAvatarFiles, saveUserAvatar } from "../lib/avatar";
import { toUserPublic } from "../lib/utils";
import { applyDailyDecay } from "../services/karma.service";

const ROLE_SORT: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 0,
  [Role.ADMIN]: 1,
  [Role.MODERATOR]: 2,
  [Role.USER]: 3,
};

function sortUsersByRole<T extends { role: Role; username: string }>(users: T[]): T[] {
  return [...users].sort((a, b) => {
    const roleDiff = ROLE_SORT[a.role] - ROLE_SORT[b.role];
    if (roleDiff !== 0) return roleDiff;
    return a.username.localeCompare(b.username, "fr");
  });
}

export async function registerUser(
  email: string,
  username: string,
  password: string
) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new Error("Email ou pseudo déjà utilisé");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  return toUserPublic(user);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Identifiants invalides");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Identifiants invalides");

  const updated = await applyDailyDecay(user);
  return toUserPublic(updated);
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  const updated = await applyDailyDecay(user);
  return toUserPublic(updated);
}

export async function listStaffUsers() {
  const users = await prisma.user.findMany();
  return sortUsersByRole(users.map(toUserPublic));
}

export async function updateUserProfile(
  userId: string,
  data: { username?: string; email?: string; themeId?: ThemeId }
) {
  if (!data.username && !data.email && !data.themeId) {
    throw new Error("Aucune modification à enregistrer");
  }

  if (data.themeId && !isThemeId(data.themeId)) {
    throw new Error("Thème invalide");
  }

  if (data.email || data.username) {
    const existing = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              ...(data.email ? [{ email: data.email }] : []),
              ...(data.username ? [{ username: data.username }] : []),
            ],
          },
        ],
      },
    });
    if (existing) {
      throw new Error("Email ou pseudo déjà utilisé");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.themeId !== undefined && { themeId: data.themeId }),
    },
  });
  return toUserPublic(user);
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Mot de passe actuel incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function setUserAvatar(
  userId: string,
  buffer: Buffer,
  mimetype: string
) {
  const avatarUrl = await saveUserAvatar(userId, buffer, mimetype);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });
  return toUserPublic(user);
}

export async function clearUserAvatar(userId: string) {
  await removeUserAvatarFiles(userId);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
  });
  return toUserPublic(user);
}

export async function updateUserRole(userId: string, role: Role) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  return toUserPublic(user);
}
