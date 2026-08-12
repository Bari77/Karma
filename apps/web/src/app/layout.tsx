import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ConfirmProvider } from "@/lib/confirm-context";

export const metadata: Metadata = {
  title: "Karma Quest — Gère ton aura",
  description: "Un jeu de karma quotidien. Coche tes actions, monte ta jauge, deviens une légende.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-grid min-h-screen">
        <AuthProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
