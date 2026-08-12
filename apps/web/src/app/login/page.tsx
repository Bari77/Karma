"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("Identifiants invalides");
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
          Connexion
        </h1>
        {error && (
          <p className="mb-4 rounded-lg bg-rose-900/30 p-3 text-center text-rose-300">
            {error}
          </p>
        )}
        <div className="space-y-4">
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
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-gaming"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Connexion..." : "Entrer dans l'arène"}
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-purple-300/60">
          Pas de compte ?{" "}
          <Link href="/register" className="text-cyan-400 hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </motion.form>
    </main>
  );
}
