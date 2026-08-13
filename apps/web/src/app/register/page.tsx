"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, username, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="card-gaming w-full max-w-md p-8"
      >
        <h1 className="font-game mb-6 text-center text-2xl font-bold glow-text">
          Rejoindre l&apos;aventure
        </h1>
        {error && (
          <p className="mb-4 rounded-lg bg-rose-900/30 p-3 text-center text-rose-300">
            {error}
          </p>
        )}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-gaming"
            required
            minLength={3}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-gaming"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe (6+ caractères)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-gaming"
            required
            minLength={6}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Création..." : "Commencer avec 50 karma"}
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-theme-muted">
          Déjà inscrit ?{" "}
          <Link href="/login" className="link-theme">
            Se connecter
          </Link>
        </p>
      </motion.form>
    </main>
  );
}
