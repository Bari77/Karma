"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { AdminActionRowSkeleton } from "@/components/Skeleton";
import { GamingSelect } from "@/components/GamingSelect";
import { useAuth } from "@/lib/auth-context";
import { useConfirm } from "@/lib/confirm-context";
import { api } from "@/lib/api";
import { ActionItem, ActionType, Role } from "@karma/shared";
import { formatCooldownDays } from "@/lib/format-cooldown";

const STAFF = [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN];

function sortActions(items: ActionItem[]) {
  return [...items].sort((a, b) => {
    if (a.points !== b.points) return a.points - b.points;
    if (a.type !== b.type) return a.type === ActionType.GOOD ? -1 : 1;
    return a.label.localeCompare(b.label, "fr");
  });
}

function ActionAdminRow({
  action,
  onUpdate,
  onRemove,
}: {
  action: ActionItem;
  onUpdate: (id: string, data: { label?: string; points?: number; cooldownDays?: number }) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const [label, setLabel] = useState(action.label);
  const [points, setPoints] = useState(action.points);
  const [cooldownDays, setCooldownDays] = useState(action.cooldownDays);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLabel(action.label);
    setPoints(action.points);
    setCooldownDays(action.cooldownDays);
  }, [action.label, action.points, action.cooldownDays]);

  const saveIfChanged = async (
    field: "label" | "points" | "cooldownDays",
    value: string | number
  ) => {
    const current = { label: action.label, points: action.points, cooldownDays: action.cooldownDays };
    if (field === "label" && value === current.label) return;
    if (field === "points" && value === current.points) return;
    if (field === "cooldownDays" && value === current.cooldownDays) return;

    if (field === "label") {
      const trimmed = String(value).trim();
      if (trimmed.length < 2) {
        setLabel(action.label);
        return;
      }
    }

    setSaving(true);
    try {
      if (field === "label") await onUpdate(action.id, { label: String(value).trim() });
      if (field === "points") await onUpdate(action.id, { points: Number(value) });
      if (field === "cooldownDays") await onUpdate(action.id, { cooldownDays: Number(value) });
    } catch {
      setLabel(action.label);
      setPoints(action.points);
      setCooldownDays(action.cooldownDays);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-gaming space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl">{action.type === "GOOD" ? "✅" : "❌"}</span>
        <input
          className="input-gaming min-w-[200px] flex-1 py-2 text-sm"
          placeholder="Libellé"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => saveIfChanged("label", label)}
          disabled={saving}
        />
        <input
          type="number"
          className="input-gaming w-20 py-2 text-sm"
          placeholder="Pts"
          value={points}
          min={1}
          onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
          onBlur={() => saveIfChanged("points", points)}
          disabled={saving}
          aria-label="Points"
        />
        <span className="rounded-lg bg-purple-900/40 px-2 py-1 text-xs text-theme-muted-soft">
          {action.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-theme pt-3">
        <input
          type="number"
          className="input-gaming w-28 py-2 text-sm"
          placeholder="Cooldown (jours)"
          value={cooldownDays}
          min={0}
          onChange={(e) => setCooldownDays(Math.max(0, parseInt(e.target.value) || 0))}
          onBlur={() => saveIfChanged("cooldownDays", cooldownDays)}
          disabled={saving}
          aria-label="Cooldown en jours"
        />
        <span className="text-xs text-theme-muted">{formatCooldownDays(cooldownDays)}</span>
        {saving && <span className="text-xs text-theme-from/70">Enregistrement…</span>}
        <button
          type="button"
          onClick={() => onRemove(action.id)}
          disabled={saving}
          className="btn-bad ml-auto text-sm"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

export default function AdminActionsPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const router = useRouter();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [points, setPoints] = useState(5);
  const [type, setType] = useState<ActionType>(ActionType.GOOD);
  const [cooldownDays, setCooldownDays] = useState(1);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user) return;
    if (!opts?.silent) setLoading(true);
    try {
      setActions(sortActions(await api.allActions()));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !STAFF.includes(user.role)) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCooldownDays(type === ActionType.GOOD ? 1 : 0);
  }, [type]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await api.createAction({ label, points, type, cooldownDays });
    setLabel("");
    setPoints(5);
    setCooldownDays(type === ActionType.GOOD ? 1 : 0);
    await load({ silent: true });
  };

  const updateAction = async (
    id: string,
    data: { label?: string; points?: number; cooldownDays?: number }
  ) => {
    if (!user) return;
    await api.updateAction(id, data);
    setActions((prev) =>
      sortActions(prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
    );
  };

  const remove = async (id: string) => {
    if (!user) return;
    const ok = await confirm({
      title: "Supprimer l'action",
      message: "Supprimer cette action ? Elle ne sera plus disponible pour les joueurs.",
      confirmLabel: "Supprimer",
      variant: "danger",
    });
    if (!ok) return;
    await api.deleteAction(id);
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-game mb-6 text-2xl font-bold glow-text">
          Gestion des actions
        </h1>

        <form onSubmit={create} className="card-gaming mb-8 space-y-4 p-6">
          <h2 className="font-semibold text-theme-from">Créer une action</h2>

          <input
            className="input-gaming"
            placeholder="Libellé — ex. Tenir la porte à quelqu'un"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="number"
              className="input-gaming"
              placeholder="Points"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
              min={1}
            />
            <GamingSelect
              id="action-type"
              value={type}
              onChange={setType}
              aria-label="Type d'action"
              options={[
                { value: ActionType.GOOD, label: "Bonne action" },
                { value: ActionType.BAD, label: "Mauvaise action" },
              ]}
            />
            <input
              type="number"
              className="input-gaming"
              placeholder="Cooldown (jours)"
              value={cooldownDays}
              onChange={(e) => setCooldownDays(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
            />
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full whitespace-nowrap">
                Ajouter
              </button>
            </div>
          </div>

          <p className="text-xs text-theme-muted">
            Cooldown : 0 = illimité, 1 = reset journalier (minimum), 2+ = jours
          </p>
        </form>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <AdminActionRowSkeleton key={i} />)
            : actions.map((a) => (
                <ActionAdminRow
                  key={a.id}
                  action={a}
                  onUpdate={updateAction}
                  onRemove={remove}
                />
              ))}
          {!loading && actions.length === 0 && (
            <p className="text-center text-theme-muted">Aucune action</p>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
