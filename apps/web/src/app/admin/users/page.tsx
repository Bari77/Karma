"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { GamingSelect } from "@/components/GamingSelect";
import { UserAvatar } from "@/components/UserAvatar";
import { UserCardSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Role, UserPublic } from "@karma/shared";

const ROLE_OPTIONS = [
  { value: Role.USER, label: "Utilisateur" },
  { value: Role.MODERATOR, label: "Modérateur" },
  { value: Role.ADMIN, label: "Admin" },
  { value: Role.SUPER_ADMIN, label: "Super admin" },
] as const;

const ROLE_LABELS: Record<Role, string> = {
  [Role.USER]: "Utilisateur",
  [Role.MODERATOR]: "Modérateur",
  [Role.ADMIN]: "Admin",
  [Role.SUPER_ADMIN]: "Super admin",
};

type RoleFilter = "all" | "admin" | Role.MODERATOR | Role.USER;

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Tous les types" },
  { value: "admin", label: "Admins" },
  { value: Role.MODERATOR, label: "Modérateurs" },
  { value: Role.USER, label: "Utilisateurs" },
];

function filterUsers(users: UserPublic[], query: string, roleFilter: RoleFilter) {
  let result = users;

  if (roleFilter === "admin") {
    result = result.filter(
      (u) => u.role === Role.ADMIN || u.role === Role.SUPER_ADMIN
    );
  } else if (roleFilter !== "all") {
    result = result.filter((u) => u.role === roleFilter);
  }

  const q = query.trim().toLowerCase();
  if (!q) return result;
  return result.filter(
    (u) =>
      u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
}

function UserCard({
  user,
  currentUserId,
  onRoleChange,
}: {
  user: UserPublic;
  currentUserId: string;
  onRoleChange: (userId: string, role: Role) => void;
}) {
  const isSelf = user.id === currentUserId;

  return (
    <article className="card-gaming flex h-full min-h-[240px] flex-col p-4">
      <div className="flex min-h-0 flex-1 flex-col items-center text-center">
        <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size="md" />
        <h2 className="mt-3 line-clamp-2 font-semibold text-white">{user.username}</h2>
        <p className="mt-1 line-clamp-2 break-all text-xs text-purple-300/55">
          {user.email}
        </p>
        <p className="mt-1 text-xs font-semibold text-theme-muted-soft">
          {ROLE_LABELS[user.role]}
        </p>
        <p className="mt-2 font-game text-lg font-bold text-theme-from">
          {user.karmaScore} KP
        </p>
      </div>

      <div className="mt-auto min-h-12 shrink-0 pt-3">
        {isSelf ? (
          <p className="text-center text-xs font-semibold leading-snug text-theme-muted-soft">
            Vous ne pouvez pas modifier votre propre rôle
          </p>
        ) : (
          <GamingSelect
            value={user.role}
            onChange={(role) => onRoleChange(user.id, role)}
            options={[...ROLE_OPTIONS]}
            aria-label={`Rôle de ${user.username}`}
          />
        )}
      </div>
    </article>
  );
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setUsers(await api.staffUsers());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role !== Role.SUPER_ADMIN) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (userId: string, role: Role) => {
    if (!user) return;
    await api.updateUserRole(userId, role);
    load();
  };

  const filtered = useMemo(
    () => filterUsers(users, search, roleFilter),
    [users, search, roleFilter]
  );

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-game mb-2 text-2xl font-bold glow-text">Utilisateurs</h1>
        <p className="mb-4 text-sm text-theme-muted">
          Assigne les rôles Utilisateur, Modérateur, Admin ou Super admin.
        </p>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            className="input-gaming sm:max-w-md"
            placeholder="Rechercher par pseudo ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <GamingSelect
            className="sm:w-56"
            value={roleFilter}
            onChange={setRoleFilter}
            options={ROLE_FILTER_OPTIONS}
            aria-label="Filtrer par type de compte"
          />
        </div>

        <div className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <UserCardSkeleton key={i} />)
            : filtered.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  currentUserId={user!.id}
                  onRoleChange={changeRole}
                />
              ))}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="py-12 text-center text-theme-muted">
            {users.length === 0
              ? "Aucun utilisateur"
              : "Aucun résultat pour cette recherche"}
          </p>
        )}

        {!loading && users.length > 0 && (
          <p className="mt-4 text-xs text-purple-300/40">
            {filtered.length} / {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </p>
        )}
      </main>
    </AuthGuard>
  );
}
