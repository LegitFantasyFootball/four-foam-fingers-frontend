// src/components/AdminRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

function isAdminEmail(email: string | null | undefined): boolean {
  const allow = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!email) return false;
  return allow.includes(email.toLowerCase());
}

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
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

  if (!email) {
    return <Navigate to="/march-basketball-foam-fingers/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdminEmail(email)) {
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
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}