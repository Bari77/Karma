"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { KarmaGauge } from "@/components/KarmaGauge";
import { UserAvatar } from "@/components/UserAvatar";
import { LeaderboardRowSkeleton, KarmaGaugeSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { useConfirm } from "@/lib/confirm-context";
import { api } from "@/lib/api";
import { GroupDetail, GroupMemberRank, MemberKarmaStats } from "@karma/shared";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_ORDER = [2, 1, 3];

function getPodiumSlots(members: GroupMemberRank[]): (GroupMemberRank | null)[] {
  const top = members.filter((m) => m.rank <= 3);
  if (top.length === 0) return [];
  return PODIUM_ORDER.map((rank) => top.find((m) => m.rank === rank) ?? null);
}

function PodiumCard({
  member,
  onClick,
  canManage,
  onRemove,
}: {
  member: GroupMemberRank;
  onClick: () => void;
  canManage?: boolean;
  onRemove?: () => void;
}) {
  const isFirst = member.rank === 1;
  const showRemove = canManage && !member.isGroupOwner && onRemove;

  return (
    <div className="relative">
      {showRemove && (
        <button
          type="button"
          title="Exclure du groupe"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1 top-1 z-10 rounded-lg bg-rose-900/80 px-2 py-0.5 text-xs text-rose-200 transition hover:bg-rose-800"
        >
          ✕
        </button>
      )}
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={clsx(
          "card-gaming flex aspect-square w-full flex-col items-center justify-center p-3 text-center transition sm:p-4",
          member.isMe && "border-cyan-400/30 bg-cyan-900/10",
          member.isGroupOwner && "ring-1 ring-purple-400/30",
          isFirst && "-translate-y-2 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/25"
        )}
      >
        <span className="text-2xl leading-none sm:text-3xl">{MEDALS[member.rank - 1]}</span>
        <UserAvatar
          username={member.username}
          avatarUrl={member.avatarUrl}
          size={isFirst ? "lg" : "md"}
          className="mt-2"
        />
        <p className="mt-2 line-clamp-2 w-full font-semibold text-white">
          {member.username}
          {member.isGroupOwner && (
            <span className="block text-xs text-theme-muted-soft">Propriétaire</span>
          )}
          {member.isMe && !member.isGroupOwner && (
            <span className="block text-xs text-theme-from">(vous)</span>
          )}
        </p>
        <p className="mt-1 font-game text-xl font-bold text-theme-from">{member.karmaScore}</p>
        <p className="mt-1 text-[10px] font-semibold leading-tight text-theme-muted-soft sm:text-xs">
          Niv. {member.questLevel} · {member.questTitle}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-purple-900/40">
          <div
            className="karma-progress-fill h-full"
            style={{ width: `${Math.min(100, member.karmaScore)}%` }}
          />
        </div>
      </motion.button>
    </div>
  );
}

function LeaderboardRow({
  member,
  onClick,
  canManage,
  onRemove,
}: {
  member: GroupMemberRank;
  onClick: () => void;
  canManage?: boolean;
  onRemove?: () => void;
}) {
  const showRemove = canManage && !member.isGroupOwner && onRemove;

  return (
    <div className="flex items-center gap-2">
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        onClick={onClick}
        className={clsx(
          "card-gaming flex min-w-0 flex-1 items-center gap-4 p-4 text-left transition",
          member.isMe && "border-cyan-400/30 bg-cyan-900/10",
          member.isGroupOwner && "ring-1 ring-purple-400/30"
        )}
      >
        <span className="w-8 shrink-0 text-center font-game text-lg text-theme-muted">
          #{member.rank}
        </span>
        <UserAvatar username={member.username} avatarUrl={member.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {member.username}
            {member.isGroupOwner && (
              <span className="ml-2 text-xs text-theme-muted-soft">Propriétaire</span>
            )}
            {member.isMe && !member.isGroupOwner && (
              <span className="ml-2 text-xs text-theme-from">(vous)</span>
            )}
          </p>
          <p className="text-xs text-theme-muted-soft">
            Niv. {member.questLevel} · {member.questTitle}
          </p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-purple-900/40">
            <div
              className="karma-progress-fill h-full"
              style={{ width: `${Math.min(100, member.karmaScore)}%` }}
            />
          </div>
        </div>
        <span className="font-game text-lg font-bold text-theme-from">{member.karmaScore}</span>
      </motion.button>
      {showRemove && (
        <button
          type="button"
          title="Exclure du groupe"
          onClick={onRemove}
          className="btn-bad shrink-0 px-3 py-2 text-sm"
        >
          Exclure
        </button>
      )}
    </div>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<GroupMemberRank | null>(null);
  const [memberStats, setMemberStats] = useState<MemberKarmaStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      setGroup(await api.groupDetail(id));
    } catch {
      router.replace("/groups");
    } finally {
      setLoading(false);
    }
  }, [user, id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const viewMember = async (member: GroupMemberRank) => {
    if (!user || !id) return;
    setSelectedMember(member);
    setMemberStats(null);
    setLoadingStats(true);
    try {
      setMemberStats(await api.memberKarma(id, member.userId));
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !id) return;
    const ok = await confirm({
      title: "Quitter le groupe",
      message: "Voulez-vous vraiment quitter ce groupe ?",
      confirmLabel: "Quitter",
      variant: "danger",
    });
    if (!ok) return;
    await api.leaveGroup(id);
    router.push("/groups");
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    const ok = await confirm({
      title: "Supprimer le groupe",
      message: "Supprimer définitivement ce groupe ? Cette action est irréversible.",
      confirmLabel: "Supprimer",
      variant: "danger",
    });
    if (!ok) return;
    await api.deleteGroup(id);
    router.push("/groups");
  };

  const handleRegenerateCode = async () => {
    if (!id || !group?.isOwner) return;
    const ok = await confirm({
      title: "Régénérer le code",
      message:
        "Régénérer le code d'invitation ? L'ancien code ne fonctionnera plus.",
      confirmLabel: "Régénérer",
    });
    if (!ok) return;
    setAdminLoading(true);
    setAdminMsg("");
    try {
      setGroup(await api.regenerateGroupInviteCode(id));
      setAdminMsg("Nouveau code généré");
    } catch (err) {
      setAdminMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRemoveMember = async (member: GroupMemberRank) => {
    if (!id || !group?.isOwner || member.isGroupOwner) return;
    const ok = await confirm({
      title: "Exclure un membre",
      message: `Exclure « ${member.username} » du groupe ?`,
      confirmLabel: "Exclure",
      variant: "danger",
    });
    if (!ok) return;
    setAdminLoading(true);
    setAdminMsg("");
    try {
      setGroup(await api.removeGroupMember(id, member.userId));
      setAdminMsg(`${member.username} a été exclu`);
    } catch (err) {
      setAdminMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/groups" className="mb-4 inline-block text-sm text-theme-muted hover:text-theme-from">
          ← Retour aux groupes
        </Link>

        {loading ? (
          <>
            <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-purple-900/30" />
            <div className="mb-6 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    "card-gaming aspect-square animate-pulse bg-purple-900/20",
                    i === 1 && "-translate-y-2"
                  )}
                />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <LeaderboardRowSkeleton key={i} />
              ))}
            </div>
          </>
        ) : group ? (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="font-game text-2xl font-bold glow-text">{group.name}</h1>
                {group.description && (
                  <p className="mt-1 text-theme-muted">{group.description}</p>
                )}
                <p className="mt-2 font-mono text-xs text-theme-from/80">
                  Code : {group.inviteCode}
                </p>
              </div>
              <div className="flex gap-2">
                {group.isOwner ? (
                  <button onClick={handleDelete} className="btn-bad text-sm">
                    Supprimer
                  </button>
                ) : (
                  <button onClick={handleLeave} className="btn-secondary text-sm">
                    Quitter
                  </button>
                )}
              </div>
            </div>

            {group.isOwner && (
              <section className="card-gaming mb-6 space-y-3 p-4">
                <h2 className="font-semibold text-theme-from">Gestion du groupe</h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="font-mono text-sm text-theme-muted">
                    Code d&apos;invitation :{" "}
                    <span className="text-theme-from">{group.inviteCode}</span>
                  </p>
                  <button
                    type="button"
                    disabled={adminLoading}
                    onClick={handleRegenerateCode}
                    className="btn-secondary whitespace-nowrap text-sm"
                  >
                    Régénérer le code
                  </button>
                </div>
                <p className="text-xs text-theme-muted">
                  Excluez un membre via le bouton sur sa ligne ou sa carte du podium.
                </p>
                {adminMsg && (
                  <p className="text-sm text-theme-muted">{adminMsg}</p>
                )}
              </section>
            )}

            <h2 className="font-game mb-4 text-lg text-theme-muted">Classement</h2>

            {group.members.length === 0 ? (
              <p className="py-8 text-center text-theme-muted">Aucun membre</p>
            ) : (
              <>
                {getPodiumSlots(group.members).length > 0 && (
                  <div className="mb-6 grid grid-cols-3 items-end gap-3">
                    {getPodiumSlots(group.members).map((m, i) =>
                      m ? (
                        <PodiumCard
                          key={m.userId}
                          member={m}
                          onClick={() => viewMember(m)}
                          canManage={group.isOwner}
                          onRemove={() => handleRemoveMember(m)}
                        />
                      ) : (
                        <div key={`empty-${i}`} aria-hidden />
                      )
                    )}
                  </div>
                )}

                {group.members.some((m) => m.rank > 3) && (
                  <div className="space-y-2">
                    {group.members
                      .filter((m) => m.rank > 3)
                      .map((m) => (
                        <LeaderboardRow
                          key={m.userId}
                          member={m}
                          onClick={() => viewMember(m)}
                          canManage={group.isOwner}
                          onRemove={() => handleRemoveMember(m)}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : null}

        <AnimatePresence>
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setSelectedMember(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {loadingStats ? (
                  <KarmaGaugeSkeleton />
                ) : memberStats ? (
                  <KarmaGauge
                    score={memberStats.karmaScore}
                    max={memberStats.maxKarma}
                    dailyDecay={memberStats.dailyDecay}
                    username={memberStats.username}
                    questLevel={memberStats.questLevel}
                    questTitle={memberStats.questTitle}
                  />
                ) : null}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="btn-secondary mt-4 w-full"
                >
                  Fermer
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AuthGuard>
  );
}
