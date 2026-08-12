"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ActionItem, Role } from "@karma/shared";

const ADMIN = [Role.ADMIN, Role.SUPER_ADMIN];

export default function ValidatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<ActionItem[]>([]);
  const [edits, setEdits] = useState<
    Record<string, { label: string; points: number; cooldownDays: number }>
  >({});

  const load = useCallback(async () => {
    if (!user) return;
    const items = await api.pendingActions();
    setPending(items);
    setEdits(
      Object.fromEntries(
        items.map((a) => [
          a.id,
          {
            label: a.label,
            points: a.points,
            cooldownDays: a.cooldownDays ?? (a.type === "GOOD" ? 1 : 0),
          },
        ])
      )
    );
  }, [user]);

  useEffect(() => {
    if (user && !ADMIN.includes(user.role)) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    load();
  }, [load]);

  const validate = async (id: string) => {
    if (!user) return;
    const edit = edits[id];
    await api.validateAction(id, edit);
    load();
  };

  const reject = async (id: string) => {
    if (!user) return;
    await api.rejectAction(id);
    load();
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-game mb-6 text-2xl font-bold glow-text">
          Validation des propositions
        </h1>

        {pending.length === 0 ? (
          <p className="text-center text-purple-300/50">Aucune proposition en attente</p>
        ) : (
          <div className="space-y-4">
            {pending.map((a) => (
              <div key={a.id} className="card-gaming space-y-4 p-6">
                <p className="text-sm text-purple-300/60">
                  Proposé par {a.proposedBy?.username ?? "inconnu"} —{" "}
                  {a.type === "GOOD" ? "✅ Bonne action" : "❌ Mauvaise action"}
                </p>

                <div>
                  <label htmlFor={`validate-label-${a.id}`} className="mb-1 block text-sm text-purple-300/70">
                    Libellé
                  </label>
                  <input
                    id={`validate-label-${a.id}`}
                    className="input-gaming"
                    value={edits[a.id]?.label ?? a.label}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [a.id]: { ...prev[a.id], label: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`validate-points-${a.id}`} className="mb-1 block text-sm text-purple-300/70">
                      Points
                    </label>
                    <input
                      id={`validate-points-${a.id}`}
                      type="number"
                      className="input-gaming"
                      value={edits[a.id]?.points ?? a.points}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [a.id]: {
                            ...prev[a.id],
                            points: parseInt(e.target.value) || 1,
                          },
                        }))
                      }
                      min={1}
                    />
                  </div>
                  <div>
                    <label htmlFor={`validate-cooldown-${a.id}`} className="mb-1 block text-sm text-purple-300/70">
                      Cooldown (jours)
                    </label>
                    <input
                      id={`validate-cooldown-${a.id}`}
                      type="number"
                      className="input-gaming"
                      value={edits[a.id]?.cooldownDays ?? a.cooldownDays}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [a.id]: {
                            ...prev[a.id],
                            cooldownDays: Math.max(0, parseInt(e.target.value) || 0),
                          },
                        }))
                      }
                      min={0}
                    />
                  </div>
                </div>

                <p className="text-xs text-purple-300/50">
                  Cooldown : 0 = illimité, 1 = reset journalier (minimum), 2+ = jours
                </p>

                <div className="flex gap-3">
                  <button onClick={() => validate(a.id)} className="btn-good">
                    Valider
                  </button>
                  <button onClick={() => reject(a.id)} className="btn-bad">
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
