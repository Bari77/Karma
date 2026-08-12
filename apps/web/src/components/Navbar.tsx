"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/UserAvatar";
import { Role } from "@karma/shared";
import clsx from "clsx";

const STAFF = [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN];
const ADMIN = [Role.ADMIN, Role.SUPER_ADMIN];

function navLinkClass(active: boolean) {
  return clsx(
    "rounded-lg px-3 py-2 text-sm font-semibold transition",
    active
      ? "bg-purple-600/30 text-cyan-300"
      : "text-purple-200/70 hover:text-white"
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const dashboardActive =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const links = [
    { href: "/groups", label: "Groupes" },
    { href: "/propose", label: "Proposer" },
    { href: "/history", label: "Historique" },
  ];

  if (user && STAFF.includes(user.role)) {
    links.push({ href: "/admin/actions", label: "Actions" });
  }
  if (user && ADMIN.includes(user.role)) {
    links.push({ href: "/admin/validate", label: "Validation" });
  }
  if (user?.role === Role.SUPER_ADMIN) {
    links.push({ href: "/admin/users", label: "Utilisateurs" });
  }

  const jeuLink = user ? (
    <Link href="/dashboard" className={clsx(navLinkClass(dashboardActive), "inline-flex items-center gap-2")}>
      <span>Jeu</span>
      <span className="font-game text-xs font-bold text-cyan-400">{user.karmaScore} KP</span>
    </Link>
  ) : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-purple-500/20 bg-karma-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="font-game text-xl font-bold glow-text">
          ⚡ Karma Quest
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="md:hidden">{jeuLink}</div>
            <div className="hidden items-center gap-1 md:flex">
              {jeuLink}
              {links.map((l) => {
                const active =
                  pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link key={l.href} href={l.href} className={navLinkClass(active)}>
                    {l.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-2 py-1 transition",
                  pathname === "/profile"
                    ? "bg-purple-600/30 text-cyan-300"
                    : "text-purple-300/80 hover:bg-purple-900/30 hover:text-white"
                )}
                title="Mon profil"
              >
                <UserAvatar
                  username={user.username}
                  avatarUrl={user.avatarUrl}
                  size="sm"
                />
                <span className="hidden text-sm font-semibold sm:inline">
                  {user.username}
                </span>
              </Link>
              <button onClick={logout} className="btn-secondary py-2 text-sm">
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
