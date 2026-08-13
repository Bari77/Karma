"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ActionType } from "@karma/shared";
import { motion } from "framer-motion";

export default function ProposePage() {
  const { user } = useAuth();
  const [label, setLabel] = useState("");
  const [points, setPoints] = useState(5);
  const [type, setType] = useState<ActionType>(ActionType.GOOD);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage("");
    try {
      await api.proposeAction({ label, points, type });
      setMessage("Proposition envoyée ! Un admin la validera bientôt.");
      setLabel("");
      setPoints(5);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-8">
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSubmit}
          className="card-gaming p-8"
        >
          <h1 className="font-game mb-2 text-2xl font-bold glow-text">
            Proposer une action
          </h1>
          <p className="mb-6 text-sm text-theme-muted">
            Ta proposition sera examinée par un administrateur avant d&apos;apparaître dans le jeu.
          </p>

          {message && (
            <p className="mb-4 rounded-lg bg-purple-900/40 p-3 text-center text-theme-muted">
              {message}
            </p>
          )}

          <div className="space-y-4">
            <input
              className="input-gaming"
              placeholder="Libellé — ex. Tenir la porte à quelqu'un"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              minLength={2}
            />
            <input
              type="number"
              className="input-gaming"
              placeholder="Points"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
              min={1}
              required
            />
            <div>
              <div className="flex gap-3" role="group" aria-label="Type d'action">
                <button
                  type="button"
                  onClick={() => setType(ActionType.GOOD)}
                  className={`btn-toggle ${
                    type === ActionType.GOOD ? "btn-toggle-active" : ""
                  }`}
                >
                  ✅ Bonne action
                </button>
                <button
                  type="button"
                  onClick={() => setType(ActionType.BAD)}
                  className={`btn-toggle ${
                    type === ActionType.BAD ? "btn-toggle-active" : ""
                  }`}
                >
                  ❌ Mauvaise action
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Envoi..." : "Soumettre la proposition"}
            </button>
          </div>
        </motion.form>
      </main>
    </AuthGuard>
  );
}
