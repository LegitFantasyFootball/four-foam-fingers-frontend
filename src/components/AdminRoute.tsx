// src/components/AdminRoute.tsx
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GAME_BASE = "/march-basketball-foam-fingers";

function parseAllowlist(): Set<string> {
  const raw = String(import.meta.env.VITE_ADMIN_EMAILS || "");
  const emails = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
}

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const allow = useMemo(() => parseAllowlist(), []);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setEmail(data.session?.user?.email ?? "");
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!alive) return;
      setEmail(session?.user?.email ?? "");
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  // no session -> login
  if (!email) {
    return <Navigate to={`${GAME_BASE}/login`} replace state={{ from: location.pathname }} />;
  }

  // has session but not allowed -> bounce to lets-go
  if (!allow.has(email.trim().toLowerCase())) {
    return <Navigate to={`${GAME_BASE}/lets-go`} replace />;
  }

  return <>{children}</>;
}