"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-cyan-900/10" />
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 text-center"
      >
        <h1 className="font-game mb-4 text-5xl font-black glow-text md:text-7xl">
          Karma Quest
        </h1>
        <p className="mb-8 max-w-lg text-xl text-theme-muted/80">
          Coche tes actions du jour. Monte ta jauge. Évite la décroissance quotidienne.
          Deviens une légende du karma.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/login" className="btn-primary">
            Se connecter
          </Link>
          <Link href="/register" className="btn-secondary">
            Créer un compte
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 text-center text-sm text-theme-muted">
          <div className="card-gaming p-4">
            <div className="text-2xl">📈</div>
            <div>Bonnes actions</div>
          </div>
          <div className="card-gaming p-4">
            <div className="text-2xl">📉</div>
            <div>Mauvaises actions</div>
          </div>
          <div className="card-gaming p-4">
            <div className="text-2xl">⏳</div>
            <div>Décroissance/jour</div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
