"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { GroupCardSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { GroupSummary } from "@karma/shared";
import { motion } from "framer-motion";

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setGroups(await api.groups());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setMessage("");
    try {
      await api.createGroup({ name, description: description || undefined });
      setName("");
      setDescription("");
      setMessage("Groupe créé !");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setMessage("");
    try {
      const group = await api.joinGroup(inviteCode);
      setInviteCode("");
      setMessage(`Bienvenue dans « ${group.name} » !`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-game mb-6 text-2xl font-bold glow-text">
          🏆 Groupes & Classements
        </h1>

        {message && (
          <p className="mb-4 rounded-lg bg-purple-900/40 p-3 text-center text-purple-200">
            {message}
          </p>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <form onSubmit={handleCreate} className="card-gaming space-y-3 p-5">
            <h2 className="font-semibold text-cyan-300">Créer un groupe</h2>
            <input
              className="input-gaming"
              placeholder="Nom du groupe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
            <input
              className="input-gaming"
              placeholder="Description (optionnel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              Créer
            </button>
          </form>

          <form onSubmit={handleJoin} className="card-gaming space-y-3 p-5">
            <h2 className="font-semibold text-purple-300">Rejoindre un groupe</h2>
            <input
              className="input-gaming font-mono uppercase"
              placeholder="Code d'invitation"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
            />
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              Rejoindre
            </button>
          </form>
        </div>

        <h2 className="font-game mb-4 text-lg text-purple-200">Mes groupes</h2>
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => <GroupCardSkeleton key={i} />)
            : groups.map((g) => (
                <motion.div key={g.id} whileHover={{ scale: 1.01 }}>
                  <Link href={`/groups/${g.id}`} className="card-gaming block p-5 transition hover:border-purple-400/40">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-game text-lg font-bold text-white">{g.name}</h3>
                        {g.description && (
                          <p className="mt-1 text-sm text-purple-300/60">{g.description}</p>
                        )}
                        <p className="mt-2 text-xs text-purple-300/50">
                          {g.memberCount} joueur{g.memberCount > 1 ? "s" : ""}
                          {g.isOwner && " · Propriétaire"}
                        </p>
                      </div>
                      <span className="rounded-lg bg-purple-900/50 px-2 py-1 font-mono text-xs text-cyan-400">
                        {g.inviteCode}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
          {!loading && groups.length === 0 && (
            <p className="text-center text-purple-300/50">
              Aucun groupe — créez-en un ou rejoignez avec un code !
            </p>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
