"use client";

import { useEffect, useState } from "react";
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
      ? "bg-theme-nav-active text-theme-from"
      : "text-theme-muted-soft hover:text-white"
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const jeuLink = user ? (
    <Link
      href="/dashboard"
      onClick={() => setMenuOpen(false)}
      className={clsx(navLinkClass(dashboardActive), "inline-flex items-center gap-2")}
    >
      <span>Jeu</span>
      <span className="font-game text-xs font-bold text-theme-from">{user.karmaScore} KP</span>
    </Link>
  ) : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-theme bg-karma-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:py-4">
        <Link
          href="/dashboard"
          className="min-w-0 shrink font-game text-base font-bold glow-text whitespace-nowrap sm:text-lg md:text-xl"
        >
          ⚡ Karma Quest
        </Link>

        {user && (
          <>
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

            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              <Link
                href="/profile"
                className={clsx(
                  "hidden items-center gap-2 rounded-lg px-2 py-1 transition sm:flex",
                  pathname === "/profile"
                    ? "bg-theme-nav-active text-theme-from"
                    : "text-theme-muted hover:bg-theme-nav-active hover:text-white"
                )}
                title="Mon profil"
              >
                <UserAvatar
                  username={user.username}
                  avatarUrl={user.avatarUrl}
                  size="sm"
                />
                <span className="hidden text-sm font-semibold lg:inline">
                  {user.username}
                </span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="btn-secondary hidden py-2 text-sm md:inline-flex"
              >
                Déconnexion
              </button>

              <button
                type="button"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-theme bg-karma-card/60 text-theme-muted transition hover:border-theme-strong hover:text-white md:hidden"
              >
                <span className="sr-only">Menu</span>
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  {menuOpen ? (
                    <>
                      <path d="M6 6l12 12M18 6 6 18" />
                    </>
                  ) : (
                    <>
                      <path d="M4 7h16M4 12h16M4 17h16" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {user && menuOpen && (
        <div className="border-t border-theme bg-karma-bg/98 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {jeuLink}
            {links.map((l) => {
              const active =
                pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass(active)}
                >
                  {l.label}
                </Link>
              );
            })}
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                pathname === "/profile"
                  ? "bg-theme-nav-active text-theme-from"
                  : "text-theme-muted-soft hover:text-white"
              )}
            >
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
              Mon profil
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="btn-secondary mt-1 w-full py-2 text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
