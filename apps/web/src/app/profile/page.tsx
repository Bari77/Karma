"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [avatarMsg, setAvatarMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

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
            <section className="card-gaming p-6">
              <h2 className="mb-4 font-semibold text-cyan-300">Avatar</h2>
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
                  <p className="text-xs text-purple-300/50">JPEG, PNG, WebP ou GIF — max 2 Mo</p>
                </div>
              </div>
              {avatarMsg && (
                <p className="mt-3 text-center text-sm text-purple-200">{avatarMsg}</p>
              )}
            </section>

            <motion.form
              onSubmit={handleProfileSave}
              className="card-gaming space-y-4 p-6"
            >
              <h2 className="font-semibold text-cyan-300">Informations</h2>
              <div>
                <label htmlFor="profile-username" className="mb-1 block text-sm text-purple-300/70">
                  Pseudo
                </label>
                <input
                  id="profile-username"
                  className="input-gaming"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="mb-1 block text-sm text-purple-300/70">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="input-gaming"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {profileMsg && (
                <p className="text-center text-sm text-purple-200">{profileMsg}</p>
              )}
              <button type="submit" disabled={profileLoading} className="btn-primary w-full">
                {profileLoading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </motion.form>

            <form onSubmit={handlePasswordSave} className="card-gaming space-y-4 p-6">
              <h2 className="font-semibold text-cyan-300">Mot de passe</h2>
              <div>
                <label htmlFor="current-password" className="mb-1 block text-sm text-purple-300/70">
                  Mot de passe actuel
                </label>
                <input
                  id="current-password"
                  type="password"
                  className="input-gaming"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm text-purple-300/70">
                  Nouveau mot de passe
                </label>
                <input
                  id="new-password"
                  type="password"
                  className="input-gaming"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-1 block text-sm text-purple-300/70">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  className="input-gaming"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {passwordMsg && (
                <p className="text-center text-sm text-purple-200">{passwordMsg}</p>
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
