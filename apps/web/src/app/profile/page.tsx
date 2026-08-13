"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { KarmaGauge } from "@/components/KarmaGauge";
import { KarmaGaugeSkeleton } from "@/components/Skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ThemeId, KarmaStats } from "@karma/shared";
import { ThemePicker } from "@/components/ThemePicker";
import { useTheme } from "@/lib/theme-provider";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { setThemeId } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<KarmaStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [themeId, setThemeIdLocal] = useState<ThemeId>("cyan-purple");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [avatarMsg, setAvatarMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeMsg, setThemeMsg] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setThemeIdLocal(user.themeId);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    api
      .karmaStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleThemeSave = async () => {
    if (!user) return;
    if (themeId === user.themeId) {
      setThemeMsg("Thème déjà actif");
      return;
    }
    setThemeLoading(true);
    setThemeMsg("");
    try {
      const updated = await api.updateProfile({ themeId });
      setUser(updated);
      setThemeId(updated.themeId);
      setThemeMsg("Thème enregistré");
    } catch (err) {
      setThemeMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setThemeLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileMsg("");
    try {
      const body: { username?: string; email?: string } = {};
      if (username !== user.username) body.username = username;
      if (email !== user.email) body.email = email;
      if (!body.username && !body.email) {
        setProfileMsg("Aucune modification");
        return;
      }
      const updated = await api.updateProfile(body);
      setUser(updated);
      setProfileMsg("Profil mis à jour");
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Les mots de passe ne correspondent pas");
      setPasswordLoading(false);
      return;
    }
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg("Mot de passe modifié");
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    setAvatarMsg("");
    try {
      const updated = await api.uploadAvatar(file);
      setUser(updated);
      setAvatarMsg("Avatar mis à jour");
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAvatarLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarLoading(true);
    setAvatarMsg("");
    try {
      const updated = await api.deleteAvatar();
      setUser(updated);
      setAvatarMsg("Avatar supprimé");
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="font-game mb-6 text-2xl font-bold glow-text">Mon profil</h1>

        {user && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="mb-6">
                <KarmaGaugeSkeleton />
              </div>
            ) : stats ? (
              <div className="mb-6">
                <KarmaGauge
                  score={stats.karmaScore}
                  max={stats.maxKarma}
                  dailyDecay={stats.dailyDecay}
                  username={user.username}
                  questLevel={stats.questLevel}
                  questTitle={stats.questTitle}
                  variant="full"
                />
              </div>
            ) : null}

            <section className="card-gaming p-6">
              <h2 className="mb-2 font-semibold text-theme-from">Apparence</h2>
              <p className="mb-4 text-sm text-theme-muted">
                Choisissez la palette de couleurs utilisée dans toute l&apos;application.
              </p>
              <ThemePicker
                value={themeId}
                onChange={(id) => {
                  setThemeIdLocal(id);
                  setThemeId(id);
                }}
                disabled={themeLoading}
              />
              <button
                type="button"
                disabled={themeLoading || !user || themeId === user.themeId}
                onClick={handleThemeSave}
                className="btn-primary mt-4 w-full text-sm"
              >
                {themeLoading ? "Enregistrement…" : "Enregistrer le thème"}
              </button>
              {themeMsg && (
                <p className="mt-3 text-center text-sm text-theme-muted">{themeMsg}</p>
              )}
            </section>

            <section className="card-gaming p-6">
              <h2 className="mb-4 font-semibold text-theme-from">Avatar</h2>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <UserAvatar
                  username={user.username}
                  avatarUrl={user.avatarUrl}
                  size="lg"
                />
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    disabled={avatarLoading}
                    onClick={() => fileRef.current?.click()}
                    className="btn-primary text-sm"
                  >
                    {avatarLoading ? "Chargement…" : "Changer l'avatar"}
                  </button>
                  {user.avatarUrl && (
                    <button
                      type="button"
                      disabled={avatarLoading}
                      onClick={handleAvatarRemove}
                      className="btn-bad text-sm"
                    >
                      Supprimer l'avatar
                    </button>
                  )}
                  <p className="text-xs text-theme-muted">JPEG, PNG, WebP ou GIF — max 2 Mo</p>
                </div>
              </div>
              {avatarMsg && (
                <p className="mt-3 text-center text-sm text-theme-muted">{avatarMsg}</p>
              )}
            </section>

            <motion.form
              onSubmit={handleProfileSave}
              className="card-gaming space-y-4 p-6"
            >
              <h2 className="font-semibold text-theme-from">Informations</h2>
              <input
                className="input-gaming"
                placeholder="Pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
              <input
                type="email"
                className="input-gaming"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {profileMsg && (
                <p className="text-center text-sm text-theme-muted">{profileMsg}</p>
              )}
              <button type="submit" disabled={profileLoading} className="btn-primary w-full">
                {profileLoading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </motion.form>

            <form onSubmit={handlePasswordSave} className="card-gaming space-y-4 p-6">
              <h2 className="font-semibold text-theme-from">Mot de passe</h2>
              <input
                type="password"
                className="input-gaming"
                placeholder="Mot de passe actuel"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="input-gaming"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <input
                type="password"
                className="input-gaming"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              {passwordMsg && (
                <p className="text-center text-sm text-theme-muted">{passwordMsg}</p>
              )}
              <button type="submit" disabled={passwordLoading} className="btn-primary w-full">
                {passwordLoading ? "Modification…" : "Changer le mot de passe"}
              </button>
            </form>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
