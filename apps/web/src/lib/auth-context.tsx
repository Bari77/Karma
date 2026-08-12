"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { UserPublic } from "@karma/shared";
import { api } from "./api";

interface AuthContextValue {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserPublic) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionEpoch = useRef(0);

  const refreshUser = useCallback(async () => {
    const epoch = ++sessionEpoch.current;
    try {
      const u = await api.me();
      if (epoch === sessionEpoch.current) setUser(u);
    } catch {
      if (epoch === sessionEpoch.current) setUser(null);
    }
  }, []);

  useEffect(() => {
    const epoch = sessionEpoch.current;
    api.me()
      .then((u) => {
        if (epoch === sessionEpoch.current) setUser(u);
      })
      .catch(() => {
        if (epoch === sessionEpoch.current) setUser(null);
      })
      .finally(() => {
        if (epoch === sessionEpoch.current) setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    sessionEpoch.current += 1;
    const res = await api.login({ email, password });
    setUser(res.user);
    setLoading(false);
  };

  const register = async (email: string, username: string, password: string) => {
    sessionEpoch.current += 1;
    const res = await api.register({ email, username, password });
    setUser(res.user);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
