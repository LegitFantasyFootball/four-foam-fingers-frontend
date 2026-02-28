// src/components/AdminRoute.tsx
// src/components/AdminRoute.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GAME_BASE = "/march-basketball-foam-fingers";
const FALLBACK_ADMINS = ["jet@legitgamesinc.com", "todd@legitgamesinc.com", "dimetrius@legitgamesinc.com"];

function parseAllowList(): string[] {
  const raw = (import.meta.env.VITE_ADMIN_EMAILS || "").trim();
  const list = raw
    .split(",")
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);

  return list.length ? list : FALLBACK_ADMINS;
}

function safeReturnPath(pathname: string, search: string): string {
  const p = pathname || "";
  const s = search || "";
  if (p.startsWith(GAME_BASE)) return `${p}${s}`;
  return `${GAME_BASE}/admin`;
}

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");

  const allow = useMemo(() => parseAllowList(), []);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setEmail((data.session?.user?.email ?? "").toLowerCase());
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!alive) return;
      setEmail((session?.user?.email ?? "").toLowerCase());
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  const from = safeReturnPath(location.pathname, location.search);

  if (!email) {
    return (
      <Navigate
        to={`${GAME_BASE}/login`}
        replace
        state={{ from }}
      />
    );
  }

  const isAllowed = allow.includes(email);

  if (!isAllowed) {
    return (
      <main style={{ minHeight: "100vh", padding: 16 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              border: "1px solid var(--fff-border)",
              background: "var(--fff-surface)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Admin access required</h2>
            <p style={{ marginBottom: 0, color: "var(--fff-muted)" }}>
              Signed in as <strong>{email}</strong>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}