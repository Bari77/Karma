export enum Role {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum ActionType {
  GOOD = "GOOD",
  BAD = "BAD",
}

export enum ActionStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  role: Role;
  karmaScore: number;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  label: string;
  points: number;
  type: ActionType;
  cooldownDays: number;
  status: ActionStatus;
  proposedById: string | null;
  proposedBy?: { username: string } | null;
  validatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KarmaLogEntry {
  id: string;
  pointsChange: number;
  reason: string;
  actionId: string | null;
  createdAt: string;
  action?: { label: string; type: ActionType } | null;
}

export type KarmaHistoryPeriod = "week" | "month" | "all";

export interface KarmaHistoryPage {
  items: KarmaLogEntry[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AuthResponse {
  user: UserPublic;
}

export interface KarmaStats {
  karmaScore: number;
  maxKarma: number;
  dailyDecay: number;
  percentFull: number;
}

export interface ActionWithStatus {
  id: string;
  label: string;
  points: number;
  type: ActionType;
  cooldownDays: number;
  doneToday?: boolean;
}

export interface ActionCooldownStatus {
  canPerform: boolean;
  nextAvailableAt: string;
  remainingMs: number;
  cooldownDays: number;
}

export interface ActionsMyStatus {
  cooldowns: Record<string, ActionCooldownStatus>;
  favorites: string[];
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  memberCount: number;
  ownerId: string;
  isOwner: boolean;
  createdAt: string;
}

export interface GroupMemberRank {
  userId: string;
  username: string;
  avatarUrl: string | null;
  karmaScore: number;
  rank: number;
  isMe: boolean;
  isGroupOwner: boolean;
}

export interface GroupDetail extends GroupSummary {
  members: GroupMemberRank[];
}

export interface MemberKarmaStats extends KarmaStats {
  username: string;
  userId: string;
}
