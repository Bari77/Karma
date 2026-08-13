import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { getKarmaConfig } from "../lib/utils";
import { applyDailyDecay } from "./karma.service";
import { getUserQuestLevel, getUserQuestLevels } from "./quest.service";

function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

async function ensureMember(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new Error("Vous n'êtes pas membre de ce groupe");
}

async function ensureOwner(groupId: string, userId: string) {
  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });
  if (group.ownerId !== userId) {
    throw new Error("Seul le propriétaire peut effectuer cette action");
  }
  return group;
}

async function uniqueInviteCode(excludeGroupId?: string) {
  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.group.findFirst({
      where: {
        inviteCode,
        ...(excludeGroupId && { id: { not: excludeGroupId } }),
      },
    });
    if (!existing) return inviteCode;
    inviteCode = generateInviteCode();
    attempts++;
  }
  return inviteCode;
}

export async function createGroup(
  ownerId: string,
  name: string,
  description?: string
) {
  let inviteCode = await uniqueInviteCode();

  const group = await prisma.group.create({
    data: {
      name,
      description: description || null,
      inviteCode,
      ownerId,
      members: { create: { userId: ownerId } },
    },
    include: { _count: { select: { members: true } } },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    memberCount: group._count.members,
    ownerId: group.ownerId,
    isOwner: true,
    createdAt: group.createdAt.toISOString(),
  };
}

export async function joinGroup(userId: string, inviteCode: string) {
  const group = await prisma.group.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
  });
  if (!group) throw new Error("Code d'invitation invalide");

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId } },
  });
  if (existing) throw new Error("Vous êtes déjà membre de ce groupe");

  await prisma.groupMember.create({
    data: { groupId: group.id, userId },
  });

  return getGroupDetail(group.id, userId);
}

export async function listUserGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    inviteCode: m.group.inviteCode,
    memberCount: m.group._count.members,
    ownerId: m.group.ownerId,
    isOwner: m.group.ownerId === userId,
    createdAt: m.group.createdAt.toISOString(),
  }));
}

export async function getGroupDetail(groupId: string, userId: string) {
  await ensureMember(groupId, userId);

  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: {
      _count: { select: { members: true } },
      members: {
        include: {
          user: {
            select: { id: true, username: true, karmaScore: true, avatarUrl: true },
          },
        },
      },
    },
  });

  const userIds = group.members.map((m) => m.user.id);
  const questLevels = await getUserQuestLevels(userIds);

  const members = group.members
    .map((m) => {
      const quest = questLevels.get(m.user.id) ?? { level: 1, title: "Novice du karma" };
      return {
        userId: m.user.id,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        karmaScore: m.user.karmaScore,
        questLevel: quest.level,
        questTitle: quest.title,
        isMe: m.user.id === userId,
        isGroupOwner: m.user.id === group.ownerId,
      };
    })
    .sort((a, b) => b.karmaScore - a.karmaScore)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    memberCount: group._count.members,
    ownerId: group.ownerId,
    isOwner: group.ownerId === userId,
    createdAt: group.createdAt.toISOString(),
    members,
  };
}

export async function getMemberKarma(
  groupId: string,
  requesterId: string,
  targetUserId: string
) {
  await ensureMember(groupId, requesterId);
  await ensureMember(groupId, targetUserId);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: targetUserId } });
  const updated = await applyDailyDecay(user);
  const { dailyDecay, maxKarma } = getKarmaConfig();
  const quest = await getUserQuestLevel(updated.id);

  return {
    userId: updated.id,
    username: updated.username,
    karmaScore: updated.karmaScore,
    maxKarma,
    dailyDecay,
    percentFull: Math.round((updated.karmaScore / maxKarma) * 100),
    questLevel: quest.level,
    questTitle: quest.title,
  };
}

export async function leaveGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });
  if (group.ownerId === userId) {
    throw new Error("Le propriétaire ne peut pas quitter — supprimez le groupe");
  }
  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
  return { ok: true };
}

export async function deleteGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });
  if (group.ownerId !== userId) {
    throw new Error("Seul le propriétaire peut supprimer le groupe");
  }
  await prisma.group.delete({ where: { id: groupId } });
  return { ok: true };
}

export async function removeGroupMember(
  groupId: string,
  ownerId: string,
  targetUserId: string
) {
  const group = await ensureOwner(groupId, ownerId);
  if (targetUserId === group.ownerId) {
    throw new Error("Impossible d'exclure le propriétaire du groupe");
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!member) throw new Error("Membre introuvable");

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });

  return getGroupDetail(groupId, ownerId);
}

export async function regenerateGroupInviteCode(groupId: string, ownerId: string) {
  await ensureOwner(groupId, ownerId);
  const inviteCode = await uniqueInviteCode(groupId);
  await prisma.group.update({
    where: { id: groupId },
    data: { inviteCode },
  });
  return getGroupDetail(groupId, ownerId);
}
