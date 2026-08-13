const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export { API_URL };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : data.message || "Erreur serveur";
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const api = {
  register: (body: { email: string; username: string; password: string }) =>
    request<{ user: import("@karma/shared").UserPublic }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    ),

  login: (body: { email: string; password: string }) =>
    request<{ user: import("@karma/shared").UserPublic }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) }
    ),

  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  me: () => request<import("@karma/shared").UserPublic>("/users/me"),

  updateProfile: (body: {
    username?: string;
    email?: string;
    themeId?: import("@karma/shared").ThemeId;
  }) =>
    request<import("@karma/shared").UserPublic>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean }>("/users/me/password", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/users/me/avatar`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        typeof data.error === "string"
          ? data.error
          : data.message || "Erreur serveur";
      throw new ApiError(res.status, msg);
    }
    return data as import("@karma/shared").UserPublic;
  },

  deleteAvatar: () =>
    request<import("@karma/shared").UserPublic>("/users/me/avatar", {
      method: "DELETE",
    }),

  karmaStats: () => request<import("@karma/shared").KarmaStats>("/karma/stats"),

  karmaHistory: (params?: {
    period?: import("@karma/shared").KarmaHistoryPeriod;
    cursor?: string;
    limit?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.period) search.set("period", params.period);
    if (params?.cursor) search.set("cursor", params.cursor);
    if (params?.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return request<import("@karma/shared").KarmaHistoryPage>(
      `/karma/history${qs ? `?${qs}` : ""}`
    );
  },

  activeActions: (type?: string) =>
    request<{ id: string; label: string; points: number; type: string; cooldownDays: number }[]>(
      `/actions/active${type ? `?type=${type}` : ""}`
    ),

  actionsMyStatus: () =>
    request<import("@karma/shared").ActionsMyStatus>("/actions/my-status"),

  toggleActionFavorite: (actionId: string) =>
    request<{ favorited: boolean }>(`/actions/${actionId}/favorite`, {
      method: "POST",
    }),

  performAction: (actionId: string) =>
    request<{
      pointsChange: number;
      karmaScore: number;
      questUpdate?: import("@karma/shared").QuestProgressUpdate | null;
    }>(`/actions/${actionId}/perform`, { method: "POST" }),

  questProgression: () =>
    request<import("@karma/shared").QuestProgression>("/quests/progression"),

  proposeAction: (body: { label: string; points: number; type: string }) =>
    request("/actions/propose", { method: "POST", body: JSON.stringify(body) }),

  allActions: () => request<import("@karma/shared").ActionItem[]>("/actions/"),

  pendingActions: () =>
    request<import("@karma/shared").ActionItem[]>("/actions/pending"),

  createAction: (body: {
    label: string;
    points: number;
    type: string;
    cooldownDays?: number;
  }) =>
    request("/actions/", { method: "POST", body: JSON.stringify(body) }),

  updateAction: (id: string, body: Record<string, unknown>) =>
    request(`/actions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  validateAction: (id: string, body?: { points?: number; label?: string; cooldownDays?: number }) =>
    request(`/actions/${id}/validate`, {
      method: "POST",
      body: JSON.stringify(body || {}),
    }),

  rejectAction: (id: string) =>
    request(`/actions/${id}/reject`, { method: "POST" }),

  deleteAction: (id: string) =>
    request(`/actions/${id}`, { method: "DELETE" }),

  staffUsers: () =>
    request<import("@karma/shared").UserPublic[]>("/users/staff"),

  updateUserRole: (userId: string, role: string) =>
    request(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  groups: () => request<import("@karma/shared").GroupSummary[]>("/groups/"),

  createGroup: (body: { name: string; description?: string }) =>
    request<import("@karma/shared").GroupSummary>("/groups/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  joinGroup: (inviteCode: string) =>
    request<import("@karma/shared").GroupDetail>("/groups/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    }),

  groupDetail: (groupId: string) =>
    request<import("@karma/shared").GroupDetail>(`/groups/${groupId}`),

  memberKarma: (groupId: string, userId: string) =>
    request<import("@karma/shared").MemberKarmaStats>(
      `/groups/${groupId}/members/${userId}/karma`
    ),

  leaveGroup: (groupId: string) =>
    request(`/groups/${groupId}/leave`, { method: "POST" }),

  deleteGroup: (groupId: string) =>
    request(`/groups/${groupId}`, { method: "DELETE" }),

  removeGroupMember: (groupId: string, userId: string) =>
    request<import("@karma/shared").GroupDetail>(
      `/groups/${groupId}/members/${userId}`,
      { method: "DELETE" }
    ),

  regenerateGroupInviteCode: (groupId: string) =>
    request<import("@karma/shared").GroupDetail>(
      `/groups/${groupId}/invite-code/regenerate`,
      { method: "POST" }
    ),
};
